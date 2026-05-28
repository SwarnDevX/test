<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Fires the external platform webhook on AI Hub signup.
 * Hooks into WPForms, Fluent Forms, and Contact Form 7 submission events.
 * The API key is read from wp_options — never from the browser.
 */
class PM_AI_Hub_Webhook {

	public static function init() {
		// WPForms
		add_action( 'wpforms_process_complete', [ __CLASS__, 'handle_wpforms' ], 10, 4 );

		// Fluent Forms
		add_action( 'fluentform/submission_inserted', [ __CLASS__, 'handle_fluent' ], 10, 3 );

		// Contact Form 7 (fallback)
		add_action( 'wpcf7_mail_sent', [ __CLASS__, 'handle_cf7' ] );
	}

	// ── WPForms handler ───────────────────────────────────────────────────────
	public static function handle_wpforms( array $fields, array $entry, array $form_data, int $entry_id ) {
		$target_id = (int) get_option( 'pm_aihub_wpforms_id', 0 );
		if ( ! $target_id || (int) $form_data['id'] !== $target_id ) {
			return;
		}

		$name  = '';
		$email = '';

		foreach ( $fields as $field ) {
			$type = $field['type'] ?? '';
			if ( in_array( $type, [ 'name', 'text' ], true ) && ! $name ) {
				$name = $field['value'] ?? '';
			}
			if ( 'email' === $type && ! $email ) {
				$email = $field['value'] ?? '';
			}
		}

		self::fire( $name, $email );
	}

	// ── Fluent Forms handler ──────────────────────────────────────────────────
	public static function handle_fluent( int $insert_id, array $form_data, $form ) {
		$target_id = (int) get_option( 'pm_aihub_fluentforms_id', 0 );
		if ( ! $target_id || (int) $form->id !== $target_id ) {
			return;
		}

		$name  = sanitize_text_field( $form_data['data']['names'] ?? $form_data['data']['name'] ?? '' );
		$email = sanitize_email( $form_data['data']['email'] ?? '' );

		self::fire( $name, $email );
	}

	// ── Contact Form 7 handler ────────────────────────────────────────────────
	public static function handle_cf7( $contact_form ) {
		// Only fire for forms with a specific tag (add [pm_aihub_trigger] to your CF7 form).
		$submission = WPCF7_Submission::get_instance();
		if ( ! $submission ) {
			return;
		}

		$posted = $submission->get_posted_data();

		// Check for the opt-in tag to confirm this is the AI Hub form.
		if ( empty( $posted['pm_aihub_trigger'] ) ) {
			return;
		}

		$name  = sanitize_text_field( $posted['your-name'] ?? $posted['name'] ?? '' );
		$email = sanitize_email( $posted['your-email'] ?? $posted['email'] ?? '' );

		self::fire( $name, $email );
	}

	// ── Core webhook fire ─────────────────────────────────────────────────────

	/**
	 * POST to the external platform and log the result.
	 *
	 * @param string $name  User's name from the form.
	 * @param string $email User's email from the form.
	 */
	private static function fire( string $name, string $email ) {
		$endpoint = get_option( 'pm_aihub_platform_endpoint', '' );
		$api_key  = get_option( 'pm_aihub_platform_api_key', '' );

		if ( ! $endpoint || ! $email ) {
			self::log( $email, false, 'Missing endpoint or email — check AI Hub settings.' );
			return;
		}

		if ( ! is_email( $email ) ) {
			self::log( $email, false, 'Invalid email address.' );
			return;
		}

		$payload = [
			'name'      => sanitize_text_field( $name ),
			'email'     => sanitize_email( $email ),
			'source'    => 'performission_aihub',
			'timestamp' => gmdate( 'c' ),
		];

		$args = [
			'headers' => [
				'Content-Type' => 'application/json',
			],
			'body'    => wp_json_encode( $payload ),
			'timeout' => 15,
		];

		// Only add Auth header if api_key is set.
		if ( $api_key ) {
			$args['headers']['Authorization'] = 'Bearer ' . $api_key;
		}

		$response = wp_remote_post( $endpoint, $args );

		if ( is_wp_error( $response ) ) {
			self::log( $email, false, $response->get_error_message() );
			return;
		}

		$code = wp_remote_retrieve_response_code( $response );

		if ( $code >= 200 && $code < 300 ) {
			self::log( $email, true, '' );

			// Optionally create a WordPress account for the lead.
			if ( ! email_exists( $email ) ) {
				self::create_lead_account( $name, $email );
			}
		} else {
			$body = wp_remote_retrieve_body( $response );
			self::log( $email, false, 'HTTP ' . $code . ': ' . substr( $body, 0, 200 ) );
		}
	}

	/**
	 * Optionally create a WP account tagged as a lead so it can feed the ambassador tracker.
	 */
	private static function create_lead_account( string $name, string $email ) {
		$user_id = wp_create_user(
			sanitize_user( strtolower( str_replace( ' ', '.', $name ) ) . '.' . wp_generate_password( 4, false ) ),
			wp_generate_password( 16 ),
			$email
		);

		if ( is_wp_error( $user_id ) ) {
			return;
		}

		$user = get_user_by( 'id', $user_id );
		if ( $user ) {
			$user->set_role( 'pm_client' );
			update_user_meta( $user_id, 'pm_lead_source', 'aihub' );
			update_user_meta( $user_id, 'pm_lead_date', gmdate( 'Y-m-d' ) );
			wp_update_user( [ 'ID' => $user_id, 'display_name' => sanitize_text_field( $name ) ] );
		}
	}

	// ── Logging ───────────────────────────────────────────────────────────────
	private static function log( string $email, bool $ok, string $error ) {
		$log   = get_option( 'pm_aihub_last_log', [] );
		$log[] = [
			'time'  => gmdate( 'Y-m-d H:i:s' ),
			'email' => $email,
			'ok'    => $ok,
			'error' => $error,
		];
		// Keep only the last 50 entries.
		if ( count( $log ) > 50 ) {
			$log = array_slice( $log, -50 );
		}
		update_option( 'pm_aihub_last_log', $log );

		if ( ! $ok && defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( '[PM AI Hub] Webhook failed for ' . $email . ': ' . $error );
		}
	}
}
