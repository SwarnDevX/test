<?php
/**
 * Plugin Name:  PerforMission Core
 * Description:  Ambassador CPT, roles (pm_ambassador / pm_client), portal dashboard shortcodes.
 * Version:      1.0.0
 * Author:       PerforMission
 * Text Domain:  performission-core
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PM_CORE_VERSION', '1.0.0' );
define( 'PM_CORE_PATH', plugin_dir_path( __FILE__ ) );
define( 'PM_CORE_URL', plugin_dir_url( __FILE__ ) );

require_once PM_CORE_PATH . 'includes/class-ambassador-cpt.php';
require_once PM_CORE_PATH . 'includes/class-roles.php';
require_once PM_CORE_PATH . 'includes/class-portal-dashboard.php';

add_action( 'plugins_loaded', 'pm_core_bootstrap' );

function pm_core_bootstrap() {
	PM_Ambassador_CPT::init();
	PM_Roles::init();
	PM_Portal_Dashboard::init();
}

add_action( 'wp_enqueue_scripts', 'pm_core_enqueue_assets' );

function pm_core_enqueue_assets() {
	if ( ! is_user_logged_in() ) {
		return;
	}

	wp_enqueue_style(
		'pm-portal',
		PM_CORE_URL . 'assets/css/portal.css',
		[],
		PM_CORE_VERSION
	);

	wp_enqueue_script(
		'pm-portal',
		PM_CORE_URL . 'assets/js/portal.js',
		[],
		PM_CORE_VERSION,
		true
	);

	wp_localize_script( 'pm-portal', 'pmPortal', [
		'restUrl'   => esc_url_raw( rest_url( 'pm/v1/' ) ),
		'restNonce' => wp_create_nonce( 'wp_rest' ),
		'userId'    => get_current_user_id(),
	] );
}
