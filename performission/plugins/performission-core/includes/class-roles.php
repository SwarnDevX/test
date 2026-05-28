<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PM_Roles {

	// Custom capabilities used across the platform.
	const CAPS = [
		'pm_view_dashboard',
		'pm_view_own_clients',
		'pm_edit_client_records',
		'pm_view_all_clients',
		'pm_reassign_clients',
		'pm_view_courses',
		'pm_manage_ambassadors',
	];

	public static function init() {
		// Roles are registered once on plugin activation; re-register on every init
		// to handle cases where the role was removed externally.
		add_action( 'init', [ __CLASS__, 'register_roles' ] );
		add_filter( 'login_redirect', [ __CLASS__, 'role_based_redirect' ], 10, 3 );

		// Prevent portal roles from accessing wp-admin (except admins).
		add_action( 'admin_init', [ __CLASS__, 'block_portal_users_from_admin' ] );
	}

	public static function register_roles() {
		if ( ! get_role( 'pm_ambassador' ) ) {
			add_role( 'pm_ambassador', 'Ambassador', [
				'read'                   => true,
				'pm_view_dashboard'      => true,
				'pm_view_own_clients'    => true,
				'pm_edit_client_records' => true,
				'pm_view_courses'        => true,
			] );
		}

		if ( ! get_role( 'pm_client' ) ) {
			add_role( 'pm_client', 'Client', [
				'read'              => true,
				'pm_view_dashboard' => true,
				'pm_view_courses'   => true,
			] );
		}

		// Grant all PM caps to admins.
		$admin = get_role( 'administrator' );
		if ( $admin ) {
			foreach ( self::CAPS as $cap ) {
				$admin->add_cap( $cap );
			}
		}
	}

	/**
	 * Redirect users to the portal dashboard after login based on their role.
	 */
	public static function role_based_redirect( $redirect_to, $requested_redirect_to, $user ) {
		if ( is_wp_error( $user ) ) {
			return $redirect_to;
		}

		$roles = (array) $user->roles;

		// Admins go to wp-admin.
		if ( in_array( 'administrator', $roles, true ) ) {
			return admin_url();
		}

		// All portal roles go to the portal dashboard.
		if ( in_array( 'pm_ambassador', $roles, true ) || in_array( 'pm_client', $roles, true ) ) {
			$page = get_page_by_path( 'dashboard' );
			if ( $page ) {
				return get_permalink( $page->ID );
			}
			return home_url( '/dashboard/' );
		}

		return $redirect_to;
	}

	/**
	 * Redirect portal-only users away from wp-admin.
	 */
	public static function block_portal_users_from_admin() {
		if ( ! is_user_logged_in() || wp_doing_ajax() ) {
			return;
		}
		$user = wp_get_current_user();
		$roles = (array) $user->roles;
		$portal_only = array_intersect( $roles, [ 'pm_ambassador', 'pm_client' ] );
		if ( ! empty( $portal_only ) && ! in_array( 'administrator', $roles, true ) ) {
			wp_redirect( home_url( '/dashboard/' ) );
			exit;
		}
	}

	// ── Helpers ──────────────────────────────────────────────────────────────

	public static function is_ambassador( int $user_id = 0 ): bool {
		$user = $user_id ? get_user_by( 'id', $user_id ) : wp_get_current_user();
		if ( ! $user ) {
			return false;
		}
		$roles = (array) $user->roles;
		return in_array( 'pm_ambassador', $roles, true ) || in_array( 'administrator', $roles, true );
	}

	public static function is_client( int $user_id = 0 ): bool {
		$user = $user_id ? get_user_by( 'id', $user_id ) : wp_get_current_user();
		if ( ! $user ) {
			return false;
		}
		return in_array( 'pm_client', (array) $user->roles, true );
	}
}
