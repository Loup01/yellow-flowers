(function () {
    var STORAGE_KEY = "yellowFlowers.settings.v1";
    var defaults = {
        recipient: "el amor de mi vida",
        startDate: "2025-06-04T00:00",
        line1: "Flores amarillas para ti,",
        line2: "Nuestro amor siempre florecerá.",
        line3: "Y mientras sigamos juntos, este árbol seguirá creciendo.",
        signature: "— Siempre contigo, siempre nosotros.",
        branchBoost: 0
    };

    var form = document.getElementById("editor-form");
    var status = document.getElementById("save-status");
    var shareButton = document.getElementById("share-button");
    var shareOutput = document.getElementById("share-output");
    var shareUrl = document.getElementById("share-url");
    var previewFrame = document.getElementById("preview-frame");
    var previewSeason = document.getElementById("preview-season");
    var previewTimer = null;

    function readSettings() {
        try {
            return Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {});
        } catch (error) {
            return Object.assign({}, defaults);
        }
    }

    function collectFormData() {
        var data = {};
        Array.prototype.forEach.call(form.elements, function (field) {
            if (field.name) {
                data[field.name] = field.value.trim();
            }
        });
        return data;
    }

    function buildTreeUrl(data, preview) {
        var url = new URL("../index.html", window.location.href);
        url.searchParams.set("nombre", data.recipient);
        url.searchParams.set("fecha", data.startDate);
        url.searchParams.set("m1", data.line1);
        url.searchParams.set("m2", data.line2);
        url.searchParams.set("m3", data.line3);
        url.searchParams.set("firma", data.signature);
        url.searchParams.set("anios", String(data.branchBoost || 0));
        if (preview) {
            url.searchParams.set("preview", "1");
        }
        return url;
    }

    function currentSeasonLabel() {
        var month = new Date().getMonth();
        if (month >= 2 && month <= 4) { return "Pasto de primavera"; }
        if (month >= 5 && month <= 7) { return "Pasto de verano"; }
        if (month >= 8 && month <= 10) { return "Pasto de otoño"; }
        return "Pasto de invierno";
    }

    function updatePreview() {
        var data = Object.assign({}, readSettings(), collectFormData());
        previewFrame.src = buildTreeUrl(data, true).href;
    }

    function schedulePreview() {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(updatePreview, 320);
    }

    function populate() {
        var settings = readSettings();
        Object.keys(settings).forEach(function (key) {
            var field = document.getElementById(key);
            if (field) {
                field.value = settings[key];
            }
        });
        previewSeason.textContent = currentSeasonLabel();
        updatePreview();
    }

    form.addEventListener("input", schedulePreview);

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = collectFormData();

        if (!data.startDate || isNaN(new Date(data.startDate).getTime())) {
            status.textContent = "Elige una fecha válida para iniciar el temporizador.";
            status.className = "status error";
            return;
        }

        var next = Object.assign({}, readSettings(), data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        status.textContent = "Guardado. La vista del árbol se actualizará con esta historia.";
        status.className = "status success";
        updatePreview();
    });

    shareButton.addEventListener("click", function () {
        var data = Object.assign({}, readSettings(), collectFormData());
        var url = buildTreeUrl(data, false);

        shareUrl.value = url.href;
        shareOutput.hidden = false;
        shareUrl.focus();
        shareUrl.select();

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url.href).then(function () {
                status.textContent = "Enlace creado y copiado. Este árbol conservará su propia historia.";
                status.className = "status success";
            }).catch(function () {
                status.textContent = "Enlace creado. Selecciónalo y cópialo para compartirlo.";
                status.className = "status success";
            });
        } else {
            status.textContent = "Enlace creado. Selecciónalo y cópialo para compartirlo.";
            status.className = "status success";
        }
    });

    populate();
})();
