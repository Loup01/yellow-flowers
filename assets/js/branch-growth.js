(function (window) {
    var SLOTS = [
        [540, 285, 510, 225, 470, 190],
        [545, 300, 580, 235, 625, 190],
        [520, 325, 478, 280, 438, 235],
        [570, 330, 620, 280, 670, 232],
        [530, 265, 510, 215, 500, 165],
        [558, 270, 590, 215, 630, 165],
        [500, 360, 455, 330, 418, 285],
        [590, 365, 640, 330, 694, 278]
    ];

    var MAX_MONTH_BRANCHES = 36;
    var MAX_TOTAL = 120;
    var MAX_BOOST = 200;
    var MAX_CYCLE = 4;
    var DAY_MS = 86400000;

    function clampBoost(value) {
        var parsed = parseInt(value, 10);
        if (!isFinite(parsed) || parsed < 0) {
            parsed = 0;
        }
        return Math.min(parsed, MAX_BOOST);
    }

    function elapsedDays(startDate) {
        var start = new Date(startDate).getTime();
        if (isNaN(start)) {
            return 0;
        }
        return Math.max(0, Math.floor((Date.now() - start) / DAY_MS));
    }

    function monthBranches(startDate) {
        var months = Math.floor(elapsedDays(startDate) / 30);
        var base = Math.min(months, MAX_MONTH_BRANCHES);
        var yearly = months > MAX_MONTH_BRANCHES
            ? Math.floor((months - MAX_MONTH_BRANCHES) / 12)
            : 0;
        return base + yearly;
    }

    function total(startDate, boost) {
        return Math.min(monthBranches(startDate) + clampBoost(boost), MAX_TOTAL);
    }

    function specAt(index) {
        var slot = SLOTS[((index % SLOTS.length) + SLOTS.length) % SLOTS.length];
        var cycle = Math.min(Math.floor(index / SLOTS.length), MAX_CYCLE);
        var direction = index % 2 === 0 ? -1 : 1;
        var drift = cycle * 7 * direction;
        var length = Math.max(24, 76 - cycle * 5);
        var radius = Math.max(1.5, 6 - cycle * .35);

        return [
            slot[0] + drift,
            slot[1] - cycle * 4,
            slot[2] + drift * 1.15,
            slot[3] - cycle * 5,
            slot[4] + drift * 1.35,
            slot[5] - cycle * 6,
            radius,
            length
        ];
    }

    function specs(count) {
        var list = [];
        var total_ = Math.max(0, Math.floor(count) || 0);

        for (var index = 0; index < total_; index++) {
            list.push(specAt(index));
        }

        return list;
    }

    window.FlowGrowth = {
        total: total,
        specAt: specAt,
        specs: specs,
        clampBoost: clampBoost,
        MAX_TOTAL: MAX_TOTAL,
        MAX_BOOST: MAX_BOOST
    });
})(window);
