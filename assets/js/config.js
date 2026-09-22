(function (window) {
    var DEFAULT_START_DATE = "2025-06-04T00:00";
    var DEFAULT_RECIPIENT_DISPLAY = "el amor de mi vida";
    var STORAGE_KEY = "yellowFlowers.settings.v1";
    var MAX_BOOST = (window.FlowGrowth && window.FlowGrowth.MAX_BOOST) || 200;
    var DEFAULT_SETTINGS = {
        recipient: DEFAULT_RECIPIENT_DISPLAY,
        startDate: DEFAULT_START_DATE,
        line1: "Flores amarillas para ti,",
        line2: "Nuestro amor siempre florecerá.",
        line3: "Y mientras sigamos juntos, este árbol seguirá creciendo.",
        signature: "— Siempre contigo, siempre nosotros.",
        flowerIntensity: "equilibrada"
    };

    function readSettings() {
        try {
            var stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
            return Object.assign({}, DEFAULT_SETTINGS, stored || {});
        } catch (error) {
            return Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    function clampText(value, max) {
        if (value == null) {
            return "";
        }
        return String(value).trim().slice(0, max);
    }

    function normalizeDate(value) {
        var text = String(value || "").trim();

        if (!text) {
            return "";
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            text += "T00:00";
        }

        return isNaN(new Date(text).getTime()) ? "" : text;
    }

    function clampBoost(value) {
        if (window.FlowGrowth) {
            return window.FlowGrowth.clampBoost(value);
        }

        var parsed = parseInt(value, 10);
        if (!isFinite(parsed) || parsed < 0) {
            parsed = 0;
        }
        return Math.min(parsed, MAX_BOOST);
    }

    function normalizeFlowerIntensity(value) {
        var intensity = String(value || "").trim().toLowerCase();
        return ["suave", "equilibrada", "abundante"].indexOf(intensity) >= 0
            ? intensity
            : "equilibrada";
    }

    var params = new URLSearchParams(window.location.search);
    var saved = readSettings();
    var compactLink = params.get("v") === "2";
    var source = compactLink ? DEFAULT_SETTINGS : saved;
    var recipientName = clampText(params.get("n") || params.get("nombre"), 60) || clampText(source.recipient, 60);
    var startDate = normalizeDate(params.get("d") || params.get("fecha")) || normalizeDate(source.startDate) || DEFAULT_START_DATE;
    var yearsParam = params.get("b");
    if (yearsParam == null || yearsParam === "") {
        yearsParam = params.get("anios");
    }
    if (yearsParam == null || yearsParam === "") {
        yearsParam = params.get("ramas");
    }
    var branchBoost = yearsParam == null || yearsParam === ""
        ? clampBoost(source.branchBoost)
        : clampBoost(yearsParam);
    var flowerIntensity = normalizeFlowerIntensity(params.get("i") || params.get("floracion") || source.flowerIntensity);

    window.APP_CONFIG = {
        storageKey: STORAGE_KEY,
        defaults: DEFAULT_SETTINGS,
        settings: saved,
        canvas: {
            width: 1100,
            height: 680
        },
        startDate: startDate,
        recipientName: recipientName,
        recipientDisplay: recipientName || DEFAULT_RECIPIENT_DISPLAY,
        message: {
            line1: clampText(params.get("1") || params.get("m1"), 140) || clampText(source.line1, 140) || DEFAULT_SETTINGS.line1,
            line2: clampText(params.get("2") || params.get("m2"), 140) || clampText(source.line2, 140) || DEFAULT_SETTINGS.line2,
            line3: clampText(params.get("3") || params.get("m3"), 220) || clampText(source.line3, 220) || DEFAULT_SETTINGS.line3,
            signature: clampText(params.get("s") || params.get("firma"), 140) || clampText(source.signature, 140) || DEFAULT_SETTINGS.signature
        },
        branchBoost: branchBoost,
        treeId: clampText(params.get("a") || params.get("arbol"), 80),
        flowerIntensity: flowerIntensity,
        clock: {
            offsetHours: 0
        },
        flowerImages: [
            "assets/images/flower-1.avif",
            "assets/images/flower-2.avif",
            "assets/images/flower-3.avif",
            "assets/images/flower-4.avif",
            "assets/images/flower-5.avif",
            "assets/images/flower-6.avif",
            "assets/images/flower-7.avif"
        ],
        tree: {
            seed: {
                color: "rgb(139, 69, 19)",
                scale: 4,
                label: ""
            },
            branch: [
                [535, 680, 570, 250, 500, 200, 30, 100, [
                    [540, 500, 455, 417, 340, 400, 13, 100, [
                        [450, 435, 434, 430, 394, 395, 2, 40]
                    ]],
                    [550, 445, 600, 356, 680, 345, 12, 100, [
                        [578, 400, 648, 409, 661, 426, 3, 80]
                    ]],
                    [539, 281, 537, 248, 534, 217, 3, 40],
                    [546, 397, 413, 247, 328, 244, 9, 80, [
                        [427, 286, 383, 253, 371, 205, 2, 40],
                        [498, 345, 435, 315, 395, 330, 4, 60]
                    ]],
                    [546, 357, 608, 252, 678, 221, 6, 100, [
                        [590, 293, 646, 277, 648, 271, 2, 80]
                    ]]
                ]]
            ],
            bloom: {
                num: 700,
                width: 1080,
                height: 650,
                jumpScale: {
                    narrow: 0.55,
                    wide: 0.75
                },
                jumpSpawnMin: 1,
                jumpSpawnMax: {
                    narrow: 1,
                    wide: 2
                }
            },
            footer: {
                width: 1200,
                height: 5,
                speed: 10
            },
            transition: {
                targetScale: 0.55
            }
        }
    };
})(window);
