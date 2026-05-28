<?php
/**
 * Ambassador archive — lists all published ambassador profiles.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main style="max-width:1200px;margin:0 auto;padding:60px 24px">

	<header style="text-align:center;margin-bottom:48px">
		<h1 style="font-size:2.4rem;font-weight:800;color:var(--pm-text);margin-bottom:12px">
			Our Ambassadors
		</h1>
		<p style="font-size:1rem;color:var(--pm-text-muted);max-width:560px;margin:0 auto">
			Meet the people driving results for PerforMission clients around the world.
		</p>
	</header>

	<?php if ( have_posts() ) : ?>

		<div class="pm-ambassadors-grid">
			<?php while ( have_posts() ) :
				the_post();

				$role     = get_post_meta( get_the_ID(), 'pm_amb_role', true );
				$location = get_post_meta( get_the_ID(), 'pm_amb_location', true );
				$stats    = get_post_meta( get_the_ID(), 'pm_amb_stats', true );
				?>

				<a href="<?php the_permalink(); ?>" class="pm-ambassador-card">

					<?php if ( has_post_thumbnail() ) : ?>
						<img class="pm-ambassador-card__thumb"
							src="<?php echo esc_url( get_the_post_thumbnail_url( get_the_ID(), 'medium_large' ) ); ?>"
							alt="<?php echo esc_attr( get_the_title() ); ?>" />
					<?php else : ?>
						<div class="pm-ambassador-card__thumb-placeholder">👤</div>
					<?php endif; ?>

					<div class="pm-ambassador-card__body">
						<h3 class="pm-ambassador-card__name"><?php the_title(); ?></h3>

						<?php if ( $role ) : ?>
							<span class="pm-ambassador-card__role"><?php echo esc_html( $role ); ?></span>
						<?php endif; ?>

						<?php if ( $location ) : ?>
							<span class="pm-ambassador-card__location">📍 <?php echo esc_html( $location ); ?></span>
						<?php endif; ?>

						<?php if ( $stats ) : ?>
							<span class="pm-ambassador-card__stats"><?php echo esc_html( $stats ); ?></span>
						<?php endif; ?>
					</div>

				</a>

			<?php endwhile; ?>
		</div>

		<?php
		the_posts_pagination( [
			'mid_size'  => 2,
			'prev_text' => '← Previous',
			'next_text' => 'Next →',
		] );
		?>

	<?php else : ?>
		<p style="text-align:center;color:var(--pm-text-muted);padding:60px 0">
			No ambassadors found.
		</p>
	<?php endif; ?>

</main>

<?php
get_footer();
