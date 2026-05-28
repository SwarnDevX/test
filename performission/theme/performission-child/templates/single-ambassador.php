<?php
/**
 * Single Ambassador profile page template.
 * Uses the pm_ambassador CPT + custom fields set via the meta box.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

while ( have_posts() ) :
	the_post();

	$role     = get_post_meta( get_the_ID(), 'pm_amb_role', true );
	$email    = get_post_meta( get_the_ID(), 'pm_amb_email', true );
	$phone    = get_post_meta( get_the_ID(), 'pm_amb_phone', true );
	$linkedin = get_post_meta( get_the_ID(), 'pm_amb_linkedin', true );
	$twitter  = get_post_meta( get_the_ID(), 'pm_amb_twitter', true );
	$location = get_post_meta( get_the_ID(), 'pm_amb_location', true );
	$stats    = get_post_meta( get_the_ID(), 'pm_amb_stats', true );
	?>

	<main class="pm-ambassador-single">

		<nav class="pm-breadcrumb" style="margin-bottom:24px;font-size:.82rem;color:var(--pm-text-muted)">
			<a href="<?php echo esc_url( home_url() ); ?>" style="color:var(--pm-text-muted)">Home</a>
			&nbsp;/&nbsp;
			<a href="<?php echo esc_url( get_post_type_archive_link( 'ambassador' ) ); ?>" style="color:var(--pm-text-muted)">Ambassadors</a>
			&nbsp;/&nbsp;
			<span><?php the_title(); ?></span>
		</nav>

		<div class="pm-ambassador-single__header">

			<?php if ( has_post_thumbnail() ) : ?>
				<img class="pm-ambassador-single__avatar"
					src="<?php echo esc_url( get_the_post_thumbnail_url( get_the_ID(), 'medium' ) ); ?>"
					alt="<?php echo esc_attr( get_the_title() ); ?>" />
			<?php else : ?>
				<div class="pm-ambassador-single__avatar" style="
					width:140px;height:140px;border-radius:50%;background:rgba(108,99,255,.1);
					display:flex;align-items:center;justify-content:center;
					font-size:3rem;color:rgba(108,99,255,.5);flex-shrink:0">👤</div>
			<?php endif; ?>

			<div class="pm-ambassador-single__info">
				<h1><?php the_title(); ?></h1>

				<?php if ( $role ) : ?>
					<p class="pm-ambassador-single__role"><?php echo esc_html( $role ); ?></p>
				<?php endif; ?>

				<?php if ( $location ) : ?>
					<p class="pm-ambassador-single__location">📍 <?php echo esc_html( $location ); ?></p>
				<?php endif; ?>

				<div class="pm-ambassador-single__socials">
					<?php if ( $linkedin ) : ?>
						<a href="<?php echo esc_url( $linkedin ); ?>" class="pm-social-link" target="_blank" rel="noopener noreferrer">
							LinkedIn ↗
						</a>
					<?php endif; ?>
					<?php if ( $twitter ) : ?>
						<a href="<?php echo esc_url( $twitter ); ?>" class="pm-social-link" target="_blank" rel="noopener noreferrer">
							X / Twitter ↗
						</a>
					<?php endif; ?>
					<?php if ( $email ) : ?>
						<a href="mailto:<?php echo esc_attr( $email ); ?>" class="pm-social-link">
							Email
						</a>
					<?php endif; ?>
				</div>
			</div>

		</div><!-- .header -->

		<?php if ( $stats ) : ?>
			<?php
			$stat_parts = array_map( 'trim', explode( ',', $stats ) );
			?>
			<div class="pm-ambassador-single__stats">
				<?php foreach ( $stat_parts as $stat ) :
					$parts = explode( ' ', $stat, 2 );
					$val   = $parts[0] ?? $stat;
					$label = $parts[1] ?? '';
					?>
					<div class="pm-stat">
						<span class="pm-stat__value"><?php echo esc_html( $val ); ?></span>
						<?php if ( $label ) : ?>
							<span class="pm-stat__label"><?php echo esc_html( $label ); ?></span>
						<?php endif; ?>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<div class="pm-ambassador-single__bio">
			<?php the_content(); ?>
		</div>

		<div style="text-align:center;margin-top:48px">
			<a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"
				class="pm-btn pm-btn--primary" style="font-size:1rem;padding:14px 36px">
				Work with <?php echo esc_html( get_the_title() ); ?>
			</a>
		</div>

	</main>

	<?php
endwhile;

get_footer();
