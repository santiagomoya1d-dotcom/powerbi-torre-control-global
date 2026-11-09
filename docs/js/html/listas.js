// Medidas HTML del grupo «listas»: riesgo de rotura, llegadas al almacén y los paneles del «···» de En tránsito,
// Retraso y Exposición. Traducidas de Medidas.tmdl: cada una devuelve el mismo HTML que Power BI, byte a byte
// (lo comprueba Prj2_TorreControl/web/pruebas/comprobar.mjs). El CSS está copiado tal cual del DAX.
import { unico } from "../modelo.js";
import { BLANK, DIVIDE, FORMAT, dia, esBlank, mes } from "../formato.js";
import {
  AVERAGEX, COALESCE, CONCATENATEX, COUNTROWS, GENERATESERIES, GROUPBY, INT, MAXX, MID, MOD, RIGHT, SUMX, TOPN, TRIM,
  WEEKDAY, cat,
} from "../dax.js";

// ---------------------------------------------------------------- CSS de cada medida (del DAX, sin tocar)
const CSS_ALERTAS = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.hd{display:flex;align-items:center;gap:12px}.hd .tt{font-size:15px;font-weight:600;letter-spacing:-.01em;flex:1;min-width:0}.hd .tt em{display:block;font-style:normal;font-size:11.5px;font-weight:400;color:var(--mut);letter-spacing:0;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.bdg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;border-radius:999px;padding:5px 10px;background:var(--lime);align-self:center;margin-left:auto;white-space:nowrap}.bdg.neg{background:var(--ink);color:var(--lime)}.bdg svg{width:13px;height:13px}.al{display:flex;flex-direction:column;gap:8px;height:100%}.ca{background:var(--card);border-radius:24px;padding:16px 18px}.res{display:flex;align-items:baseline;gap:10px;margin-top:10px}.res b{font-size:44px;font-weight:300;letter-spacing:-.045em;line-height:1}.res .rl{font-size:13px;color:var(--ink2);line-height:1.25}.it{display:flex;align-items:center;gap:12px;background:var(--card);border-radius:20px;padding:10px 14px 10px 10px}.ini{width:40px;height:40px;border-radius:13px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;position:relative;flex:none}.ini i{position:absolute;right:-3px;top:-3px;width:11px;height:11px;border-radius:50%;border:2px solid var(--card)}.it .tx{flex:1;min-width:0}.t1{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ct{font-size:10.5px;font-weight:500;color:var(--ink2);background:#fff;border:1px solid var(--lin);border-radius:999px;padding:1px 7px;margin-left:7px;vertical-align:1px}.t2{font-size:11.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}.dd{font-size:12px;font-weight:600;border-radius:999px;padding:4px 9px;white-space:nowrap}.dd.rot{background:var(--ink);color:var(--lime)}.dd.ret{background:#fff;border:1px solid var(--lin)}.ok{font-size:13px;color:var(--ink2)}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_LLEGADAS = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.card{position:relative;background:var(--card);border-radius:28px;padding:18px 20px;height:100%;overflow:hidden;display:flex;flex-direction:column}.hd{display:flex;align-items:center;gap:12px}.hd .tt{font-size:15px;font-weight:600;letter-spacing:-.01em;flex:1;min-width:0}.hd .tt em{display:block;font-style:normal;font-size:11.5px;font-weight:400;color:var(--mut);letter-spacing:0;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.al{display:flex;flex-direction:column;gap:8px;height:100%}.dd{font-size:12px;font-weight:600;border-radius:999px;padding:4px 9px;white-space:nowrap}.ley{display:flex;align-items:center;gap:16px;font-size:12px;color:var(--ink2);white-space:nowrap}.ley i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}.tot{font-size:12px;color:var(--mut)}.tot b{color:var(--ink);font-weight:600}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}@keyframes sube{from{transform:scaleY(0)}}";
// «Panel tránsito» y «Panel retraso» llevan el mismo CSS.
const CSS_PANEL = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.lima{background:var(--lime)}.lima .chip{border-color:transparent}.tr{width:22px;height:60px;border-radius:999px;border:1.3px dashed var(--fai);position:relative}.tr i{position:absolute;left:3px;right:3px;bottom:3px;min-height:13px;max-height:calc(100% - 6px);border-radius:999px;background:var(--ink);transform-origin:bottom;animation:sube .9s cubic-bezier(.2,.8,.2,1) both}.ct{font-size:10.5px;font-weight:500;color:var(--ink2);background:#fff;border:1px solid var(--lin);border-radius:999px;padding:1px 7px;margin-left:7px;vertical-align:1px}.dd{font-size:12px;font-weight:600;border-radius:999px;padding:4px 9px;white-space:nowrap}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}.pn{position:relative;margin:14px;height:calc(100% - 28px);background:#fff;border:1px solid var(--lin);border-radius:28px;padding:22px 26px;box-shadow:0 4px 10px rgba(22,22,22,.10);display:flex;flex-direction:column;overflow:hidden}.ph{display:flex;align-items:center;gap:14px;padding-right:56px}.ph .tt{font-size:22px;font-weight:400;letter-spacing:-.03em;flex:1;min-width:0}.ph .tt em{display:block;font-style:normal;font-size:12px;color:var(--mut);letter-spacing:0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pn .x{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--lin);display:flex;align-items:center;justify-content:center}.pn .x svg{width:16px;height:16px}.pk{display:flex;gap:8px;margin-top:16px}.pk div{background:var(--card);border-radius:16px;padding:8px 16px 9px}.pk b{font-size:22px;font-weight:400;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.pk span{display:block;font-size:11px;color:var(--mut)}.pk .lima span{color:rgba(22,22,22,.62)}.tb{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}.tb th{text-align:left;font-weight:500;color:var(--mut);font-size:11px;padding:0 10px 7px;border-bottom:1px solid var(--lin);white-space:nowrap}.tb td{padding:6px 10px;border-bottom:1px solid var(--lin);white-space:nowrap;max-width:230px;overflow:hidden;text-overflow:ellipsis}.tb .n{text-align:right;font-variant-numeric:tabular-nums}.tb td:first-child,.tb th:first-child{padding-left:0}.tb td:last-child,.tb th:last-child{padding-right:0}.tb .gr{color:var(--mut)}.dd.am{background:#FCEBC8;color:#8A5A00}.dd.co{background:#FBE0D8;color:#B8361B}.pf{margin-top:auto;padding-top:10px;font-size:11.5px;color:var(--mut)}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_EXPOSICION = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.lima{background:var(--lime)}.lima .chip{border-color:transparent}.tr{width:22px;height:60px;border-radius:999px;border:1.3px dashed var(--fai);position:relative}.tr i{position:absolute;left:3px;right:3px;bottom:3px;min-height:13px;max-height:calc(100% - 6px);border-radius:999px;background:var(--ink);transform-origin:bottom;animation:sube .9s cubic-bezier(.2,.8,.2,1) both}.tr i.l{background:var(--lime);box-shadow:inset 0 0 0 1.4px var(--ink)}.cz{font-size:10px;font-weight:700;letter-spacing:.04em;color:#fff;background:var(--coral);border-radius:999px;padding:2px 7px}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}.pn{position:relative;margin:14px;height:calc(100% - 28px);background:#fff;border:1px solid var(--lin);border-radius:28px;padding:22px 26px;box-shadow:0 4px 10px rgba(22,22,22,.10);display:flex;flex-direction:column;overflow:hidden}.ph{display:flex;align-items:center;gap:14px;padding-right:56px}.ph .tt{font-size:22px;font-weight:400;letter-spacing:-.03em;flex:1;min-width:0}.ph .tt em{display:block;font-style:normal;font-size:12px;color:var(--mut);letter-spacing:0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pn .x{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--lin);display:flex;align-items:center;justify-content:center}.pn .x svg{width:16px;height:16px}.pk{display:flex;gap:8px;margin-top:16px}.pk div{background:var(--card);border-radius:16px;padding:8px 16px 9px}.pk b{font-size:22px;font-weight:400;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.pk span{display:block;font-size:11px;color:var(--mut)}.pk .lima span{color:rgba(22,22,22,.62)}.tb{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}.tb th{text-align:left;font-weight:500;color:var(--mut);font-size:11px;padding:0 10px 7px;border-bottom:1px solid var(--lin);white-space:nowrap}.tb td{padding:6px 10px;border-bottom:1px solid var(--lin);white-space:nowrap;max-width:230px;overflow:hidden;text-overflow:ellipsis}.tb .n{text-align:right;font-variant-numeric:tabular-nums}.tb td:first-child,.tb th:first-child{padding-left:0}.tb td:last-child,.tb th:last-child{padding-right:0}.tb .gr{color:var(--mut)}.tb tr.cerr td{color:#B8361B}.mb{display:inline-block;width:64px;height:6px;border-radius:999px;background:var(--lin);vertical-align:middle;margin-right:8px;position:relative;overflow:hidden}.mb i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--ink)}.mb i.l{background:#9DB300}.pf{margin-top:auto;padding-top:10px;font-size:11.5px;color:var(--mut)}@keyframes sube{from{transform:scaleY(0)}}";

// ---------------------------------------------------------------- iconos
const ICO_ALERTA = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3.5 2.8 19.5h18.4z'/><path d='M12 10v4.5M12 17.2v.3'/></svg>";
const ICO_BARRAS = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><path d='M5 20V11M10 20V5M15 20v-6M20 20V9'/></svg>";
const ICO_CAJA = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='6' width='18' height='12' rx='2'/><path d='M7.5 6v12M12 6v12M16.5 6v12'/></svg>";
const ICO_RELOJ = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M12 7v5l3.5 2'/></svg>";
const ICO_RUTA = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='6' cy='18' r='2'/><circle cx='18' cy='6' r='2'/><path d='M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16'/></svg>";
const ICO_CERRAR = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6.5 6.5l11 11M17.5 6.5l-11 11'/></svg>";

// ---------------------------------------------------------------- ayudas
const MESES = "ene feb mar abr may jun jul ago sep oct nov dic ";
/** DAY ( d ) & " " & TRIM ( MID ( meses, ( MONTH ( d ) - 1 ) * 4 + 1, 4 ) ): «5 mar». */
const diaCorto = (d) => dia(d) + " " + TRIM(MID(MESES, (mes(d) - 1) * 4 + 1, 4));

/** SWITCH ( Envios[Vía], "Cabo", "Cabo de Buena Esperanza", …, Envios[Vía] ): el nombre largo de la vía. */
const VIAS = new Map([["Cabo", "Cabo de Buena Esperanza"], ["Suez", "Canal de Suez"], ["Europa", "Carretera europea"],
  ["Aérea", "Avión"]]);
const nombreVia = (v) => (VIAS.has(v) ? VIAS.get(v) : v);

/** FORMAT ( x, "0.0", "en-US" ): los números del SVG, con punto decimal. */
const sv = (x) => FORMAT(x, "0.0", "en-US");

/** Celda de retraso de las tablas de los paneles: coral de 7 días arriba, ámbar de 2 a 7, «en plazo» si no. */
const celdaRetraso = (r) => (r > 7 ? "<span class='dd co'>+" + FORMAT(r, "0", "es-ES") + " d</span>"
  : r > 2 ? "<span class='dd am'>+" + FORMAT(r, "0", "es-ES") + " d</span>" : "<span class='gr'>en plazo</span>");

/** Principio común de los paneles: estilo, icono, título con su línea gris y el botón de cerrar. */
const cabeceraPanel = (css, icono, titulo, linea) => "<style>" + css + "</style><div class='t'>"
  + "<div class='pn'><div class='ph'><div class='chip'>" + icono + "</div><div class='tt'>" + titulo + "<em>" + linea
  + "</em></div></div><div class='x'>" + ICO_CERRAR + "</div>";

const SIN_TRANSITO = "<div class='pf' style='margin-top:30px'>No hay mercancía en tránsito con estos filtros.</div>";

export function crear(modelo, html) {
  const { T, M } = modelo;
  const nodo = new Map(T.Nodos.map((n) => [n.NodoID, n.Nodo]));

  /** Riesgo de rotura: cargas cuyo retraso supera los días de cobertura de su categoría, agrupadas por proveedor. */
  function alertas(f) {
    // enTransito (con más de 2 días de retraso) con @cob, @ciudad, @color y la holgura @hol = retraso − cobertura
    const conHolgura = modelo.enTransito(f).filter((e) => e["Retraso (días)"] > 2).map((e) => ({
      e, cob: e._c["Cobertura (días)"], ciudad: e._p.Ciudad, color: e._c.Color,
      hol: e["Retraso (días)"] - e._c["Cobertura (días)"],
    }));
    const riesgo = conHolgura.filter((x) => x.hol > 0);
    const nRiesgo = COALESCE(COUNTROWS(riesgo), 0);
    const vRiesgo = COALESCE(SUMX(riesgo, (x) => x.e["Valor (€)"]), 0);
    const grupos = GROUPBY(conHolgura, (x) => x.e.ProveedorID).map(({ clave, filas: g }) => ({
      prov: clave,
      ciudad: MAXX(g, (x) => x.ciudad),
      cat: MAXX(g, (x) => x.e["Categoría"]),
      color: MAXX(g, (x) => x.color),
      cob: MAXX(g, (x) => x.cob),
      n: SUMX(g, () => 1),
      nr: SUMX(g, (x) => (x.hol > 0 ? 1 : 0)),
      hol: MAXX(g, (x) => x.hol),
      ret: MAXX(g, (x) => x.e["Retraso (días)"]),
      valor: SUMX(g, (x) => x.e["Valor (€)"]),
    }));
    const orden = [[(g) => g.hol, "DESC"], [(g) => g.valor, "DESC"]];
    const lista = CONCATENATEX(TOPN(5, grupos, ...orden), (g) =>
      "<div class='it'><div class='ini'>" + RIGHT(g.prov, 2) + "<i style='background:" + cat(g.color) + "'></i></div>"
      + "<div class='tx'><div class='t1'>" + cat(g.ciudad) + "<span class='ct'>" + cat(g.cat) + "</span></div><div class='t2'>"
      + (g.nr > 0
        ? (g.nr === g.n ? g.n + (g.n === 1 ? " carga sin stock" : " cargas sin stock") : g.nr + " de " + g.n + " cargas sin stock")
        : g.n + (g.n === 1 ? " carga" : " cargas") + " con retraso")
      + " · " + FORMAT(g.valor / 1000, "#,0", "es-ES") + " mil € · cubre " + cat(g.cob) + " d</div></div>"
      + "<span class='dd " + (g.nr > 0 ? "rot" : "ret") + "'>+" + FORMAT(g.ret, "0", "es-ES") + " d</span></div>",
    "", ...orden);
    return "<style>" + CSS_ALERTAS + "</style><div class='t'>"
      + "<div class='al'><div class='ca'><div class='hd'><div class='chip'>" + ICO_ALERTA + "</div><div class='tt'>Riesgo de rotura en el almacén<em>el retraso supera los días de stock de seguridad</em></div></div>"
      + "<div class='res'><b>" + nRiesgo + "</b><span class='rl'>" + (nRiesgo === 1 ? "carga llegará<br>sin stock" : "cargas llegarán<br>sin stock") + "</span>"
      + "<span class='bdg" + (nRiesgo > 0 ? " neg'>" + FORMAT(vRiesgo / 1000000, "0.0", "es-ES") + " M€" : "'>sin riesgo") + "</span></div></div>"
      + (conHolgura.length === 0 ? "<div class='ca ok'>Ninguna carga en tránsito va con más de dos días de retraso.</div>" : lista)
      + "</div></div>";
  }

  /** Llegadas al almacén en los próximos 14 o 30 días (Horizonte): cápsula lima a tiempo y negra con retraso. */
  function llegadas(f) {
    const hoy = INT(modelo.momento(f));
    const nd = COALESCE(unico(T.Horizonte.filter((h) => !f.horizonte || f.horizonte.has(h.Horizonte)), (h) => h["Días"]), 14);
    // ent: las entregas de los nd días desde hoy, con su día, su valor y si llegan con más de 2 días de retraso
    const ent = modelo.Envios(f).filter((e) => e.Entrega >= hoy && e.Entrega < hoy + nd)
      .map((e) => ({ dia: INT(e.Entrega), val: e["Valor (€)"], tarde: e["Retraso (días)"] > 2 ? 1 : 0 }));
    const dias = GENERATESERIES(0, nd - 1, 1).map(({ Value }) => {
      const a = hoy + Value;
      const todas = ent.filter((x) => x.dia === a);
      const tarde = todas.filter((x) => x.tarde === 1);
      return {
        Value, d: a,
        v: COALESCE(SUMX(todas, (x) => x.val), 0), r: COALESCE(SUMX(tarde, (x) => x.val), 0),
        n: COALESCE(COUNTROWS(todas), 0), nr: COALESCE(COUNTROWS(tarde), 0),
      };
    });
    const mx = Math.max(MAXX(dias, (x) => x.v), 1);
    const paso = mx <= 1000000 ? 100000 : mx <= 2000000 ? 200000 : 500000;
    const tope = (INT(mx / paso) + 1) * paso;
    const ancho = (840 - 34) / nd;
    const bw = Math.min(30, ancho * 0.72);
    const rr = bw / 2;
    const cada = nd > 14 ? 2 : 1;
    const porDia = [(x) => x.Value, "ASC"];
    const rejilla = CONCATENATEX(GENERATESERIES(0, INT(tope / paso), 1), ({ Value }) => {
      const y = 136 - Value * paso / tope * 128;
      return "<line x1='34' x2='840' y1='" + sv(y) + "' y2='" + sv(y) + "' stroke='#E2E5DF'/>"
        + "<text x='26' y='" + sv(y + 3.5) + "' text-anchor='end' font-size='10' fill='#8A8F87'>" + FORMAT(Value * paso / 1000000, "0.0", "es-ES") + "</text>";
    }, "", porDia);
    const barras = CONCATENATEX(dias, (x) => {
      const cx = 34 + ancho * (x.Value + 0.5);
      const xi = cx - rr;
      const h = Math.max(x.v / tope * 128, bw);
      const hr = x.r / tope * 128;
      const hr2 = Math.min(Math.max(hr, bw), h);
      const ytop = 136 - h;
      const yl = hr > 0.5 ? ytop + hr2 + rr : ytop + rr;
      const rotulo = MOD(x.Value, cada) === 0
        ? "<text x='" + sv(cx) + "' y='158' text-anchor='middle' font-size='11' font-weight='" + (x.Value === 0 ? "700" : "400")
          + "' fill='" + (x.Value === 0 ? "#161616" : WEEKDAY(x.d, 2) >= 6 ? "#A3A79F" : "#6F746C") + "'>" + diaCorto(x.d) + "</text>"
        : "";
      if (x.v <= 0) {
        // día sin llegadas: cápsula de trazos con un punto
        return rotulo + "<rect x='" + sv(xi) + "' y='12' width='" + sv(bw) + "' height='124' rx='" + sv(rr) + "' fill='none' stroke='#B9BDB5' stroke-width='1.3' stroke-dasharray='4 4'/>"
          + "<circle cx='" + sv(cx) + "' cy='" + sv(12 + rr) + "' r='" + sv(rr * 0.4) + "' fill='#B9BDB5'/>";
      }
      return rotulo + "<rect class='b' x='" + sv(xi) + "' y='" + sv(ytop) + "' width='" + sv(bw) + "' height='" + sv(h) + "' rx='" + sv(rr) + "' fill='#E2F27A'/>"
        + (hr > 0.5
          ? "<path class='b' d='M" + sv(xi) + "," + sv(ytop + hr2) + " V" + sv(ytop + rr) + " a" + sv(rr) + "," + sv(rr) + " 0 0 1 " + sv(bw) + ",0 V" + sv(ytop + hr2) + " Z' fill='#161616'/>"
            + "<circle cx='" + sv(cx) + "' cy='" + sv(ytop + rr) + "' r='" + sv(rr * 0.433) + "' fill='#fff'/>"
          : "")
        + (yl < 136 - 6 && (hr <= 0.5 || h - hr2 >= bw)
          ? "<circle cx='" + sv(cx) + "' cy='" + sv(yl) + "' r='" + sv(rr * 0.433) + "' fill='#fff'/><circle cx='" + sv(cx) + "' cy='" + sv(yl) + "' r='" + sv(rr * 0.24) + "' fill='#161616'/>"
          : "");
    }, "", porDia);
    // El día de más valor y el de más valor con retraso (el primero si empatan)
    const iMax = MAXX(TOPN(1, dias, [(x) => x.v, "DESC"], porDia), (x) => x.Value);
    const iRet = MAXX(dias, (x) => x.r) > 0 ? MAXX(TOPN(1, dias, [(x) => x.r, "DESC"], porDia), (x) => x.Value) : -1;
    let etiquetaRet = "";
    if (iRet >= 0) {
      const fila = dias.filter((x) => x.Value === iRet);
      const cx = 34 + ancho * (iRet + 0.5);
      const ytop = 136 - Math.max(MAXX(fila, (x) => x.v) / tope * 128, bw);
      const xr = iRet >= nd - 3 ? cx - rr - 76 : cx + rr + 6;
      etiquetaRet = "<rect x='" + sv(xr) + "' y='" + sv(ytop + 4) + "' width='70' height='22' rx='11' fill='#161616'/>"
        + "<text x='" + sv(xr + 35) + "' y='" + sv(ytop + 19) + "' text-anchor='middle' font-size='11' font-weight='600' fill='#fff'>"
        + FORMAT(DIVIDE(MAXX(fila, (x) => x.r), MAXX(fila, (x) => x.v)), "0 %", "es-ES") + " tarde</text>";
    }
    let etiquetaMax = "";
    if (iMax !== iRet && MAXX(dias, (x) => x.v) > 0) {
      const fila = dias.filter((x) => x.Value === iMax);
      const cx = 34 + ancho * (iMax + 0.5);
      const ytop = 136 - Math.max(MAXX(fila, (x) => x.v) / tope * 128, bw);
      const xr = iMax >= 2 ? cx - rr - 69 : cx + rr + 6;
      etiquetaMax = "<rect x='" + sv(xr) + "' y='" + sv(ytop - 2) + "' width='64' height='22' rx='11' fill='#E2F27A'/>"
        + "<text x='" + sv(xr + 32) + "' y='" + sv(ytop + 13) + "' text-anchor='middle' font-size='11' font-weight='600' fill='#161616'>"
        + FORMAT(MAXX(fila, (x) => x.v) / 1000000, "0.00", "es-ES") + " M€</text>";
    }
    const total = SUMX(dias, (x) => x.v);
    const n = SUMX(dias, (x) => x.n);
    const nr = SUMX(dias, (x) => x.nr);
    return "<style>" + CSS_LLEGADAS + "</style><div class='t'>"
      + "<div class='card' style='padding:16px 22px'><div class='hd'><div class='chip'>" + ICO_BARRAS + "</div>"
      + "<div class='tt' style='flex:none;font-size:22px;font-weight:400;letter-spacing:-.03em'>Llegadas al almacén</div>"
      + "<div class='ley' style='margin-left:20px'><span><i style='background:#E2F27A'></i>a tiempo</span><span><i style='background:#161616'></i>con retraso</span>"
      + "<span class='tot'>· <b>" + FORMAT(total / 1000000, "0.0", "es-ES") + " M€</b> en <b>" + cat(n) + "</b> cargas, " + cat(nr) + " tarde</span></div>"
      + "<div style='flex:1'></div><div style='width:196px;flex:none'></div></div>"
      + "<svg viewBox='0 0 840 166' width='100%' height='166' style='display:block;margin-top:10px;font-family:inherit'>"
      + rejilla + barras + etiquetaRet + etiquetaMax + "</svg></div></div>";
  }

  /** Fila de la tabla de un panel: carga, proveedor y categoría, vía, (prevista), llegada, retraso y valor. */
  const filaCarga = (e, conPrevista) => "<tr><td>" + cat(e.EnvioID) + "</td><td>" + cat(e._p.Ciudad) + "<span class='ct'>"
    + cat(e._c["Nombre corto"]) + "</span></td><td>" + cat(nombreVia(e["Vía"])) + "</td>"
    + (conPrevista ? "<td class='gr'>" + diaCorto(e["Entrega prevista"]) + "</td>" : "")
    + "<td>" + diaCorto(e.Entrega) + "</td><td class='n'>" + celdaRetraso(e["Retraso (días)"])
    + "</td><td class='n'>" + FORMAT(e["Valor (€)"] / 1000, "#,0", "es-ES") + " mil €</td></tr>";

  /** Panel del «···» de En tránsito: las cargas en tránsito a mediodía, las de más valor primero. */
  function panelTransito(f) {
    const enT = modelo.enTransito(f);
    const n = COALESCE(COUNTROWS(enT), 0);
    const total = SUMX(enT, (e) => e["Valor (€)"]);
    const nr = COALESCE(COUNTROWS(enT.filter((e) => e["Retraso (días)"] > 2)), 0);
    const orden = [[(e) => e["Valor (€)"], "DESC"], [(e) => e.EnvioID, "ASC"]];
    const primeras = TOPN(10, enT, ...orden);
    const resto = n - COALESCE(COUNTROWS(primeras), 0);
    const vResto = total - SUMX(primeras, (e) => e["Valor (€)"]);
    const filas = CONCATENATEX(primeras, (e) => filaCarga(e, false), "", ...orden);
    return cabeceraPanel(CSS_PANEL, ICO_CAJA, "En tránsito hoy",
      FORMAT(n, "#,0", "es-ES") + (n === 1 ? " carga" : " cargas") + " a mediodía del día elegido · las de más valor primero")
      + (n === 0 ? SIN_TRANSITO
        : "<div class='pk'><div class='lima'><b>" + FORMAT(total / 1000000, "0.0", "es-ES") + " M€</b><span>valor en tránsito</span></div>"
          + "<div><b>" + FORMAT(n, "#,0", "es-ES") + "</b><span>cargas</span></div><div><b>" + nr + "</b><span>con más de 2 días de retraso</span></div></div>"
          + "<table class='tb'><tr><th>Carga</th><th>Proveedor</th><th>Vía</th><th>Llega</th><th class='n'>Retraso</th><th class='n'>Valor</th></tr>" + filas + "</table>"
          + (resto > 0 ? "<div class='pf'>Y " + FORMAT(resto, "#,0", "es-ES") + (resto === 1 ? " carga más" : " cargas más") + " por " + FORMAT(vResto / 1000000, "0.0", "es-ES") + " M€.</div>" : ""))
      + "</div></div>";
  }

  /** Panel del «···» de Retraso en tránsito: las cargas en tránsito con más retraso. */
  function panelRetraso(f) {
    const enT = modelo.enTransito(f);
    const n = COALESCE(COUNTROWS(enT), 0);
    const nr = COALESCE(COUNTROWS(enT.filter((e) => e["Retraso (días)"] > 2)), 0);
    const peor = MAXX(enT, (e) => e["Retraso (días)"]);
    const medio = COALESCE(M["Retraso en tránsito (días)"](f), 0);
    const orden = [[(e) => e["Retraso (días)"], "DESC"], [(e) => e["Valor (€)"], "DESC"]];
    const filas = CONCATENATEX(TOPN(10, enT, ...orden), (e) => filaCarga(e, true), "", ...orden);
    return cabeceraPanel(CSS_PANEL, ICO_RELOJ, "Retraso en tránsito", "las cargas que aún no han llegado, las más retrasadas primero")
      + (n === 0 ? SIN_TRANSITO
        : "<div class='pk'><div class='lima'><b>" + FORMAT(medio, "0.0", "es-ES") + " d</b><span>retraso medio en tránsito</span></div>"
          + "<div><b>" + FORMAT(nr, "#,0", "es-ES") + " de " + FORMAT(n, "#,0", "es-ES") + "</b><span>cargas con más de 2 días de retraso</span></div>"
          + "<div><b>+" + FORMAT(Math.max(COALESCE(peor, 0), 0), "0", "es-ES") + " d</b><span>la más retrasada</span></div></div>"
          + "<table class='tb'><tr><th>Carga</th><th>Proveedor</th><th>Vía</th><th>Prevista</th><th>Llega</th><th class='n'>Retraso</th><th class='n'>Valor</th></tr>" + filas + "</table>"
          + (nr > 10 ? "<div class='pf'>Y " + FORMAT(nr - 10, "#,0", "es-ES") + " cargas más con retraso.</div>" : ""))
      + "</div></div>";
  }

  /** Panel del «···» de Exposición: valor en tránsito por vía y origen, y las vías que el escenario deja sin viajes. */
  function panelExposicion(f) {
    const t = modelo.momento(f);
    const esBase = modelo.escenarioElegido(f) === "Base";
    const enT = modelo.enTransito(f);
    const total = SUMX(enT, (e) => e["Valor (€)"]);
    // GROUPBY ( enT, Envios[Vía], Envios[Origen], "@v", …, "@n", …, "@d", AVERAGEX ( …, MAX ( retraso, 0 ) ) )
    const grupos = GROUPBY(enT, (e) => e["Vía"] + "\u0000" + e.Origen).map(({ filas: g }) => ({
      via: g[0]["Vía"], origen: g[0].Origen,
      v: SUMX(g, (e) => e["Valor (€)"]),
      n: SUMX(g, () => 1),
      d: AVERAGEX(g, (e) => Math.max(COALESCE(e["Retraso (días)"], 0), 0)),
    }));
    const vias = GROUPBY(enT, (e) => e["Vía"]).map(({ clave, filas: g }) => ({ via: clave, v: SUMX(g, (e) => e["Valor (€)"]) }));
    const viaTop = MAXX(TOPN(1, vias, [(x) => x.v, "DESC"]), (x) => x.via);
    const vTop = COALESCE(MAXX(vias, (x) => x.v), 0);
    const mx = MAXX(grupos, (x) => x.v);
    const porValor = [(x) => x.v, "DESC"];
    const filas = CONCATENATEX(TOPN(9, grupos, porValor), (x) => {
      const ancho = DIVIDE(x.v, mx);
      return "<tr><td>" + cat(nombreVia(x.via)) + "</td><td>" + cat(COALESCE(nodo.get(x.origen), x.origen))
        + "</td><td class='n'>" + x.n + "</td><td class='n'>" + FORMAT(x.v / 1000000, "0.00", "es-ES") + " M€</td><td><span class='mb'><i class='"
        + (x.via === viaTop ? "l" : "") + "' style='width:" + FORMAT(esBlank(ancho) ? BLANK : ancho * 100, "0.0", "en-US") + "%'></i></span>" + FORMAT(DIVIDE(x.v, total), "0 %", "es-ES")
        + "</td><td class='n'>" + (x.d > 2 ? "+" + FORMAT(x.d, "0.0", "es-ES") + " d" : "en plazo") + "</td></tr>";
    }, "", porValor);
    // Vías que en la base llevarían carga en tránsito y en este escenario no tienen viajes
    let cerradas = "";
    if (!esBase) {
      const hoyVias = new Set(vias.map((x) => x.via));
      const enTBase = modelo.Envios(modelo.base(f)).filter((e) => e.Salida <= t && e.Entrega > t);
      const base = GROUPBY(enTBase, (e) => e["Vía"]).map(({ clave, filas: g }) => ({ via: clave, b: SUMX(g, (e) => e["Valor (€)"]) }));
      cerradas = CONCATENATEX(base.filter((x) => !hoyVias.has(x.via)), (x) =>
        "<tr class='cerr'><td>" + cat(nombreVia(x.via)) + "</td><td><span class='cz'>SIN VIAJES</span></td><td class='n'>0</td><td class='n'>0,00 M€</td>"
        + "<td colspan='2' class='gr'>en la base llevaría " + FORMAT(x.b / 1000000, "0.0", "es-ES") + " M€</td></tr>",
      "", [(x) => x.b, "DESC"]);
    }
    const nVias = COUNTROWS(vias);
    return cabeceraPanel(CSS_EXPOSICION, ICO_RUTA, "Exposición por vía", "cuánto del valor en tránsito depende de cada vía y de cada origen")
      + (esBlank(total) || total <= 0 ? SIN_TRANSITO
        : "<div class='pk'><div class='lima'><b>" + FORMAT(DIVIDE(vTop, total), "0 %", "es-ES") + "</b><span>por " + cat(nombreVia(viaTop)) + "</span></div>"
          + "<div><b>" + FORMAT(total / 1000000, "0.0", "es-ES") + " M€</b><span>valor en tránsito</span></div>"
          + "<div><b>" + cat(nVias) + "</b><span>" + (nVias === 1 ? "vía con viajes" : "vías con viajes") + "</span></div></div>"
          + "<table class='tb'><tr><th>Vía</th><th>Origen</th><th class='n'>Cargas</th><th class='n'>Valor</th><th>Parte del total</th><th class='n'>Retraso medio</th></tr>"
          + filas + cerradas + "</table>"
          + (grupos.length > 9 ? "<div class='pf'>Y " + (grupos.length - 9) + " orígenes más con menos valor.</div>" : ""))
      + "</div></div>";
  }

  return {
    "HTML · Alertas": alertas,
    "HTML · Llegadas": llegadas,
    "HTML · Panel tránsito": panelTransito,
    "HTML · Panel retraso": panelRetraso,
    "HTML · Panel exposición": panelExposicion,
  };
}
