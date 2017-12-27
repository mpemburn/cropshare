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
    imageSize: {
        width: null,
        height: null
    },
    init: function(options) {
        jQuery.extend(this, options);
    },
    onLoaded: function() {
        this._createButton();
        this._getImageSize(jQuery('[id^=image-preview-]'));
    },
    _createButton: function() {
        jQuery('.imgedit-menu').append('<button type="button" id="cropshare" class="button" disabled><i class="cropshare-btn fa fa-share-square-o"></i><span class="screen-reader-text">Crop and download</span></button>');
        this._setListener();
    },
    onSelected: function() {
    },
    onDone: function() {
        clearInterval(this.selectListener);
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
        jQuery('#cropshare').prop('disabled', (imageSelection == ''))
    },
    _setListener: function() {
        var self = this;
        jQuery('#cropshare').off().on('click', function() {
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
                    originalSize: self.imageSize
                },
                success: function(response) {
                    console.log(response);
                },
                error: function(response) {
                    console.log(response);
                }
            });
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