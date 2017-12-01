jQuery(document).ready(function ($) {
    function findClass(className, callback) {
        // Notify me of everything!
        var observerConfig = {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        };

        // Node, config
        // In this case we'll listen to all changes to body and child nodes
        var targetNode = document.body;

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName == 'class') {
                    if (mutation.target.className.indexOf(className) !== -1) {
                        callback();
                        return;
                    }
                }
            });
        });


        observer.observe(targetNode, observerConfig);
    }
    var found = findClass('imgareaselect-outer', function() {
        //alert('You got it!');
    });
        $('.imgedit-menu').ready(function () {
            //alert('wtf');
        if ($('.imgedit-menu').is('*')) {
            $('.imgedit-menu').append('<button type="button" class=""><span class="screen-reader-text">Crop and download</span></button>');
        }
    });
});