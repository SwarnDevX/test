<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Zoho CRM v3 API wrapper.
 *
 * Handles OAuth 2.0 token lifecycle and all CRM data operations.
 * Credentials (client_id, client_secret, refresh_token) are stored in wp_options,
 * set via the PerforMission → Zoho Settings admin page.
 *
 * Zoho custom data model expected in CRM:
 *   Contacts module:
 *     - PM_Ambassador_WP_ID  (Text)  — WordPress user ID of the assigned ambassador
 *
 *   Custom module "PM_Monthly_Records":
 *     - PM_Client_ID     (Lookup → Contacts)
 *     - PM_Month         (Integer, 1–12)
 *     - PM_Year          (Integer, e.g. 2025)
 *     - PM_Ad_Spend      (Currency)
 *     - PM_Client_Payment (Currency)
 *     - PM_Profit        (Currency)
 */
class PM_Zoho_API {

	// Zoho OAuth / API endpoints — adjust domain for your Zoho datacenter if needed.
	// US: accounts.zoho.com / EU: accounts.zoho.eu / AU: accounts.zoho.com.au
	const AUTH_BASE  = 'https://accounts.zoho.com';
	const API_BASE   = 'https://www.zohoapis.com/crm/v3';
	const TOKEN_KEY  = 'pm_zoho_access_token';
	const EXPIRY_KEY = 'pm_zoho_token_expiry';

	// Zoho CRM custom module API name (create this in Zoho Setup → Modules).
	const RECORDS_MODULE = 'PM_Monthly_Records';

	// ── OAuth ─────────────────────────────────────────────────────────────────

	/**
	 * Return a valid access token, refreshing it automatically when expired.
	 */
	public static function get_access_token(): string {
		$token  = get_option( self::TOKEN_KEY, '' );
		$expiry = (int) get_option( self::EXPIRY_KEY, 0 );

		// Refresh 60 seconds early to avoid edge-case expiry during requests.
		if ( $token && time() < ( $expiry - 60 ) ) {
			return $token;
		}

		return self::refresh_access_token();
	}

	/**
	 * Exchange refresh_token for a new access_token and persist it.
	 */
	private static function refresh_access_token(): string {
		$refresh_token = get_option( 'pm_zoho_refresh_token', '' );
		$client_id     = get_option( 'pm_zoho_client_id', '' );
		$client_secret = get_option( 'pm_zoho_client_secret', '' );

		if ( ! $refresh_token || ! $client_id || ! $client_secret ) {
			self::log( 'Token refresh aborted: missing Zoho credentials.' );
			return '';
		}

		$response = wp_remote_post(
			self::AUTH_BASE . '/oauth/v2/token',
			[
				'body' => [
					'grant_type'    => 'refresh_token',
					'refresh_token' => $refresh_token,
					'client_id'     => $client_id,
					'client_secret' => $client_secret,
				],
				'timeout' => 15,
			]
		);

		if ( is_wp_error( $response ) ) {
			self::log( 'Token refresh WP error: ' . $response->get_error_message() );
			return '';
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( empty( $body['access_token'] ) ) {
			self::log( 'Token refresh failed: ' . wp_remote_retrieve_body( $response ) );
			return '';
		}

		$expires_in = (int) ( $body['expires_in'] ?? 3600 );
		update_option( self::TOKEN_KEY, $body['access_token'] );
		update_option( self::EXPIRY_KEY, time() + $expires_in );

		return $body['access_token'];
	}

	/**
	 * Build the redirect URL for initiating Zoho OAuth from the admin settings page.
	 */
	public static function get_oauth_url(): string {
		$client_id    = get_option( 'pm_zoho_client_id', '' );
		$redirect_uri = admin_url( 'admin.php?page=pm-zoho-settings&pm_zoho_oauth=callback' );

		return add_query_arg( [
			'scope'         => 'ZohoCRM.modules.contacts.ALL,ZohoCRM.modules.' . self::RECORDS_MODULE . '.ALL',
			'client_id'     => $client_id,
			'response_type' => 'code',
			'access_type'   => 'offline',
			'redirect_uri'  => rawurlencode( $redirect_uri ),
		], self::AUTH_BASE . '/oauth/v2/auth' );
	}

	/**
	 * Exchange authorization code (from OAuth callback) for refresh + access tokens.
	 */
	public static function exchange_auth_code( string $code ): bool {
		$client_id     = get_option( 'pm_zoho_client_id', '' );
		$client_secret = get_option( 'pm_zoho_client_secret', '' );
		$redirect_uri  = admin_url( 'admin.php?page=pm-zoho-settings&pm_zoho_oauth=callback' );

		$response = wp_remote_post(
			self::AUTH_BASE . '/oauth/v2/token',
			[
				'body' => [
					'grant_type'    => 'authorization_code',
					'code'          => $code,
					'client_id'     => $client_id,
					'client_secret' => $client_secret,
					'redirect_uri'  => $redirect_uri,
				],
				'timeout' => 15,
			]
		);

		if ( is_wp_error( $response ) ) {
			self::log( 'Auth code exchange WP error: ' . $response->get_error_message() );
			return false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( empty( $body['access_token'] ) || empty( $body['refresh_token'] ) ) {
			self::log( 'Auth code exchange failed: ' . wp_remote_retrieve_body( $response ) );
			return false;
		}

		$expires_in = (int) ( $body['expires_in'] ?? 3600 );
		update_option( 'pm_zoho_refresh_token', $body['refresh_token'] );
		update_option( self::TOKEN_KEY, $body['access_token'] );
		update_option( self::EXPIRY_KEY, time() + $expires_in );

		return true;
	}

	// ── CRM Data Operations ───────────────────────────────────────────────────

	/**
	 * Fetch all Contacts in Zoho whose PM_Ambassador_WP_ID equals $wp_user_id.
	 * This is the primary security gate: ambassadors only ever see their own clients.
	 *
	 * @param int $wp_user_id WordPress user ID of the logged-in ambassador.
	 * @return array List of client records, each a simplified array.
	 */
	public static function get_clients_for_ambassador( int $wp_user_id ): array {
		if ( $wp_user_id <= 0 ) {
			return [];
		}

		$endpoint = '/Contacts/search';
		$params   = [
			'criteria' => '(PM_Ambassador_WP_ID:equals:' . $wp_user_id . ')',
			'fields'   => 'id,Full_Name,Account_Name,Email,Phone,PM_Ambassador_WP_ID,Lead_Status',
			'per_page' => 200,
		];

		$data = self::get( $endpoint, $params );

		if ( empty( $data['data'] ) ) {
			return [];
		}

		$clients = [];
		foreach ( $data['data'] as $record ) {
			// Double-check server-side: only include records matching this ambassador.
			if ( (string) ( $record['PM_Ambassador_WP_ID'] ?? '' ) !== (string) $wp_user_id ) {
				continue;
			}
			$clients[] = [
				'zoho_id'     => sanitize_text_field( $record['id'] ),
				'name'        => sanitize_text_field( $record['Full_Name'] ?? '' ),
				'business'    => sanitize_text_field( $record['Account_Name']['name'] ?? '' ),
				'email'       => sanitize_email( $record['Email'] ?? '' ),
				'phone'       => sanitize_text_field( $record['Phone'] ?? '' ),
				'status'      => sanitize_text_field( $record['Lead_Status'] ?? '' ),
			];
		}

		return $clients;
	}

	/**
	 * Verify a contact belongs to $ambassador_wp_id before allowing record access.
	 * Always call this before serving monthly-record data.
	 *
	 * @return bool
	 */
	public static function contact_belongs_to_ambassador( string $zoho_contact_id, int $ambassador_wp_id ): bool {
		if ( ! $zoho_contact_id || $ambassador_wp_id <= 0 ) {
			return false;
		}

		$data = self::get( '/Contacts/' . $zoho_contact_id, [
			'fields' => 'id,PM_Ambassador_WP_ID',
		] );

		if ( empty( $data['data'][0] ) ) {
			return false;
		}

		return (string) ( $data['data'][0]['PM_Ambassador_WP_ID'] ?? '' ) === (string) $ambassador_wp_id;
	}

	/**
	 * Fetch monthly records for a given Zoho Contact ID.
	 *
	 * @param string $zoho_contact_id Zoho Contact record ID.
	 * @return array
	 */
	public static function get_monthly_records( string $zoho_contact_id ): array {
		$endpoint = '/' . self::RECORDS_MODULE . '/search';
		$params   = [
			'criteria' => '(PM_Client_ID:equals:' . $zoho_contact_id . ')',
			'fields'   => 'id,PM_Client_ID,PM_Month,PM_Year,PM_Ad_Spend,PM_Client_Payment,PM_Profit',
			'per_page' => 200,
			'sort_by'  => 'PM_Year',
			'sort_order' => 'desc',
		];

		$data = self::get( $endpoint, $params );

		if ( empty( $data['data'] ) ) {
			return [];
		}

		$records = [];
		foreach ( $data['data'] as $r ) {
			$records[] = [
				'record_id'      => sanitize_text_field( $r['id'] ),
				'month'          => (int) ( $r['PM_Month'] ?? 0 ),
				'year'           => (int) ( $r['PM_Year'] ?? 0 ),
				'ad_spend'       => (float) ( $r['PM_Ad_Spend'] ?? 0 ),
				'client_payment' => (float) ( $r['PM_Client_Payment'] ?? 0 ),
				'profit'         => (float) ( $r['PM_Profit'] ?? 0 ),
			];
		}
		return $records;
	}

	/**
	 * Create a new monthly record in Zoho.
	 *
	 * @param array $data {zoho_contact_id, month, year, ad_spend, client_payment, profit}
	 * @return string|false  New Zoho record ID on success, false on failure.
	 */
	public static function create_monthly_record( array $data ) {
		$payload = [
			'data' => [
				[
					'PM_Client_ID'      => $data['zoho_contact_id'],
					'PM_Month'          => (int) $data['month'],
					'PM_Year'           => (int) $data['year'],
					'PM_Ad_Spend'       => (float) $data['ad_spend'],
					'PM_Client_Payment' => (float) $data['client_payment'],
					'PM_Profit'         => (float) $data['profit'],
					'Name'              => 'Record ' . $data['year'] . '-' . str_pad( $data['month'], 2, '0', STR_PAD_LEFT ),
				],
			],
		];

		$result = self::post( '/' . self::RECORDS_MODULE, $payload );

		if ( ! empty( $result['data'][0]['details']['id'] ) ) {
			return sanitize_text_field( $result['data'][0]['details']['id'] );
		}

		self::log( 'create_monthly_record failed: ' . wp_json_encode( $result ) );
		return false;
	}

	/**
	 * Update an existing monthly record in Zoho.
	 *
	 * @param string $record_id Zoho record ID.
	 * @param array  $data      Fields to update.
	 * @return bool
	 */
	public static function update_monthly_record( string $record_id, array $data ): bool {
		$payload = [
			'data' => [
				[
					'id'                => $record_id,
					'PM_Ad_Spend'       => (float) $data['ad_spend'],
					'PM_Client_Payment' => (float) $data['client_payment'],
					'PM_Profit'         => (float) $data['profit'],
				],
			],
		];

		$result = self::put( '/' . self::RECORDS_MODULE . '/' . $record_id, $payload );
		$status = $result['data'][0]['status'] ?? '';

		if ( 'success' === $status ) {
			return true;
		}

		self::log( 'update_monthly_record failed for ' . $record_id . ': ' . wp_json_encode( $result ) );
		return false;
	}

	/**
	 * Update PM_Ambassador_WP_ID on a Contact (used by admin to reassign).
	 *
	 * @param string $zoho_contact_id
	 * @param int    $new_ambassador_wp_id
	 * @return bool
	 */
	public static function reassign_client( string $zoho_contact_id, int $new_ambassador_wp_id ): bool {
		$payload = [
			'data' => [
				[
					'id'                   => $zoho_contact_id,
					'PM_Ambassador_WP_ID'  => (string) $new_ambassador_wp_id,
				],
			],
		];

		$result = self::put( '/Contacts/' . $zoho_contact_id, $payload );
		return isset( $result['data'][0]['status'] ) && 'success' === $result['data'][0]['status'];
	}

	// ── HTTP helpers ──────────────────────────────────────────────────────────

	private static function get( string $endpoint, array $params = [] ): array {
		$url      = self::API_BASE . $endpoint;
		if ( $params ) {
			$url .= '?' . http_build_query( $params );
		}
		$response = wp_remote_get( $url, [
			'headers' => self::auth_headers(),
			'timeout' => 20,
		] );
		return self::parse_response( $response );
	}

	private static function post( string $endpoint, array $body ): array {
		$response = wp_remote_post(
			self::API_BASE . $endpoint,
			[
				'headers' => array_merge( self::auth_headers(), [ 'Content-Type' => 'application/json' ] ),
				'body'    => wp_json_encode( $body ),
				'timeout' => 20,
			]
		);
		return self::parse_response( $response );
	}

	private static function put( string $endpoint, array $body ): array {
		$response = wp_remote_request(
			self::API_BASE . $endpoint,
			[
				'method'  => 'PUT',
				'headers' => array_merge( self::auth_headers(), [ 'Content-Type' => 'application/json' ] ),
				'body'    => wp_json_encode( $body ),
				'timeout' => 20,
			]
		);
		return self::parse_response( $response );
	}

	private static function auth_headers(): array {
		return [ 'Authorization' => 'Zoho-oauthtoken ' . self::get_access_token() ];
	}

	private static function parse_response( $response ): array {
		if ( is_wp_error( $response ) ) {
			self::log( 'HTTP error: ' . $response->get_error_message() );
			return [];
		}
		$code = wp_remote_retrieve_response_code( $response );
		$body = wp_remote_retrieve_body( $response );
		if ( $code >= 400 ) {
			self::log( 'API returned ' . $code . ': ' . $body );
			return [];
		}
		return json_decode( $body, true ) ?? [];
	}

	// ── Logging ───────────────────────────────────────────────────────────────

	private static function log( string $message ) {
		if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( '[PM Zoho] ' . $message );
		}
	}
}
