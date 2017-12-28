<?php

/*
 * @wordpress-plugin
 * Plugin Name: CropShare Plugin
 * Description: Crop images to size and save them to your local disk
 * Version: 1.0 Alpha
 * Author: Mark Pemburn
 * Author URI: http://www.pemburnia.com/
*/

require_once __DIR__ . '/phpcrop.php';
//use Plugins\Cropshare\PHPCrop;

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
        wp_enqueue_style('fontawesome', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
        wp_enqueue_style('cropshare', plugin_dir_url(__FILE__) . 'css/cropshare.css');
        wp_register_script('cropshare', plugin_dir_url(__FILE__) . 'js/cropshare.js', '', '1.2', true);
        wp_enqueue_script('cropshare');
    }

    /**
     *
     */
    public function handleCropshareAjax()
    {
        $postId = $_REQUEST['post_id'];
        $previewSize = (object) $_REQUEST['originalSize'];
        $magnification = $_REQUEST['magnification'];
        $selection = json_decode(stripslashes($_REQUEST['selection']));
        $imageWidth = $_REQUEST['width'];
        $imageHeight = $_REQUEST['height'];

        if (!empty($postId)) {
            $this->cropAndSaveImage($postId, $previewSize, $selection);
        }

        $return = array(
            'message' => 'Saved'
        );

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
     * @param $postId
     * @param $previewSize
     * @param $selection
     */
    protected function cropAndSaveImage($postId, $previewSize, $selection)
    {
        $originImage = get_attached_file($postId);
        if ($this->useImageMagick) {
            $this->cropWithImageMagick($originImage, $previewSize, $selection);
        } else {
            // Use WP to get original image dimensions
            $originImageInfo = wp_get_attachment_image_src($postId, 'full');
            if ($originImageInfo !== false) {
                $image = $this->cropWithPhpCrop($originImage, $previewSize, $selection, $originImageInfo[1], $originImageInfo[2]);
                if ($image !== false)
                {

                }
            }
        }
    }

    /**
     * @param $originImage
     * @param $previewSize
     * @param $selection
     */
    protected function cropWithImageMagick($originImage, $previewSize, $selection)
    {
        $image = new Imagick($originImage);
        $originalDimensions = $image->getImageGeometry();
        $scaledSelection = $this->scaleSelection($previewSize, $selection, $originalDimensions['width'], $originalDimensions['height']);
        $image->cropImage($scaledSelection->w, $scaledSelection->h, $scaledSelection->x, $scaledSelection->y);

        $uploads = wp_upload_dir();
        if (is_array($uploads)) {
            $outFile = $uploads['basedir'] . '/this_really_worked.bmp';
        }
        $image->setImageFormat ('bmp');
        $image->writeImage($outFile);
    }

    /**
     * @param $originImage
     * @param $previewSize
     * @param $selection
     * @param $originalWidth
     * @param $originalHeight
     * @return mixed
     */
    protected function cropWithPhpCrop($originImage, $previewSize, $selection, $originalWidth, $originalHeight)
    {
        $scaledSelection = $this->scaleSelection($previewSize, $selection, $originalWidth, $originalHeight);
        $phpCrop = new PHPCrop($originImage, $scaledSelection);
        $image = $phpCrop->getCroppedImage();

        return $image;
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

    /**
     * @param $previewSize
     * @param $selection
     * @param $originalWidth
     * @param $originalHeight
     * @return \stdClass
     */
    protected function scaleSelection($previewSize, $selection, $originalWidth, $originalHeight)
    {
        $scaledSelection = new \stdClass();
        $scaleWidth =  intval($originalWidth) / $previewSize->width;
        $scaleHeight =  intval($originalHeight) / $previewSize->height;
        $scaledSelection->x = $selection->x * $scaleWidth;
        $scaledSelection->y = $selection->y * $scaleHeight;
        $scaledSelection->width = $selection->w * $scaleWidth;
        $scaledSelection->height = $selection->h * $scaleHeight;

        return $scaledSelection;
    }
}
// Load as singleton to add actions and enqueue assets
CropShare::register();