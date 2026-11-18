# X Video Downloader — PWA

PWA estática para GitHub Pages y API Python independiente. Úsala únicamente para vídeos que tengas derecho a descargar. No elude contenido privado, controles de acceso ni restricciones de X.

## 1. Publicar la PWA en GitHub Pages

1. Crea un repositorio GitHub, por ejemplo `x-video-downloader`.
2. Sube `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icons/` y `.nojekyll`.
3. En **Settings → Pages**, selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
4. Espera a que GitHub publique la web.

## 2. Desplegar la API

La API necesita Python y yt-dlp; GitHub Pages no puede ejecutarlos.

1. Crea un servicio web en Render conectado al repositorio.
2. Indica como directorio raíz la carpeta donde está `server.py` (si está en la raíz, déjalo vacío).
3. Render puede detectar `render.yaml`; alternativamente:
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn server:app --bind 0.0.0.0:$PORT --timeout 180`
4. Cuando tengas la URL HTTPS del servicio, copia esa dirección.

## 3. Conectar la PWA con la API

Abre `app.js` y sustituye:

```js
const API_BASE = "https://CAMBIA-ESTA-URL-POR-TU-BACKEND";
```

por la URL real de tu servicio Render, por ejemplo:

```js
const API_BASE = "https://x-video-downloader-api.onrender.com";
```

Guarda y sube el cambio a GitHub. La PWA ya podrá llamar a la API.

## 4. Probar localmente la API

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

Comprueba `http://localhost:5000/health`.

## Notas y límites

- La PWA puede instalarse, pero la descarga requiere conexión a Internet y que la API esté disponible.
- La primera petición a un servicio gratuito puede tardar en arrancar.
- X puede cambiar su plataforma y romper temporalmente la extracción; actualiza yt-dlp si ocurre.
- El servidor tiene un límite configurable de tamaño (`MAX_FILE_MB`, por defecto 250 MB).
- Configura `ALLOWED_ORIGINS` con el dominio de tu GitHub Pages en producción, en lugar de `*`, por ejemplo `https://TU-USUARIO.github.io`.
- Para producción conviene añadir autenticación, límites de peticiones y limpieza programada de archivos temporales.
- Respeta los derechos de autor, las condiciones de X y la privacidad de las personas.
