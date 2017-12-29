<?php

/*
 * @wordpress-plugin
 * Plugin Name: CropShare Plugin
 * Description: Crop images to size and save them to your local disk
 * Version: 1.0 Alpha
 * Author: Mark Pemburn
 * Author URI: http://www.pemburnia.com/
*/

class CropShare
{
    protected $useImageMagick;

    protected $wpImage;
    protected $postId;
    protected $imageUrl;

    public static function register()
    {
        $instance = new self;
        $instance->addActions();
    }

    private function __construct()
    {
        $this->useImageMagick = class_exists('Imagick');
    }

    /**
     * @param $image
     * @param $postId
     * @return mixed
     */
    public function cropshareImageEditorSavePre($image, $postId)
    {
        $this->wpImage = $image;
        $this->postId = $postId;
        $this->imageUrl = $this->getImageUrl($image);

        return $image;
    }

    /**
     *
     */
    public function enqueueAssets()
    {
        wp_enqueue_style( 'wp-jquery-ui-dialog' );
        wp_enqueue_style('fontawesome', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
        wp_enqueue_style('jquery-cropper', plugin_dir_url(__FILE__) . 'css/cropper.min.css');
        wp_enqueue_style('cropshare', plugin_dir_url(__FILE__) . 'css/cropshare.css');

        wp_enqueue_script('jquery-cropper', plugin_dir_url(__FILE__) . 'js/cropper.min.js');
        wp_enqueue_script( 'jquery-ui-dialog' );
        wp_register_script('dom-observer', plugin_dir_url(__FILE__) . 'js/dom_observer.js', '', '1.0', true);
        wp_register_script('cropshare', plugin_dir_url(__FILE__) . 'js/cropshare.js', '', '1.0', true);
        wp_enqueue_script('dom-observer');
        wp_enqueue_script('cropshare');
    }

    /**
     *
     */
    public function handleCropshareAjax()
    {
        $postId = $_REQUEST['post_id'];

        $return = null;

        if (!empty($postId)) {
            $imageInfo = wp_get_attachment_image_src($postId, 'full');
            $imageUrl = $imageInfo[0];
            $originImage = get_attached_file($postId);
            $ext = pathinfo($originImage, PATHINFO_EXTENSION);
            $return = array(
                'url' => $imageUrl,
                'ext' => $ext
            );
        }

        wp_send_json($return);

        die();
    }

    /** PROTECTED methods **/
    /**
     * Add WordPress actions and filters
     */
    protected function addActions()
    {
        // Enqueue the js and css needed for this plugin
        add_action('admin_enqueue_scripts', [$this, 'enqueueAssets']);

        // Set up AJAX handler
        add_action('wp_ajax_handle_cropshare_ajax', [$this, 'handleCropshareAjax']);

        // Grab the image and post info
        add_filter('image_editor_save_pre', [$this, 'cropshareImageEditorSavePre'], 10, 2);
    }

    /**
     * @param $image
     * @return string|null
     */
    protected function getImageUrl($image)
    {
        $image_url = null;
        $unique_id = uniqid();

        // Stupid dodge to prevent WP from adding a suffix.
        $filename = $image->generate_filename($unique_id);
        $uploads = wp_upload_dir();

        if (is_array($uploads)) {
            // Remove basedir and unique id;
            $file_path = str_replace([$uploads['basedir'], '-' . $unique_id], '', $filename);
            $image_url = $uploads['baseurl'] . '/' . $file_path;
        }

        return $image_url;
    }
}
// Load as singleton to add actions and enqueue assets
CropShare::register();