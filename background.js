browser.browserAction.onClicked.addListener((tab) => {
  var all_tabs = browser.tabs.query({ currentWindow: true }).then(logTabs, onError);
  all_tabs.then((val) => GenerateZipfile(val), onError);
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


function GenerateZipfile(tabs) {
  const files = {};
  if (tabs.length > 0) {
    for (var c = 0; c < tabs.length; c++) {
      var title = tabs[c].title + ".URL";
      var text = "[InternetShortcut]\nURL=" + tabs[c].url + "\nIDList= \nHotKey=0 \nIconFile=peperoni \nIconIndex=0";
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


