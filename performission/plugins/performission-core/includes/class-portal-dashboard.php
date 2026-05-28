<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PM_Portal_Dashboard {

	public static function init() {
		add_shortcode( 'pm_dashboard', [ __CLASS__, 'render' ] );
		// Protect portal pages from unauthenticated access.
		add_action( 'template_redirect', [ __CLASS__, 'guard_portal_pages' ] );
	}

	/**
	 * Main shortcode: [pm_dashboard]
	 * Place this on the /dashboard/ page in Elementor via HTML widget.
	 */
	public static function render(): string {
		if ( ! is_user_logged_in() ) {
			return sprintf(
				'<p class="pm-login-notice">Please <a href="%s">log in</a> to access your dashboard.</p>',
				esc_url( wp_login_url( get_permalink() ) )
			);
		}

		$user  = wp_get_current_user();
		$roles = (array) $user->roles;

		if ( in_array( 'pm_ambassador', $roles, true ) || in_array( 'administrator', $roles, true ) ) {
			return self::ambassador_view( $user );
		}

		if ( in_array( 'pm_client', $roles, true ) ) {
			return self::client_view( $user );
		}

		return '<p class="pm-error">Your account does not have portal access. Contact <a href="/contact/">support</a>.</p>';
	}

	// ── Ambassador view ───────────────────────────────────────────────────────

	private static function ambassador_view( WP_User $user ): string {
		ob_start();
		?>
		<div class="pm-portal pm-portal--ambassador" id="pm-dashboard" data-role="ambassador">

			<header class="pm-portal__header">
				<div class="pm-portal__welcome">
					<h2>Welcome back, <span><?php echo esc_html( $user->display_name ); ?></span></h2>
					<span class="pm-badge pm-badge--ambassador">Ambassador</span>
				</div>
				<a href="<?php echo esc_url( wp_logout_url( home_url() ) ); ?>" class="pm-btn pm-btn--ghost pm-btn--sm">Sign out</a>
			</header>

			<nav class="pm-portal__nav" role="tablist">
				<button class="pm-tab active" data-target="clients"  role="tab" aria-selected="true">My Clients</button>
				<button class="pm-tab"        data-target="courses"  role="tab">My Courses</button>
				<button class="pm-tab"        data-target="profile"  role="tab">Profile</button>
			</nav>

			<!-- CLIENTS TAB -->
			<section class="pm-panel active" id="pm-panel-clients" role="tabpanel">
				<div class="pm-panel__head">
					<h3>Client Portfolio</h3>
					<p>Monthly performance data for your assigned clients, pulled live from Zoho CRM.</p>
				</div>
				<div id="pm-clients-container">
					<div class="pm-loading"><span class="pm-spinner"></span> Loading clients…</div>
				</div>
			</section>

			<!-- COURSES TAB -->
			<section class="pm-panel" id="pm-panel-courses" role="tabpanel">
				<div class="pm-panel__head">
					<h3>My Courses</h3>
				</div>
				<?php echo self::courses_html( $user->ID ); ?>
			</section>

			<!-- PROFILE TAB -->
			<section class="pm-panel" id="pm-panel-profile" role="tabpanel">
				<div class="pm-panel__head">
					<h3>My Profile</h3>
				</div>
				<div class="pm-profile-card">
					<div class="pm-profile-card__row"><span>Name</span><strong><?php echo esc_html( $user->display_name ); ?></strong></div>
					<div class="pm-profile-card__row"><span>Email</span><strong><?php echo esc_html( $user->user_email ); ?></strong></div>
					<div class="pm-profile-card__row"><span>Role</span><strong>Ambassador</strong></div>
				</div>
				<a href="<?php echo esc_url( get_edit_user_link( $user->ID ) ); ?>" class="pm-btn pm-btn--secondary pm-btn--sm">Edit Profile</a>
			</section>

		</div><!-- .pm-portal -->
		<?php
		return ob_get_clean();
	}

	// ── Client view ───────────────────────────────────────────────────────────

	private static function client_view( WP_User $user ): string {
		ob_start();
		?>
		<div class="pm-portal pm-portal--client" id="pm-dashboard" data-role="client">

			<header class="pm-portal__header">
				<div class="pm-portal__welcome">
					<h2>Welcome back, <span><?php echo esc_html( $user->display_name ); ?></span></h2>
					<span class="pm-badge pm-badge--client">Client</span>
				</div>
				<a href="<?php echo esc_url( wp_logout_url( home_url() ) ); ?>" class="pm-btn pm-btn--ghost pm-btn--sm">Sign out</a>
			</header>

			<nav class="pm-portal__nav" role="tablist">
				<button class="pm-tab active" data-target="courses" role="tab" aria-selected="true">My Courses</button>
				<button class="pm-tab"        data-target="profile" role="tab">Profile</button>
			</nav>

			<section class="pm-panel active" id="pm-panel-courses" role="tabpanel">
				<div class="pm-panel__head"><h3>My Courses</h3></div>
				<?php echo self::courses_html( $user->ID ); ?>
			</section>

			<section class="pm-panel" id="pm-panel-profile" role="tabpanel">
				<div class="pm-panel__head"><h3>My Profile</h3></div>
				<div class="pm-profile-card">
					<div class="pm-profile-card__row"><span>Name</span><strong><?php echo esc_html( $user->display_name ); ?></strong></div>
					<div class="pm-profile-card__row"><span>Email</span><strong><?php echo esc_html( $user->user_email ); ?></strong></div>
					<div class="pm-profile-card__row"><span>Role</span><strong>Client</strong></div>
				</div>
				<a href="<?php echo esc_url( get_edit_user_link( $user->ID ) ); ?>" class="pm-btn pm-btn--secondary pm-btn--sm">Edit Profile</a>
			</section>

		</div>
		<?php
		return ob_get_clean();
	}

	// ── Shared helpers ────────────────────────────────────────────────────────

	private static function courses_html( int $user_id ): string {
		if ( ! function_exists( 'learndash_user_get_enrolled_courses' ) ) {
			return '<p>Course system not active yet. <a href="/education/">Browse courses</a>.</p>';
		}

		$course_ids = learndash_user_get_enrolled_courses( $user_id );

		if ( empty( $course_ids ) ) {
			return '<p>You are not enrolled in any courses yet. <a href="/education/" class="pm-link">Browse courses</a>.</p>';
		}

		$html = '<div class="pm-courses-grid">';
		foreach ( $course_ids as $id ) {
			$progress = function_exists( 'learndash_course_progress' )
				? learndash_course_progress( [ 'user_id' => $user_id, 'course_id' => $id, 'array' => true ] )
				: [];
			$pct = isset( $progress['percentage'] ) ? (int) $progress['percentage'] : 0;

			$html .= sprintf(
				'<div class="pm-course-card">
					<h4>%s</h4>
					<div class="pm-progress-bar"><div class="pm-progress-bar__fill" style="width:%d%%"></div></div>
					<span class="pm-progress-label">%d%% complete</span>
					<a href="%s" class="pm-btn pm-btn--primary pm-btn--sm">%s</a>
				</div>',
				esc_html( get_the_title( $id ) ),
				$pct,
				$pct,
				esc_url( get_permalink( $id ) ),
				$pct > 0 ? 'Continue' : 'Start'
			);
		}
		$html .= '</div>';
		return $html;
	}

	/**
	 * Redirect unauthenticated visitors away from the /dashboard/ page.
	 */
	public static function guard_portal_pages() {
		if ( is_user_logged_in() ) {
			return;
		}
		$protected_slugs = [ 'dashboard', 'portal' ];
		global $post;
		if ( $post && in_array( $post->post_name, $protected_slugs, true ) ) {
			wp_redirect( wp_login_url( get_permalink() ) );
			exit;
		}
	}
}
