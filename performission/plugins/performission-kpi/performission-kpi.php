<?php
/**
 * Plugin Name:  PerforMission KPI Calculator
 * Description:  Server-side proxy for the AI KPI Calculator. Keeps the AI API key out of the browser.
 *               Embeds the calculator via [pm_kpi_calculator] shortcode.
 * Version:      1.0.0
 * Author:       PerforMission
 * Text Domain:  performission-kpi
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PM_KPI_VERSION', '1.0.0' );
define( 'PM_KPI_PATH', plugin_dir_path( __FILE__ ) );
define( 'PM_KPI_URL', plugin_dir_url( __FILE__ ) );

require_once PM_KPI_PATH . 'includes/class-kpi-proxy.php';

add_action( 'plugins_loaded', 'pm_kpi_bootstrap' );

function pm_kpi_bootstrap() {
	PM_KPI_Proxy::init();
}

// Enqueue calculator assets.
add_action( 'wp_enqueue_scripts', 'pm_kpi_enqueue_assets' );

function pm_kpi_enqueue_assets() {
	if ( ! is_singular() ) return;
	global $post;
	if ( ! $post || ! has_shortcode( $post->post_content, 'pm_kpi_calculator' ) ) return;

	wp_enqueue_style(
		'pm-kpi-calculator',
		PM_KPI_URL . 'assets/css/calculator.css',
		[],
		PM_KPI_VERSION
	);

	wp_enqueue_script(
		'pm-kpi-calculator',
		PM_KPI_URL . 'assets/js/calculator.js',
		[],
		PM_KPI_VERSION,
		true
	);

	wp_localize_script( 'pm-kpi-calculator', 'pmKpi', [
		'ajaxUrl'   => esc_url_raw( rest_url( 'pm/v1/kpi-calculate' ) ),
		'nonce'     => wp_create_nonce( 'wp_rest' ),
	] );
}

// Admin settings sub-page.
add_action( 'admin_menu', 'pm_kpi_admin_menu' );

function pm_kpi_admin_menu() {
	add_submenu_page(
		'pm-zoho-settings',
		'KPI Calculator Settings',
		'KPI Calculator',
		'manage_options',
		'pm-kpi-settings',
		'pm_kpi_settings_page'
	);
}

function pm_kpi_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) return;

	if ( isset( $_POST['pm_kpi_save'] ) && check_admin_referer( 'pm_kpi_settings_save' ) ) {
		update_option( 'pm_kpi_ai_provider', sanitize_text_field( wp_unslash( $_POST['pm_kpi_ai_provider'] ?? 'openai' ) ) );
		update_option( 'pm_kpi_api_key', sanitize_text_field( wp_unslash( $_POST['pm_kpi_api_key'] ?? '' ) ) );
		update_option( 'pm_kpi_model', sanitize_text_field( wp_unslash( $_POST['pm_kpi_model'] ?? '' ) ) );
		update_option( 'pm_kpi_rate_limit', absint( $_POST['pm_kpi_rate_limit'] ?? 10 ) );
		echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
	}

	$provider   = get_option( 'pm_kpi_ai_provider', 'openai' );
	$model      = get_option( 'pm_kpi_model', 'gpt-4o-mini' );
	$rate_limit = get_option( 'pm_kpi_rate_limit', 10 );
	?>
	<div class="wrap" style="max-width:700px">
		<h1>PerforMission — KPI Calculator</h1>
		<p>The calculator sends user inputs to a server-side proxy here. The AI API key never reaches the browser.</p>
		<p>Embed the calculator on any page with: <code>[pm_kpi_calculator]</code></p>
		<hr>
		<form method="post">
			<?php wp_nonce_field( 'pm_kpi_settings_save' ); ?>
			<table class="form-table">
				<tr>
					<th><label for="pm_kpi_ai_provider">AI Provider</label></th>
					<td>
						<select id="pm_kpi_ai_provider" name="pm_kpi_ai_provider">
							<option value="openai"    <?php selected( $provider, 'openai' ); ?>>OpenAI</option>
							<option value="anthropic" <?php selected( $provider, 'anthropic' ); ?>>Anthropic (Claude)</option>
						</select>
					</td>
				</tr>
				<tr>
					<th><label for="pm_kpi_api_key">AI API Key</label></th>
					<td>
						<input type="password" id="pm_kpi_api_key" name="pm_kpi_api_key"
							value="<?php echo esc_attr( get_option( 'pm_kpi_api_key', '' ) ); ?>"
							class="large-text" autocomplete="new-password" />
						<p class="description">Stored server-side only. Never sent to the browser.</p>
					</td>
				</tr>
				<tr>
					<th><label for="pm_kpi_model">Model</label></th>
					<td>
						<input type="text" id="pm_kpi_model" name="pm_kpi_model"
							value="<?php echo esc_attr( $model ); ?>" class="regular-text"
							placeholder="gpt-4o-mini or claude-haiku-4-5-20251001" />
					</td>
				</tr>
				<tr>
					<th><label for="pm_kpi_rate_limit">Rate limit (requests/IP/hour)</label></th>
					<td>
						<input type="number" id="pm_kpi_rate_limit" name="pm_kpi_rate_limit"
							value="<?php echo esc_attr( $rate_limit ); ?>" min="1" max="100" style="width:80px" />
					</td>
				</tr>
			</table>
			<input type="hidden" name="pm_kpi_save" value="1" />
			<?php submit_button( 'Save Settings', 'primary', '', false ); ?>
		</form>
	</div>
	<?php
}
