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
  var carpeta = zip.folder(path);

  if (tabs.length > 0) {
    for (var c = 0; c < tabs.length; c++) {
      var title = tabs[c].title + ".URL";
      var text = "[InternetShortcut]\nURL=" + tabs[c].url + "\nIDList= \nHotKey=0 \nIconFile=peperoni \nIconIndex=0";
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