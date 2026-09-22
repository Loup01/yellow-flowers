(function () {
    var canvas = document.getElementById('canvas');
    var config = window.APP_CONFIG;
    var width = config.canvas.width;
    var height = config.canvas.height;
    var branchLayer = document.getElementById('branch-layer');
    var branchContext = branchLayer ? branchLayer.getContext('2d') : null;
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
    function relationshipBranches(startDate, branchBoost) {
        var count = Math.floor(elapsedDays(startDate) / 30) + (branchBoost || 0);
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
    if (branchLayer) {
        branchLayer.width = width;
        branchLayer.height = height;
    }

    var opts = structuredClone(config.tree);
    opts.images = config.flowerImages;
    opts.branch = opts.branch.concat(relationshipBranches(config.startDate, config.branchBoost));
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

        canvas.style.background = "#f3e8d0";
        await sleep(300);
        canvas.style.background = "none";
    }

    async function jumpAnimate() {
        while (true) {
            tree.ctx.clearRect(0, 0, width, height);
            tree.jump();
            foot.draw();
            drawExtraBranches();
            await sleep(25);
        }
    }

    var extraBranches = [];
    var extraBranchCount = config.branchBoost || 0;
    var branchSlots = [
        [535, 292, 500, 248, 458, 212],
        [548, 305, 584, 255, 632, 214],
        [520, 330, 477, 294, 435, 255],
        [567, 335, 615, 294, 667, 252],
        [531, 274, 510, 230, 493, 185],
        [557, 280, 590, 232, 624, 187],
        [500, 356, 455, 333, 412, 300],
        [590, 360, 638, 333, 691, 296]
    ];

    function branchForIndex(index) {
        var slot = branchSlots[index % branchSlots.length];
        var cycle = Math.floor(index / branchSlots.length);
        var direction = index % 2 === 0 ? -1 : 1;
        var drift = cycle * 8 * direction;
        return {
            p1: { x: slot[0] + drift, y: slot[1] - cycle * 4 },
            p2: { x: slot[2] + drift * 1.15, y: slot[3] - cycle * 5 },
            p3: { x: slot[4] + drift * 1.35, y: slot[5] - cycle * 6 },
            progress: 0,
            radius: Math.max(1.4, 5.5 - cycle * .3)
        };
    }

    function bezierPoint(branch, progress) {
        var inverse = 1 - progress;
        return {
            x: inverse * inverse * branch.p1.x + 2 * inverse * progress * branch.p2.x + progress * progress * branch.p3.x,
            y: inverse * inverse * branch.p1.y + 2 * inverse * progress * branch.p2.y + progress * progress * branch.p3.y
        };
    }

    function drawExtraBranches() {
        if (!branchContext) {
            return;
        }

        branchContext.clearRect(0, 0, width, height);
        extraBranches.forEach(function (branch) {
            var points = [];
            var steps = Math.max(2, Math.ceil(branch.progress * 34));
            for (var step = 0; step <= steps; step++) {
                points.push(bezierPoint(branch, Math.min(branch.progress, step / 34)));
            }

            if (points.length < 2) {
                return;
            }

            branchContext.save();
            branchContext.beginPath();
            branchContext.moveTo(points[0].x, points[0].y);
            points.slice(1).forEach(function (point) {
                branchContext.lineTo(point.x, point.y);
            });
            branchContext.strokeStyle = "rgba(64, 81, 59, .92)";
            branchContext.lineWidth = branch.radius;
            branchContext.lineCap = "round";
            branchContext.lineJoin = "round";
            branchContext.stroke();

            if (branch.progress >= 1) {
                var tip = bezierPoint(branch, 1);
                branchContext.fillStyle = "rgba(242, 140, 24, .95)";
                branchContext.beginPath();
                branchContext.arc(tip.x, tip.y, Math.max(2.5, branch.radius * 1.25), 0, Math.PI * 2);
                branchContext.fill();
            }
            branchContext.restore();
        });
    }

    function growExtraBranch() {
        if (!branchContext) {
            return;
        }

        var branch = branchForIndex(extraBranchCount);
        extraBranchCount += 1;
        extraBranches.push(branch);

        var started = performance.now();
        var duration = 1600;
        function animate(now) {
            branch.progress = Math.min(1, (now - started) / duration);
            drawExtraBranches();
            if (branch.progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);

        var params = new URLSearchParams(window.location.search);
        params.set("ramas", String(extraBranchCount));
        window.history.replaceState({}, "", window.location.pathname + "?" + params.toString());
    }

    async function textAnimate() {
        var together = new Date(config.startDate);
        var code = document.getElementById("code");
        var settings = readSavedSettings();
        settings.line1 = config.message.line1;
        settings.line2 = config.message.line2;
        settings.line3 = config.message.line3;
        settings.signature = config.message.signature;

        fadeIn(code, 450);
        await renderMessage(settings, true);
        fadeIn(document.getElementById("clock-box"), 500);

        var clock = document.getElementById("clock");
        while (true) {
            clock.innerHTML = AppClock.formatElapsedHtml(together, config.clock);
            await sleep(1000);
        }
    }

    var branchTouch = document.getElementById("branch-touch");
    if (branchTouch) {
        branchTouch.addEventListener("click", function () {
            growExtraBranch();
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
