<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function fs_admin_menu() { 
    // NOME ALTERADO AQUI
    add_menu_page('Configurações do Fonte Slide Course','Fonte Slide Course','manage_options','fonte-slider-plugin','fs_settings_page_html','dashicons-images-alt2'); 
}
add_action( 'admin_menu', 'fs_admin_menu' );

function fs_register_settings() {
    register_setting( 'fs_settings_group', 'fs_slides' );
    register_setting( 'fs_settings_group', 'fs_settings' );
}
add_action( 'admin_init', 'fs_register_settings' );

function fs_settings_page_html() {
    if ( ! current_user_can( 'manage_options' ) ) return;
    $slides = get_option('fs_slides', []);
    $settings = get_option('fs_settings', ['background_image' => '','transition_time' => 6000,'enable_particles' => 0,'contact_email' => '','email_color' => '#ffffff']);
    ?>
    <div class="wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
        <form action="options.php" method="post">
            <?php settings_fields( 'fs_settings_group' ); ?>
            <h2>Configurações Gerais</h2>
            <table class="form-table">
                <tr><th>Imagem de Fundo Padrão</th><td><input type="text" name="fs_settings[background_image]" value="<?php echo esc_attr($settings['background_image']); ?>" class="regular-text" /><input type="button" class="button button-secondary upload_image_button" value="Selecionar Imagem" /></td></tr>
                <tr><th>Tempo de Transição (ms)</th><td><input type="number" name="fs_settings[transition_time]" value="<?php echo esc_attr($settings['transition_time']); ?>" class="regular-text" /></td></tr>
                <tr><th>Ativar Partículas Interativas</th><td><label><input type="checkbox" name="fs_settings[enable_particles]" value="1" <?php checked( $settings['enable_particles'] ?? 0, 1 ); ?> /> Sim</label></td></tr>
                <tr><th>Email de Contato</th><td><input type="email" name="fs_settings[contact_email]" value="<?php echo esc_attr($settings['contact_email'] ?? ''); ?>" class="regular-text" /></td></tr>
                <tr><th>Cor da Fonte do Email</th><td><input type="color" name="fs_settings[email_color]" value="<?php echo esc_attr($settings['email_color'] ?? '#ffffff'); ?>" /></td></tr>
            </table>

            <h2>Slides</h2>
            <div id="fs_slides_wrapper">
                <?php if ( ! empty( $slides ) ) : foreach ( $slides as $index => $slide ) : ?>
                    <div class="fs_slide_item postbox">
                        <h3 class="hndle"><span>Slide: <?php echo esc_html($slide['title'] ?: 'Novo Slide'); ?></span></h3>
                        <div class="inside"><table class="form-table">
                            <tr><th>Imagem do Slide (1:1)</th><td><input type="text" name="fs_slides[<?php echo $index; ?>][image]" value="<?php echo esc_attr($slide['image'] ?? ''); ?>" class="regular-text" /><input type="button" class="button upload_image_button" value="Selecionar" /><div class="fs_image_preview"><?php if ( ! empty( $slide['image'] ) ) : ?><img src="<?php echo esc_url($slide['image']); ?>" /><?php endif; ?></div></td></tr>
                            <tr><th>Imagem de Fundo</th><td><input type="text" name="fs_slides[<?php echo $index; ?>][background]" value="<?php echo esc_attr($slide['background'] ?? ''); ?>" class="regular-text" /><input type="button" class="button upload_image_button" value="Selecionar" /><div class="fs_background_preview"><?php if ( ! empty( $slide['background'] ) ) : ?><img src="<?php echo esc_url($slide['background']); ?>" /><?php endif; ?></div></td></tr>
                            <tr><th>Categoria</th><td><input type="text" name="fs_slides[<?php echo $index; ?>][category]" value="<?php echo esc_attr($slide['category'] ?? ''); ?>" class="regular-text" /></td></tr>
                            <tr><th>Título</th><td><input type="text" name="fs_slides[<?php echo $index; ?>][title]" value="<?php echo esc_attr($slide['title'] ?? ''); ?>" class="regular-text" /></td></tr>
                            <tr><th>Link do Botão</th><td><input type="text" name="fs_slides[<?php echo $index; ?>][link]" value="<?php echo esc_attr($slide['link'] ?? ''); ?>" class="regular-text" /></td></tr>
                            <tr><th>Abrir link em:</th><td><select name="fs_slides[<?php echo $index; ?>][target]"><option value="_self" <?php selected( ($slide['target'] ?? '_self'), '_self' ); ?>>Mesma Janela</option><option value="_blank" <?php selected( ($slide['target'] ?? '_self'), '_blank' ); ?>>Nova Janela</option></select></td></tr>
                        </table><button type="button" class="button button-danger fs_remove_slide">Remover Slide</button></div>
                    </div>
                <?php endforeach; endif; ?>
            </div>
            <button type="button" class="button button-primary" id="fs_add_slide">Adicionar Novo Slide</button>
            <?php submit_button( 'Salvar Alterações' ); ?>
        </form>
    </div>
    <style>.fs_image_preview img, .fs_background_preview img { max-width: 100px; margin-top: 10px; }</style>
    <script>
    jQuery(document).ready(function($) {
        $('body').on('click', '.upload_image_button', function(e) {
            e.preventDefault(); var button = $(this);
            var frame = wp.media({ title: 'Selecionar Imagem', multiple: false }).on('select', function() {
                var attachment = frame.state().get('selection').first().toJSON();
                button.prev('input').val(attachment.url);
                button.next('div').html('<img src="' + attachment.url + '" />');
            }).open();
        });
        $('#fs_add_slide').on('click', function() {
            var slideCount = $('.fs_slide_item').length;
            var newSlideHtml = `<div class="fs_slide_item postbox"><h3 class="hndle"><span>Novo Slide</span></h3><div class="inside"><table class="form-table">
                <tr><th>Imagem do Slide (1:1)</th><td><input type="text" name="fs_slides[${slideCount}][image]" value="" class="regular-text" /><input type="button" class="button upload_image_button" value="Selecionar" /><div class="fs_image_preview"></div></td></tr>
                <tr><th>Imagem de Fundo</th><td><input type="text" name="fs_slides[${slideCount}][background]" value="" class="regular-text" /><input type="button" class="button upload_image_button" value="Selecionar" /><div class="fs_background_preview"></div></td></tr>
                <tr><th>Categoria</th><td><input type="text" name="fs_slides[${slideCount}][category]" value="" class="regular-text" /></td></tr>
                <tr><th>Título</th><td><input type="text" name="fs_slides[${slideCount}][title]" value="" class="regular-text" /></td></tr>
                <tr><th>Link do Botão</th><td><input type="text" name="fs_slides[${slideCount}][link]" value="" class="regular-text" /></td></tr>
                <tr><th>Abrir link em:</th><td><select name="fs_slides[${slideCount}][target]"><option value="_self">Mesma Janela</option><option value="_blank">Nova Janela</option></select></td></tr>
            </table><button type="button" class="button button-danger fs_remove_slide">Remover Slide</button></div></div>`;
            $('#fs_slides_wrapper').append(newSlideHtml);
        });
        $('body').on('click', '.fs_remove_slide', function() { if (confirm('Tem certeza?')) $(this).closest('.fs_slide_item').remove(); });
    });
    </script>
    <?php
}
function fs_admin_enqueue_scripts( $hook ) { if ( 'toplevel_page_fonte-slider-plugin' != $hook ) return; wp_enqueue_media(); }
add_action( 'admin_enqueue_scripts', 'fs_admin_enqueue_scripts' );