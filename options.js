function saveOptions(e) {
    e.preventDefault();

    const selectedOption = document.querySelector('input[name="opcion"]:checked');
    const checkboxValue = document.getElementById("miCheckbox").checked;
    const prefs = {
        outputFile: selectedOption.value,
        multipleWindows: checkboxValue
    };

    browser.storage.sync.set({ prefs })
        .then(() => console.log("Opción guardada:", prefs))
        .catch(error => console.error("Error al guardar:", error));




}

function restoreOptions() {
    function setCurrentChoice(result) {
        console.log("Preferencias cargadas:", result.outputFile);
        console.log(result);
        console.log(result.multipleWindows);

        result = result.prefs;
        if (result.outputFile) {
            const radioButton = document.querySelector(`input[name="opcion"][value="${result.outputFile}"]`);
            if (radioButton) {
                radioButton.checked = true;
            } else {
                console.warn("No se encontró el botón correspondiente.");
            }
        }

        const checkbox = document.getElementById("miCheckbox");
        checkbox.checked = result.multipleWindows === true;
    }
    function onError(error) {
        console.error(`Error al recuperar datos: ${error}`);
    }
    browser.storage.sync.get("prefs").then(setCurrentChoice, onError);
}
document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("optionsForm").addEventListener("submit", saveOptions);
