(function () {
    var STORAGE_KEY = "yellowFlowers.settings.v1";
    var LIBRARY_KEY = "yellowFlowers.trees.v2";
    var defaults = {
        recipient: "el amor de mi vida",
        startDate: "2025-06-04T00:00",
        line1: "Flores amarillas para ti,",
        line2: "Nuestro amor siempre florecerá.",
        line3: "Y mientras sigamos juntos, este árbol seguirá creciendo.",
        signature: "— Siempre contigo, siempre nosotros.",
        flowerIntensity: "equilibrada",
        branchBoost: 0
    };

    var form = document.getElementById("editor-form");
    var status = document.getElementById("save-status");
    var shareButton = document.getElementById("share-button");
    var shareOutput = document.getElementById("share-output");
    var shareUrl = document.getElementById("share-url");
    var undoYear = document.getElementById("undo-year");
    var previewFrame = document.getElementById("preview-frame");
    var previewSeason = document.getElementById("preview-season");
    var treeSelector = document.getElementById("tree-selector");
    var newTreeButton = document.getElementById("new-tree");
    var previewTimer = null;
    var library = readLibrary();

    function createId() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }
        return "arbol-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    }

    function readLegacySettings() {
        try {
            return Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {});
        } catch (error) {
            return Object.assign({}, defaults);
        }
    }

    function readLibrary() {
        try {
            var stored = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "null");
            if (stored && Array.isArray(stored.items) && stored.items.length) {
                stored.items = stored.items.map(function (item) {
                    return { id: item.id, data: Object.assign({}, defaults, item.data || {}) };
                });
                if (!stored.items.some(function (item) { return item.id === stored.activeId; })) {
                    stored.activeId = stored.items[0].id;
                }
                return stored;
            }
        } catch (error) {
            /* migra la configuración anterior abajo */
        }

        var firstId = createId();
        return {
            activeId: firstId,
            items: [{ id: firstId, data: readLegacySettings() }]
        };
    }

    function activeProfile() {
        return library.items.find(function (item) {
            return item.id === library.activeId;
        }) || library.items[0];
    }

    function profileName(profile, index) {
        var name = String(profile.data.recipient || "").trim();
        if (!name || name === defaults.recipient || name === "Nueva historia") {
            return "Árbol " + (index + 1);
        }
        return "Árbol " + (index + 1) + " · " + name;
    }

    function persistLibrary() {
        localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeProfile().data));
    }

    function renderTreeSelector() {
        treeSelector.innerHTML = "";
        library.items.forEach(function (profile, index) {
            var option = document.createElement("option");
            option.value = profile.id;
            option.textContent = profileName(profile, index);
            option.selected = profile.id === library.activeId;
            treeSelector.appendChild(option);
        });
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

    function saveCurrent(showMessage) {
        var profile = activeProfile();
        profile.data = Object.assign({}, profile.data, collectFormData());
        persistLibrary();
        renderTreeSelector();
        if (showMessage) {
            status.textContent = "Guardado en " + profileName(profile, library.items.indexOf(profile)) + ".";
            status.className = "status success";
        }
        return profile;
    }

    function buildTreeUrl(profile, preview) {
        var data = profile.data;
        var url = new URL("../index.html", window.location.href);
        url.searchParams.set("arbol", profile.id);
        url.searchParams.set("nombre", data.recipient);
        url.searchParams.set("fecha", data.startDate);
        url.searchParams.set("m1", data.line1);
        url.searchParams.set("m2", data.line2);
        url.searchParams.set("m3", data.line3);
        url.searchParams.set("firma", data.signature);
        url.searchParams.set("anios", String(data.branchBoost || 0));
        url.searchParams.set("floracion", data.flowerIntensity || "equilibrada");
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

    function updateEditorUrl() {
        var url = new URL(window.location.href);
        url.searchParams.set("arbol", library.activeId);
        window.history.replaceState(null, "", url.pathname + url.search);
    }

    function updatePreview() {
        var profile = activeProfile();
        profile.data = Object.assign({}, profile.data, collectFormData());
        previewFrame.src = buildTreeUrl(profile, true).href;
    }

    function schedulePreview() {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(updatePreview, 320);
    }

    function populateProfile() {
        var profile = activeProfile();
        Object.keys(defaults).forEach(function (key) {
            var field = document.getElementById(key);
            if (field) {
                field.value = profile.data[key];
            }
        });
        shareOutput.hidden = true;
        status.textContent = "";
        renderTreeSelector();
        updateEditorUrl();
        updatePreview();
    }

    var requestedId = new URLSearchParams(window.location.search).get("arbol");
    if (requestedId && library.items.some(function (item) { return item.id === requestedId; })) {
        library.activeId = requestedId;
    }
    persistLibrary();
    previewSeason.textContent = currentSeasonLabel();
    populateProfile();

    form.addEventListener("input", schedulePreview);

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = collectFormData();
        if (!data.startDate || isNaN(new Date(data.startDate).getTime())) {
            status.textContent = "Elige una fecha válida para iniciar el temporizador.";
            status.className = "status error";
            return;
        }
        saveCurrent(true);
        updatePreview();
    });

    treeSelector.addEventListener("change", function () {
        var nextId = treeSelector.value;
        saveCurrent(false);
        library.activeId = nextId;
        persistLibrary();
        populateProfile();
    });

    newTreeButton.addEventListener("click", function () {
        saveCurrent(false);
        var profile = {
            id: createId(),
            data: Object.assign({}, defaults, {
                recipient: "Nueva historia",
                branchBoost: 0
            })
        };
        library.items.push(profile);
        library.activeId = profile.id;
        persistLibrary();
        populateProfile();
        document.getElementById("recipient").focus();
        document.getElementById("recipient").select();
        status.textContent = "Nuevo árbol creado. Personalízalo y guarda los cambios.";
        status.className = "status success";
    });

    shareButton.addEventListener("click", function () {
        var profile = saveCurrent(false);
        var url = buildTreeUrl(profile, false);
        shareUrl.value = url.href;
        shareOutput.hidden = false;
        shareUrl.focus();
        shareUrl.select();

        var message = "Enlace creado. Este árbol conserva su propia historia.";
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url.href).then(function () {
                status.textContent = "Enlace creado y copiado. Este árbol conserva su propia historia.";
                status.className = "status success";
            }).catch(function () {
                status.textContent = message;
                status.className = "status success";
            });
        } else {
            status.textContent = message;
            status.className = "status success";
        }
    });

    undoYear.addEventListener("click", function () {
        var profile = saveCurrent(false);
        var currentYears = Math.max(0, parseInt(profile.data.branchBoost, 10) || 0);
        if (currentYears === 0) {
            status.textContent = "Este árbol no tiene años simulados que deshacer.";
            status.className = "status error";
            return;
        }
        profile.data.branchBoost = currentYears - 1;
        persistLibrary();
        status.textContent = "Se deshizo el último año de este árbol. Quedan " + profile.data.branchBoost + ".";
        status.className = "status success";
        updatePreview();
    });
})();
