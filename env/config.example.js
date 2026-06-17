/**
 * env/config.example.js
 * ---------------------------------------------------------------
 * Esta app funciona "lista para usar" sin ninguna API key, porque
 * por defecto consulta el endpoint ABIERTO y GRATUITO de
 * ExchangeRate-API: https://open.er-api.com/v6/latest/USD
 *
 * Si en algún momento quieres usar tu propia API key del plan
 * "v6" de https://www.exchangerate-api.com/ (por ejemplo para
 * tener más solicitudes por mes o monedas adicionales), sigue
 * estos pasos:
 *
 *   1. Copia este archivo a:  js/config.js
 *   2. Reemplaza el valor de EXCHANGE_API_KEY con tu key real.
 *   3. En index.html, agrega esta línea ANTES de <script src="js/script.js">:
 *        <script src="js/config.js"></script>
 *   4. NO subas js/config.js (con tu key real) a un repositorio
 *      público. Agrega "js/config.js" a tu .gitignore.
 *
 * IMPORTANTE — limitación de los sitios estáticos:
 * Un sitio alojado en Azure Blob Storage es 100% archivos estáticos
 * (HTML/CSS/JS) servidos directamente al navegador. Cualquier valor
 * que pongas aquí viajará al cliente y será visible para quien
 * inspeccione el código fuente. Por eso, para esta actividad se
 * recomienda usar el endpoint abierto (sin key). Si un proyecto
 * real necesitara ocultar una key por completo, la solución
 * correcta sería una función serverless (p. ej. Azure Functions)
 * que actúe como intermediaria entre el sitio y la API.
 */

window.APP_CONFIG = {
  EXCHANGE_API_KEY: "", // pega aquí tu API key si decides usarla
};
