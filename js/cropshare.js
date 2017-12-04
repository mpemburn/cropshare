var DOMObserver = {
    done: false,
    observer: null,
    foundCallback: null,
    doneCallback: null,
    onFoundClassName: '',
    onRemovedClassName: '',
    config: {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
    },
    targetNode: document.body,
    init: function(options) {
        $.extend(this, options);
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
                                self.doneCallback();
                                self.done = false;
                            }
                        }
                    }
                }
                if (mutation.attributeName == 'class' && !self.done) {
                    if (mutation.target.className.indexOf(self.onFoundClassName) !== -1) {
                        self.foundCallback();
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
    init: function(options) {
        $.extend(this, options);
    },
    createButton: function() {
        $('.imgedit-menu').append('<button type="button" id="cropshare" class="button"><i class="cropshare-btn fa fa-share-square-o"></i><span class="screen-reader-text">Crop and download</span></button>');
        this._setListener();
    },
    onSelected: function() {
    },
    onDone: function() {
        clearInterval(this.selectListener);
    },
    _listenForSelect: function() {
        var foo = 'bark';
    },
    _setListener: function() {
        $('#cropshare').off().on('click', function() {
            var $imageEditor = $('[id^=image-editor-]');
            var imageEditorId = $imageEditor.attr('id');
            var postId = imageEditorId.match(/\d+/g, '')[0];
            var imageSelection = $('[id^=imgedit-selection-]').val()
            var imageWidth = $('[id^=imgedit-sel-width-]').val()
            var imageHeight = $('[id^=imgedit-sel-height-]').val()
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
                },
                success: function(response) {
                    console.log(response);
                },
                error: function(response) {
                    console.log(response);
                }
            });
        })
        this.selectListener = setInterval(this._listenForSelect, 500);
    }
};

jQuery('.imgedit-menu').ready(function ($) {
    var domObserver = Object.create(DOMObserver);
    var cropShare = Object.create(CropShare);
    domObserver.init({
        done: false,
        onFoundClassName: 'imgareaselect-outer',
        onRemovedClassName: 'image-editor',
        foundCallback: function() {
            cropShare.createButton();
        },
        doneCallback: function() {
            cropShare.onDone();
        }
    });
    cropShare.init();
});