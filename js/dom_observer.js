/** dom_observer.js */

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
