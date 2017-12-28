var DOMObserver = {
    done: false,
    observer: null,
    nodeAddedCallback: null,
    nodeRemovedCallback: null,
    onAddedClassName: '',
    onRemovedClassName: '',
    config: {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
    },
    targetNode: document.body,
    init: function(options) {
        jQuery.extend(this, options);
        this.observe()
    },
    observe: function() {
        var self = this;
        this.observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var removedNodes = Array.from(mutation.removedNodes);
                if (removedNodes.length > 0) {
                    for (var index in removedNodes) {
                        var node = removedNodes[index];
                        if (node.className !== undefined) {
                            if (node.className.indexOf(self.onRemovedClassName) !== -1) {
                                self.nodeRemovedCallback();
                                self.done = false;
                            }
                        }
                    }
                }
                if (mutation.attributeName == 'class' && !self.done) {
                    if (mutation.target.className.indexOf(self.onAddedClassName) !== -1) {
                        self.nodeAddedCallback();
                        self.done = true;
                    }
                }
            });
        });
        this.observer.observe(this.targetNode, this.config);
    }
};

var CropShare = {
    selectListener: null,
    previewImage: null,
    magnification: 10,
    imageSize: {
        width: null,
        height: null
    },
    init: function(options) {
        jQuery.extend(this, options);
    },
    onLoaded: function() {
        this._createButtons();
        this.previewImage = jQuery('[id^=image-preview-]');
        this._getImageSize(this.previewImage);
    },
    _createButtons: function() {
        // Add Plus, Minus, and Share buttons
        jQuery('.imgedit-menu').append('<button type="button" id="cropshare_plus" class="button"><i class="cropshare-btn fa fa-plus-circle"></i><span class="screen-reader-text">Increase magnification</span></button>');
        jQuery('.imgedit-menu').append('<button type="button" id="cropshare_minus" class="button"><i class="cropshare-btn fa fa-minus-circle"></i><span class="screen-reader-text">Decrease magnification</span></button>');
        jQuery('.imgedit-menu').append('<button type="button" id="cropshare" class="button" disabled><i class="cropshare-btn fa fa-share-square-o"></i><span class="screen-reader-text">Crop and download</span></button>');
        this._setListeners();
    },
    _decreaseMagnification: function() {
        this.magnification-=10;
        this._setMagnification();
    },
    _increaseMagnification: function() {
        this.magnification+=10;
        this._setMagnification();
    },
    _setMagnification: function() {
        this.previewImage.width(parseInt(this.imageSize.width + this.magnification));
        //this.previewImage.css({ 'clip-path' : 'inset(' + this.magnification / 2 + 'px)' })
    },
    onSelected: function() {
    },
    onDone: function() {
        clearInterval(this.selectListener);
    },
    _doAjax: function() {
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
        // Disable size buttons and enable share button
        jQuery('#cropshare_plus').prop('disabled', (imageSelection != ''))
        jQuery('#cropshare_minus').prop('disabled', (imageSelection != ''))
        jQuery('#cropshare').prop('disabled', (imageSelection == ''))
    },
    _setListeners: function() {
        var self = this;
        jQuery('#cropshare_plus').off().on('click', function() {
            self._increaseMagnification();
        })
        jQuery('#cropshare_minus').off().on('click', function() {
            self._decreaseMagnification();
        })
        jQuery('#cropshare').off().on('click', function() {
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