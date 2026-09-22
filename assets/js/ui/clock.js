(function (window) {
    function pad(value) {
        return value < 10 ? "0" + value : String(value);
    }

    function getElapsedParts(startDate, options) {
        var opts = options || {};
        var current = new Date();

        if (opts.offsetHours) {
            current.setHours(current.getHours() + opts.offsetHours);
        }

        var seconds = Math.floor((current.getTime() - startDate.getTime()) / 1000);
        seconds = Math.max(0, seconds);
        var days = Math.floor(seconds / (3600 * 24));

        seconds = seconds % (3600 * 24);
        var hours = Math.floor(seconds / 3600);

        seconds = seconds % 3600;
        var minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);

        return {
            days: days,
            hours: pad(hours),
            minutes: pad(minutes),
            seconds: pad(seconds)
        };
    }

    function formatElapsedHtml(startDate, options) {
        var elapsed = getElapsedParts(startDate, options);

        return " <span class=\"digit\">" + elapsed.days + "</span> d\u00edas " +
            "<span class=\"digit\">" + elapsed.hours + "</span> horas " +
            "<span class=\"digit\">" + elapsed.minutes + "</span> minutos " +
            "<span class=\"digit\">" + elapsed.seconds + "</span> segundos";
    }

    window.AppClock = {
        getElapsedParts: getElapsedParts,
        formatElapsedHtml: formatElapsedHtml
    };
})(window);
