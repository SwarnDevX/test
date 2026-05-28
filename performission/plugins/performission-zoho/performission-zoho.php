<?php
/**
 * Plugin Name:  PerforMission Zoho CRM
 * Description:  Zoho CRM OAuth integration — ambassador client tracker, monthly records, admin settings.
 * Version:      1.0.0
 * Author:       PerforMission
 * Text Domain:  performission-zoho
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PM_ZOHO_VERSION', '1.0.0' );
define( 'PM_ZOHO_PATH', plugin_dir_path( __FILE__ ) );
define( 'PM_ZOHO_URL', plugin_dir_url( __FILE__ ) );

require_once PM_ZOHO_PATH . 'includes/class-zoho-api.php';
require_once PM_ZOHO_PATH . 'includes/class-zoho-rest-api.php';
require_once PM_ZOHO_PATH . 'admin/settings-page.php';

add_action( 'plugins_loaded', 'pm_zoho_bootstrap' );

function pm_zoho_bootstrap() {
	PM_Zoho_REST_API::init();
	PM_Zoho_Settings::init();
}

// Enqueue dashboard assets on front-end for logged-in ambassadors.
add_action( 'wp_enqueue_scripts', 'pm_zoho_enqueue_assets' );

function pm_zoho_enqueue_assets() {
	if ( ! is_user_logged_in() ) {
		return;
	}
	$user  = wp_get_current_user();
	$roles = (array) $user->roles;
	if ( ! array_intersect( $roles, [ 'pm_ambassador', 'administrator' ] ) ) {
		return;
	}

	wp_enqueue_style(
		'pm-zoho-dashboard',
		PM_ZOHO_URL . 'assets/css/dashboard.css',
		[],
		PM_ZOHO_VERSION
	);

	wp_enqueue_script(
		'pm-zoho-dashboard',
		PM_ZOHO_URL . 'assets/js/dashboard.js',
		[],
		PM_ZOHO_VERSION,
		true
	);

	wp_localize_script( 'pm-zoho-dashboard', 'pmZoho', [
		'restUrl'   => esc_url_raw( rest_url( 'pm/v1/' ) ),
		'restNonce' => wp_create_nonce( 'wp_rest' ),
	] );
}
