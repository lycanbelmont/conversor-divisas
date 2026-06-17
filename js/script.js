/* ============================================================
   CONVERSOR DE DIVISAS — script.js
   - Integración con API gratuita de tasas de cambio (JSON)
   - Validación de formulario
   - Manipulación del DOM (selects, tablero, historial)
   - Animaciones (flip board, transiciones, spinner)
   ============================================================ */

(() => {
  "use strict";

  /* ----------------------------------------------------------
   * 1. CONFIGURACIÓN DE LA API
   * ------------------------------------------------------------
   * Por defecto usamos el endpoint ABIERTO y GRATUITO de
   * ExchangeRate-API (https://www.exchangerate-api.com/), que no
   * requiere API key: https://open.er-api.com/v6/latest/<BASE>
   *
   * Si más adelante quieres usar el plan con API key
   * (https://v6.exchangerate-api.com/v6/<KEY>/latest/<BASE>),
   * copia env/config.example.js a js/config.js, coloca tu key
   * y carga ese script ANTES de script.js en index.html.
   * Si window.APP_CONFIG.EXCHANGE_API_KEY existe, se usará
   * automáticamente.
   * ---------------------------------------------------------- */
  const OPEN_ENDPOINT = "https://open.er-api.com/v6/latest/";
  const KEYED_ENDPOINT = "https://v6.exchangerate-api.com/v6/";
  const BASE_CURRENCY = "USD";

  function buildRatesUrl() {
    const key = window.APP_CONFIG && window.APP_CONFIG.EXCHANGE_API_KEY;
    return key
      ? `${KEYED_ENDPOINT}${key}/latest/${BASE_CURRENCY}`
      : `${OPEN_ENDPOINT}${BASE_CURRENCY}`;
  }

  /* Nombres legibles para las divisas más usadas; el resto se
     muestra solo con su código ISO. */
  const CURRENCY_NAMES = {
    USD: "Dólar estadounidense", EUR: "Euro", GBP: "Libra esterlina",
    JPY: "Yen japonés", MXN: "Peso mexicano", CAD: "Dólar canadiense",
    AUD: "Dólar australiano", CHF: "Franco suizo", CNY: "Yuan chino",
    BRL: "Real brasileño", ARS: "Peso argentino", CLP: "Peso chileno",
    COP: "Peso colombiano", PEN: "Sol peruano", UYU: "Peso uruguayo",
    BOB: "Boliviano", PYG: "Guaraní paraguayo", VES: "Bolívar venezolano",
    GTQ: "Quetzal guatemalteco", HNL: "Lempira hondureño", CRC: "Colón costarricense",
    PAB: "Balboa panameño", DOP: "Peso dominicano", INR: "Rupia india",
    KRW: "Won surcoreano", SEK: "Corona sueca", NOK: "Corona noruega",
    NZD: "Dólar neozelandés", SGD: "Dólar singapurense", HKD: "Dólar de Hong Kong",
    ZAR: "Rand sudafricano", TRY: "Lira turca", RUB: "Rublo ruso",
    AED: "Dirham de EAU",
  };

  /* ----------------------------------------------------------
   * 2. REFERENCIAS AL DOM
   * ---------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);

  const form = $("converter-form");
  const amountInput = $("amount");
  const amountError = $("amount-error");
  const formError = $("form-error");
  const fromSelect = $("from-currency");
  const toSelect = $("to-currency");
  const swapBtn = $("swap-btn");
  const convertBtn = $("convert-btn");
  const statusDot = $("status-dot");
  const statusText = $("status-text");
  const lastUpdated = $("last-updated");
  const flipboard = $("flipboard");
  const resultCurrency = $("result-currency");
  const rateLine = $("rate-line");
  const historyList = $("history-list");
  const historyEmpty = $("history-empty");
  const clearHistoryBtn = $("clear-history");

  /* ----------------------------------------------------------
   * 3. ESTADO DE LA APLICACIÓN
   * ---------------------------------------------------------- */
  let ratesData = null;       // { base, rates: { XXX: number, ... } }
  let historyItems = loadHistory();

  /* ----------------------------------------------------------
   * 4. PERSISTENCIA SIMPLE DEL HISTORIAL (con respaldo en memoria)
   * ---------------------------------------------------------- */
  const STORAGE_KEY = "conversor-divisas:historial";

  function loadHistory() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_err) {
      return [];
    }
  }

  function saveHistory() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(historyItems));
    } catch (_err) {
      /* Si el almacenamiento no está disponible, el historial
         simplemente vive solo durante esta sesión. */
    }
  }

  /* ----------------------------------------------------------
   * 5. CARGA DE TASAS DE CAMBIO (USO DE API + JSON)
   * ---------------------------------------------------------- */
  async function loadRates() {
    setStatus("loading", "Conectando con el mercado…");
    disableForm(true);

    try {
      const response = await fetch(buildRatesUrl());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json(); // <-- consumo de JSON
      if (data.result === "error" || !data.rates) {
        throw new Error(data["error-type"] || "Respuesta inválida de la API");
      }

      ratesData = { base: data.base_code || BASE_CURRENCY, rates: data.rates };
      populateCurrencySelects(ratesData.rates);
      disableForm(false);

      const updated = data.time_last_update_utc
        ? new Date(data.time_last_update_utc)
        : new Date();
      setStatus("live", "Tasas en vivo");
      lastUpdated.textContent = `Última actualización: ${updated.toLocaleString("es-ES")}`;
    } catch (err) {
      console.error("Error al obtener tasas de cambio:", err);
      setStatus("error", "No se pudo conectar con el proveedor de tasas");
      formError.textContent = "No fue posible cargar las tasas de cambio. Verifica tu conexión e inténtalo de nuevo.";
      formError.classList.add("show");
    }
  }

  function setStatus(kind, text) {
    statusDot.classList.remove("live", "error");
    if (kind === "live") statusDot.classList.add("live");
    if (kind === "error") statusDot.classList.add("error");
    statusText.textContent = text;
  }

  function disableForm(disabled) {
    fromSelect.disabled = disabled;
    toSelect.disabled = disabled;
    convertBtn.disabled = disabled;
  }

  /* ----------------------------------------------------------
   * 6. MANIPULACIÓN DEL DOM: construir los <select> dinámicamente
   * ---------------------------------------------------------- */
  function populateCurrencySelects(rates) {
    const codes = Object.keys(rates).sort();

    const buildOptions = () =>
      codes
        .map((code) => {
          const name = CURRENCY_NAMES[code];
          const label = name ? `${code} — ${name}` : code;
          return `<option value="${code}">${label}</option>`;
        })
        .join("");

    fromSelect.innerHTML = buildOptions();
    toSelect.innerHTML = buildOptions();

    fromSelect.value = codes.includes(BASE_CURRENCY) ? BASE_CURRENCY : codes[0];
    const secondary = codes.find((c) => c !== fromSelect.value);
    toSelect.value = secondary || codes[0];
  }

  /* ----------------------------------------------------------
   * 7. VALIDACIÓN DEL FORMULARIO
   * ---------------------------------------------------------- */
  function parseAmount(raw) {
    // Acepta "1.234,56" o "1234.56" normalizando a punto decimal.
    const cleaned = raw.trim().replace(/\s/g, "");
    if (cleaned === "") return NaN;
    const normalized = cleaned.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    return Number(normalized);
  }

  function validateForm() {
    let valid = true;

    const rawAmount = amountInput.value;
    const amount = parseAmount(rawAmount);

    clearFieldError(amountInput, amountError);
    formError.classList.remove("show");
    formError.textContent = "";

    if (rawAmount.trim() === "") {
      showFieldError(amountInput, amountError, "Ingresa una cantidad.");
      valid = false;
    } else if (Number.isNaN(amount)) {
      showFieldError(amountInput, amountError, "Ingresa solo números, por ejemplo 250.50.");
      valid = false;
    } else if (amount <= 0) {
      showFieldError(amountInput, amountError, "La cantidad debe ser mayor que cero.");
      valid = false;
    } else if (amount > 1_000_000_000) {
      showFieldError(amountInput, amountError, "Ingresa una cantidad razonable.");
      valid = false;
    }

    if (!ratesData) {
      formError.textContent = "Las tasas de cambio aún no están disponibles.";
      formError.classList.add("show");
      valid = false;
    }

    return { valid, amount };
  }

  function showFieldError(input, errorEl, message) {
    input.classList.add("invalid");
    errorEl.textContent = message;
    errorEl.classList.add("show");
  }

  function clearFieldError(input, errorEl) {
    input.classList.remove("invalid");
    errorEl.classList.remove("show");
    errorEl.textContent = "";
  }

  amountInput.addEventListener("input", () => clearFieldError(amountInput, amountError));

  /* ----------------------------------------------------------
   * 8. CÁLCULO DE LA CONVERSIÓN
   * ---------------------------------------------------------- */
  function convert(amount, fromCode, toCode, rates) {
    // rates están expresadas como "1 BASE = rates[XXX] XXX"
    const fromRate = rates[fromCode];
    const toRate = rates[toCode];
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  }

  function formatNumber(value) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /* ----------------------------------------------------------
   * 9. ANIMACIÓN — TABLERO DE FICHAS GIRATORIAS (signature)
   * ---------------------------------------------------------- */
  function renderFlipboard(text) {
    const chars = text.split("");
    const existing = flipboard.querySelectorAll(".flip-card");

    // Si el largo cambia, reconstruimos las tarjetas necesarias.
    if (existing.length !== chars.length) {
      flipboard.innerHTML = chars
        .map(() => `<div class="flip-card"><div class="flip-face"></div></div>`)
        .join("");
    }

    const cards = flipboard.querySelectorAll(".flip-card");
    chars.forEach((char, i) => {
      const card = cards[i];
      const face = card.querySelector(".flip-face");
      const isSymbol = /[^0-9]/.test(char);
      card.classList.toggle("is-symbol", isSymbol);

      if (face.textContent === char) return; // sin cambio, sin animar

      card.classList.remove("flipping");
      // Forzar reflow para poder re-disparar la animación
      void card.offsetWidth;
      card.classList.add("flipping");

      window.setTimeout(() => {
        face.textContent = char;
      }, 250); // a la mitad del flip, cuando la cara está de canto

      card.addEventListener(
        "animationend",
        () => card.classList.remove("flipping"),
        { once: true }
      );
    });
  }

  /* ----------------------------------------------------------
   * 10. MANIPULACIÓN DEL DOM — HISTORIAL DE CONVERSIONES
   * ---------------------------------------------------------- */
  function renderHistory() {
    historyList.querySelectorAll(".history-item").forEach((el) => el.remove());
    historyEmpty.style.display = historyItems.length ? "none" : "block";

    historyItems.forEach((item) => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.dataset.id = item.id;
      li.innerHTML = `
        <div class="history-main">
          <b>${formatNumber(item.amount)} ${item.from}</b>
          <span class="arrow">→</span>
          <span class="result-amt">${formatNumber(item.result)} ${item.to}</span>
        </div>
        <div class="history-main">
          <span class="history-time">${item.time}</span>
          <button class="history-remove" aria-label="Eliminar esta conversión" data-id="${item.id}">✕</button>
        </div>
      `;
      historyList.appendChild(li);
    });
  }

  function addToHistory(entry) {
    historyItems.unshift(entry);
    historyItems = historyItems.slice(0, 8); // conservar solo las últimas 8
    saveHistory();
    renderHistory();
  }

  historyList.addEventListener("click", (event) => {
    const btn = event.target.closest(".history-remove");
    if (!btn) return;
    const id = btn.dataset.id;
    const li = btn.closest(".history-item");
    li.classList.add("leaving");
    li.addEventListener(
      "animationend",
      () => {
        historyItems = historyItems.filter((h) => String(h.id) !== id);
        saveHistory();
        renderHistory();
      },
      { once: true }
    );
  });

  clearHistoryBtn.addEventListener("click", () => {
    historyItems = [];
    saveHistory();
    renderHistory();
  });

  /* ----------------------------------------------------------
   * 11. ENVÍO DEL FORMULARIO
   * ---------------------------------------------------------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const { valid, amount } = validateForm();
    if (!valid) return;

    const fromCode = fromSelect.value;
    const toCode = toSelect.value;

    convertBtn.classList.add("loading");
    convertBtn.disabled = true;

    // Pequeño retraso deliberado para que el spinner y el flip
    // del tablero se perciban como un proceso, no un salto brusco.
    window.setTimeout(() => {
      const result = convert(amount, fromCode, toCode, ratesData.rates);
      const rate = ratesData.rates[toCode] / ratesData.rates[fromCode];

      renderFlipboard(formatNumber(result));
      resultCurrency.textContent = toCode;
      rateLine.textContent = `1 ${fromCode} = ${rate.toFixed(4)} ${toCode}`;

      addToHistory({
        id: Date.now(),
        amount,
        from: fromCode,
        to: toCode,
        result,
        time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      });

      convertBtn.classList.remove("loading");
      convertBtn.disabled = false;
    }, 380);
  });

  /* ----------------------------------------------------------
   * 12. INTERCAMBIAR MONEDAS
   * ---------------------------------------------------------- */
  swapBtn.addEventListener("click", () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;

    swapBtn.classList.add("spin");
    window.setTimeout(() => swapBtn.classList.remove("spin"), 350);

    if (ratesData && flipboard.children.length) {
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit"));
    }
  });

  /* ----------------------------------------------------------
   * 13. INICIO
   * ---------------------------------------------------------- */
  renderHistory();
  loadRates();
})();
