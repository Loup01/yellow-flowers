(function (window) {
    function typewriter(element, text, options) {
        var content = text == null ? element.textContent : String(text);
        var progress = 0;
        var opts = options || {};
        var speed = opts.speed || 34;

        if (element._typewriterTimer) {
            clearInterval(element._typewriterTimer);
        }

        element.textContent = "";
        element._typewriterTimer = setInterval(function () {
            progress++;
            element.textContent = content.substring(0, progress) + (progress < content.length && progress % 2 ? "_" : "");

            if (progress >= content.length) {
                clearInterval(element._typewriterTimer);
                element._typewriterTimer = null;
                element.textContent = content;
            }
        }, speed);

        return element;
    }

    window.typewriter = typewriter;
})(window);
