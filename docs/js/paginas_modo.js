// Gráficos nativos de las páginas Mar, Aire y Carretera: tarjetas, barras y tablas, con el formato que guarda el
// informe y el comportamiento de Power BI: un clic en una barra o en una fila filtra el resto de la página, y las
// barras del otro gráfico se resaltan (la parte que corresponde a la selección, sobre la barra completa atenuada).
import { con } from "./modelo.js";
import { FORMAT, aFecha, esBlank, redondear } from "./formato.js";
import { PT, color, escapar, medir, mostrarTooltip, ocultarTooltip, props } from "./nativos.js";

const LETRA = "'Segoe UI Variable Display', 'Segoe UI', 'Selawik', -apple-system, Arial, sans-serif";
const UNIDADES = { 1000: " mil", 1000000: " mill.", 1000000000: " mil M" };

/** Valor con la cadena de formato del modelo, las unidades y los decimales del objeto visual, como Power BI (es-ES). */
export function formatoPBI(v, formato, unidades = 0, decimales = null, tipo = null) {
  if (esBlank(v)) return "";
  if (typeof v === "string") return v;
  if (!formato && tipo === "double") return FORMAT(v, "0.00", "es-ES");   // decimal sin formato: «20,60», como Power BI
  if (formato && /d|y|h|n/.test(formato) && !/[#0]/.test(formato)) {
    const f = aFecha(v);
    const dos = (n) => String(n).padStart(2, "0");
    return formato.replace("dd", dos(f.getUTCDate())).replace("mm", dos(f.getUTCMonth() + 1)).replace("yyyy", f.getUTCFullYear())
      .replace("hh", dos(f.getUTCHours())).replace("nn", dos(f.getUTCMinutes()));
  }
  if (!formato) {                       // sin formato (General): el número tal cual, con coma decimal
    const r = Number.isInteger(v) ? String(v) : String(redondear(v, 10));
    return r.replace(".", ",");
  }
  const porcentaje = formato.includes("%");
  const sufijo = formato.match(/[^#0.,%]*$/)[0];      // « €», «%»…
  const dec = decimales ?? ((formato.split(".")[1] || "").replace(/[^0#]/g, "").length);
  let x = porcentaje ? v * 100 : v;
  let unidad = "";
  if (unidades && UNIDADES[unidades]) { x = x / unidades; unidad = UNIDADES[unidades]; }
  const agrupar = formato.includes(",") || !!unidad;
  const patron = dec ? `0.${"0".repeat(dec)}` : "0";
  let texto = agrupar && dec === 0 ? FORMAT(x, "#,0", "es-ES") : FORMAT(x, patron === "0.00" || patron === "0.0" || patron === "0" ? patron : "0.0", "es-ES");
  if (agrupar && dec > 0) {
    const [e, d] = texto.split(",");
    texto = e.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + d;
  }
  // Como Power BI con es-ES: «6,2 mill.€» (la abreviatura con punto va pegada a la moneda) y «392 mil €»
  const resto = porcentaje ? "%" : sufijo.replace("%", "");
  return texto + unidad + (unidad.endsWith(".") ? resto.trimStart() : resto);
}

export function crearNativosPagina({ modelo, estado, pintar, contexto, contextoSinCruce, formatos, tipos = {} }) {
  const fmtCampo = (c) => formatos[`${c.tabla}.${c.campo}`];
  const tipoCampo = (c) => tipos[`${c.tabla}.${c.campo}`];
  const medida = (c, f) => modelo.M[c.campo](f);

  function seleccionar(p, v, filtros, valor) {
    const cruz = estado.cruzado.get(p.nombre);
    if (cruz && cruz.visual === v.nombre && cruz.valor === valor) estado.cruzado.delete(p.nombre);
    else estado.cruzado.set(p.nombre, { visual: v.nombre, filtros, valor });
    pintar();
  }

  // ------------------------------------------------------------------------------------------- tarjeta
  function tarjeta(p, v, caja) {
    const c = v.campos.Values[0];
    const et = props(v.objetos, "labels"), cat = props(v.objetos, "categoryLabels");
    const cuerpo = caja.cuerpo;
    Object.assign(cuerpo.style, { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" });
    const valor = document.createElement("div");
    Object.assign(valor.style, { color: et.color || "#161616", font: `400 ${(et.fontSize || 24) * PT}px/1.15 ${et.fontFamily || LETRA}`, whiteSpace: "nowrap" });
    const etiqueta = document.createElement("div");
    Object.assign(etiqueta.style, { color: cat.color || "#8A8F87", font: `400 ${(cat.fontSize || 10) * PT}px/1.3 ${cat.fontFamily || LETRA}`, whiteSpace: "nowrap", marginTop: "2px" });
    etiqueta.textContent = c.nombre || c.campo;
    if (cat.show === false) etiqueta.style.display = "none";
    cuerpo.append(valor, etiqueta);
    return (f) => {
      const x = medida(c, f);
      valor.textContent = esBlank(x) ? "(En blanco)" : formatoPBI(x, fmtCampo(c), et.labelDisplayUnits || 0, et.labelPrecision ?? null);
    };
  }

  // ----------------------------------------------------------------------------- gráfico de barras horizontales
  function barras(p, v, caja) {
    const cat = v.campos.Category[0], y = v.campos.Y[0];
    const et = props(v.objetos, "labels"), ejeX = props(v.objetos, "categoryAxis");
    const relleno = props(v.objetos, "dataPoint").fill || "#161616";
    const tamCat = (ejeX.fontSize || 9) * PT, tamEt = (et.fontSize || 9) * PT;
    const cuerpo = caja.cuerpo;
    const filtroDe = (valor) => (cat.tabla === "Rutas" ? { rutas: [valor] } : cat.tabla === "Categorías" ? { categorias: [valor] } : {});
    const miembros = () => (cat.tabla === "Rutas" ? modelo.T.Rutas.map((r) => r.RutaID)
      : [...modelo.T["Categorías"]].sort((a, b) => a.Orden - b.Orden).map((r) => r["Nombre corto"]));
    return (f) => {
      const cruz = estado.cruzado.get(p.nombre);
      const propia = cruz && cruz.visual === v.nombre;
      const ajena = cruz && !propia;
      const base = ajena ? contextoSinCruce(p, v) : f;
      let filas = miembros().map((m) => ({ m, v: medida(y, con(base, filtroDe(m))), r: ajena ? medida(y, con(f, filtroDe(m))) : null }))
        .filter((x) => !esBlank(x.v) || !esBlank(x.r));
      filas.sort((a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity));
      const W = parseFloat(cuerpo.style.width), H = parseFloat(cuerpo.style.height);
      const anchoCat = Math.min(W * 0.4, Math.max(0, ...filas.map((x) => medir(String(x.m), tamCat))) + 10);
      const fmt = (x) => formatoPBI(x, fmtCampo(y), et.labelDisplayUnits || 0, et.labelPrecision ?? null);
      const anchoEt = Math.max(0, ...filas.map((x) => medir(fmt(Math.max(x.v ?? 0, x.r ?? 0)), tamEt))) + 8;
      const max = Math.max(0, ...filas.map((x) => Math.max(x.v ?? 0, x.r ?? 0)));
      // Como Power BI: las categorías se reparten por todo el alto (con un margen arriba) y la barra no pasa de 15 px
      const margen = 16;
      const paso = filas.length ? (H - margen) / filas.length : 0;
      const alto = Math.min(paso * 0.8, 15);
      const largo = (x) => (max > 0 && !esBlank(x) ? Math.max(0, x) / max * (W - anchoCat - anchoEt) : 0);
      cuerpo.replaceChildren();
      filas.forEach((x, i) => {
        const fila = document.createElement("div");
        Object.assign(fila.style, { position: "absolute", left: "0", top: `${margen + i * paso}px`, width: `${W}px`, height: `${paso}px`, cursor: "pointer" });
        const nombre = document.createElement("div");
        Object.assign(nombre.style, { position: "absolute", left: "0", width: `${anchoCat - 8}px`, top: "0", height: `${paso}px`, display: "flex", alignItems: "center", justifyContent: "flex-end", color: ejeX.labelColor || "#3B3D3A", font: `400 ${tamCat}px ${ejeX.fontFamily || LETRA}`, whiteSpace: "nowrap", overflow: "hidden" });
        nombre.textContent = x.m;
        const atenuada = (propia && cruz.valor !== x.m) || ajena;
        const barra = document.createElement("div");
        Object.assign(barra.style, { position: "absolute", left: `${anchoCat}px`, top: `${(paso - alto) / 2}px`, width: `${largo(x.v)}px`, height: `${alto}px`, background: color(relleno, atenuada ? 60 : 0) });
        fila.append(nombre, barra);
        if (ajena && !esBlank(x.r)) {
          const resalte = document.createElement("div");
          Object.assign(resalte.style, { position: "absolute", left: `${anchoCat}px`, top: `${(paso - alto) / 2}px`, width: `${largo(x.r)}px`, height: `${alto}px`, background: relleno });
          fila.appendChild(resalte);
        }
        if (et.show !== false) {
          const etq = document.createElement("div");
          const val = ajena ? x.r : x.v;
          Object.assign(etq.style, { position: "absolute", left: `${anchoCat + Math.max(largo(x.v), largo(x.r)) + 4}px`, top: "0", height: `${paso}px`, display: "flex", alignItems: "center", color: et.color || "#161616", font: `400 ${tamEt}px ${et.fontFamily || LETRA}`, whiteSpace: "nowrap" });
          etq.textContent = esBlank(val) ? "" : fmt(val);
          fila.appendChild(etq);
        }
        fila.addEventListener("click", () => seleccionar(p, v, filtroDe(x.m), x.m));
        fila.addEventListener("mousemove", (e) => mostrarTooltip({ [cat.nombre || cat.campo]: x.m, [y.nombre || y.campo]: formatoPBI(ajena ? x.r : x.v, fmtCampo(y)) }, e.clientX, e.clientY));
        fila.addEventListener("mouseleave", ocultarTooltip);
        cuerpo.appendChild(fila);
      });
    };
  }

  // ----------------------------------------------------------------------------------------------------- tabla
  function tabla(p, v, caja) {
    const cols = v.campos.Values;
    const o = v.objetos;
    const cab = props(o, "columnHeaders"), val = props(o, "values"), rej = props(o, "grid");
    const tamC = (cab.fontSize || 9) * PT, tamV = (val.fontSize || 9) * PT;
    const ordenInicial = v.orden?.[0];
    let orden = ordenInicial ? { campo: ordenInicial.field.Measure?.Property || ordenInicial.field.Column?.Property, desc: ordenInicial.direction === "Descending" } : null;
    const filtroVisual = (v.filtros || []).map((x) => x.field?.Measure?.Property).filter(Boolean);
    const esEnvios = cols[0].tabla === "Envios";
    const caja2 = document.createElement("div");
    Object.assign(caja2.style, { position: "absolute", inset: "0", overflow: "auto", scrollbarWidth: "thin" });
    caja2.className = "tablaPBI";
    caja.cuerpo.appendChild(caja2);
    // Números a la derecha; textos y fechas a la izquierda, como Power BI
    const numerico = (c) => c.tipo === "Measure" || ["int64", "double", "decimal"].includes(tipoCampo(c));
    const celda = (c, fila) => {
      const x = fila[c.campo];
      return formatoPBI(x, fmtCampo(c), 0, null, tipoCampo(c));
    };
    return (f) => {
      let filas;
      if (esEnvios) {
        filas = modelo.Envios(f).filter((e) => filtroVisual.every((m) => modelo.M[m](con(f, { envios: [e.EnvioID] })) === 1)).map((e) => ({
          _clave: e.EnvioID, EnvioID: e.EnvioID, Ciudad: e._p.Ciudad, "Nombre corto": e._c["Nombre corto"], "Vía": e["Vía"],
          "Entrega prevista": e["Entrega prevista"], Entrega: e.Entrega, "Retraso (días)": e["Retraso (días)"], "Valor (€)": e["Valor (€)"],
        }));
      } else {
        filas = modelo.T.Rutas.map((r) => {
          const fr = con(f, { rutas: [r.RutaID] });
          const fila = { _clave: r.RutaID, RutaID: r.RutaID, "Vía": r["Vía"] };
          for (const c of cols) if (c.tipo === "Measure") fila[c.campo] = modelo.M[c.campo](fr);
          return fila;
        }).filter((fila) => cols.some((c) => c.tipo === "Measure" && !esBlank(fila[c.campo])));
      }
      if (orden) {
        const k = orden.campo;
        filas.sort((a, b) => {
          const x = a[k], y = b[k];
          if (esBlank(x) && esBlank(y)) return 0;
          if (esBlank(x)) return 1;
          if (esBlank(y)) return -1;
          const r = typeof x === "string" ? x.localeCompare(y, "es") : x - y;
          return orden.desc ? -r : r;
        });
      }
      const cruz = estado.cruzado.get(p.nombre);
      const propia = cruz && cruz.visual === v.nombre;
      const borde = rej.gridHorizontal !== false ? `1px solid ${rej.gridHorizontalColor || "#E2E5DF"}` : "0";
      // Cabecera: la columna por la que se ordena lleva un triangulito debajo del texto, a la izquierda, como Power BI
      const th = (c) => {
        const flecha = orden && orden.campo === c.campo
          ? `<span style="position:absolute;left:8px;bottom:0;font-size:8px;line-height:8px;color:${cab.fontColor || "#8A8F87"}">${orden.desc ? "⏷" : "⏶"}</span>` : "";
        return `<th data-campo="${escapar(c.campo)}" style="text-align:${numerico(c) ? "right" : "left"};color:${cab.fontColor || "#8A8F87"};background:${cab.backColor || "#F7F8F5"};font:400 ${tamC}px ${cab.fontFamily || LETRA};padding:4px 8px 9px;white-space:nowrap;position:sticky;top:0;cursor:pointer;border-bottom:${borde}"><span style="position:relative;display:inline-block">${escapar(c.nombre || c.campo)}</span>${flecha}</th>`;
      };
      const tr = (fila, i) => {
        const atenuada = propia && cruz.valor !== fila._clave;
        const fondo = i % 2 ? val.backColorSecondary || val.backColorPrimary : val.backColorPrimary;
        const letra = i % 2 ? val.fontColorSecondary || val.fontColorPrimary : val.fontColorPrimary;
        return `<tr data-clave="${escapar(fila._clave)}" style="background:${fondo || "transparent"};color:${letra || "#161616"};opacity:${atenuada ? 0.4 : 1};cursor:pointer">${cols.map((c) =>
          `<td style="text-align:${numerico(c) ? "right" : "left"};font:400 ${tamV}px ${val.fontFamily || LETRA};padding:4px 8px;white-space:nowrap;border-bottom:${borde}">${escapar(celda(c, fila))}</td>`).join("")}</tr>`;
      };
      caja2.innerHTML = `<table style="border-collapse:collapse;width:auto"><thead><tr>${cols.map(th).join("")}</tr></thead><tbody>${filas.map(tr).join("")}</tbody></table>`;
      caja2.querySelectorAll("th").forEach((x) => x.addEventListener("click", () => {
        const k = x.dataset.campo;
        orden = orden && orden.campo === k ? { campo: k, desc: !orden.desc } : { campo: k, desc: true };
        pintar();
      }));
      caja2.querySelectorAll("tbody tr").forEach((x) => x.addEventListener("click", () => {
        const clave = x.dataset.clave;
        seleccionar(p, v, esEnvios ? { envios: [clave] } : { rutas: [clave] }, clave);
      }));
    };
  }

  return (p, v, caja) => {
    if (v.tipo === "card") return tarjeta(p, v, caja);
    if (v.tipo === "clusteredBarChart") return barras(p, v, caja);
    if (v.tipo === "tableEx") return tabla(p, v, caja);
    caja.cuerpo.textContent = "";
    return () => {};
  };
}
