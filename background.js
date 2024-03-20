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

function downloadContent(name, content, id) {
  var file = new Blob([content], { type: 'application/octet-stream;' });
  file.name = name;
  return file;
}

function GenerateZipfile(tabs) {
  var atag = document.createElement("a");
  var zip = new JSZip();
  var path = "";
  var path_imagenes = ""
  var carpeta_imagenes = zip.folder(path_imagenes);
  var carpeta = zip.folder(path);

  if (tabs.length > 0) {
    for (var c = 0; c < tabs.length; c++) {
      console.log(tabs[c]);
      var mimeType = extractMimeType(tabs[c].favIconUrl);
      var imagenIcon = GetImage(tabs[c].favIconUrl, mimeType);
      console.log(mimeType);
      var imagenIcon_name = "";
      var extension ="";
      if (mimeType !== null && mimeType != undefined) {
          extension = mimeType.split("\/")[1];
        if (extension == "x-icon")
          extension = ".ico";
        if(extension == "svg+xml")
          extension = ".svg"

        console.log(extension);
        imagenIcon_name = imagenIcon_name.replace(/\\/g, "-");
        imagenIcon_name = imagenIcon_name.replace(/\//g, "-");

        imagenIcon_name = tabs[c].title + "." + extension;
        carpeta.file(imagenIcon_name, imagenIcon);

      }

      console.log(imagenIcon_name);


      var title = tabs[c].title + ".URL";

      var text = "[InternetShortcut]\nURL=" + tabs[c].url;

      if (imagenIcon_name != "")
        text = text + "\nIconFile=" + imagenIcon_name+ "\nIDList= \nHotKey=0 \nIconIndex=0";
      text = text.replace(/\n/g, "\r\n");

      var name = title.replace(/\\/g, "-");
      name = name.replace(/\//g, "-");



      var link = downloadContent(name, text);
      carpeta.file(name, link);

    }

    zip.generateAsync({
      type: "base64", compression: "DEFLATE",
      compressionOptions: {
        level: 9
      }
    })
      .then(function (content) {
        atag.href = "data:application/zip;base64," + content;
        atag.download = "Current Tabs";
        atag.click();
      });
  }
}



function extractMimeType(dataString) {
  if (dataString != undefined) {
    const regex = /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);/;
    const match = dataString.match(regex);
    return match ? match[1] : null;
  }
}


function base64ToBlob(base64, mimeType) {
  const byteString = atob(base64.split(',')[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mimeType });
}


function GetImage(favIconurl, mimeType) {

  if (favIconurl != undefined && favIconurl.includes("base64")) {

    return base64ToBlob(favIconurl, mimeType)


  }
  return "";

}