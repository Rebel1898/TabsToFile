
async function obtenerPreferenciaArchivo() {
  try {
    const data = await browser.storage.sync.get("prefs");
    storedPreference = data.prefs.outputFile || detectarSOyDevolverOpcion();
    return storedPreference;
  } catch (error) {
    console.error("Error al obtener preferencia:", error);
    return ".URL";
  }
}

async function obtenerPreferenciaMultiWindows() {
  try {
    const data = await browser.storage.sync.get("prefs");
    return data.prefs.multipleWindows;
  } catch (error) {
    console.error("Error al obtener preferencia:", error);
    return false;
  }
}

let tabArray = [];
let codigo = `      
browser.runtime.sendMessage({
    url: window.location.href,
    title: document.title,
    html: document.documentElement.outerHTML
    });
`;
const promesas = [];
browser.browserAction.onClicked.addListener(async (tab) => {
  try {
    const preferencia = await obtenerPreferenciaArchivo();
    const MultiWindows = await obtenerPreferenciaMultiWindows();
    const all_tabs = await browser.tabs.query({ currentWindow: !MultiWindows });

    for (const tab of all_tabs) {
      try {
        await browser.tabs.executeScript(tab.id, {
          code: codigo,
        });
      } catch (e) {
        // console.warn(`Error inyectando código en pestaña ${tab.url}:`, e);
      }
    }

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
  const MM = String(ahora.getMonth() + 1).padStart(2, '0'); 
  const yyyy = ahora.getFullYear();
  const HH = String(ahora.getHours()).padStart(2, '0');
  const mm = String(ahora.getMinutes()).padStart(2, '0');
  return cadena + `${dd}.${MM}.${yyyy}_${HH}.${mm}` + extension;
}

function GenerateText(cadena, title, preferencia) {
  var text = "[InternetShortcut]\nURL=" + cadena + "\nIDList= \nHotKey=0 \nIconFile=peperoni \nIconIndex=0";
  if (preferencia == ".webloc")
    text = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>URL</key><string>${cadena}</string></dict></plist>`;
  else if (preferencia == ".desktop")
    text = "[Desktop Entry]\nVersion=1.0\nType=Link\nName=" + title + "\nComment=Acceso directo a una web\nIcon=text-html\nURL=" + cadena;
  return text;
}


function GeneratePDF(htmlContent) {
  const container = document.createElement('div');
  container.id = 'contenido';
  container.style.width = '210mm';
  container.style.background = '#fff';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';

  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  setTimeout(() => {
    html2pdf().from(container).set({
      margin: 10,
      filename: 'pagina.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save().then(() => {
      document.body.removeChild(container);
    });
  }, 500);
}

async function obtenerDatosDeTodasLasPestanas() {
  const tabs = await browser.tabs.query({ currentWindow: true });

  const promesas = tabs.map(tab =>
    browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        url: window.location.href,
        title: document.title,
        html: document.documentElement.outerHTML
      }),
    })
      .then(results => results[0].result)
      .catch(error => {
        console.warn(`Error en tab ${tab.id}: ${error.message}`);
        return null;
      })
  );

  const resultados = await Promise.allSettled(promesas);
  return resultados
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
}

async function obtenerHTMLDeTodasLasPestanasEsperando() {
  const all_tabs = await browser.tabs.query({ currentWindow: true });
  const resultados = [];
  for (const tab of all_tabs) {
    if (!tab.url.startsWith('http')) continue;
    try {
      const [html] = await browser.tabs.executeScript(tab.id, {
        code: `document.documentElement.outerHTML;`,
      });

      

      resultados.push({
        title: tab.title,
        url: tab.url,
        html,
      });
    } catch (e) {
      console.warn(`❌ Error al obtener HTML de ${tab.url}:`, e);
    }
  }
  return resultados;
}

function obtenerHTMLDePestana() {
  return new Promise((resolve) => {
    browser.runtime.onMessage.addListener((message) => {
      tabArray.push({
        title: message.title,
        url: message.url,
        text: message.html
      });
      resolve(tabArray);
    });
  });
}


function extraerBaseDoc(doc, hostUrl) {
  var base = doc.querySelectorAll("base");
  if (base.length == 0) {
    const url = new URL(hostUrl);
    return url.origin;
  }


  else
    return base[0].getAttribute("href");
}

function obtenerDirectorioSuperior(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const pathDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return urlObj.origin + pathDir;
  } catch (e) {
    console.error("URL inválida:", url);
    return null;
  }
}


function normalizarURL(url, doc, hostUrl) {

  if (url === null)
    return [];
  if (url.startsWith('//')) return ['https:' + url];
  else if (url.startsWith('http://') || url.startsWith('https://')) return [url];
  else if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/.*)?$/i.test(url)) return ["https://" + url];
  else {
    const rutaDesdeHotst = (extraerBaseDoc(doc, hostUrl) + "/" + url).replaceAll("//", "/");
    const rutaActualFolder = (obtenerDirectorioSuperior(hostUrl) + "/" + url).replaceAll("//", "/");

    return [rutaDesdeHotst, rutaActualFolder];
  }
}

function pulirSrcSet(srcset) {
  const items = srcset.split(',');
  const urls = [];
  for (let item of items) {
    item = item.trim();
    const match = item.match(/(.+)\s+(\d+(?:\.\d+)?[wx])$/);

    if (match) {
      let url = match[1].trim();
      urls.push(url);
    }
  }
  return urls.join(', ');
}

function procesarElemento(elementos, doc, url, title, atributo) {
  elementos.forEach(element => {
    const urlNormal = normalizarURL(element.getAttribute(atributo), doc, url);

    urlNormal.forEach(srcOriginal => {
      if (srcOriginal != "") {
        let rutaLocal = obtenerRutaLocal(srcOriginal, url, title);
        const promesa = descargarRecursoAdjunto(srcOriginal, rutaLocal, rutaLocal, element, atributo, doc);
        promesas.push(promesa);
      }
    });
  });
}

async function reemplazaryDescargarElementos(html, files, url, title) {

  var result = {}
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const imagenes = doc.querySelectorAll("img");
  const elementosSrc = doc.querySelectorAll("script", "audio", "video", "source", "embed", "iframe");
  const elementosData = doc.querySelectorAll("object")
  const estilos = doc.querySelectorAll('link[rel="stylesheet"]');
  const frames = doc.querySelectorAll("iframes");

  procesarElemento(elementosData, doc, url, title, "data");
  procesarElemento(elementosSrc, doc, url, title, "src");
  procesarElemento(estilos, doc, url, title, "href");
  procesarElemento(imagenes, doc, url, title, "src");
  procesarElemento(imagenes, doc, url, title, "srcset");

  //contenido dentro de iframe?


  imagenes.forEach(img => {

    img.removeAttribute("srcset");
    // const urlNormal = normalizarURL(img.getAttribute("srcset"), doc, url);
    // urlNormal.forEach(srcSet => {

    //   if (srcSet != "") {
    //     let rutaLocal = obtenerRutaLocal(srcSet, url, title);
    //     let rutaPulida = pulirSrcSet(rutaLocal);
    //     let srcSetPulido = pulirSrcSet(srcSet);

    //     const promesa = descargarRecursoAdjunto(srcSetPulido, rutaLocal, rutaPulida, img, "srcset");
    //     promesas.push(promesa);
    //   }
    // })
  });

  const resultados = await Promise.allSettled(promesas);

  for (const resultado of resultados) {
    var nombreArchivo = resultado.value.nombreArchivo;
    var element = resultado.value.elemento;
    var atributo = resultado.value.atributo;
    var contenido = resultado.value.contenido;
    var rutaLocalTag = resultado.value.valorTag

    if (nombreArchivo && nombreArchivo !== "") {
      element.setAttribute(atributo, rutaLocalTag);

      if (element.tagName.toLowerCase() == "img") {
        var img = element;
        const lazyAttrs = ['data-src', 'data-lazy-src', 'data-original'];
        lazyAttrs.forEach(attr => {
          if (img.hasAttribute(attr)) {
            img.setAttribute(attr, rutaLocalTag);
          }
        });
      }
      files[nombreArchivo] = contenido;
    }


  }
  result.files = files;
  result.text = doc.documentElement.outerHTML;
  return result;
}

function reemplazarExtensionPorCss(url, contentType) {
  if (contentType && contentType.includes("text/css")) {
    const [baseUrl, query] = url.split("?");
    const nuevaBaseUrl = baseUrl.replace(/\.[^/.]+$/, ".css");
    return query ? `${nuevaBaseUrl}?${query}` : nuevaBaseUrl;
  }
  return url;
}


async function descargarRecursoAdjunto(valorAtributo, rutaLocalTag, rutaLocalZip, elemento, attr, doc) {
  let resultado = {};
  try {
    const response = await fetch(valorAtributo,
      {
        method: "GET",
        headers: {
          "User-Agent": navigator.userAgent,
          "Accept": "*/*",
          "Referer": new URL(valorAtributo).origin
        }
      });

    if (response.status != 200)
      throw new Error("Código " + response.status);
    const contentType = response.headers.get("content-type");
    let arrayBuffer, imageData;

    if (!contentType.includes("text/css")) {
      arrayBuffer = await response.arrayBuffer();
      imageData = new Uint8Array(arrayBuffer);
    }
    else if (contentType.includes("text/css")) {
      let cssText = await response.text();
      const encoder = new TextEncoder();
      imageData = encoder.encode(cssText);
      rutaLocalTag = reemplazarExtensionPorCss(rutaLocalTag, contentType);
      rutaLocalZip = reemplazarExtensionPorCss(rutaLocalZip, contentType);

    }
    resultado.valorTag = rutaLocalTag
    resultado.nombreArchivo = rutaLocalZip;
    resultado.contenido = imageData;
    resultado.elemento = elemento;
    resultado.atributo = attr;
    resultado.ok = true;
    return resultado

  }
  catch (e) {
    // console.error(`Error descargando ${valorAtributo}:`, e);
    return {
      nombreArchivo: "",
      atributo: null,
      contenido: null,
      elemento: null,
      ok: false
    };
  }

}


function getAllCSSRules() {
  let cssRules = '';
  for (let sheet of document.styleSheets) {
    try {
      for (let rule of sheet.cssRules) {
        cssRules += rule.cssText + '\n';
      }
      return cssRules;
    } catch (e) {
      console.warn("No se pudo acceder a una hoja de estilos:", sheet.href);
    }

  }
}
function fnv1aHash(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}



function obtenerRutaLocal(srcOriginal, url, title) {

  title = title.replaceAll(/[\\/?:*"#<>|,]/g, " ");
  let baseName = `${title}_files/${srcOriginal.split('?')[0].split('#')[0].split('/').filter(Boolean).pop() || "file.bin"}`;
  let name;

  if (!baseName || baseName === "" || baseName === "/" || srcOriginal.startsWith("data:")) {
    baseName = fnv1aHash(srcOriginal).replace(/[\\/?:*"<>|#]/g, "");
    name = `${title}_files/${baseName}`;
  }
  else {

    let src = new URL(srcOriginal, url);
    name = `${title}_files/${src.pathname.split('/').pop().replace(/[\\/?:*"<>|#]/g, "")}`;
  }
  return decodeURIComponent(name);
}

async function GenerateZipfile(tabs, preferencia) {
  var files = {};
  if (preferencia.includes(".HTML")) {
    var tabsHTML = await obtenerHTMLDeTodasLasPestanasEsperando(tabs.length);
    tabs = tabsHTML
  }

  if (tabs.length > 0) {
    var descargarExtras = false;
    if (preferencia == ".HTML2") {
      descargarExtras = true;
      preferencia = ".HTML"
    }

    for (var c = 0; c < tabs.length; c++) {
      var title = tabs[c].title + preferencia.toLowerCase();
      var name = title.replaceAll(/[\\/]/g, "-");

      if (preferencia == ".HTML") {
        var text = tabs[c].html;
        if (descargarExtras) {
          var resultado = await reemplazaryDescargarElementos(tabs[c].html, files, tabs[c].url, tabs[c].title);
          text = resultado.text;
          files = resultado.files;
        }
        text = text.replace(/\n/g, "\r\n");
        files[name] = fflate.strToU8(text);
      }
      else {
        var text = GenerateText(tabs[c].url, title, preferencia)
        text = text.replaceAll(/\n/g, "\r\n");
        files[name] = fflate.strToU8(text);
      }
    }
    const zipContent = fflate.zipSync(files);
    const blob = new Blob([zipContent], { type: "application/zip" });
    const fileName = ReturnFileName();
    const downloadFile = new File([blob], fileName);
    const url = URL.createObjectURL(downloadFile)
    
    chrome.tabs.create({ url: url });


  }
}


