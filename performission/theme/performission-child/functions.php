<?php
/**
 * PerforMission Child Theme — functions.php
 * Parent: Hello Elementor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ── Enqueue parent + child styles ─────────────────────────────────────────
add_action( 'wp_enqueue_scripts', 'pm_child_enqueue_styles' );

function pm_child_enqueue_styles() {
	$parent_version = wp_get_theme( 'hello-elementor' )->get( 'Version' );
	wp_enqueue_style(
		'hello-elementor-style',
		get_template_directory_uri() . '/style.css',
		[],
		$parent_version
	);
	wp_enqueue_style(
		'performission-child-style',
		get_stylesheet_uri(),
		[ 'hello-elementor-style' ],
		wp_get_theme()->get( 'Version' )
	);

	// Google Fonts — Inter
	wp_enqueue_style(
		'pm-inter-font',
		'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
		[],
		null
	);
}

// ── Template overrides ────────────────────────────────────────────────────
add_filter( 'template_include', 'pm_child_template_override' );

function pm_child_template_override( $template ) {
	if ( is_singular( 'ambassador' ) ) {
		$child_template = get_stylesheet_directory() . '/templates/single-ambassador.php';
		if ( file_exists( $child_template ) ) {
			return $child_template;
		}
	}

	if ( is_post_type_archive( 'ambassador' ) ) {
		$child_template = get_stylesheet_directory() . '/templates/archive-ambassador.php';
		if ( file_exists( $child_template ) ) {
			return $child_template;
		}
	}

	return $template;
}

// ── Remove Hello Elementor's default page title on dashboard page ─────────
add_filter( 'hello_elementor_page_title', 'pm_hide_dashboard_title' );

function pm_hide_dashboard_title( $show_title ) {
	if ( is_page( 'dashboard' ) || is_page( 'portal' ) ) {
		return false;
	}
	return $show_title;
}

// ── Add body class for logged-in role ─────────────────────────────────────
add_filter( 'body_class', 'pm_body_classes' );

function pm_body_classes( array $classes ): array {
	if ( is_user_logged_in() ) {
		$user  = wp_get_current_user();
		$roles = (array) $user->roles;
		foreach ( $roles as $role ) {
			$classes[] = 'pm-role-' . sanitize_html_class( $role );
		}
		$classes[] = 'pm-logged-in';
	}
	return $classes;
}

// ── Dashboard page shortcode fallback (in case pm_dashboard isn't registered)
add_shortcode( 'pm_dashboard_fallback', function () {
	if ( is_user_logged_in() ) {
		return do_shortcode( '[pm_dashboard]' );
	}
	return '<p>Please <a href="' . esc_url( wp_login_url( get_permalink() ) ) . '">log in</a>.</p>';
} );

// ── Excerpt length tweak for ambassador archive ───────────────────────────
add_filter( 'excerpt_length', function ( $length ) {
	return is_post_type_archive( 'ambassador' ) ? 20 : $length;
} );
