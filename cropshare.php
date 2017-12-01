<?php

/*
Plugin Name: CropShare Plugin
Description: Crop images to size and save them to your local disk
Version: 1.0 Alpha
Author: Mark Pemburn
Author URI: http://www.pemburnia.com/
*/

class CropShare
{
    protected $wp_image;
    protected $post_id;
    protected $image_url;

    public function __construct()
    {
        $this->add_actions();
    }

    public function cropshare_image_editor_save_pre($image, $post_id)
    {
        $this->wp_image = $image;
        $this->post_id = $post_id;
        $this->image_url = $this->get_image_url($image);

        return $image;
    }

    public function enqueue_assets()
    {
       wp_register_script('cropshare', plugin_dir_url( __FILE__ ) . 'js/cropshare.js','','1.1', true);
       wp_enqueue_script( 'cropshare');
    }

    public function handle_cropshare()
    {

    }

    /** PROTECTED methods **/
    protected function add_actions()
    {
        // Enqueue the js and css needed for this plugin
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);

        // Set up AJAX handler
        add_action('wp_ajax_handle_cropshare', [$this, 'handle_cropshare']);

        // Grab the image and post info
        add_filter('image_editor_save_pre', [$this, 'cropshare_image_editor_save_pre'], 10, 2);
    }

    /**
     * @param $image
     * @return null|string
     */
    protected function get_image_url($image)
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

new CropShare();