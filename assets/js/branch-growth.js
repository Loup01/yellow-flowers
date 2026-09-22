(function (window) {
    var DAY_MS = 86400000;
    var YEAR_DAYS = 365.2425;
    var MAX_NATURAL_YEARS = 60;
    var MAX_EXTRA_YEARS = 80;
    var MAX_TOTAL = MAX_NATURAL_YEARS + MAX_EXTRA_YEARS;

    // Cada ruta parte exactamente de una punta existente del árbol original.
    // Al completar una vuelta, el siguiente brote continúa desde el extremo
    // del brote anterior de esa misma ruta: nunca nace suspendido en el aire.
    var TIP_PATHS = [
        [500, 200, -30, -27, -1],
        [394, 395, -34, -23, -1],
        [661, 426, 28, -8, 1],
        [534, 217, 0, -34, 1],
        [371, 205, -19, -34, -1],
        [395, 330, -32, 5, -1],
        [648, 271, 28, -16, 1],
        [678, 221, 31, -25, 1]
    ];

    function clampExtraYears(value) {
        var parsed = parseInt(value, 10);
        if (!isFinite(parsed) || parsed < 0) {
            parsed = 0;
        }
        return Math.min(parsed, MAX_EXTRA_YEARS);
    }

    function elapsedDays(startDate) {
        var start = new Date(startDate).getTime();
        if (isNaN(start)) {
            return 0;
        }
        return Math.max(0, Math.floor((Date.now() - start) / DAY_MS));
    }

    function naturalYears(startDate) {
        return Math.min(MAX_NATURAL_YEARS, Math.floor(elapsedDays(startDate) / YEAR_DAYS));
    }

    function total(startDate, extraYears) {
        return Math.min(naturalYears(startDate) + clampExtraYears(extraYears), MAX_TOTAL);
    }

    function specAt(index) {
        var normalized = Math.max(0, Math.floor(index) || 0);
        var path = TIP_PATHS[normalized % TIP_PATHS.length];
        var generation = Math.floor(normalized / TIP_PATHS.length);
        var startX = path[0] + path[2] * generation;
        var startY = path[1] + path[3] * generation;
        var endX = startX + path[2];
        var endY = startY + path[3];
        var curve = path[4] * (4 + Math.min(generation, 4));
        var controlX = startX + path[2] * .52 - path[3] / 22 * curve;
        var controlY = startY + path[3] * .52 + path[2] / 22 * curve;
        var radius = Math.max(1.2, 3.5 - generation * .22);
        var children = [];

        if ((normalized + 1) % 3 === 0) {
            var side = path[4];
            children.push([
                endX,
                endY,
                endX + 7 * side,
                endY - 6,
                endX + 13 * side,
                endY - 10,
                Math.max(1, radius * .58),
                20,
                []
            ]);
        }

        return [
            startX,
            startY,
            controlX,
            controlY,
            endX,
            endY,
            radius,
            46,
            children
        ];
    }

    function specs(count) {
        var list = [];
        var safeCount = Math.min(MAX_TOTAL, Math.max(0, Math.floor(count) || 0));
        for (var index = 0; index < safeCount; index++) {
            list.push(specAt(index));
        }
        return list;
    }

    window.FlowGrowth = {
        total: total,
        naturalYears: naturalYears,
        specAt: specAt,
        specs: specs,
        clampBoost: clampExtraYears,
        clampExtraYears: clampExtraYears,
        MAX_TOTAL: MAX_TOTAL,
        MAX_BOOST: MAX_EXTRA_YEARS,
        YEAR_DAYS: YEAR_DAYS,
        TIP_COUNT: TIP_PATHS.length
    };
})(window);
