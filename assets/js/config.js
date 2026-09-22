(function (window) {
    var DEFAULT_START_DATE = "2025-06-04T00:00";
    var DEFAULT_RECIPIENT_DISPLAY = "el amor de mi vida";
    var STORAGE_KEY = "yellowFlowers.settings.v1";
    var DEFAULT_SETTINGS = {
        recipient: DEFAULT_RECIPIENT_DISPLAY,
        startDate: DEFAULT_START_DATE,
        line1: "Flores amarillas para ti,",
        line2: "Nuestro amor siempre florecerá.",
        line3: "Y mientras sigamos juntos, este árbol seguirá creciendo.",
        signature: "— Siempre contigo, siempre nosotros."
    };

    function readSettings() {
        try {
            var stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
            return Object.assign({}, DEFAULT_SETTINGS, stored || {});
        } catch (error) {
            return Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    var params = new URLSearchParams(window.location.search);
    var saved = readSettings();
    var recipientName = (params.get("nombre") || saved.recipient || "").trim();
    var startDateParam = (params.get("fecha") || "").trim();
    var startDate = startDateParam && !isNaN(new Date(startDateParam).getTime())
        ? startDateParam
        : saved.startDate || DEFAULT_START_DATE;

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
            line1: params.get("m1") || saved.line1,
            line2: params.get("m2") || saved.line2,
            line3: params.get("m3") || saved.line3,
            signature: params.get("firma") || saved.signature
        },
        branchBoost: Math.max(0, parseInt(params.get("ramas") || "0", 10) || 0),
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
                    label: recipientName ? ("  Flores para " + recipientName) : "  Flores para ti"
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
