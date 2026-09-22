(function (window) {
    var DAY_MS = 86400000;
    var YEAR_DAYS = 365.2425;
    var MAX_NATURAL_YEARS = 60;
    var MAX_EXTRA_YEARS = 80;
    var MAX_TOTAL = MAX_NATURAL_YEARS + MAX_EXTRA_YEARS;

    // Puntos de crecimiento distribuidos por la copa. Cada tramo representa
    // la extensión de una temporada anual desde una yema terminal existente.
    var SHOOTS = [
        [540, 285, 524, 265, 506, 248],
        [548, 300, 567, 278, 587, 260],
        [520, 325, 500, 309, 481, 294],
        [570, 330, 594, 312, 617, 296],
        [530, 265, 520, 244, 514, 222],
        [558, 270, 573, 248, 589, 228],
        [500, 360, 480, 350, 460, 337],
        [590, 365, 612, 352, 635, 338]
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

    function transformShoot(shoot, index) {
        var cycle = Math.floor(index / SHOOTS.length);
        var direction = index % 2 === 0 ? -1 : 1;
        var drift = Math.min(cycle, 8) * 4 * direction;
        var rise = Math.min(cycle, 8) * 2;
        var radius = Math.max(1.35, 3.8 - cycle * .18);
        var length = Math.max(24, 46 - cycle * 2);
        var endX = shoot[4] + drift;
        var endY = shoot[5] - rise;
        var children = [];

        // Cada tercer año aparece un brote lateral corto, como ocurre cuando
        // una yema lateral toma fuerza tras el crecimiento terminal.
        if ((index + 1) % 3 === 0) {
            var side = index % 2 === 0 ? -1 : 1;
            children.push([
                endX,
                endY,
                endX + 8 * side,
                endY - 7,
                endX + 15 * side,
                endY - 11,
                Math.max(1, radius * .62),
                22,
                []
            ]);
        }

        return [
            shoot[0] + drift * .35,
            shoot[1] - rise * .3,
            shoot[2] + drift * .7,
            shoot[3] - rise * .65,
            endX,
            endY,
            radius,
            length,
            children
        ];
    }

    function specAt(index) {
        var normalized = Math.max(0, Math.floor(index) || 0);
        return transformShoot(SHOOTS[normalized % SHOOTS.length], normalized);
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
        YEAR_DAYS: YEAR_DAYS
    };
})(window);
