<?php

/**
 * Class PHPCrop
 *
 * Fallback if ImageMagick isn't installed
 */
class PHPCrop
{
    protected $croppedImage = false;

    /**
     * PHPCrop constructor.
     * @param $imagePath
     * @param $selectedArea
     */
    public function __construct($imagePath, $selectedArea)
    {
        $this->cropImage($imagePath, $selectedArea);
    }

    /**
     * @return mixed
     */
    public function getCroppedImage()
    {
        return $this->croppedImage;
    }

    /**
     * @param $imagePath
     * @param $selectedArea
     */
    protected function cropImage($imagePath, $selectedArea)
    {
        $imageResource = $this->createImageFromPath($imagePath);
        if (!is_null($imageResource)) {
            $this->croppedImage = imagecrop($imageResource, (array) $selectedArea);
        }
    }

    /**
     * @param $imagePath
     * @return resource|null
     */
    protected function createImageFromPath($imagePath)
    {
        if (file_exists($imagePath)) {
            return imagecreatefromstring(file_get_contents($imagePath));
        }
        return null;
    }


}