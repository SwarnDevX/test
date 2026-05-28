<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * KPI Calculator proxy — registers the REST endpoint and handles AI API calls.
 *
 * POST /wp-json/pm/v1/kpi-calculate
 * Body: { metrics: { ... } }
 * Returns: { result: "AI-generated analysis string" }
 *
 * Rate-limited per IP using transients. API key never leaves the server.
 */
class PM_KPI_Proxy {

	const ROUTE = 'pm/v1';

	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_route' ] );
		add_shortcode( 'pm_kpi_calculator', [ __CLASS__, 'render_shortcode' ] );
	}

	public static function register_route() {
		register_rest_route( self::ROUTE, '/kpi-calculate', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [ __CLASS__, 'handle_request' ],
			'permission_callback' => '__return_true', // Public endpoint — rate-limited below.
			'args'                => [
				'metrics' => [
					'required'          => true,
					'validate_callback' => fn( $v ) => is_array( $v ),
				],
			],
		] );
	}

	public static function handle_request( WP_REST_Request $request ): WP_REST_Response {
		// Rate limiting — max N requests per IP per hour.
		if ( ! self::check_rate_limit() ) {
			return new WP_Error(
				'pm_rate_limited',
				'Too many requests. Please try again later.',
				[ 'status' => 429 ]
			);
		}

		$metrics = $request->get_param( 'metrics' );
		$metrics = self::sanitize_metrics( $metrics );

		if ( empty( $metrics ) ) {
			return new WP_Error( 'pm_bad_input', 'No valid metrics provided.', [ 'status' => 400 ] );
		}

		$api_key  = get_option( 'pm_kpi_api_key', '' );
		$provider = get_option( 'pm_kpi_ai_provider', 'openai' );
		$model    = get_option( 'pm_kpi_model', 'gpt-4o-mini' );

		if ( ! $api_key ) {
			return new WP_Error( 'pm_config_error', 'KPI Calculator is not configured. Contact the site admin.', [ 'status' => 500 ] );
		}

		$result = 'openai' === $provider
			? self::call_openai( $api_key, $model, $metrics )
			: self::call_anthropic( $api_key, $model, $metrics );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( [ 'result' => $result ] );
	}

	// ── AI Providers ──────────────────────────────────────────────────────────

	private static function call_openai( string $api_key, string $model, array $metrics ) {
		$prompt = self::build_prompt( $metrics );

		$response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', [
			'headers' => [
				'Authorization' => 'Bearer ' . $api_key,
				'Content-Type'  => 'application/json',
			],
			'body' => wp_json_encode( [
				'model'      => $model ?: 'gpt-4o-mini',
				'messages'   => [ [ 'role' => 'user', 'content' => $prompt ] ],
				'max_tokens' => 600,
				'temperature' => 0.3,
			] ),
			'timeout' => 30,
		] );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'pm_ai_error', 'AI service unavailable: ' . $response->get_error_message(), [ 'status' => 503 ] );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		$text = $body['choices'][0]['message']['content'] ?? '';

		if ( ! $text ) {
			return new WP_Error( 'pm_ai_error', 'No response from AI provider.', [ 'status' => 503 ] );
		}

		return wp_strip_all_tags( $text );
	}

	private static function call_anthropic( string $api_key, string $model, array $metrics ) {
		$prompt = self::build_prompt( $metrics );

		$response = wp_remote_post( 'https://api.anthropic.com/v1/messages', [
			'headers' => [
				'x-api-key'         => $api_key,
				'anthropic-version' => '2023-06-01',
				'Content-Type'      => 'application/json',
			],
			'body' => wp_json_encode( [
				'model'      => $model ?: 'claude-haiku-4-5-20251001',
				'max_tokens' => 600,
				'messages'   => [ [ 'role' => 'user', 'content' => $prompt ] ],
			] ),
			'timeout' => 30,
		] );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'pm_ai_error', 'AI service unavailable: ' . $response->get_error_message(), [ 'status' => 503 ] );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		$text = $body['content'][0]['text'] ?? '';

		if ( ! $text ) {
			return new WP_Error( 'pm_ai_error', 'No response from AI provider.', [ 'status' => 503 ] );
		}

		return wp_strip_all_tags( $text );
	}

	// ── Prompt builder ────────────────────────────────────────────────────────

	private static function build_prompt( array $metrics ): string {
		$lines = [ 'You are a marketing performance analyst. Analyse these KPIs and provide a brief, actionable summary (3-5 bullet points). Be concise and specific.', '', 'KPI Data:' ];
		foreach ( $metrics as $key => $val ) {
			$lines[] = '- ' . ucwords( str_replace( '_', ' ', $key ) ) . ': ' . $val;
		}
		$lines[] = '';
		$lines[] = 'Provide insights on what is working, what needs improvement, and one recommended next step.';
		return implode( "\n", $lines );
	}

	// ── Shortcode ─────────────────────────────────────────────────────────────

	public static function render_shortcode(): string {
		ob_start();
		?>
		<div class="pm-kpi-calculator" id="pm-kpi-calculator">
			<div class="pm-kpi-form-wrap">
				<h3>AI Marketing KPI Analyser</h3>
				<p class="pm-kpi-desc">Enter your campaign metrics and get an instant AI-powered performance analysis.</p>

				<form id="pm-kpi-form" class="pm-kpi-form" novalidate>
					<div class="pm-kpi-grid">
						<div class="pm-kpi-field">
							<label for="pm-kpi-impressions">Impressions</label>
							<input type="number" id="pm-kpi-impressions" name="impressions" min="0" placeholder="e.g. 50000" />
						</div>
						<div class="pm-kpi-field">
							<label for="pm-kpi-clicks">Clicks</label>
							<input type="number" id="pm-kpi-clicks" name="clicks" min="0" placeholder="e.g. 2500" />
						</div>
						<div class="pm-kpi-field">
							<label for="pm-kpi-conversions">Conversions</label>
							<input type="number" id="pm-kpi-conversions" name="conversions" min="0" placeholder="e.g. 150" />
						</div>
						<div class="pm-kpi-field">
							<label for="pm-kpi-spend">Ad Spend ($)</label>
							<input type="number" id="pm-kpi-spend" name="ad_spend" min="0" step="0.01" placeholder="e.g. 1200" />
						</div>
						<div class="pm-kpi-field">
							<label for="pm-kpi-revenue">Revenue Generated ($)</label>
							<input type="number" id="pm-kpi-revenue" name="revenue" min="0" step="0.01" placeholder="e.g. 8000" />
						</div>
						<div class="pm-kpi-field">
							<label for="pm-kpi-cac">Customer Acquisition Cost ($)</label>
							<input type="number" id="pm-kpi-cac" name="cac" min="0" step="0.01" placeholder="e.g. 8.00" />
						</div>
					</div>

					<div id="pm-kpi-error" style="display:none"></div>

					<button type="submit" id="pm-kpi-submit" class="pm-kpi-btn">
						<span id="pm-kpi-btn-text">Analyse My KPIs</span>
						<span id="pm-kpi-btn-loading" style="display:none">Analysing…</span>
					</button>
				</form>

				<div id="pm-kpi-result" class="pm-kpi-result" style="display:none">
					<h4>AI Analysis</h4>
					<div id="pm-kpi-result-text"></div>
					<button id="pm-kpi-reset" class="pm-kpi-btn pm-kpi-btn--secondary">Start Over</button>
				</div>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	// ── Rate limiting ─────────────────────────────────────────────────────────

	private static function check_rate_limit(): bool {
		$limit      = (int) get_option( 'pm_kpi_rate_limit', 10 );
		$ip         = self::get_client_ip();
		$key        = 'pm_kpi_rl_' . md5( $ip );
		$count      = (int) get_transient( $key );

		if ( $count >= $limit ) {
			return false;
		}

		if ( $count === 0 ) {
			set_transient( $key, 1, HOUR_IN_SECONDS );
		} else {
			set_transient( $key, $count + 1, HOUR_IN_SECONDS );
		}

		return true;
	}

	private static function get_client_ip(): string {
		// Check for reverse-proxy headers — use only the first IP in the chain.
		$headers = [ 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR' ];
		foreach ( $headers as $h ) {
			if ( ! empty( $_SERVER[ $h ] ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER[ $h ] ) );
				return explode( ',', $ip )[0];
			}
		}
		return '0.0.0.0';
	}

	// ── Sanitization ──────────────────────────────────────────────────────────

	private static function sanitize_metrics( $metrics ): array {
		if ( ! is_array( $metrics ) ) return [];
		$clean = [];
		foreach ( $metrics as $key => $val ) {
			$key = sanitize_key( $key );
			if ( $key && is_numeric( $val ) ) {
				$clean[ $key ] = (float) $val;
			}
		}
		return $clean;
	}
}
