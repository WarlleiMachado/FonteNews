<?php
/**
 * Plugin Name:       Fonte Slide Course
 * Description:       Um plugin para criar um slider de conteúdo com imagens e textos personalizáveis.
 * Version:           4.0
 * Author:            Warllei Machado
 * Author URI:        https://adfontedevidalaranjeiras.org/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       fonte-slider
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// Constantes para caminhos
define( 'FSC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Inclui o arquivo do painel de administração
require_once( plugin_dir_path( __FILE__ ) . 'admin/config-page.php' );

/**
 * Enfileira os scripts e estilos necessários para o slider.
 */
function fsc_enqueue_assets() {
    global $post;
    if ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'fonte_slider' ) ) {
        
        wp_enqueue_script( 'gsap-core', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js', array(), '3.11.3', true );
        wp_enqueue_script( 'gsap-physics', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/Physics2DPlugin.min.js', array('gsap-core'), '3.11.3', true );
        
        wp_enqueue_style( 'fsc-style', FSC_PLUGIN_URL . 'css/fsc-style.css', array(), '4.0' );
        wp_enqueue_script( 'fonte-slide-course', FSC_PLUGIN_URL . 'js/fonte-slide-course.js', array( 'jquery', 'gsap-core' ), '4.0', true );

        $slides = get_option('fs_slides', []);
        $settings = get_option('fs_settings', []);
        wp_localize_script( 'fonte-slide-course', 'fs_data', ['slides' => $slides, 'settings' => $settings]);
    }
}
add_action( 'wp_enqueue_scripts', 'fsc_enqueue_assets' );

/**
 * Renderiza o HTML do slider através do shortcode.
 */
function fsc_render_slider_shortcode() {
    $settings = get_option('fs_settings', []);
    
    // MUDANÇA: Ícones SVG agora estão embutidos diretamente no PHP.
    // A pasta /img/ não é mais necessária.
    $prev_icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    $next_icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    $particles_enabled = isset($settings['enable_particles']) && $settings['enable_particles'] == '1' ? 'true' : 'false';

    ob_start();
    ?>
    <div id="fsc_container" class="fsc-container" data-particles-enabled="<?php echo $particles_enabled; ?>">
        <canvas id="fsc_magic-dust"></canvas>
        <div class="fsc-background"></div>
        <div class="fsc-content">
            <div class="fsc-text-area">
                <div class="fsc-text-wrapper">
                    <div class="fsc-category"></div><h2 class="fsc-title"></h2><a href="#" class="fsc-read-more background_shining">Leia Mais</a>
                </div>
            </div>
            <div class="fsc-image-area"><div class="fsc-image-wrapper"></div></div>
        </div>
        <div class="fsc-navigator"><div class="fsc-prev"><?php echo $prev_icon; ?></div><div class="fsc-next"><?php echo $next_icon; ?></div></div>
        <?php if ( !empty($settings['contact_email']) ) : ?>
            <div class="fsc-email-display" style="color: <?php echo esc_attr($settings['email_color'] ?? '#ffffff'); ?>;">
                <a href="mailto:<?php echo esc_attr($settings['contact_email']); ?>" style="color: inherit;"><?php echo esc_html($settings['contact_email']); ?></a>
            </div>
        <?php endif; ?>
    </div>

    <div id="fsc_popup_overlay" class="fsc-popup-overlay">
        <div class="fsc-popup-content">
            <img src="" alt="Imagem Ampliada" />
        </div>
        <div class="fsc-popup-actions">
            <a href="#" class="fsc-popup-open-link" target="_self" title="Abrir Link">
                <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></i>
            </a>
            <a href="#" class="fsc-popup-close-action" title="Fechar">
                <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></i>
            </a>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'fonte_slider', 'fsc_render_slider_shortcode' );