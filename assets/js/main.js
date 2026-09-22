(function () {
    var canvas = document.getElementById('canvas');
    var branchLayer = document.getElementById('branch-layer');
    var config = window.APP_CONFIG;
    var FlowGrowth = window.FlowGrowth;
    var width = config.canvas.width;
    var height = config.canvas.height;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || width;
    var isNarrowScreen = viewportWidth <= 768;
    var reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (!canvas || !canvas.getContext) {
        return false;
    }

    var TREE_CAPTURE_X = 240;
    var TREE_FINAL_X = 500;
    var TREE_SCALE = config.tree.transition.targetScale;
    var TREE_OFFSET_X = TREE_FINAL_X - TREE_CAPTURE_X * TREE_SCALE;

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function wait(ms) {
        return sleep(reducedMotion ? 1 : ms);
    }

    function fadeIn(element, duration) {
        element.style.opacity = "0";
        element.style.display = "block";
        element.style.transition = "opacity " + duration + "ms";
        void element.offsetHeight;
        element.style.opacity = "1";
    }

    function typeLine(element, text) {
        return new Promise(function (resolve) {
            window.typewriter(element, text, { speed: 28, onDone: resolve });
        });
    }

    async function renderMessage(lines, animated) {
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

    function revealBranchButton() {
        var button = document.getElementById("branch-touch");

        if (!button) {
            return;
        }

        button.hidden = false;
        window.requestAnimationFrame(function () {
            button.classList.add("is-visible");
        });
    }

    canvas.width = width;
    canvas.height = height;

    var opts = structuredClone(config.tree);
    opts.images = config.flowerImages;
    var branchCount = FlowGrowth.total(config.startDate, config.branchBoost);
    var boostCount = FlowGrowth.clampBoost(config.branchBoost);
    opts.branch = opts.branch.concat(FlowGrowth.specs(branchCount));
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
    var wrap = canvas.parentElement;

    var backdrop = document.createElement('canvas');
    backdrop.width = width;
    backdrop.height = height;
    var backdropCtx = backdrop.getContext('2d');
    var backdropReady = null;

    var layerCtx = branchLayer && branchLayer.getContext ? branchLayer.getContext('2d') : null;
    var twigQueue = [];
    var twigPumpRunning = false;

    async function seedAnimate() {
        seed.draw();
        while (startInteraction.isWaiting()) {
            await sleep(10);
        }
        while (seed.canScale()) {
            seed.scale(0.95);
            await wait(10);
        }
        while (seed.canMove()) {
            seed.move(0, 2);
            foot.draw();
            await wait(10);
        }
    }

    async function growAnimate() {
        do {
            tree.grow();
            await wait(10);
        } while (tree.canGrow());
    }

    async function flowAnimate() {
        do {
            tree.flower(2);
            await wait(10);
        } while (tree.canFlower());
    }

    async function moveAnimate() {
        tree.snapshot("p1", TREE_CAPTURE_X, 0, 610, 680);
        while (tree.move("p1", TREE_FINAL_X, 0, TREE_SCALE)) {
            foot.draw();
            await wait(10);
        }
        foot.draw();
        tree.snapshot("p2", TREE_FINAL_X, 0, 610, 680);

        var finalImage = tree.toDataURL('image/png');
        wrap.style.backgroundImage = "url(" + finalImage + ")";
        wrap.style.backgroundSize = "100% 100%";
        wrap.style.backgroundRepeat = "no-repeat";
        wrap.style.backgroundPosition = "center";

        backdropReady = new Promise(function (resolve) {
            var image = new Image();
            image.onload = function () {
                backdropCtx.clearRect(0, 0, width, height);
                backdropCtx.drawImage(image, 0, 0, width, height);
                resolve();
            };
            image.src = finalImage;
        });
    }

    async function jumpAnimate() {
        if (reducedMotion) {
            return;
        }

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
        var lines = [
            [document.getElementById("message-line-1"), config.message.line1],
            [document.getElementById("message-line-2"), config.message.line2],
            [document.getElementById("message-line-3"), config.message.line3],
            [document.getElementById("message-signature"), config.message.signature]
        ];

        fadeIn(code, 450);
        await renderMessage(lines, !reducedMotion);
        revealBranchButton();
        fadeIn(document.getElementById("clock-box"), 500);

        var clock = document.getElementById("clock");
        while (true) {
            clock.innerHTML = AppClock.formatElapsedHtml(together, config.clock);
            await sleep(1000);
        }
    }

    function twigSpecOnScreen(spec) {
        var t = TREE_SCALE;

        return [
            TREE_OFFSET_X + spec[0] * t,
            spec[1] * t,
            TREE_OFFSET_X + spec[2] * t,
            spec[3] * t,
            TREE_OFFSET_X + spec[4] * t,
            spec[5] * t,
            Math.min(4, Math.max(1.8, spec[6] * t * 1.25)),
            Math.max(14, Math.round(spec[7] * t))
        ];
    }

    async function growTwigOnLayer(spec) {
        if (!branchLayer || !layerCtx) {
            return;
        }

        var twig = new Tree(branchLayer, width, height, {
            images: config.flowerImages,
            bloom: { num: 2, width: width, height: height },
            branch: [spec]
        });

        do {
            twig.grow();
            await wait(16);
        } while (twig.canGrow());
    }

    async function bakeTwig() {
        if (!backdropReady || !layerCtx) {
            return;
        }

        await backdropReady;
        backdropCtx.drawImage(branchLayer, 0, 0);
        wrap.style.backgroundImage = "url(" + backdrop.toDataURL('image/png') + ")";
        layerCtx.clearRect(0, 0, width, height);
    }

    async function pumpTwigs() {
        if (twigPumpRunning) {
            return;
        }

        twigPumpRunning = true;
        while (twigQueue.length) {
            await growTwigOnLayer(twigSpecOnScreen(twigQueue.shift()));
            await bakeTwig();
        }
        twigPumpRunning = false;
    }

    function persistBranches() {
        try {
            var raw = JSON.parse(localStorage.getItem(config.storageKey) || "null") || {};
            raw.branchBoost = boostCount;
            localStorage.setItem(config.storageKey, JSON.stringify(raw));
        } catch (error) {
            /* sin almacenamiento disponible */
        }

        try {
            var params = new URLSearchParams(window.location.search);
            params.set("ramas", String(boostCount));
            window.history.replaceState(null, "", window.location.pathname + "?" + params.toString() + window.location.hash);
        } catch (error) {
            return;
        }
    }

    var branchTouch = document.getElementById("branch-touch");
    if (branchTouch) {
        branchTouch.addEventListener("click", function () {
            if (!backdropReady) {
                return;
            }

            if (branchCount >= FlowGrowth.MAX_TOTAL) {
                return;
            }

            twigQueue.push(FlowGrowth.specAt(branchCount));
            branchCount += 1;
            boostCount = FlowGrowth.clampBoost(boostCount + 1);
            persistBranches();
            pumpTwigs();
        });
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
