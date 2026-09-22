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

    populate();
})();
