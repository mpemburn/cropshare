jQuery(document).ready(function ($) {
    $('.imgedit-menu').ready(function () {
    //alert('wtf');
        if ($('.imgedit-menu').is('*')) {
            $('.imgedit-menu').append('<button type="button" class=""><span class="screen-reader-text">Crop and download</span></button>');
        }
    });
});