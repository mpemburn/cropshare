var DOMObserver = {
    done: false,
    observer: null,
    callback: null,
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
                                self.done = false;
                            }
                        }
                    }
                }
                if (mutation.attributeName == 'class' && !self.done) {
                    if (mutation.target.className.indexOf(self.onFoundClassName) !== -1) {
                        self.callback();
                        self.done = true;
                    }
                }
            });
        });
        this.observer.observe(this.targetNode, this.config);
    }
}

jQuery('.imgedit-menu').ready(function ($) {
    var domObserver = Object.create(DOMObserver);
    domObserver.init({
        done: false,
        onFoundClassName: 'imgareaselect-outer',
        onRemovedClassName: 'image-editor',
        callback: function() {
            var foo = 'bar!';
            $('.imgedit-menu').append('<button type="button" id="cropshare" class="fa a-share-square-o"><span class="screen-reader-text">Crop and download</span></button>');
            $('#cropshare').off().on('click', function() {
                var $imageClone = $('#image-preview-4').clone();
                //imageEdit.crop(6, 'dd9a491102', this);
                //$('#cropshare').html($imageClone);
            })
        }
    });
});