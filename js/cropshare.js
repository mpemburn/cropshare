var DOMObserver = {
    done: false,
    observer: null,
    callback: null,
    className: '',
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
                if (mutation.attributeName == 'class' && !self.done) {
                    if (mutation.target.className.indexOf(self.className) !== -1) {
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
        className: 'imgareaselect-outer',
        callback: function() {
            var foo = 'bar!';
            $('.imgedit-menu').append('<button type="button" id="cropshare" class="fa a-share-square-o"><span class="screen-reader-text">Crop and download</span></button>');
            $('#cropshare').off().on('click', function() {
                alert('Yessssss!!!');
            })
        }
    });
});