<?php
/**
 * Plugin Name:  PerforMission AI Hub
 * Description:  Fires a server-side webhook to the external marketing platform on AI Hub signup.
 *               Compatible with WPForms, Fluent Forms, and Contact Form 7.
 * Version:      1.0.0
 * Author:       PerforMission
 * Text Domain:  performission-aihub
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PM_AIHUB_VERSION', '1.0.0' );
define( 'PM_AIHUB_PATH', plugin_dir_path( __FILE__ ) );

require_once PM_AIHUB_PATH . 'includes/class-webhook.php';

add_action( 'plugins_loaded', 'pm_aihub_bootstrap' );

function pm_aihub_bootstrap() {
	PM_AI_Hub_Webhook::init();
}

// ── Admin settings page (sub-menu under PerforMission) ────────────────────
add_action( 'admin_menu', 'pm_aihub_admin_menu' );

function pm_aihub_admin_menu() {
	add_submenu_page(
		'pm-zoho-settings',
		'AI Hub Settings',
		'AI Hub',
		'manage_options',
		'pm-aihub-settings',
		'pm_aihub_settings_page'
	);
}

function pm_aihub_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) return;

	if ( isset( $_POST['pm_aihub_save'] ) && check_admin_referer( 'pm_aihub_settings_save' ) ) {
		update_option( 'pm_aihub_platform_endpoint', sanitize_url( wp_unslash( $_POST['pm_aihub_platform_endpoint'] ?? '' ) ) );
		update_option( 'pm_aihub_platform_api_key', sanitize_text_field( wp_unslash( $_POST['pm_aihub_platform_api_key'] ?? '' ) ) );
		update_option( 'pm_aihub_wpforms_id', absint( $_POST['pm_aihub_wpforms_id'] ?? 0 ) );
		update_option( 'pm_aihub_fluentforms_id', absint( $_POST['pm_aihub_fluentforms_id'] ?? 0 ) );
		echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
	}

	$endpoint    = get_option( 'pm_aihub_platform_endpoint', '' );
	$api_key     = get_option( 'pm_aihub_platform_api_key', '' );
	$wpforms_id  = get_option( 'pm_aihub_wpforms_id', 0 );
	$fluent_id   = get_option( 'pm_aihub_fluentforms_id', 0 );
	$log         = get_option( 'pm_aihub_last_log', [] );
	?>
	<div class="wrap" style="max-width:700px">
		<h1>PerforMission — AI Hub Settings</h1>
		<p>When a user submits the AI Hub signup form, a POST is sent server-side to your external platform. The API key is never exposed to the browser.</p>
		<hr>
		<form method="post">
			<?php wp_nonce_field( 'pm_aihub_settings_save' ); ?>
			<table class="form-table">
				<tr>
					<th><label for="pm_aihub_platform_endpoint">Platform Webhook URL</label></th>
					<td>
						<input type="url" id="pm_aihub_platform_endpoint" name="pm_aihub_platform_endpoint"
							value="<?php echo esc_attr( $endpoint ); ?>" class="large-text" placeholder="https://platform.example.com/api/register" />
						<p class="description">The POST endpoint provided by your external marketing platform.</p>
					</td>
				</tr>
				<tr>
					<th><label for="pm_aihub_platform_api_key">Platform API Key</label></th>
					<td>
						<input type="password" id="pm_aihub_platform_api_key" name="pm_aihub_platform_api_key"
							value="<?php echo esc_attr( $api_key ); ?>" class="large-text" autocomplete="new-password" />
						<p class="description">Stored server-side only. Never sent to the browser.</p>
					</td>
				</tr>
				<tr>
					<th><label>Form ID</label></th>
					<td>
						<p><strong>WPForms:</strong> <input type="number" name="pm_aihub_wpforms_id" value="<?php echo esc_attr( $wpforms_id ); ?>" style="width:80px" /> &nbsp;
						<strong>Fluent Forms:</strong> <input type="number" name="pm_aihub_fluentforms_id" value="<?php echo esc_attr( $fluent_id ); ?>" style="width:80px" /></p>
						<p class="description">Enter the form ID from your forms plugin. Zero = disabled for that plugin.</p>
					</td>
				</tr>
			</table>
			<p>
				<input type="hidden" name="pm_aihub_save" value="1" />
				<?php submit_button( 'Save Settings', 'primary', '', false ); ?>
			</p>
		</form>
		<hr>
		<h2>Recent Webhook Log</h2>
		<?php if ( ! empty( $log ) ) : ?>
			<table class="widefat striped" style="max-width:600px">
				<thead><tr><th>Time</th><th>Email</th><th>Result</th></tr></thead>
				<tbody>
				<?php foreach ( array_slice( array_reverse( $log ), 0, 10 ) as $entry ) : ?>
					<tr>
						<td><?php echo esc_html( $entry['time'] ?? '' ); ?></td>
						<td><?php echo esc_html( $entry['email'] ?? '' ); ?></td>
						<td style="color:<?php echo isset( $entry['ok'] ) && $entry['ok'] ? 'green' : 'red'; ?>">
							<?php echo isset( $entry['ok'] ) && $entry['ok'] ? '✅ OK' : '❌ ' . esc_html( $entry['error'] ?? 'Failed' ); ?>
						</td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
		<?php else : ?>
			<p>No webhook attempts logged yet.</p>
		<?php endif; ?>
	</div>
	<?php
}
