// Objetos visuales nativos de Power BI rehechos en HTML y SVG con el formato que guarda el informe (informe.json):
// contenedor (fondo, borde, radio, título, relleno), segmentador de botones, botón y gráfico de líneas.
// Los tamaños de letra de Power BI van en puntos: 1 pt = 4/3 px.
import { FORMAT, aFecha, esBlank } from "./formato.js";

export const PT = 4 / 3;
const LETRA = "'Segoe UI Variable Display', 'Segoe UI', 'Selawik', -apple-system, Arial, sans-serif";

/** Color con transparencia de Power BI (0 = opaco, 100 = invisible). */
export function color(hex, transparencia = 0) {
  if (!hex || typeof hex !== "string") return "transparent";
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${1 - (transparencia || 0) / 100})`;
}

/** Propiedades de un objeto de formato, opcionalmente para un estado («default», «selection:selected»…). */
export function props(objetos, nombre, estado = null) {
  const filas = (objetos || {})[nombre] || [];
  const base = filas.find((f) => !f.selector)?.properties || {};
  const def = filas.find((f) => f.selector?.id === "default")?.properties || {};
  if (!estado || estado === "default") return { ...base, ...def };
  const est = filas.find((f) => f.selector?.id === estado)?.properties;
  return est ? { ...base, ...def, ...est } : null;
}

/** Caja de un objeto visual con el formato del contenedor. Devuelve el elemento y el área útil (cuerpo). */
export function contenedor(v) {
  const c = v.contenedor || {};
  const el = document.createElement("div");
  el.className = "vis";
  el.dataset.nombre = v.nombre;
  const { x, y, width, height, z } = v.pos;
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`, zIndex: String(Math.round(z || 0)) });
  const fondo = props(c, "background");
  if (fondo.show) el.style.background = color(fondo.color, fondo.transparency);
  const borde = props(c, "border");
  let grosor = 0;
  if (borde.show) { grosor = 1; el.style.border = `1px solid ${color(borde.color || "#E1DFDD")}`; }
  if (borde.radius) el.style.borderRadius = `${borde.radius}px`;
  const pad = props(c, "padding");
  const relleno = { top: pad.top ?? 0, right: pad.right ?? 0, bottom: pad.bottom ?? 0, left: pad.left ?? 0 };
  let arriba = relleno.top;
  const tit = props(c, "title");
  if (tit.show && tit.text) {
    const t = document.createElement("div");
    t.className = "titulo";
    const tam = (tit.fontSize || 12) * PT;
    Object.assign(t.style, {
      left: `${relleno.left}px`, right: `${relleno.right}px`, top: `${relleno.top}px`, color: tit.fontColor || "#161616",
      font: `${tit.bold ? 600 : 400} ${tam}px/${Math.round(tam * 1.35)}px ${tit.fontFamily || LETRA}`, textAlign: tit.alignment || "left",
    });
    t.textContent = tit.text;
    el.appendChild(t);
    arriba += Math.round(tam * 1.35) + 4;
  }
  const cuerpo = document.createElement("div");
  cuerpo.className = "cuerpo";
  const ancho = width - 2 * grosor - relleno.left - relleno.right;
  const alto = height - 2 * grosor - arriba - relleno.bottom;
  Object.assign(cuerpo.style, { left: `${relleno.left}px`, top: `${arriba}px`, width: `${ancho}px`, height: `${alto}px` });
  el.appendChild(cuerpo);
  return { el, cuerpo, ancho, alto };
}

// ------------------------------------------------------------------------------------------- etiqueta emergente
const tip = () => document.getElementById("tooltip");
export function mostrarTooltip(contenido, clientX, clientY) {
  const t = tip();
  if (!contenido) { t.hidden = true; return; }
  if (typeof contenido === "string") t.innerHTML = `<div class="solo">${escapar(contenido)}</div>`;
  else {
    const filas = Object.entries(contenido).filter(([, v]) => !esBlank(v) && v !== "");
    t.innerHTML = `<table>${filas.map(([k, v]) => `<tr><td class="k">${escapar(k)}</td><td class="v">${escapar(v)}</td></tr>`).join("")}</table>`;
  }
  t.hidden = false;
  const r = t.getBoundingClientRect();
  let x = clientX + 14, y = clientY + 14;
  if (x + r.width > innerWidth - 6) x = clientX - r.width - 14;
  if (y + r.height > innerHeight - 6) y = clientY - r.height - 14;
  t.style.left = `${Math.max(6, x)}px`;
  t.style.top = `${Math.max(6, y)}px`;
}
export const ocultarTooltip = () => { tip().hidden = true; };
export const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// --------------------------------------------------------------------------------------- segmentador de botones
/**
 * Segmentador de botones (advancedSlicerVisual): una rejilla de pastillas con su formato por estado
 * (normal, elegida, encima). `valores` = [{ valor, texto }]; `alPulsar(valor)` decide la nueva selección.
 */
export function segmentador(v, cuerpo, alPulsar) {
  const o = v.objetos || {};
  const lay = props(o, "layout");
  const filas = lay.rowCount || 1, cols = lay.columnCount || 1, hueco = lay.cellPadding ?? 4;
  const radio = props(o, "shapeCustomRectangle").rectangleRoundedCurve ?? 0;
  const estilo = (estado) => {
    const fill = props(o, "fillCustom", estado), out = props(o, "outline", estado), val = props(o, "value", estado);
    return { fill, out, val };
  };
  const normal = estilo("default"), elegida = estilo("selection:selected") || normal, encima = estilo("interaction:hover");
  const rejilla = document.createElement("div");
  rejilla.className = "seg";
  Object.assign(rejilla.style, { gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${filas}, 1fr)`, gap: `${hueco}px` });
  cuerpo.appendChild(rejilla);

  const pintar = (b, e) => {
    const f = e.fill || normal.fill, out = e.out || normal.out, val = e.val || normal.val;
    b.style.background = f && f.show ? color(f.fillColor, f.transparency) : "transparent";
    b.style.border = out && out.show ? `${out.weight ?? 1}px solid ${color(out.lineColor, out.transparency)}` : "0";
    b.style.borderRadius = `${radio}px`;
    const mostrar = val && val.show !== false;
    b.style.color = mostrar ? val.fontColor || "#161616" : "transparent";
    b.style.font = `400 ${(val?.fontSize || 12) * PT}px ${val?.fontFamily || LETRA}`;
    b.style.justifyContent = { left: "flex-start", right: "flex-end" }[val?.horizontalAlignment] || "center";
  };

  let valoresActuales = [], seleccion = new Set();
  return {
    actualizar(valores, sel) {
      valoresActuales = valores;
      seleccion = sel;
      rejilla.replaceChildren();
      for (const { valor, texto } of valores.slice(0, lay.maxTiles || valores.length)) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = texto;
        b.title = "";
        const elegido = sel.has(valor);
        b.setAttribute("aria-pressed", String(elegido));
        pintar(b, elegido ? elegida : normal);
        if (!elegido && encima) {
          b.addEventListener("mouseenter", () => pintar(b, encima));
          b.addEventListener("mouseleave", () => pintar(b, normal));
        }
        b.addEventListener("click", () => alPulsar(valor));
        rejilla.appendChild(b);
      }
    },
  };
}

// ----------------------------------------------------------------------------------------------------- botón
export function boton(v, cuerpo, accion, texto) {
  const b = document.createElement("div");
  b.className = "boton";
  b.setAttribute("role", "button");
  b.tabIndex = 0;
  if (texto) b.setAttribute("aria-label", texto);
  Object.assign(b.style, { position: "absolute", inset: "0" });
  b.addEventListener("click", accion);
  b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); accion(); } });
  if (texto) {
    b.addEventListener("mousemove", (e) => mostrarTooltip(texto, e.clientX, e.clientY));
    b.addEventListener("mouseleave", ocultarTooltip);
  }
  cuerpo.appendChild(b);
  return b;
}

// --------------------------------------------------------------------------------------------- gráfico de líneas
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const SVG = "http://www.w3.org/2000/svg";
const nodo = (tag, attrs = {}, padre = null) => {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (padre) padre.appendChild(n);
  return n;
};

/** Valor en «mill. €» como lo escribe Power BI con unidades de millón y formato #,0 €, con los decimales justos. */
const millones = (v, dec = 0) => `${dec ? FORMAT(v / 1e6, dec === 1 ? "0.0" : "0.00", "es-ES") : FORMAT(v / 1e6, "#,0", "es-ES")} mill. €`;

/**
 * Gráfico de líneas con eje de fechas continuo (la curva del año). series = [{ nombre, color, valores: [{x, y}] }].
 * `alPulsar(x | null)` selecciona un día (o lo quita, al pulsar el mismo otra vez).
 */
export function lineas(v, cuerpo, alPulsar) {
  const o = v.objetos || {};
  const ejeY = props(o, "valueAxis"), ejeX = props(o, "categoryAxis"), ley = props(o, "legend");
  const grosor = props(o, "lineStyles").strokeWidth ?? 2;
  const tamY = (ejeY.fontSize || 8) * PT, tamX = (ejeX.fontSize || 8) * PT, tamL = (ley.fontSize || 8) * PT;
  const W = parseFloat(cuerpo.style.width), H = parseFloat(cuerpo.style.height);
  const svg = nodo("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, cuerpo);
  svg.style.display = "block";
  svg.style.cursor = "pointer";
  let estadoActual = null;

  function actualizar(series, seleccion) {
    estadoActual = { series, seleccion };
    svg.replaceChildren();
    const xs = series[0]?.valores.map((p) => p.x) || [];
    if (!xs.length) return;
    const ys = series.flatMap((s) => s.valores.map((p) => p.y)).filter((y) => !esBlank(y));
    if (!ys.length) return;                         // sin datos, Power BI deja el gráfico vacío
    const maxY = Math.max(0, ...ys);
    // Escala «bonita» con 2-3 marcas, como el eje automático de Power BI
    const paso = pasoBonito(maxY / 2);
    const tope = Math.max(paso, Math.ceil(maxY / paso) * paso);
    const marcas = [];
    for (let m = 0; m <= tope + 1e-6; m += paso) marcas.push(m);
    const altoLeyenda = ley.show === false ? 0 : Math.round(tamL * 1.6);
    const dec = paso / 1e6 >= 1 ? 0 : Math.min(2, Math.ceil(-Math.log10(paso / 1e6) - 1e-9));
    const anchoY = Math.max(...marcas.map((m) => medir(millones(m, dec), tamY))) + 8;
    const altoX = ejeX.show === false ? 0 : Math.round(tamX * 1.7);
    const x0 = anchoY, x1 = W - 4, y0 = altoLeyenda + 4, y1 = H - altoX;
    const sx = (x) => x0 + ((x - xs[0]) / (xs[xs.length - 1] - xs[0] || 1)) * (x1 - x0);
    const sy = (y) => y1 - (y / tope) * (y1 - y0);
    const fuente = ejeY.fontFamily || LETRA;
    // rejilla y etiquetas del eje Y
    for (const m of marcas) {
      if (ejeY.gridlineShow !== false) nodo("line", { x1: x0, x2: x1, y1: sy(m), y2: sy(m), stroke: ejeY.gridlineColor || "#E2E5DF", "stroke-width": 1, "stroke-dasharray": "1 3" }, svg);
      const t = nodo("text", { x: x0 - 6, y: sy(m), "text-anchor": "end", "dominant-baseline": "middle", fill: ejeY.labelColor || "#8A8F87", "font-size": tamY, "font-family": fuente }, svg);
      t.textContent = millones(m, dec);
    }
    // etiquetas del eje X: primer día de cada trimestre que cabe
    if (ejeX.show !== false) {
      const meses = xs.filter((x) => aFecha(x).getUTCDate() === 1);
      const cada = Math.max(1, Math.ceil(meses.length / Math.max(1, Math.floor((x1 - x0) / (medir("sept 2026", tamX) + 18)))));
      meses.forEach((x, i) => {
        if (i % cada) return;
        const f = aFecha(x);
        const t = nodo("text", { x: sx(x), y: H - 4, "text-anchor": "middle", fill: ejeX.labelColor || "#8A8F87", "font-size": tamX, "font-family": ejeX.fontFamily || LETRA }, svg);
        t.textContent = `${MESES_CORTOS[f.getUTCMonth()]} ${f.getUTCFullYear()}`;
      });
    }
    // leyenda arriba a la derecha
    if (ley.show !== false) {
      let x = x1;
      for (const s of [...series].reverse()) {
        const ancho = medir(s.nombre, tamL);
        x -= ancho;
        const t = nodo("text", { x, y: tamL, fill: ley.labelColor || "#3B3D3A", "font-size": tamL, "font-family": ley.fontFamily || LETRA }, svg);
        t.textContent = s.nombre;
        nodo("circle", { cx: x - 7, cy: tamL * 0.66, r: 4, fill: s.color }, svg);
        x -= 20;
      }
    }
    // líneas: Power BI no deja huecos en los días en blanco, une los puntos que hay
    const atenuar = !esBlank(seleccion);
    for (const s of series) {
      let d = "";
      for (const p of s.valores) {
        if (esBlank(p.y)) continue;
        d += `${d ? "L" : "M"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`;
      }
      nodo("path", { d, fill: "none", stroke: s.color, "stroke-width": grosor, "stroke-linejoin": "round", "stroke-linecap": "round", opacity: atenuar ? 0.4 : 1 }, svg);
    }
    if (atenuar) {
      for (const s of series) {
        const p = s.valores.find((q) => q.x === seleccion);
        if (p && !esBlank(p.y)) nodo("circle", { cx: sx(p.x), cy: sy(p.y), r: 4, fill: s.color, stroke: "#FFFFFF", "stroke-width": 1.5 }, svg);
      }
    }
    // zona sensible: el día más cercano al puntero
    const zona = nodo("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: "transparent" }, svg);
    const guia = nodo("line", { y1: y0, y2: y1, stroke: "#8A8F87", "stroke-width": 1, "stroke-dasharray": "2 2", visibility: "hidden" }, svg);
    const diaEn = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const local = pt.matrixTransform(svg.getScreenCTM().inverse());
      const x = xs[0] + ((local.x - x0) / (x1 - x0)) * (xs[xs.length - 1] - xs[0]);
      return xs.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
    };
    zona.addEventListener("mousemove", (e) => {
      const d = diaEn(e);
      guia.setAttribute("x1", sx(d)); guia.setAttribute("x2", sx(d)); guia.setAttribute("visibility", "visible");
      const info = { Fecha: FORMAT(d, "dd/mm") + "/" + aFecha(d).getUTCFullYear() };
      for (const s of series) { const p = s.valores.find((q) => q.x === d); info[s.nombre] = esBlank(p?.y) ? "" : FORMAT(p.y, "#,0", "es-ES") + " €"; }
      mostrarTooltip(info, e.clientX, e.clientY);
    });
    zona.addEventListener("mouseleave", () => { guia.setAttribute("visibility", "hidden"); ocultarTooltip(); });
    zona.addEventListener("click", (e) => { const d = diaEn(e); alPulsar(d === estadoActual.seleccion ? null : d); });
  }
  return { actualizar };
}

function pasoBonito(x) {
  if (x <= 0) return 1;
  const e = 10 ** Math.floor(Math.log10(x));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * e >= x) return m * e;
  return 10 * e;
}

let lienzoMedidas = null;
export function medir(texto, tamPx, familia = LETRA, peso = 400) {
  lienzoMedidas ??= document.createElement("canvas").getContext("2d");
  lienzoMedidas.font = `${peso} ${tamPx}px ${familia}`;
  return lienzoMedidas.measureText(texto).width;
}
