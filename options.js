function saveOptions() {
    console.log("GUARDO");

    const selectedOption = document.querySelector('input[name="opcion"]:checked');
    const checkboxValue = document.getElementById("miCheckbox").checked;
    const prefs = {
        outputFile: selectedOption.value,
        multipleWindows: checkboxValue
    };
    console.log("guardando");
    console.log(prefs);

    browser.storage.sync.set({ prefs })
        .then(() => console.log("Opción guardada:", prefs))
        .catch(error => console.error("Error al guardar:", error));
}

function restoreOptions() {
    function setCurrentChoice(result) {


       console.log("Preferencias cargadas:", result.outputFile);
        console.log(result);
        console.log(result.multipleWindows);
        let save = false;
        result = result.prefs;

        if (result === undefined) {
            result = {
                multipleWindows: false,
                outputFile: ".URL"
            };
            save = true;
        }


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

        if(save)
            saveOptions();

    }
    function onError(error) {
        console.error(`Error al recuperar datos: ${error}`);
    }
    browser.storage.sync.get("prefs").then(setCurrentChoice, onError);
}
document.addEventListener("DOMContentLoaded", restoreOptions);

document.getElementById("optionsForm").addEventListener("submit", saveOptions);



let isDirty = false;
let saveBtn = document.getElementById("confirmButton");
let statusMessage = document.getElementById("statusMessage");

document.getElementsByTagName("form")[0].addEventListener("input", () => {
    if (!isDirty) {
        isDirty = true;
        saveBtn.disabled = false;
        statusMessage.style.display = "block";
    }
});

saveBtn.addEventListener("click", () => {
     saveOptions();
    document.getElementById("confirmMessage").style.display = "block";
    
    setTimeout(function () {
        document.getElementById("confirmMessage").style.display = "none";
    }, 5000);

    isDirty = false;
    saveBtn.disabled = true;
    statusMessage.style.display = "none";
});