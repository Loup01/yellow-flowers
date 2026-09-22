(function () {
    var canvas = document.getElementById('canvas');
    var branchLayer = document.getElementById('branch-layer');
    var groundLayer = document.getElementById('ground-layer');
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
    var TREE_OFFSET_Y = height * (1 - TREE_SCALE);
    var branchOnlyImage = null;
    var growthLensCanvas = null;
    var growthLensContext = null;

    function sleep(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function wait(ms) {
        return sleep(reducedMotion ? 1 : (isNarrowScreen ? Math.max(1, Math.round(ms * .28)) : ms));
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
            window.typewriter(element, text, { speed: isNarrowScreen ? 11 : 28, onDone: resolve });
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

    function seasonFor(date) {
        var month = date.getMonth();
        if (month >= 2 && month <= 4) { return "spring"; }
        if (month >= 5 && month <= 7) { return "summer"; }
        if (month >= 8 && month <= 10) { return "autumn"; }
        return "winter";
    }

    function seededRandom(seed) {
        var value = Math.sin(seed * 999.91) * 43758.5453;
        return value - Math.floor(value);
    }

    function drawSeasonalGround() {
        if (!groundLayer || !groundLayer.getContext) {
            return;
        }

        groundLayer.width = width;
        groundLayer.height = height;
        var context = groundLayer.getContext('2d');
        var season = seasonFor(new Date());
        var palettes = {
            spring: ["#74875d", "#9aa76d", "#d2b45b", "#6a774f"],
            summer: ["#40513b", "#607149", "#8b914f", "#c79a35"],
            autumn: ["#6f6841", "#92804a", "#b87932", "#805136"],
            winter: ["#7f8068", "#9a967b", "#6e735d", "#b9aa82"]
        };
        var colors = palettes[season];
        var soil = context.createLinearGradient(0, 585, 0, height);
        soil.addColorStop(0, "rgba(91, 65, 39, 0)");
        soil.addColorStop(.35, "rgba(112, 82, 50, .12)");
        soil.addColorStop(1, "rgba(82, 57, 35, .3)");
        context.fillStyle = soil;
        context.fillRect(0, 575, width, height - 575);

        for (var index = 0; index < 310; index++) {
            var x = seededRandom(index + 1) * width;
            var baseY = 620 + seededRandom(index + 41) * 58;
            var bladeHeight = 5 + seededRandom(index + 83) * (season === "summer" ? 24 : 17);
            var lean = (seededRandom(index + 127) - .5) * 10;
            context.beginPath();
            context.moveTo(x, baseY);
            context.quadraticCurveTo(x + lean * .35, baseY - bladeHeight * .55, x + lean, baseY - bladeHeight);
            context.strokeStyle = colors[index % colors.length];
            context.globalAlpha = .34 + seededRandom(index + 173) * .42;
            context.lineWidth = .7 + seededRandom(index + 211) * 1.25;
            context.lineCap = "round";
            context.stroke();
        }
        context.globalAlpha = 1;
        groundLayer.dataset.season = season;
    }

    canvas.width = width;
    canvas.height = height;
    drawSeasonalGround();

    var opts = structuredClone(config.tree);
    opts.images = config.flowerImages;
    var bloomFactors = { suave: .72, equilibrada: 1, abundante: 1.18 };
    var bloomFactor = bloomFactors[config.flowerIntensity] || 1;
    if (isNarrowScreen) {
        bloomFactor *= .78;
    }
    opts.bloom.num = Math.max(360, Math.round(opts.bloom.num * bloomFactor));
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
    var openingInvitation = document.getElementById("opening-invitation");
    var openingName = document.getElementById("opening-name");
    var growthLens = document.getElementById("growth-lens");
    var growthLensRing = document.getElementById("growth-lens-ring");

    function beginOpening() {
        if (openingInvitation) {
            openingInvitation.classList.add("is-starting");
            openingInvitation.disabled = true;
            var hint = openingInvitation.querySelector("small");
            if (hint) {
                hint.textContent = "Nuestro árbol está despertando…";
            }
        }
    }

    function dismissOpening() {
        if (openingInvitation) {
            openingInvitation.classList.add("is-dismissed");
            openingInvitation.setAttribute("aria-hidden", "true");
            openingInvitation.tabIndex = -1;
        }
    }

    if (openingName) {
        openingName.textContent = config.recipientDisplay;
    }

    var startInteraction = TreeInteractions.bindStartInteraction(canvas, seed, beginOpening);
    if (openingInvitation) {
        openingInvitation.addEventListener("click", startInteraction.start);
    }
    if (new URLSearchParams(window.location.search).get("preview") === "1") {
        startInteraction.start();
    }
    var wrap = canvas.parentElement;

    var backdrop = document.createElement('canvas');
    backdrop.width = width;
    backdrop.height = height;
    var backdropCtx = backdrop.getContext('2d');
    var backdropReady = null;

    var layerCtx = branchLayer && branchLayer.getContext ? branchLayer.getContext('2d') : null;
    var twigQueue = [];
    var twigPumpRunning = false;
    var growthFlowerImages = config.flowerImages.map(function (source) {
        var image = new Image();
        image.src = source;
        return image;
    });

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
            var growthBatch = isNarrowScreen ? 4 : 1;
            for (var step = 0; step < growthBatch && tree.canGrow(); step++) {
                tree.grow();
            }
            await wait(10);
        } while (tree.canGrow());
        branchOnlyImage = tree.toDataURL('image/png');
    }

    async function flowAnimate() {
        do {
            tree.flower(isNarrowScreen ? 8 : 2);
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

        if (growthLens && branchOnlyImage) {
            var lensImage = await buildGrowthLensImage(branchOnlyImage);
            growthLens.style.backgroundImage = "url(" + lensImage + ")";
        }

        dismissOpening();
    }

    function buildGrowthLensImage(source) {
        return new Promise(function (resolve) {
            var image = new Image();
            image.onload = function () {
                growthLensCanvas = document.createElement("canvas");
                growthLensCanvas.width = width;
                growthLensCanvas.height = height;
                growthLensContext = growthLensCanvas.getContext("2d");
                var context = growthLensContext;
                context.fillStyle = "#f3e8d0";
                context.fillRect(0, 0, width, height);
                if (groundLayer) {
                    context.drawImage(groundLayer, 0, 0, width, height);
                }
                context.drawImage(
                    image,
                    TREE_CAPTURE_X,
                    0,
                    610,
                    height,
                    TREE_FINAL_X,
                    TREE_OFFSET_Y,
                    610 * TREE_SCALE,
                    height * TREE_SCALE
                );
                resolve(growthLensCanvas.toDataURL("image/png"));
            };
            image.src = source;
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
        var children = Array.isArray(spec[8])
            ? spec[8].map(twigSpecOnScreen)
            : [];

        return [
            TREE_OFFSET_X + spec[0] * t,
            TREE_OFFSET_Y + spec[1] * t,
            TREE_OFFSET_X + spec[2] * t,
            TREE_OFFSET_Y + spec[3] * t,
            TREE_OFFSET_X + spec[4] * t,
            TREE_OFFSET_Y + spec[5] * t,
            Math.min(4, Math.max(1.8, spec[6] * t * 1.25)),
            Math.max(14, Math.round(spec[7] * t)),
            children
        ];
    }

    async function growTwigOnLayer(spec) {
        if (!branchLayer || !layerCtx) {
            return;
        }

        showGrowthLens(spec);
        drawGrowthGuide(spec);

        var twig = new Tree(branchLayer, width, height, {
            images: config.flowerImages,
            bloom: { num: 2, width: width, height: height },
            branch: [spec]
        });

        do {
            twig.grow();
            await wait(16);
        } while (twig.canGrow());

        updateGrowthLensBranches();
        await sleep(reducedMotion ? 1 : (isNarrowScreen ? 360 : 520));
        await flowerTwigTip(spec);
        await sleep(reducedMotion ? 1 : (isNarrowScreen ? 360 : 520));
        hideGrowthLens();
    }

    function updateGrowthLensBranches() {
        if (!growthLens || !growthLensCanvas || !growthLensContext || !branchLayer) {
            return;
        }

        growthLensContext.drawImage(branchLayer, 0, 0, width, height);
        growthLens.style.backgroundImage = "url(" + growthLensCanvas.toDataURL("image/png") + ")";
    }

    function showGrowthLens(spec) {
        var centerX = (spec[0] + spec[4]) / 2;
        var centerY = (spec[1] + spec[5]) / 2;
        var left = centerX / width * 100;
        var top = centerY / height * 100;

        if (growthLens) {
            growthLens.style.setProperty("--lens-x", left + "%");
            growthLens.style.setProperty("--lens-y", top + "%");
            growthLens.classList.add("is-visible");
        }
        if (growthLensRing) {
            growthLensRing.style.left = left + "%";
            growthLensRing.style.top = top + "%";
            growthLensRing.classList.add("is-visible");
        }
    }

    function hideGrowthLens() {
        if (growthLens) {
            growthLens.classList.remove("is-visible");
        }
        if (growthLensRing) {
            growthLensRing.classList.remove("is-visible");
        }
    }

    function drawGrowthGuide(spec) {
        layerCtx.save();
        layerCtx.beginPath();
        layerCtx.moveTo(spec[0], spec[1]);
        layerCtx.quadraticCurveTo(spec[2], spec[3], spec[4], spec[5]);
        layerCtx.setLineDash([3, 4]);
        layerCtx.strokeStyle = "rgba(139, 69, 19, .28)";
        layerCtx.lineWidth = Math.max(2.2, spec[6] * 1.25);
        layerCtx.lineCap = "round";
        layerCtx.stroke();
        layerCtx.restore();
    }

    function imageReady(image) {
        if (image.complete) {
            return Promise.resolve(image.naturalWidth > 0);
        }

        return new Promise(function (resolve) {
            image.addEventListener("load", function () { resolve(true); }, { once: true });
            image.addEventListener("error", function () { resolve(false); }, { once: true });
        });
    }

    async function flowerTwigTip(spec) {
        if (!layerCtx || !growthFlowerImages.length) {
            return;
        }

        var placementSets = {
            suave: [[0, 0, 19]],
            equilibrada: [[-5, 1, 20], [6, -4, 17]],
            abundante: [[-7, 2, 20], [7, -3, 18], [0, -10, 16]]
        };
        var placements = placementSets[config.flowerIntensity] || placementSets.equilibrada;
        var seed = Math.abs(Math.round(spec[4] + spec[5]));
        var flowers = [];

        for (var index = 0; index < placements.length; index++) {
            var image = growthFlowerImages[(seed + index * 3) % growthFlowerImages.length];
            var ready = await imageReady(image);
            if (ready) {
                flowers.push({ image: image, placement: placements[index] });
            }
        }

        if (!flowers.length) {
            return;
        }

        var area = {
            x: Math.max(0, Math.floor(spec[4] - 34)),
            y: Math.max(0, Math.floor(spec[5] - 34)),
            width: Math.min(68, width - Math.max(0, Math.floor(spec[4] - 34))),
            height: Math.min(68, height - Math.max(0, Math.floor(spec[5] - 34)))
        };
        var branchPixels = layerCtx.getImageData(area.x, area.y, area.width, area.height);
        var stages = reducedMotion ? 1 : 8;

        for (var stage = 0; stage <= stages; stage++) {
            var progress = stages === 1 ? 1 : stage / stages;
            var eased = 1 - Math.pow(1 - progress, 3);
            layerCtx.putImageData(branchPixels, area.x, area.y);

            if (progress < 1) {
                layerCtx.save();
                layerCtx.beginPath();
                layerCtx.arc(spec[4], spec[5], 8 + progress * 17, 0, Math.PI * 2);
                layerCtx.strokeStyle = "rgba(242, 140, 24, " + (.3 * (1 - progress)) + ")";
                layerCtx.lineWidth = 2;
                layerCtx.stroke();
                layerCtx.restore();
            }

            flowers.forEach(function (flower, flowerIndex) {
                var flowerProgress = flowerIndex === 0
                    ? eased
                    : Math.max(0, Math.min(1, (progress - .16) / .84));
                flowerProgress = 1 - Math.pow(1 - flowerProgress, 3);
                var placement = flower.placement;
                var size = placement[2] * flowerProgress;
                if (size <= 0) {
                    return;
                }

                layerCtx.save();
                layerCtx.globalAlpha = .96;
                layerCtx.drawImage(
                    flower.image,
                    spec[4] + placement[0] - size / 2,
                    spec[5] + placement[1] - size / 2,
                    size,
                    size
                );
                layerCtx.restore();
            });

            await wait(48);
        }
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

    function showGrowthSound(spec, yearsAdded) {
        var sound = document.getElementById("growth-sound");
        if (!sound) {
            return;
        }

        var transformed = twigSpecOnScreen(spec);
        var sounds = ["crac…", "fshhh…", "toc… crac…", "susss…"];
        sound.textContent = sounds[(yearsAdded - 1) % sounds.length] + "  +1 año de historia";
        sound.style.left = (transformed[4] / width * 100) + "%";
        sound.style.top = (transformed[5] / height * 100) + "%";
        sound.classList.remove("is-visible");
        void sound.offsetWidth;
        sound.classList.add("is-visible");
    }

    function persistBranches() {
        try {
            var raw = JSON.parse(localStorage.getItem(config.storageKey) || "null") || {};
            raw.branchBoost = boostCount;
            localStorage.setItem(config.storageKey, JSON.stringify(raw));

            if (config.treeId) {
                var libraryKey = "yellowFlowers.trees.v2";
                var library = JSON.parse(localStorage.getItem(libraryKey) || "null");
                if (library && Array.isArray(library.items)) {
                    var profile = library.items.find(function (item) {
                        return item.id === config.treeId;
                    });
                    if (profile) {
                        profile.data.branchBoost = boostCount;
                        library.activeId = profile.id;
                        localStorage.setItem(libraryKey, JSON.stringify(library));
                    }
                }
            }
        } catch (error) {
            /* sin almacenamiento disponible */
        }

        try {
            var params = new URLSearchParams(window.location.search);
            params.set("anios", String(boostCount));
            params.delete("ramas");
            window.history.replaceState(null, "", window.location.pathname + "?" + params.toString() + window.location.hash);
        } catch (error) {
            return;
        }
    }

    var branchTouch = document.getElementById("branch-touch");
    if (branchTouch) {
        var branchTouchLabel = branchTouch.textContent;
        branchTouch.addEventListener("click", async function () {
            if (!backdropReady) {
                return;
            }

            if (branchCount >= FlowGrowth.MAX_TOTAL || twigPumpRunning) {
                return;
            }

            branchTouch.disabled = true;
            branchTouch.textContent = "(creciendo…)";
            try {
                var nextSpec = FlowGrowth.specAt(branchCount);
                twigQueue.push(nextSpec);
                branchCount += 1;
                boostCount = FlowGrowth.clampBoost(boostCount + 1);
                persistBranches();
                await pumpTwigs();
                await sleep(reducedMotion ? 1 : 260);
                showGrowthSound(nextSpec, boostCount);
            } finally {
                branchTouch.disabled = false;
                branchTouch.textContent = branchTouchLabel;
            }
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
