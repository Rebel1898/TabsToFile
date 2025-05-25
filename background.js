async function obtenerPreferenciaArchivo() {
  try {
    const data = await browser.storage.sync.get("prefs"); // Devuelve { outputFile: "tu_valor" }
    storedPreference = data.prefs.outputFile || detectarSOyDevolverOpcion(); // Accede directamente a la propiedad
    console.log("Preferencia obtenida:", storedPreference);
    return storedPreference;
  } catch (error) {
    console.error("Error al obtener preferencia:", error);
    return ".URL"; // Valor por defecto en caso de error
  }
}

async function obtenerPreferenciaMultiWindows() {
  try {
    const data = await browser.storage.sync.get("prefs");
    console.log(data.prefs.multipleWindows);
    return data.prefs.multipleWindows;
  } catch (error) {
    console.error("Error al obtener preferencia:", error);
    return false;
  }
}


//All windows
//bajar HTML directamente
//como PDF

browser.browserAction.onClicked.addListener(async (tab) => {
  try {
    const preferencia = await obtenerPreferenciaArchivo();
    const MultiWindows = await obtenerPreferenciaMultiWindows();
    let all_tabs;
    if (MultiWindows) {
      all_tabs = await browser.tabs.query({});
    }
    else
      all_tabs = await browser.tabs.query({currentWindow:true});

    GenerateZipfile(all_tabs, preferencia);
  } catch (error) {
    console.error("Error en la ejecución:", error);
  }
});
function onError(error) {
  console.error(`Error: ${error}`);
}

function logTabs(tabs) {
  var listado_links = [];
  for (const tab of tabs) {
    listado_links.push(tab);
  }
  return listado_links;
}
async function blobToUint8Array(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function uint8ToBase64(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}
async function detectarSOyDevolverOpcion() {
  const info = await browser.runtime.getPlatformInfo();
  switch (info.os) {
    case "mac":
      return ".webloc";
    case "linux":
      return ".desktop";
    default:
      return ".url";
  }
}

function ReturnFileName() {
  const cadena = "Tabs_";
  const extension = ".zip";
  const ahora = new Date();
  const dd = String(ahora.getDate()).padStart(2, '0');
  const MM = String(ahora.getMonth() + 1).padStart(2, '0'); // Meses van de 0-11
  const yyyy = ahora.getFullYear();
  const HH = String(ahora.getHours()).padStart(2, '0');
  const mm = String(ahora.getMinutes()).padStart(2, '0');
  return cadena + `${dd}.${MM}.${yyyy}_${HH}.${mm}` + extension;
}

function GenerateText(cadena, title, preferencia) {
  console.log(preferencia);
  var text = "[InternetShortcut]\nURL=" + cadena + "\nIDList= \nHotKey=0 \nIconFile=peperoni \nIconIndex=0";
  if (preferencia == ".webloc")
    text = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>URL</key><string>${cadena}</string></dict></plist>`;

  else if (preferencia == ".desktop")
    text = "[Desktop Entry]\nVersion=1.0\nType=Link\nName=" + title + "\nComment=Acceso directo a una web\nIcon=text-html\nURL=" + cadena;

  return text;



}



function GenerateZipfile(tabs, preferencia) {
  const files = {};
  if (tabs.length > 0) {
    for (var c = 0; c < tabs.length; c++) {
      var title = tabs[c].title + preferencia;
      var text = GenerateText(tabs[c].url, title, preferencia)
      // var text = "[InternetShortcut]\nURL=" + tabs[c].url + "\nIDList= \nHotKey=0 \nIconFile=peperoni \nIconIndex=0";
      text = text.replace(/\n/g, "\r\n");
      var name = title.replace(/\\/g, "-");
      name = name.replace(/\//g, "-");
      files[name] = fflate.strToU8(text);
    }

    const zipContent = fflate.zipSync(files);
    const blob = new Blob([zipContent], { type: "application/zip" });
    const fileName = ReturnFileName();
    const downloadFile = new File([blob], fileName);
    const url = URL.createObjectURL(downloadFile)
    chrome.tabs.create({ url: url });

  }

}


