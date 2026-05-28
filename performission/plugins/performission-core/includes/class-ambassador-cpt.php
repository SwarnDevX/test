<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PM_Ambassador_CPT {

	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_cpt' ] );
		add_action( 'add_meta_boxes', [ __CLASS__, 'add_meta_boxes' ] );
		add_action( 'save_post_ambassador', [ __CLASS__, 'save_meta' ], 10, 2 );
		add_filter( 'manage_ambassador_posts_columns', [ __CLASS__, 'admin_columns' ] );
		add_action( 'manage_ambassador_posts_custom_column', [ __CLASS__, 'admin_column_data' ], 10, 2 );
	}

	public static function register_cpt() {
		$labels = [
			'name'               => 'Ambassadors',
			'singular_name'      => 'Ambassador',
			'add_new_item'       => 'Add New Ambassador',
			'edit_item'          => 'Edit Ambassador',
			'new_item'           => 'New Ambassador',
			'view_item'          => 'View Ambassador',
			'search_items'       => 'Search Ambassadors',
			'not_found'          => 'No ambassadors found',
			'not_found_in_trash' => 'No ambassadors in trash',
			'all_items'          => 'All Ambassadors',
		];

		register_post_type( 'ambassador', [
			'labels'       => $labels,
			'public'       => true,
			'has_archive'  => true,
			'supports'     => [ 'title', 'editor', 'thumbnail', 'excerpt', 'page-attributes' ],
			'rewrite'      => [ 'slug' => 'ambassadors', 'with_front' => false ],
			'menu_icon'    => 'dashicons-groups',
			'show_in_rest' => true,
			'menu_position' => 5,
		] );
	}

	public static function add_meta_boxes() {
		add_meta_box(
			'pm_ambassador_details',
			'Ambassador Details',
			[ __CLASS__, 'render_meta_box' ],
			'ambassador',
			'normal',
			'high'
		);
	}

	public static function render_meta_box( $post ) {
		wp_nonce_field( 'pm_ambassador_meta_save', 'pm_ambassador_meta_nonce' );

		$fields = [
			'pm_amb_role'     => [ 'label' => 'Role / Title',               'type' => 'text' ],
			'pm_amb_email'    => [ 'label' => 'Email Address',               'type' => 'email' ],
			'pm_amb_phone'    => [ 'label' => 'Phone Number',                'type' => 'text' ],
			'pm_amb_linkedin' => [ 'label' => 'LinkedIn URL',                'type' => 'url' ],
			'pm_amb_twitter'  => [ 'label' => 'Twitter / X URL',             'type' => 'url' ],
			'pm_amb_location' => [ 'label' => 'Location (City, Country)',    'type' => 'text' ],
			'pm_amb_wp_user'  => [ 'label' => 'Linked WordPress User ID',    'type' => 'number' ],
			'pm_amb_zoho_id'  => [ 'label' => 'Zoho CRM Contact/User ID',    'type' => 'text' ],
		];

		echo '<style>.pm-meta-table th{width:200px;padding:8px 4px;font-weight:600;vertical-align:top}.pm-meta-table td{padding:6px 4px}.pm-meta-table input{width:100%;max-width:400px}</style>';
		echo '<table class="pm-meta-table form-table"><tbody>';

		foreach ( $fields as $key => $cfg ) {
			$value = get_post_meta( $post->ID, $key, true );
			printf(
				'<tr><th><label for="%1$s">%2$s</label></th><td><input type="%3$s" id="%1$s" name="%1$s" value="%4$s" class="regular-text" /></td></tr>',
				esc_attr( $key ),
				esc_html( $cfg['label'] ),
				esc_attr( $cfg['type'] ),
				esc_attr( $value )
			);
		}

		echo '</tbody></table>';

		// Stat highlights (optional per-ambassador marketing copy)
		$stats = get_post_meta( $post->ID, 'pm_amb_stats', true );
		echo '<p><label for="pm_amb_stats"><strong>Stats / Highlight Numbers</strong> (e.g. "500+ clients, $2M revenue")</label></p>';
		echo '<input type="text" id="pm_amb_stats" name="pm_amb_stats" value="' . esc_attr( $stats ) . '" class="large-text" />';
	}

	public static function save_meta( $post_id, $post ) {
		if ( ! isset( $_POST['pm_ambassador_meta_nonce'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['pm_ambassador_meta_nonce'] ) ), 'pm_ambassador_meta_save' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$text_fields = [
			'pm_amb_role', 'pm_amb_email', 'pm_amb_phone',
			'pm_amb_linkedin', 'pm_amb_twitter', 'pm_amb_location',
			'pm_amb_wp_user', 'pm_amb_zoho_id', 'pm_amb_stats',
		];

		foreach ( $text_fields as $key ) {
			if ( array_key_exists( $key, $_POST ) ) {
				update_post_meta( $post_id, $key, sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) );
			}
		}
	}

	public static function admin_columns( $columns ) {
		$new = [];
		foreach ( $columns as $key => $val ) {
			$new[ $key ] = $val;
			if ( 'title' === $key ) {
				$new['pm_amb_role']    = 'Role';
				$new['pm_amb_email']   = 'Email';
				$new['pm_amb_wp_user'] = 'WP User ID';
			}
		}
		return $new;
	}

	public static function admin_column_data( $column, $post_id ) {
		$map = [
			'pm_amb_role'    => 'pm_amb_role',
			'pm_amb_email'   => 'pm_amb_email',
			'pm_amb_wp_user' => 'pm_amb_wp_user',
		];
		if ( isset( $map[ $column ] ) ) {
			echo esc_html( get_post_meta( $post_id, $map[ $column ], true ) );
		}
	}
}
