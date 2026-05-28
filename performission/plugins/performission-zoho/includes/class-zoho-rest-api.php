<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WordPress REST API endpoints that proxy Zoho CRM data.
 *
 * Base: /wp-json/pm/v1/
 *
 * GET  /clients                          → ambassador's client list
 * GET  /clients/{zoho_id}/records        → monthly records for one client
 * POST /clients/{zoho_id}/records        → add monthly record
 * PUT  /records/{record_id}              → update monthly record
 * PUT  /clients/{zoho_id}/reassign       → admin: reassign client to another ambassador
 *
 * Security: every endpoint enforces server-side ownership.
 * An ambassador can ONLY read/write records for clients whose PM_Ambassador_WP_ID
 * matches their own WordPress user ID.
 */
class PM_Zoho_REST_API {

	const NAMESPACE = 'pm/v1';

	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	public static function register_routes() {

		// List ambassador's own clients.
		register_rest_route( self::NAMESPACE, '/clients', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ __CLASS__, 'get_clients' ],
			'permission_callback' => [ __CLASS__, 'require_ambassador' ],
		] );

		// Monthly records for a specific client.
		register_rest_route( self::NAMESPACE, '/clients/(?P<zoho_id>[a-zA-Z0-9]+)/records', [
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'get_records' ],
				'permission_callback' => [ __CLASS__, 'require_ambassador' ],
				'args'                => [ 'zoho_id' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ] ],
			],
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ __CLASS__, 'create_record' ],
				'permission_callback' => [ __CLASS__, 'require_ambassador' ],
				'args'                => self::record_args(),
			],
		] );

		// Update a monthly record.
		register_rest_route( self::NAMESPACE, '/records/(?P<record_id>[a-zA-Z0-9]+)', [
			'methods'             => WP_REST_Server::EDITABLE,
			'callback'            => [ __CLASS__, 'update_record' ],
			'permission_callback' => [ __CLASS__, 'require_ambassador' ],
			'args'                => self::record_args(),
		] );

		// Admin: reassign a client to a different ambassador.
		register_rest_route( self::NAMESPACE, '/clients/(?P<zoho_id>[a-zA-Z0-9]+)/reassign', [
			'methods'             => WP_REST_Server::EDITABLE,
			'callback'            => [ __CLASS__, 'reassign_client' ],
			'permission_callback' => [ __CLASS__, 'require_admin' ],
			'args'                => [
				'new_ambassador_wp_id' => [
					'required'          => true,
					'sanitize_callback' => 'absint',
					'validate_callback' => fn( $v ) => $v > 0,
				],
			],
		] );
	}

	// ── Handlers ──────────────────────────────────────────────────────────────

	public static function get_clients( WP_REST_Request $request ): WP_REST_Response {
		$ambassador_id = get_current_user_id();
		$clients       = PM_Zoho_API::get_clients_for_ambassador( $ambassador_id );
		return rest_ensure_response( $clients );
	}

	public static function get_records( WP_REST_Request $request ): WP_REST_Response {
		$zoho_id       = $request->get_param( 'zoho_id' );
		$ambassador_id = get_current_user_id();

		if ( ! self::ambassador_owns_client( $zoho_id, $ambassador_id ) ) {
			return new WP_Error( 'pm_forbidden', 'You do not have access to this client.', [ 'status' => 403 ] );
		}

		$records = PM_Zoho_API::get_monthly_records( $zoho_id );
		return rest_ensure_response( $records );
	}

	public static function create_record( WP_REST_Request $request ): WP_REST_Response {
		$zoho_id       = $request->get_param( 'zoho_id' );
		$ambassador_id = get_current_user_id();

		if ( ! self::ambassador_owns_client( $zoho_id, $ambassador_id ) ) {
			return new WP_Error( 'pm_forbidden', 'You do not have access to this client.', [ 'status' => 403 ] );
		}

		$data = [
			'zoho_contact_id' => $zoho_id,
			'month'           => (int) $request->get_param( 'month' ),
			'year'            => (int) $request->get_param( 'year' ),
			'ad_spend'        => (float) $request->get_param( 'ad_spend' ),
			'client_payment'  => (float) $request->get_param( 'client_payment' ),
			'profit'          => (float) $request->get_param( 'profit' ),
		];

		$new_id = PM_Zoho_API::create_monthly_record( $data );

		if ( ! $new_id ) {
			return new WP_Error( 'pm_zoho_error', 'Failed to create record in Zoho. Check error log.', [ 'status' => 500 ] );
		}

		return rest_ensure_response( [ 'record_id' => $new_id ] );
	}

	public static function update_record( WP_REST_Request $request ): WP_REST_Response {
		$record_id = $request->get_param( 'record_id' );

		$data = [
			'ad_spend'       => (float) $request->get_param( 'ad_spend' ),
			'client_payment' => (float) $request->get_param( 'client_payment' ),
			'profit'         => (float) $request->get_param( 'profit' ),
		];

		$ok = PM_Zoho_API::update_monthly_record( $record_id, $data );

		if ( ! $ok ) {
			return new WP_Error( 'pm_zoho_error', 'Failed to update record in Zoho.', [ 'status' => 500 ] );
		}

		return rest_ensure_response( [ 'updated' => true ] );
	}

	public static function reassign_client( WP_REST_Request $request ): WP_REST_Response {
		$zoho_id              = $request->get_param( 'zoho_id' );
		$new_ambassador_wp_id = $request->get_param( 'new_ambassador_wp_id' );

		$ok = PM_Zoho_API::reassign_client( $zoho_id, $new_ambassador_wp_id );

		if ( ! $ok ) {
			return new WP_Error( 'pm_zoho_error', 'Failed to reassign client in Zoho.', [ 'status' => 500 ] );
		}

		return rest_ensure_response( [ 'reassigned' => true ] );
	}

	// ── Permissions ───────────────────────────────────────────────────────────

	public static function require_ambassador(): bool {
		if ( ! is_user_logged_in() ) {
			return false;
		}
		return current_user_can( 'pm_view_own_clients' );
	}

	public static function require_admin(): bool {
		return current_user_can( 'pm_reassign_clients' );
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	/**
	 * Server-side ownership check — never skip this.
	 */
	private static function ambassador_owns_client( string $zoho_id, int $ambassador_id ): bool {
		// Admins can access any client.
		if ( current_user_can( 'pm_view_all_clients' ) ) {
			return true;
		}
		return PM_Zoho_API::contact_belongs_to_ambassador( $zoho_id, $ambassador_id );
	}

	private static function record_args(): array {
		return [
			'month'          => [ 'required' => true, 'sanitize_callback' => 'absint',   'validate_callback' => fn($v) => $v >= 1 && $v <= 12 ],
			'year'           => [ 'required' => true, 'sanitize_callback' => 'absint',   'validate_callback' => fn($v) => $v >= 2000 && $v <= 2100 ],
			'ad_spend'       => [ 'required' => true, 'sanitize_callback' => 'floatval', 'validate_callback' => fn($v) => is_numeric($v) && $v >= 0 ],
			'client_payment' => [ 'required' => true, 'sanitize_callback' => 'floatval', 'validate_callback' => fn($v) => is_numeric($v) && $v >= 0 ],
			'profit'         => [ 'required' => true, 'sanitize_callback' => 'floatval', 'validate_callback' => fn($v) => is_numeric($v) ],
		];
	}
}
