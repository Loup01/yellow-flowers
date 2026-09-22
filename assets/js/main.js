(function () {
    var canvas = document.getElementById('canvas');
    var config = window.APP_CONFIG;
    var width = config.canvas.width;
    var height = config.canvas.height;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || width;
    var isNarrowScreen = viewportWidth <= 768;

    if (!canvas || !canvas.getContext) {
        return false;
    }

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function fadeIn(element, duration) {
        element.style.opacity = "0";
        element.style.display = "block";
        element.style.transition = "opacity " + duration + "ms";
        void element.offsetHeight;
        element.style.opacity = "1";
    }

    function elapsedDays(startDate) {
        var difference = Date.now() - new Date(startDate).getTime();
        return Math.max(0, Math.floor(difference / 86400000));
    }

    // Cada mes de historia suma una rama nueva. Las ramas se incorporan al
    // crecimiento inicial sin tocar el ramo ni la ilustración de flores.
    function relationshipBranches(startDate) {
        var count = Math.floor(elapsedDays(startDate) / 30);
        var slots = [
            [540, 285, 510, 225, 470, 190],
            [545, 300, 580, 235, 625, 190],
            [520, 325, 478, 280, 438, 235],
            [570, 330, 620, 280, 670, 232],
            [530, 265, 510, 215, 500, 165],
            [558, 270, 590, 215, 630, 165],
            [500, 360, 455, 330, 418, 285],
            [590, 365, 640, 330, 694, 278]
        ];
        var branches = [];

        for (var index = 0; index < count; index++) {
            var slot = slots[index % slots.length];
            var cycle = Math.floor(index / slots.length);
            var direction = index % 2 === 0 ? -1 : 1;
            var drift = cycle * 7 * direction;
            var length = Math.max(24, 76 - cycle * 5);
            var radius = Math.max(1.5, 6 - cycle * .35);

            branches.push([
                slot[0] + drift,
                slot[1] - cycle * 4,
                slot[2] + drift * 1.15,
                slot[3] - cycle * 5,
                slot[4] + drift * 1.35,
                slot[5] - cycle * 6,
                radius,
                length,
                []
            ]);
        }

        return branches;
    }

    function readSavedSettings() {
        try {
            return Object.assign({}, config.defaults, JSON.parse(localStorage.getItem(config.storageKey) || "null") || {});
        } catch (error) {
            return Object.assign({}, config.defaults);
        }
    }

    function typeLine(element, text) {
        return new Promise(function (resolve) {
            typewriter(element, text, { speed: 28 });
            setTimeout(resolve, Math.max(160, String(text).length * 28 + 80));
        });
    }

    async function renderMessage(settings, animated) {
        var lines = [
            [document.getElementById("message-line-1"), settings.line1],
            [document.getElementById("message-line-2"), settings.line2],
            [document.getElementById("message-line-3"), settings.line3],
            [document.getElementById("message-signature"), settings.signature]
        ];

        if (!animated) {
            lines.forEach(function (line) {
                line[0].textContent = line[1];
            });
            return;
        }

        for (var index = 0; index < lines.length; index++) {
            await typeLine(lines[index][0], lines[index][1]);
        }
    }

    canvas.width = width;
    canvas.height = height;

    var opts = structuredClone(config.tree);
    opts.images = config.flowerImages;
    opts.branch = opts.branch.concat(relationshipBranches(config.startDate));
    opts.seed = Object.assign({}, opts.seed, {
        x: width / 2 - 20
    });
    opts.bloom = Object.assign({}, opts.bloom, {
        jumpScale: isNarrowScreen ? config.tree.bloom.jumpScale.narrow : config.tree.bloom.jumpScale.wide,
        jumpSpawnMax: isNarrowScreen ? config.tree.bloom.jumpSpawnMax.narrow : config.tree.bloom.jumpSpawnMax.wide
    });

    var tree = new Tree(canvas, width, height, opts);
    var seed = tree.seed;
    var foot = tree.footer;
    var startInteraction = TreeInteractions.bindStartInteraction(canvas, seed);

    async function seedAnimate() {
        seed.draw();
        while (startInteraction.isWaiting()) {
            await sleep(10);
        }
        while (seed.canScale()) {
            seed.scale(0.95);
            await sleep(10);
        }
        while (seed.canMove()) {
            seed.move(0, 2);
            foot.draw();
            await sleep(10);
        }
    }

    async function growAnimate() {
        do {
            tree.grow();
            await sleep(10);
        } while (tree.canGrow());
    }

    async function flowAnimate() {
        do {
            tree.flower(2);
            await sleep(10);
        } while (tree.canFlower());
    }

    async function moveAnimate() {
        var targetScale = config.tree.transition.targetScale;

        tree.snapshot("p1", 240, 0, 610, 680);
        while (tree.move("p1", 500, 0, targetScale)) {
            foot.draw();
            await sleep(10);
        }
        foot.draw();
        tree.snapshot("p2", 500, 0, 610, 680);

        var wrap = canvas.parentElement;
        wrap.style.backgroundImage = "url(" + tree.toDataURL('image/png') + ")";
        wrap.style.backgroundSize = "100% 100%";
        wrap.style.backgroundRepeat = "no-repeat";
        wrap.style.backgroundPosition = "center";

        canvas.style.background = "#17120f";
        await sleep(300);
        canvas.style.background = "none";
    }

    async function jumpAnimate() {
        while (true) {
            tree.ctx.clearRect(0, 0, width, height);
            tree.jump();
            foot.draw();
            await sleep(25);
        }
    }

    async function textAnimate() {
        var together = new Date(config.startDate);
        var code = document.getElementById("code");
        var settings = readSavedSettings();

        fadeIn(code, 450);
        await renderMessage(settings, true);
        fadeIn(document.getElementById("clock-box"), 500);

        var clock = document.getElementById("clock");
        while (true) {
            clock.innerHTML = AppClock.formatElapsedHtml(together, config.clock);
            await sleep(1000);
        }
    }

    window.addEventListener("storage", function (event) {
        if (event.key === config.storageKey) {
            window.location.reload();
        }
    });

    async function run() {
        await seedAnimate();
        await growAnimate();
        await flowAnimate();
        await moveAnimate();
        textAnimate();
        await jumpAnimate();
    }

    run();
})();
