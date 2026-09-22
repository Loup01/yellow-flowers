(function () {
    var STORAGE_KEY = "yellowFlowers.settings.v1";
    var defaults = {
        recipient: "el amor de mi vida",
        startDate: "2025-06-04T00:00",
        line1: "Flores amarillas para ti,",
        line2: "Nuestro amor siempre florecerá.",
        line3: "Y mientras sigamos juntos, este árbol seguirá creciendo.",
        signature: "— Siempre contigo, siempre nosotros."
    };

    var form = document.getElementById("editor-form");
    var status = document.getElementById("save-status");
    var shareButton = document.getElementById("share-button");
    var shareOutput = document.getElementById("share-output");
    var shareUrl = document.getElementById("share-url");

    function readSettings() {
        try {
            return Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {});
        } catch (error) {
            return Object.assign({}, defaults);
        }
    }

    function populate() {
        var settings = readSettings();
        Object.keys(settings).forEach(function (key) {
            var field = document.getElementById(key);
            if (field) {
                field.value = settings[key];
            }
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = {};
        Array.prototype.forEach.call(form.elements, function (field) {
            if (field.name) {
                data[field.name] = field.value.trim();
            }
        });

        if (!data.startDate || isNaN(new Date(data.startDate).getTime())) {
            status.textContent = "Elige una fecha válida para iniciar el temporizador.";
            status.className = "status error";
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        status.textContent = "Guardado. Recarga la pestaña del árbol para ver tu nueva dedicatoria.";
        status.className = "status success";
    });

    function collectFormData() {
        var data = {};
        Array.prototype.forEach.call(form.elements, function (field) {
            if (field.name) {
                data[field.name] = field.value.trim();
            }
        });
        return data;
    }

    shareButton.addEventListener("click", function () {
        var data = collectFormData();
        var url = new URL("../index.html", window.location.href);
        url.searchParams.set("nombre", data.recipient);
        url.searchParams.set("fecha", data.startDate);
        url.searchParams.set("m1", data.line1);
        url.searchParams.set("m2", data.line2);
        url.searchParams.set("m3", data.line3);
        url.searchParams.set("firma", data.signature);
        url.searchParams.set("ramas", "0");

        shareUrl.value = url.href;
        shareOutput.hidden = false;
        shareUrl.focus();
        shareUrl.select();

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url.href).then(function () {
                status.textContent = "Enlace creado y copiado. Cada persona podrá tener su propio árbol.";
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
