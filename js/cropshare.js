/** cropshare.js */

var CropShare = {
    selectListener: null,
    previewImage: null,
    magnification: 10,
    imageSize: {
        width: null,
        height: null
    },
    imageExt: null,
    init: function(options) {
        jQuery.extend(this, options);
    },
    onLoaded: function() {
        this._createButtons();
        this._createDialog();
        this.previewImage = jQuery('[id^=image-preview-]');
        this._getImageSize(this.previewImage);
        this._setListeners();
    },
    _createButtons: function() {
        // Add Share button
        jQuery('.imgedit-menu').append('<button type="button" id="cropshare" class="button"><i class="cropshare-btn fa fa-share-square-o"></i><span class="screen-reader-text">Crop and download</span></button>');
    },
    _createCropper: function(url, ext) {
        jQuery('#cropshare_filename').val('cropped.' + ext);
        jQuery('#cropshare_link').attr('download', jQuery('#cropshare_filename').val());
        jQuery('#cropshare_crop').attr('src', url);
        jQuery('.media-modal, .media-modal-backdrop').hide();
        jQuery('#crop_modal').dialog('open');
        jQuery('#cropshare_crop').cropper({
            aspectRatio: 1 / 1,
            crop: function(e) {
                var canvas = $('#cropshare_crop').cropper('getCroppedCanvas');
                var canvas2 = $(this).cropper('getCroppedCanvas');
                var data = canvas.toDataURL();
                var url = data.replace(/^data:image\/[^;]+/, 'data:application/octet-stream');
                var $link = $('#cropshare_link');
                $link.attr('href', url);
            }
        });
        jQuery('#cropshare_filename').off().on('change', function() {
            $('#cropshare_link').attr('download', $(this).val());
        });
    },
    _createDialog: function() {
        // Append dialog body and download link
        if (jQuery('#cropshare_crop').is('*')) {
            return;
        }
        jQuery('.uploader-window').append('<div id="crop_modal" style="display:block;"></div>')
        jQuery('#crop_modal').append('<img id="cropshare_crop" src="" draggable="false"/>')
        jQuery('#cropshare_crop').append('<a id="cropshare_link" href="" download=""/>')
        // Define the dialog box
        jQuery('#crop_modal').dialog({
            title: 'Crop and Download',
            dialogClass: 'wp-dialog',
            autoOpen: false,
            draggable: true,
            width: 'auto',
            modal: true,
            resizable: false,
            closeOnEscape: true,
            position: {
                my: "center",
                at: "center",
                of: window
            },
            close: function() {
                // Destroy the cropper
                jQuery('#cropshare_crop').cropper('destroy');
                // Show the media modal and backdrop that we hid earlier
                jQuery('.media-modal, .media-modal-backdrop').show();
            },
            create: function () {
                // Style fix for WordPress admin
                $('.ui-dialog-titlebar-close').addClass('ui-button');
                $('.ui-dialog-buttonpane').append('<label for="">Cropped file name: <input id="cropshare_filename" type="text" value=""/></label>');
            },
            buttons: {
                'Download': function(e) {
                    var $link = $('#cropshare_link');
                    // Must use the native click method to click anchor element
                    $link[0].click();
                },
                'Close': function() {
                    $(this).dialog('close');
                }
            }
        })
    },
    onDone: function() {
        clearInterval(this.selectListener);
    },
    _doAjax: function() {
        var self = this;
        var $imageEditor = jQuery('[id^=image-editor-]');
        var imageEditorId = $imageEditor.attr('id');
        var postId = imageEditorId.match(/\d+/g, '')[0];
        var imageSelection = jQuery('[id^=imgedit-selection-]').val()
        var imageWidth = jQuery('[id^=imgedit-sel-width-]').val()
        var imageHeight = jQuery('[id^=imgedit-sel-height-]').val()
        jQuery.ajax({
         type : "post",
         dataType : "json",
         url : ajaxurl,
         data : {
             action: 'handle_cropshare_ajax',
             post_id: postId,
             selection: imageSelection,
             width: imageWidth,
             height: imageHeight,
             originalSize: this.imageSize,
             magnification: this.magnification
         },
         success: function(response) {
            if (response.url) {
                self.imageExt = response.ext;
                self._createCropper(response.url, response.ext);
            }
            console.log(response);
         },
         error: function(response) {
             console.log(response);
         }
        });
    },
    _getImageSize: function($img) {
        var self = this;
        var image = new Image();
        image.onload = function() {
            self.imageSize.width = this.width;
            self.imageSize.height = this.height;
        }
        image.src = $img.attr('src');
    },
    _listenForSelect: function() {
        var imageSelection = jQuery('[id^=imgedit-selection-]').val();
        // Disable share button when user has started the built-in cropping selection
        jQuery('#cropshare').prop('disabled', (imageSelection !== ''))
    },
    _setListeners: function() {
        var self = this;
        jQuery('#cropshare_plus').off().on('click', function() {
            self._increaseMagnification();
        })
        jQuery('#cropshare_minus').off().on('click', function() {
            self._decreaseMagnification();
        })
        jQuery('#cropshare').off().on('click', function(e) {
            self._doAjax();
        })
        this.selectListener = setInterval(this._listenForSelect, 100);
    }
};

jQuery('.imgedit-menu').ready(function ($) {
    var domObserver = Object.create(DOMObserver);
    var cropShare = Object.create(CropShare);
    domObserver.init({
        done: false,
        onAddedClassName: 'imgareaselect-outer',
        onRemovedClassName: 'image-editor',
        nodeAddedCallback: function() {
            cropShare.onLoaded();
        },
        nodeRemovedCallback: function() {
            cropShare.onDone();
        }
    });
    cropShare.init();
});