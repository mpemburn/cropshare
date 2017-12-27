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

    public static function register()
    {
        $instance = new self;
        $instance->addActions();
    }

    private function __construct()
    {
    }

    public function cropshareImageEditorSavePre($image, $post_id)
    {
        $this->wp_image = $image;
        $this->post_id = $post_id;
        $this->image_url = $this->getImageUrl($image);

        return $image;
    }

    public function enqueueAssets()
    {
        wp_enqueue_style('fontawesome', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
        wp_enqueue_style('cropshare', plugin_dir_url(__FILE__) . 'css/cropshare.css');
        wp_register_script('cropshare', plugin_dir_url(__FILE__) . 'js/cropshare.js', '', '1.2', true);
        wp_enqueue_script('cropshare');
    }

    public function handleCropshareAjax()
    {
        $post_id = $_REQUEST['post_id'];
        $previewSize = (object) $_REQUEST['originalSize'];
        $selection = json_decode(stripslashes($_REQUEST['selection']));
        $imageWidth = $_REQUEST['width'];
        $imageHeight = $_REQUEST['height'];

        $imagePath = $this->getImagePathFromUrl($post_id);
        if (!is_null($imagePath)) {
            $image = $this->createImage($imagePath);
            if (!is_null($image)) {
                $attachedFile = get_attached_file($post_id);
                $this->saveCroppedImage($attachedFile, $previewSize, $selection, $imageWidth, $imageHeight);
            }
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
     * @param $image_url
     * @return null|resource
     */
    protected function createImage($image_url)
    {
        $ext = pathinfo($image_url, PATHINFO_EXTENSION);
        $image_path = $this->getImageFromUrl($image_url);

        if (!file_exists($image_path)) {
            return null;
        }
        switch ($ext) {
            case 'gif':
                $image = imagecreatefromgif($image_path);
                break;
            case 'jpg':
            case 'jpeg':
                $image = imagecreatefromjpeg($image_path);
                break;
            case 'png':
                $image = imagecreatefrompng($image_path);
                break;
            default:
                return null;
        }

        return $image;
    }

    /**
     * @param $post_id
     * @return string|null
     */
    protected function getImagePathFromUrl($post_id)
    {
        $image_info = wp_get_attachment_image_src($post_id, '');

        return (is_array($image_info)) ? $image_info[0] : null;
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

    protected function getImageFromUrl($image_url)
    {
        $file_path = null;
        $parsed = parse_url($image_url);

        $uploads = wp_upload_dir();

        if (is_array($parsed) && is_array($uploads)) {
            $parsed_parts = explode('/', $parsed['path']);
            $upload_parts = explode('/', $uploads['basedir']);
            $file_path = implode('/', array_diff($parsed_parts, $upload_parts));
            $file_path = $uploads['basedir'] . '/' . $file_path;
        }

        return $file_path;
    }

    protected function saveCroppedImage($originImage, $previewSize, $selection, $originWidth, $originHeight)
    {
        $image = new Imagick($originImage);
        $scaledSelection = $this->scaleSelection($previewSize, $selection, $originWidth, $originHeight);
        $image->cropImage($originWidth, $originHeight, $selection->x, $selection->y);

        $uploads = wp_upload_dir();
        if (is_array($uploads)) {
            $outFile = $uploads['basedir'] . '/this_really_worked.bmp';
        }
        $image->setImageFormat ('bmp');
        $image->writeImage($outFile);
    }

    protected function scaleSelection($previewSize, $selection, $originWidth, $originHeight)
    {
        $scaledSelection = new stdClass();
        $scale = $previewSize->height / intval($originHeight);

        return $scaledSelection;
    }

    protected function imageCreateFromBMP($p_sFile)
    {
        //    Load the image into a string
        $file = fopen($p_sFile, "rb");
        $read = fread($file, 10);
        while (!feof($file) && ($read <> ""))
            $read .= fread($file, 1024);

        $temp = unpack("H*", $read);
        $hex = $temp[1];
        $header = substr($hex, 0, 108);

        //    Process the header
        //    Structure: http://www.fastgraph.com/help/bmp_header_format.html
        if (substr($header, 0, 4) == "424d") {
            //    Cut it in parts of 2 bytes
            $header_parts = str_split($header, 2);

            //    Get the width        4 bytes
            $width = hexdec($header_parts[19] . $header_parts[18]);

            //    Get the height        4 bytes
            $height = hexdec($header_parts[23] . $header_parts[22]);

            //    Unset the header params
            unset($header_parts);
        }

        //    Define starting X and Y
        $x = 0;
        $y = 1;

        //    Create newimage
        $image = imagecreatetruecolor($width, $height);

        //    Grab the body from the image
        $body = substr($hex, 108);

        //    Calculate if padding at the end-line is needed
        //    Divided by two to keep overview.
        //    1 byte = 2 HEX-chars
        $body_size = (strlen($body) / 2);
        $header_size = ($width * $height);

        //    Use end-line padding? Only when needed
        $usePadding = ($body_size > ($header_size * 3) + 4);

        //    Using a for-loop with index-calculation instaid of str_split to avoid large memory consumption
        //    Calculate the next DWORD-position in the body
        for ($i = 0; $i < $body_size; $i += 3) {
            //    Calculate line-ending and padding
            if ($x >= $width) {
                //    If padding needed, ignore image-padding
                //    Shift i to the ending of the current 32-bit-block
                if ($usePadding)
                    $i += $width % 4;

                //    Reset horizontal position
                $x = 0;

                //    Raise the height-position (bottom-up)
                $y++;

                //    Reached the image-height? Break the for-loop
                if ($y > $height)
                    break;
            }

            //    Calculation of the RGB-pixel (defined as BGR in image-data)
            //    Define $i_pos as absolute position in the body
            $i_pos = $i * 2;
            $r = hexdec($body[$i_pos + 4] . $body[$i_pos + 5]);
            $g = hexdec($body[$i_pos + 2] . $body[$i_pos + 3]);
            $b = hexdec($body[$i_pos] . $body[$i_pos + 1]);

            //    Calculate and draw the pixel
            $color = imagecolorallocate($image, $r, $g, $b);
            imagesetpixel($image, $x, $height - $y, $color);

            //    Raise the horizontal position
            $x++;
        }

        //    Unset the body / free the memory
        unset($body);

        //    Return image-object
        return $image;
    }
}

CropShare::register();