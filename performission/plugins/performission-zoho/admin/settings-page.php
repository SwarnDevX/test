<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PM_Zoho_Settings {

	public static function init() {
		add_action( 'admin_menu', [ __CLASS__, 'add_menu' ] );
		add_action( 'admin_init', [ __CLASS__, 'handle_oauth_callback' ] );
		add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
		add_action( 'admin_post_pm_zoho_save_settings', [ __CLASS__, 'save_settings' ] );
		add_action( 'admin_post_pm_zoho_disconnect', [ __CLASS__, 'disconnect' ] );
	}

	public static function add_menu() {
		add_menu_page(
			'PerforMission Settings',
			'PerforMission',
			'manage_options',
			'pm-zoho-settings',
			[ __CLASS__, 'render_page' ],
			'dashicons-performance',
			30
		);
	}

	public static function register_settings() {
		register_setting( 'pm_zoho_settings_group', 'pm_zoho_client_id',     [ 'sanitize_callback' => 'sanitize_text_field' ] );
		register_setting( 'pm_zoho_settings_group', 'pm_zoho_client_secret', [ 'sanitize_callback' => 'sanitize_text_field' ] );
	}

	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$client_id     = get_option( 'pm_zoho_client_id', '' );
		$client_secret = get_option( 'pm_zoho_client_secret', '' );
		$refresh_token = get_option( 'pm_zoho_refresh_token', '' );
		$is_connected  = ! empty( $refresh_token );

		if ( isset( $_GET['pm_zoho_connected'] ) ) {
			echo '<div class="notice notice-success is-dismissible"><p><strong>Zoho CRM connected successfully!</strong></p></div>';
		}
		if ( isset( $_GET['pm_zoho_error'] ) ) {
			echo '<div class="notice notice-error is-dismissible"><p><strong>OAuth error:</strong> ' . esc_html( urldecode( $_GET['pm_zoho_error'] ) ) . '</p></div>';
		}
		if ( isset( $_GET['pm_zoho_disconnected'] ) ) {
			echo '<div class="notice notice-warning is-dismissible"><p>Zoho CRM disconnected. Enter credentials and reconnect.</p></div>';
		}
		if ( isset( $_GET['pm_settings_saved'] ) ) {
			echo '<div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>';
		}
		?>
		<div class="wrap" style="max-width:800px">
			<h1>PerforMission — Zoho CRM Settings</h1>
			<p>Connect your Zoho CRM account to power the Ambassador Client Tracker. OAuth credentials never leave your server.</p>
			<hr>

			<!-- CONNECTION STATUS -->
			<div style="background:<?php echo $is_connected ? '#d4edda' : '#fff3cd'; ?>;border:1px solid <?php echo $is_connected ? '#c3e6cb' : '#ffc107'; ?>;border-radius:6px;padding:16px 20px;margin-bottom:24px">
				<strong>Status:</strong>
				<?php if ( $is_connected ) : ?>
					✅ <strong>Connected to Zoho CRM</strong>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline;margin-left:16px">
						<?php wp_nonce_field( 'pm_zoho_disconnect' ); ?>
						<input type="hidden" name="action" value="pm_zoho_disconnect">
						<button type="submit" class="button button-small" onclick="return confirm('Disconnect Zoho CRM?')">Disconnect</button>
					</form>
				<?php else : ?>
					⚠️ <strong>Not connected.</strong> Enter your Zoho Client ID and Secret below, save, then click Connect.
				<?php endif; ?>
			</div>

			<!-- CREDENTIALS FORM -->
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'pm_zoho_save_settings' ); ?>
				<input type="hidden" name="action" value="pm_zoho_save_settings">

				<table class="form-table">
					<tr>
						<th><label for="pm_zoho_client_id">Zoho Client ID</label></th>
						<td>
							<input type="text" id="pm_zoho_client_id" name="pm_zoho_client_id"
								value="<?php echo esc_attr( $client_id ); ?>"
								class="regular-text" autocomplete="off" />
							<p class="description">From Zoho API Console → Self Client or your OAuth app.</p>
						</td>
					</tr>
					<tr>
						<th><label for="pm_zoho_client_secret">Zoho Client Secret</label></th>
						<td>
							<input type="password" id="pm_zoho_client_secret" name="pm_zoho_client_secret"
								value="<?php echo esc_attr( $client_secret ); ?>"
								class="regular-text" autocomplete="new-password" />
						</td>
					</tr>
				</table>

				<?php submit_button( 'Save Credentials' ); ?>
			</form>

			<!-- OAUTH CONNECT -->
			<?php if ( $client_id && $client_secret && ! $is_connected ) : ?>
				<hr>
				<h2>Step 2 — Authorise with Zoho</h2>
				<p>Click below to open the Zoho authorisation page. You will be redirected back here automatically.</p>
				<a href="<?php echo esc_url( PM_Zoho_API::get_oauth_url() ); ?>" class="button button-primary button-large">
					Connect to Zoho CRM
				</a>
			<?php elseif ( ! $client_id || ! $client_secret ) : ?>
				<p><em>Save your Client ID and Secret above first.</em></p>
			<?php endif; ?>

			<hr>
			<h2>Zoho CRM Data Model Checklist</h2>
			<p>Before using the tracker, confirm these exist in your Zoho CRM account:</p>
			<ol>
				<li>
					<strong>Contacts module → custom field:</strong><br>
					API Name: <code>PM_Ambassador_WP_ID</code> | Type: <strong>Text</strong><br>
					<em>Stores the WordPress User ID of the assigned ambassador.</em>
				</li>
				<li>
					<strong>Custom Module:</strong> <code>PM_Monthly_Records</code><br>
					Fields required:
					<table style="margin-top:8px;border-collapse:collapse">
						<tr><th style="text-align:left;padding:4px 12px 4px 0;border-bottom:1px solid #ccc">API Name</th><th style="text-align:left;padding:4px 12px;border-bottom:1px solid #ccc">Type</th></tr>
						<tr><td style="padding:4px 12px 4px 0"><code>PM_Client_ID</code></td><td style="padding:4px 12px">Lookup → Contacts</td></tr>
						<tr><td style="padding:4px 12px 4px 0"><code>PM_Month</code></td><td style="padding:4px 12px">Integer (1–12)</td></tr>
						<tr><td style="padding:4px 12px 4px 0"><code>PM_Year</code></td><td style="padding:4px 12px">Integer (e.g. 2025)</td></tr>
						<tr><td style="padding:4px 12px 4px 0"><code>PM_Ad_Spend</code></td><td style="padding:4px 12px">Currency</td></tr>
						<tr><td style="padding:4px 12px 4px 0"><code>PM_Client_Payment</code></td><td style="padding:4px 12px">Currency</td></tr>
						<tr><td style="padding:4px 12px 4px 0"><code>PM_Profit</code></td><td style="padding:4px 12px">Currency</td></tr>
					</table>
				</li>
			</ol>

			<hr>
			<h2>Webhook Test</h2>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'pm_zoho_test_connection' ); ?>
				<input type="hidden" name="action" value="pm_zoho_test_connection">
				<p>
					<button type="submit" class="button">Test Zoho Connection</button>
					<?php if ( isset( $_GET['pm_test_result'] ) ) : ?>
						<span style="margin-left:12px;color:<?php echo 'ok' === $_GET['pm_test_result'] ? 'green' : 'red'; ?>">
							<?php echo 'ok' === $_GET['pm_test_result'] ? '✅ Connected successfully' : '❌ Connection failed — check logs'; ?>
						</span>
					<?php endif; ?>
				</p>
			</form>
		</div>
		<?php
	}

	public static function save_settings() {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );
		check_admin_referer( 'pm_zoho_save_settings' );

		update_option( 'pm_zoho_client_id',     sanitize_text_field( wp_unslash( $_POST['pm_zoho_client_id'] ?? '' ) ) );
		update_option( 'pm_zoho_client_secret', sanitize_text_field( wp_unslash( $_POST['pm_zoho_client_secret'] ?? '' ) ) );

		wp_redirect( admin_url( 'admin.php?page=pm-zoho-settings&pm_settings_saved=1' ) );
		exit;
	}

	public static function disconnect() {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );
		check_admin_referer( 'pm_zoho_disconnect' );

		delete_option( 'pm_zoho_refresh_token' );
		delete_option( 'pm_zoho_access_token' );
		delete_option( 'pm_zoho_token_expiry' );

		wp_redirect( admin_url( 'admin.php?page=pm-zoho-settings&pm_zoho_disconnected=1' ) );
		exit;
	}

	public static function handle_oauth_callback() {
		if ( ! isset( $_GET['page'] ) || 'pm-zoho-settings' !== $_GET['page'] ) return;
		if ( ! isset( $_GET['pm_zoho_oauth'] ) || 'callback' !== $_GET['pm_zoho_oauth'] ) return;
		if ( ! current_user_can( 'manage_options' ) ) return;

		if ( isset( $_GET['error'] ) ) {
			wp_redirect( admin_url( 'admin.php?page=pm-zoho-settings&pm_zoho_error=' . rawurlencode( sanitize_text_field( wp_unslash( $_GET['error'] ) ) ) ) );
			exit;
		}

		if ( empty( $_GET['code'] ) ) return;

		$code = sanitize_text_field( wp_unslash( $_GET['code'] ) );
		$ok   = PM_Zoho_API::exchange_auth_code( $code );

		wp_redirect( admin_url( 'admin.php?page=pm-zoho-settings&pm_zoho_connected=' . ( $ok ? '1' : '0' ) ) );
		exit;
	}
}

// Handle test-connection form post.
add_action( 'admin_post_pm_zoho_test_connection', function () {
	if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );
	check_admin_referer( 'pm_zoho_test_connection' );

	$token  = PM_Zoho_API::get_access_token();
	$result = $token ? 'ok' : 'fail';

	wp_redirect( admin_url( 'admin.php?page=pm-zoho-settings&pm_test_result=' . $result ) );
	exit;
} );
