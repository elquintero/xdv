/*
 * Configura API_BASE con la URL HTTPS del backend desplegado.
 * Ejemplo: https://tu-servicio.onrender.com
 */
const API_BASE = "https://xdv.onrender.com";

const urlInput = document.getElementById("videoUrl");
const downloadBtn = document.getElementById("downloadBtn");
const buttonText = document.getElementById("buttonText");
const statusEl = document.getElementById("status");
const progress = document.getElementById("progress");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function isXUrl(value) {
  try {
    const u = new URL(value);
    return ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(u.hostname.toLowerCase())
      && /^\/[^/]+\/status\/\d+/.test(u.pathname);
  } catch { return false; }
}

document.getElementById("pasteBtn").addEventListener("click", async () => {
  try {
    urlInput.value = await navigator.clipboard.readText();
    setStatus("Enlace pegado. Ya puedes descargarlo.");
  } catch {
    urlInput.focus();
    setStatus("No se pudo acceder al portapapeles. Pega el enlace manualmente.");
  }
});

downloadBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!isXUrl(url)) {
    setStatus("Introduce un enlace válido de una publicación de X.", "error");
    urlInput.focus();
    return;
  }
  if (API_BASE.includes("CAMBIA-ESTA-URL")) {
    setStatus("Falta configurar la URL del servidor en app.js. Consulta README.md.", "error");
    return;
  }

  downloadBtn.disabled = true;
  buttonText.textContent = "Procesando…";
  progress.hidden = false;
  setStatus("Solicitando el vídeo al servidor…");

  try {
    const response = await fetch(`${API_BASE.replace(/\/$/, "")}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      let message = "No se pudo obtener el vídeo.";
      try { message = (await response.json()).error || message; } catch {}
      throw new Error(message);
    }

    const blob = await response.blob();
    if (!blob.size || !blob.type.startsWith("video/")) {
      throw new Error("El servidor no devolvió un archivo de vídeo válido.");
    }

    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : "video-x.mp4";
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    setStatus("Descarga iniciada correctamente.", "success");
  } catch (error) {
    setStatus(error.message || "Error de conexión con el servidor.", "error");
  } finally {
    downloadBtn.disabled = false;
    buttonText.textContent = "Descargar vídeo";
    progress.hidden = true;
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
