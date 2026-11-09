// Versión web del informe «Torre de control»: monta cada página a partir de informe.json (lo que guarda Power BI),
// calcula cada objeto visual con el modelo en JavaScript y reproduce segmentadores, botones, marcadores y selecciones.
import { con, crearModelo, filtros } from "./modelo.js";
import { crearMedidasHtml } from "./medidas_html.js";
import { esBlank } from "./formato.js";
import { boton, contenedor, lineas, mostrarTooltip, ocultarTooltip, props, segmentador } from "./nativos.js";
import { crearNativosPagina } from "./paginas_modo.js";

const cargar = (ruta) => fetch(ruta).then((r) => { if (!r.ok) throw new Error(`${ruta}: ${r.status}`); return r.json(); });
const [datos, informe, escena] = await Promise.all([cargar("datos/datos.json"), cargar("datos/informe.json"), cargar("datos/globo.vega.json")]);
const modelo = crearModelo(datos);
const medidasHtml = crearMedidasHtml(modelo);
const T = modelo.T;

// ------------------------------------------------------------------------------------------- campos y valores
// Campo de un segmentador → filtro del modelo (modelo.js)
const CAMPO = {
  "Escenarios.Escenario": "escenario", "Categorías.Nombre corto": "categorias", "Modos.Modo": "modos",
  "Foco desvío.Foco desvío": "foco", "Horizonte.Horizonte": "horizonte", "Calendario.Mes y año": "mesAnio",
  "Calendario.Día del mes": "diaMes",
};
const porOrden = (filas, col) => [...filas].sort((a, b) => a[col] - b[col]);
const VALORES = {
  escenario: () => porOrden(T.Escenarios, "Orden").map((r) => r.Escenario),
  categorias: () => porOrden(T["Categorías"], "Orden").map((r) => r["Nombre corto"]),
  modos: () => porOrden(T.Modos, "Orden").map((r) => r.Modo),
  foco: () => ["Solo desviadas"],
  horizonte: () => porOrden(T.Horizonte, "Días").map((r) => r.Horizonte),
  mesAnio: () => [...new Map(porOrden(T.Calendario, "Año-mes").map((r) => [r["Mes y año"], 1])).keys()],
  diaMes: () => [...new Set(T.Calendario.map((r) => r["Día del mes"]))].sort((a, b) => a - b),
};
const campoDe = (v, rol) => { const c = (v.campos[rol] || [])[0]; return c ? `${c.tabla}.${c.campo}` : null; };
const tipoDe = (v) => {
  const t = v.tipo || "";
  if (t.startsWith("htmlContent")) return "html";
  if (t.startsWith("deneb")) return "globo";
  return { advancedSlicerVisual: "segmentador", actionButton: "boton", lineChart: "lineas" }[t] || t;
};

// --------------------------------------------------------------------------------------------------- estado
const estado = {
  pagina: location.hash.slice(1) && informe.paginas.some((p) => p.nombre === location.hash.slice(1)) ? location.hash.slice(1) : informe.activa,
  sel: new Map(),        // selección de cada segmentador (o grupo de sincronización): clave → Set de valores
  ocultos: new Map(),    // visibilidad cambiada por los marcadores: visual → oculto
  cruzado: new Map(),    // página → { visual, filtros }: lo que un clic en un visual filtra a los demás
};
const claveSeg = (v) => v.sincronizado || v.nombre;
for (const p of informe.paginas) {
  for (const v of p.visuales) {
    if (tipoDe(v) !== "segmentador") continue;
    const k = claveSeg(v);
    if (!estado.sel.has(k) || (v.seleccion_guardada && !estado.sel.get(k).size)) estado.sel.set(k, new Set(v.seleccion_guardada || []));
  }
}

/** Literal de PBIR ('texto', 12L, 3.5D, true) como valor de JavaScript. */
function literal(x) {
  const v = x?.Literal?.Value ?? x;
  if (typeof v !== "string") return v;
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(\.\d+)?[LDM]$/.test(v)) return Number(v.slice(0, -1));
  if (v === "true" || v === "false") return v === "true";
  return v;
}

// Filtros de página (Mar, Aire y Carretera filtran Modos[Modo])
function filtrosPagina(p) {
  const f = {};
  for (const fp of p.filtros || []) {
    const campo = fp.field?.Column ? `${fp.field.Column.Expression.SourceRef.Entity}.${fp.field.Column.Property}` : null;
    const w = fp.filter?.Where?.[0]?.Condition?.In?.Values;
    if (campo && CAMPO[campo] && w) f[CAMPO[campo]] = w.map((fila) => literal(fila[0]));
  }
  return f;
}

const sinInteraccion = (p, origen, destino) => (p._interacciones || []).some((i) => i.source === origen && i.target === destino && i.type === "NoFilter");

/** Filtros con los que Power BI evalúa un objeto visual de la página: página, segmentadores y selección cruzada. */
function contexto(p, v) {
  const f = { ...p._filtrosPagina };
  for (const s of p.visuales) {
    if (tipoDe(s) !== "segmentador" || s.nombre === v.nombre || sinInteraccion(p, s.nombre, v.nombre)) continue;
    const campo = CAMPO[campoDe(s, "Values")];
    const sel = estado.sel.get(claveSeg(s));
    if (!campo || !sel || !sel.size) continue;
    if (campo === "foco") f.foco = true;
    else f[campo] = [...sel];
  }
  const cruz = estado.cruzado.get(p.nombre);
  if (cruz && cruz.visual !== v.nombre && !sinInteraccion(p, cruz.visual, v.nombre)) Object.assign(f, cruz.filtros);
  return filtros(f);
}

/** Los mismos filtros sin la selección cruzada (para dibujar la barra completa bajo la parte resaltada). */
function contextoSinCruce(p, v) {
  const cruz = estado.cruzado.get(p.nombre);
  estado.cruzado.delete(p.nombre);
  try { return contexto(p, v); } finally { if (cruz) estado.cruzado.set(p.nombre, cruz); }
}

// --------------------------------------------------------------------------------------- objetos visuales
const lienzo = document.getElementById("lienzo");
const DOC_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;overflow:hidden;background:transparent}
#htmlViewer{width:100vw;height:100vh;overflow:hidden}
#htmlViewer li{list-style:unset}
:where(#htmlContent.hc-legacy-v1){line-height:1.5;box-sizing:border-box}
:where(#htmlContent.hc-legacy-v1) *,:where(#htmlContent.hc-legacy-v1) *::before,:where(#htmlContent.hc-legacy-v1) *::after{box-sizing:border-box}
:where(#htmlContent.hc-legacy-v1) img{vertical-align:middle}
:where(#htmlContent.hc-legacy-v1) a{color:inherit}
:where(#htmlContent.hc-legacy-v1) :is(h1,h2,h3,h4,h5,h6){font-family:'Segoe UI',Arial,sans-serif;font-weight:400;margin:10px 0}
:where(#htmlContent.hc-legacy-v1) sub,:where(#htmlContent.hc-legacy-v1) sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}
:where(#htmlContent.hc-legacy-v1) sub{bottom:-.25em}:where(#htmlContent.hc-legacy-v1) sup{top:-.5em}
</style></head><body><div id="htmlViewer" style="font-family:'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;font-size:11pt;color:#000000;text-align:left;user-select:none;-webkit-user-select:none"><div id="htmlContent" class="hc-legacy-v1"></div></div></body></html>`;

/** Objeto visual de HTML Content: su propio marco, con el mismo contenedor y estilos base que en Power BI. */
function marcoHtml(cuerpo, titulo) {
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-same-origin");
  f.setAttribute("scrolling", "no");
  f.setAttribute("tabindex", "-1");
  f.title = titulo;
  f.srcdoc = DOC_HTML;
  cuerpo.appendChild(f);
  let listo = false, pendiente = null, ultimo = null;
  const poner = (h) => {
    if (!listo) { pendiente = h; return; }
    if (h === ultimo) return;
    f.contentDocument.getElementById("htmlContent").innerHTML = esBlank(h) ? "" : `<div class="htmlViewerEntry"><div>${h}</div></div>`;
    ultimo = h;
  };
  f.addEventListener("load", () => { listo = true; if (pendiente !== null) poner(pendiente); });
  return { poner };
}

window.tooltipGlobo = (marco, valor, cx, cy) => {
  if (!valor) { ocultarTooltip(); return; }
  const r = marco.getBoundingClientRect();
  const k = r.width / (marco.clientWidth || r.width);
  mostrarTooltip(valor, r.left + cx * k, r.top + cy * k);
};

function crearVisual(p, v, capa) {
  const caja = contenedor(v);
  capa.appendChild(caja.el);
  const item = { v, caja, actualizar: () => {} };
  const tipo = tipoDe(v);
  if (tipo === "html") {
    const medida = v.campos.content?.[0]?.campo;
    const m = marcoHtml(caja.cuerpo, v.nombre);
    item.actualizar = (f) => m.poner(medidasHtml[medida] ? medidasHtml[medida](f) : null);
  } else if (tipo === "globo") {
    const f = document.createElement("iframe");
    f.src = "globo.html";
    f.setAttribute("scrolling", "no");
    f.title = "Globo de la red de aprovisionamiento";
    caja.cuerpo.appendChild(f);
    const listo = new Promise((ok) => f.addEventListener("load", ok));
    item.actualizar = async (ctx) => { const filas = modelo.datosGlobo(ctx); await listo; f.contentWindow.pintar(escena, filas); };
  } else if (tipo === "segmentador") {
    const campo = CAMPO[campoDe(v, "Values")];
    const k = claveSeg(v);
    const unica = props(v.objetos, "selection").singleSelect !== false;
    const forzada = props(v.objetos, "selection").strictSingleSelect === true;
    const seg = segmentador(v, caja.cuerpo, (valor) => {
      const actual = estado.sel.get(k) || new Set();
      let nueva;
      if (unica) nueva = actual.has(valor) ? (forzada ? actual : new Set()) : new Set([valor]);
      else { nueva = new Set(actual); nueva.has(valor) ? nueva.delete(valor) : nueva.add(valor); }
      estado.sel.set(k, nueva);
      pintar();
    });
    item.actualizar = () => seg.actualizar(VALORES[campo]().map((x) => ({ valor: x, texto: String(x) })), estado.sel.get(k) || new Set());
  } else if (tipo === "boton") {
    const link = props(v.contenedor, "visualLink");
    const accion = () => {
      ocultarTooltip();
      if (link.type === "Bookmark") aplicarMarcador(link.bookmark);
      else if (link.type === "PageNavigation") irA(link.navigationSection);
    };
    boton(v, caja.cuerpo, accion, link.tooltip);
  } else if (tipo === "lineas") {
    const ys = v.campos.Y || [];
    const colores = Object.fromEntries((v.objetos.dataPoint || []).filter((d) => d.selector?.metadata).map((d) => [d.selector.metadata, d.properties.fill]));
    const graf = lineas(v, caja.cuerpo, (dia) => {
      if (esBlank(dia)) estado.cruzado.delete(p.nombre);
      else estado.cruzado.set(p.nombre, { visual: v.nombre, filtros: { fechas: [dia] }, valor: dia });
      pintar();
    });
    item.actualizar = (f) => {
      const series = ys.map((c) => {
        const curva = modelo.curva(c.campo.includes("(Base)") ? modelo.base(f) : f);
        return { nombre: c.nombre || c.campo, color: colores[`${c.tabla}.${c.campo}`] || "#161616", valores: curva.map((y, i) => ({ x: modelo.d0Cal + i, y })) };
      });
      const cruz = estado.cruzado.get(p.nombre);
      graf.actualizar(series, cruz && cruz.visual === v.nombre ? cruz.valor : null);
    };
  } else {
    item.actualizar = nativosPagina(p, v, caja);
  }
  return item;
}

// Gráficos nativos de las páginas Mar, Aire y Carretera (tarjetas, barras y tablas)
const nativos = crearNativosPagina({ modelo, estado, pintar: () => pintar(), contexto, contextoSinCruce, formatos: informe.formatos });
function nativosPagina(p, v, caja) { return nativos(p, v, caja); }

// ------------------------------------------------------------------------------------------------ páginas
function construir(p) {
  const capa = document.createElement("div");
  capa.className = "pagina";
  Object.assign(capa.style, { position: "absolute", inset: "0" });
  const fondo = props(p.objetos, "background");
  capa.style.background = fondo.color || "#ECEEEA";
  p._filtrosPagina = filtrosPagina(p);
  p._items = p.visuales.map((v) => crearVisual(p, v, capa));
  p._capa = capa;
  lienzo.appendChild(capa);
}

function pintar() {
  const p = informe.paginas.find((x) => x.nombre === estado.pagina);
  if (!p._capa) construir(p);
  for (const q of informe.paginas) if (q._capa) q._capa.style.display = q === p ? "" : "none";
  const fuera = props(p.objetos, "outspace");
  document.documentElement.style.setProperty("--exterior", fuera.color || "#E3E6E0");
  modelo.limpiarCache();
  for (const it of p._items) {
    const oculto = estado.ocultos.has(it.v.nombre) ? estado.ocultos.get(it.v.nombre) : it.v.oculto;
    it.caja.el.style.display = oculto ? "none" : "";
    if (!oculto) {
      try { it.actualizar(contexto(p, it.v)); }
      catch (e) { console.error(`${it.v.nombre}:`, e); }
    }
  }
}

function aplicarMarcador(nombre) {
  const m = informe.marcadores.find((x) => x.nombre === nombre);
  if (!m) return;
  for (const d of m.destinos) estado.ocultos.set(d, m.ocultos.includes(d));
  if (m.datos && m.selecciones) {
    const p = informe.paginas.find((x) => x.nombre === m.pagina);
    for (const [visual, valores] of Object.entries(m.selecciones)) {
      const v = p.visuales.find((x) => x.nombre === visual);
      if (v && valores) estado.sel.set(claveSeg(v), new Set(valores));
    }
  }
  pintar();
}

function irA(pagina) {
  if (!informe.paginas.some((p) => p.nombre === pagina)) return;
  estado.pagina = pagina;
  history.replaceState(null, "", `#${pagina}`);
  pintar();
}

for (const p of informe.paginas) p._interacciones = p.interacciones || [];

// ----------------------------------------------------------------------------------------- escala y arranque
function ajustar() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  lienzo.style.transform = `scale(${s})`;
  lienzo.style.left = `${(innerWidth - 1920 * s) / 2}px`;
  lienzo.style.top = `${(innerHeight - 1080 * s) / 2}px`;
}
addEventListener("resize", ajustar);
addEventListener("hashchange", () => { const h = location.hash.slice(1); if (h && h !== estado.pagina) irA(h); });
ajustar();
pintar();
document.getElementById("cargando").classList.add("fuera");
window.informeWeb = { estado, modelo, medidasHtml, informe, contexto, pintar, aplicarMarcador, irA };
