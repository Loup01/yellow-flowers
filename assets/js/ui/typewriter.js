(function (window) {
    function typewriter(element, text, options) {
        var opts = options || {};
        var content = text == null ? element.textContent : String(text);
        var speed = opts.speed || 34;
        var progress = 0;

        if (element._typewriterTimer) {
            clearInterval(element._typewriterTimer);
            element._typewriterTimer = null;
        }

        function finish() {
            if (element._typewriterTimer) {
                clearInterval(element._typewriterTimer);
                element._typewriterTimer = null;
            }
            element.textContent = content;
            if (typeof opts.onDone === "function") {
                opts.onDone();
            }
        }

        element.textContent = "";

        if (!content.length) {
            finish();
            return element;
        }

        element._typewriterTimer = setInterval(function () {
            progress++;
            element.textContent = content.substring(0, progress) + (progress < content.length && progress % 2 ? "_" : "");

            if (progress >= content.length) {
                finish();
            }
        }, speed);

        return element;
    }

    window.typewriter = typewriter;
})(window);
