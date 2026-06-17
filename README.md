# Conversor de Divisas

Sitio web estático que convierte montos entre más de 30 divisas usando tasas de cambio reales, con validación de formulario, manipulación del DOM, animaciones y un tablero de resultado tipo "split-flap" (como los antiguos tableros de aeropuerto).

Proyecto desarrollado para la actividad individual: **Conversor de Divisas con API, validación, animaciones y despliegue serverless en Azure Blob Storage**.

## Estructura del proyecto

```
conversor-divisas/
├── index.html              # Estructura de la página
├── css/
│   └── styles.css          # Estilos, tema visual y animaciones
├── js/
│   └── script.js           # Lógica: fetch a la API, validación, DOM, cálculos
├── env/
│   └── config.example.js   # Plantilla para una API key opcional
└── README.md
```

## Cómo funciona

1. Al cargar la página, `js/script.js` hace una petición `fetch` al endpoint **gratuito y sin API key** de ExchangeRate-API:
   `https://open.er-api.com/v6/latest/USD`
2. La API responde en **JSON** con las tasas de cambio de más de 160 monedas respecto al dólar (`USD`).
3. El script construye dinámicamente (manipulación del DOM) las listas desplegables `De` / `A` con esas monedas.
4. Al enviar el formulario, se valida la cantidad ingresada y se calcula la conversión por tasa cruzada:
   `monto_en_USD = monto / tasa[origen]` → `resultado = monto_en_USD * tasa[destino]`.
5. El resultado se muestra en un tablero de fichas giratorias animado con CSS (`@keyframes flip-down`), y la conversión se agrega al historial con una animación de entrada/salida.
6. El historial se guarda en `localStorage` del navegador, así que persiste entre visitas (si el navegador no lo permite, simplemente funciona solo durante la sesión, sin romper la app).

### Requisitos cubiertos

| Requerimiento | Dónde está implementado |
|---|---|
| Validación de formularios | `validateForm()` en `script.js`: cantidad vacía, no numérica, negativa o cero, y tasas no cargadas. Mensajes de error inline con `aria-live`. |
| Manipulación del DOM | Construcción dinámica de `<select>`, tablero de fichas, lista de historial, estado de carga/conexión. |
| Cálculos | `convert()` — conversión por tasa cruzada usando los datos reales de la API. |
| Animación | Tablero "split-flap" (`flip-down`), spinner en el botón, transiciones de error, entrada/salida de elementos del historial, pulso del indicador de estado. |
| Uso de APIs | `fetch()` a ExchangeRate-API (`open.er-api.com`), con manejo de errores y reintento manual. |
| Uso de JSON | La respuesta de la API se consume con `response.json()` y se recorre como objeto JavaScript. |
| Despliegue serverless | Sitio 100% estático (sin backend) listo para Azure Blob Storage (ver abajo). |

## Cómo ejecutarlo localmente

No requiere instalación de dependencias ni build. Basta con servir los archivos estáticos:

**Opción A — Abrir directamente:**
Abre `index.html` con doble clic en tu navegador. (Algunos navegadores bloquean `fetch` en `file://`; si eso ocurre, usa la opción B).

**Opción B — Servidor local simple:**
```bash
# Con Python ya instalado
cd conversor-divisas
python -m http.server 8080
# Luego abre http://localhost:8080
```

**Opción C — Extensión "Live Server" de VS Code.**

## Uso de una API key (opcional)

La app funciona sin ninguna key. Si más adelante quieres usar el plan con API key de ExchangeRate-API en lugar del endpoint abierto, sigue las instrucciones dentro de `env/config.example.js`. En resumen: cópialo a `js/config.js`, coloca tu key, cárgalo antes de `script.js` en `index.html`, y no lo subas a un repositorio público.

## Despliegue en Azure Blob Storage

Azure Blob Storage permite alojar un sitio web puramente estático (HTML/CSS/JS) sin ningún servidor backend, ideal para este proyecto.

### 1. Crear la cuenta de almacenamiento

1. Entra al [Portal de Azure](https://portal.azure.com).
2. Busca **"Storage accounts"** → **Create**.
3. Completa Resource Group, Storage account name (único globalmente) y Region.
4. En **Redundancy** puedes dejar `LRS` (la opción más económica) y crear la cuenta.

### 2. Habilitar el alojamiento de sitio web estático

1. Dentro de la cuenta de almacenamiento creada, ve a **Data management → Static website**.
2. Cambia el estado a **Enabled**.
3. En **Index document name** escribe `index.html`.
4. En **Error document path** escribe `index.html` (o crea una página 404 si prefieres).
5. Guarda. Azure generará automáticamente un contenedor especial llamado `$web` y te mostrará la **Primary endpoint** (esa es la URL pública de tu sitio).

### 3. Subir los archivos al contenedor `$web`

**Opción A — Portal:**
1. Ve a **Data storage → Containers → $web**.
2. Sube `index.html` en la raíz, y luego crea/sube las carpetas `css/` y `js/` con sus respectivos archivos (arrastrando la carpeta completa también funciona).

**Opción B — Azure CLI** (más rápido si vas a repetir el despliegue):
```bash
az storage blob upload-batch \
  --account-name <NOMBRE_DE_TU_CUENTA> \
  --destination '$web' \
  --source ./conversor-divisas \
  --auth-mode key
```

### 4. Acceder al sitio

Copia la **Primary endpoint** desde **Static website** (algo similar a `https://<cuenta>.z13.web.core.windows.net/`) y ábrela en el navegador. Ese es el enlace que debes entregar como "Despliegue en Azure".

> Nota: no es necesario configurar CORS para este proyecto porque el sitio solo hace peticiones `fetch` salientes hacia la API pública; no recibe peticiones entrantes de otros orígenes.

## Repositorio de GitHub

Sube esta carpeta completa (`index.html`, `css/`, `js/`, `env/`, este `README.md`) a un repositorio público o privado de GitHub, y comparte el enlace junto con la URL de Azure y el video de presentación.

## Créditos

Datos de tasas de cambio proporcionados por [ExchangeRate-API](https://www.exchangerate-api.com/) a través de su endpoint abierto `open.er-api.com`. Tipografías: Fraunces, Space Grotesk y JetBrains Mono (Google Fonts).
