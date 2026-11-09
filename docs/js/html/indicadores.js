// Medidas HTML del grupo «indicadores»: las tarjetas En tránsito, Exposición, Servicio y Escenario, y el panel Vías.
// Traducidas del DAX de Medidas.tmdl; devuelven el mismo HTML que Power BI (lo comprueba web/pruebas/comprobar.mjs).
import { con } from "../modelo.js";
import { dia, mes } from "../formato.js";
import {
  BLANK, COALESCE, DIVIDE, FORMAT, esBlank, cat, num, ROUND, ROUNDUP, INT, ABS, TRIM, MID, LEFT, LEN, SUBSTITUTE,
  GENERATESERIES, TOPN, CONCATENATEX, SUMX, MAXX, MINX, AVERAGEX, COUNTROWS, GROUPBY,
} from "../dax.js";

// ---------------------------------------------------------------- CSS de cada medida, tal cual en el DAX
const CSS_TRANSITO = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.card{position:relative;background:var(--card);border-radius:28px;padding:18px 20px;height:100%;overflow:hidden;display:flex;flex-direction:column}.hd{display:flex;align-items:center;gap:12px}.hd .tt{font-size:15px;font-weight:600;letter-spacing:-.01em;flex:1;min-width:0}.hd .tt em{display:block;font-style:normal;font-size:11.5px;font-weight:400;color:var(--mut);letter-spacing:0;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.mas{opacity:.8;font-size:18px;line-height:1;letter-spacing:-1px;transform:rotate(90deg)}.big{display:flex;align-items:baseline;gap:8px;margin-top:6px;white-space:nowrap}.card>.big{margin-bottom:auto}.big b{font-size:52px;font-weight:300;letter-spacing:-.045em;line-height:.9;font-variant-numeric:tabular-nums}.big u{text-decoration:none;font-size:22px;font-weight:400;letter-spacing:-.02em;margin-left:-4px}.big i{font-style:normal;font-size:14px;color:var(--mut)}.bdg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;border-radius:999px;padding:5px 10px;background:var(--lime);align-self:center;margin-left:auto;white-space:nowrap}.bdg.mal{background:#FBE0D8;color:#B8361B}.bdg svg{width:13px;height:13px}.caps{display:flex;gap:7px;margin-top:10px}.cc{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px}.cc.ap{opacity:.28}.tr{width:22px;height:60px;border-radius:999px;border:1.3px dashed var(--fai);position:relative}.tr i{position:absolute;left:3px;right:3px;bottom:3px;min-height:13px;max-height:calc(100% - 6px);border-radius:999px;background:var(--ink);transform-origin:bottom;animation:sube .9s cubic-bezier(.2,.8,.2,1) both}.tr i.l{background:var(--lime);box-shadow:inset 0 0 0 1.4px var(--ink)}.tr i.o{display:none}.cc span{font-size:10.5px;color:var(--ink2);margin-top:4px;white-space:nowrap}.cc em{font-style:normal;font-size:10px;color:var(--mut);font-variant-numeric:tabular-nums}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}@keyframes ap{from{opacity:0;transform:scale(.6)}}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_EXPOSICION = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.card{position:relative;background:var(--card);border-radius:28px;padding:18px 20px;height:100%;overflow:hidden;display:flex;flex-direction:column}.hd{display:flex;align-items:center;gap:12px}.hd .tt{font-size:15px;font-weight:600;letter-spacing:-.01em;flex:1;min-width:0}.hd .tt em{display:block;font-style:normal;font-size:11.5px;font-weight:400;color:var(--mut);letter-spacing:0;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.mas{opacity:.8;font-size:18px;line-height:1;letter-spacing:-1px;transform:rotate(90deg)}.big{display:flex;align-items:baseline;gap:8px;margin-top:6px;white-space:nowrap}.card>.big{margin-bottom:auto}.big b{font-size:52px;font-weight:300;letter-spacing:-.045em;line-height:.9;font-variant-numeric:tabular-nums}.big u{text-decoration:none;font-size:22px;font-weight:400;letter-spacing:-.02em;margin-left:-4px}.big i{font-style:normal;font-size:14px;color:var(--mut)}.bdg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;border-radius:999px;padding:5px 10px;background:var(--lime);align-self:center;margin-left:auto;white-space:nowrap}.bdg.neu{background:rgba(255,255,255,.6)}.bdg svg{width:13px;height:13px}.caps{display:flex;gap:7px;margin-top:10px}.cap{flex:1;height:34px;border-radius:999px}.cap.f{background:var(--ink)}.cap.v{border:1.4px dashed var(--fai)}.cap.f{animation:ap .5s cubic-bezier(.2,.8,.2,1) both}.cap:nth-child(2){animation-delay:.04s}.cap:nth-child(3){animation-delay:.08s}.cap:nth-child(4){animation-delay:.12s}.cap:nth-child(5){animation-delay:.16s}.cap:nth-child(6){animation-delay:.2s}.cap:nth-child(7){animation-delay:.24s}.cap:nth-child(8){animation-delay:.28s}.cap:nth-child(9){animation-delay:.32s}.cap:nth-child(10){animation-delay:.36s}.pie{margin-top:9px;font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lima{background:var(--lime)}.lima .chip{border-color:transparent}.lima .cap.v{border-color:rgba(22,22,22,.35)}.lima .big i,.lima .pie{color:rgba(22,22,22,.62)}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}@keyframes ap{from{opacity:0;transform:scale(.6)}}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_SERVICIO = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.card{position:relative;background:var(--card);border-radius:28px;padding:18px 20px;height:100%;overflow:hidden;display:flex;flex-direction:column}.hd{display:flex;align-items:center;gap:12px}.hd .tt{font-size:15px;font-weight:600;letter-spacing:-.01em;flex:1;min-width:0}.hd .tt em{display:block;font-style:normal;font-size:11.5px;font-weight:400;color:var(--mut);letter-spacing:0;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.mas{opacity:.8;font-size:18px;line-height:1;letter-spacing:-1px;transform:rotate(90deg)}.big{display:flex;align-items:baseline;gap:8px;margin-top:6px;white-space:nowrap}.card>.big{margin-bottom:auto}.big b{font-size:52px;font-weight:300;letter-spacing:-.045em;line-height:.9;font-variant-numeric:tabular-nums}.big u{text-decoration:none;font-size:22px;font-weight:400;letter-spacing:-.02em;margin-left:-4px}.big i{font-style:normal;font-size:14px;color:var(--mut)}.bdg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;border-radius:999px;padding:5px 10px;background:var(--lime);align-self:center;margin-left:auto;white-space:nowrap}.bdg.mal{background:#FBE0D8;color:#B8361B}.bdg svg{width:13px;height:13px}.tres{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:8px;margin-top:10px}.mi{background:#fff;border-radius:18px;padding:6px 12px 7px;white-space:nowrap}.mi b{font-size:20px;font-weight:500;line-height:1.25;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.mi s{text-decoration:none;font-size:11px;font-weight:600;margin-left:6px;color:#4E6B00}.mi s.m{color:#B8361B}.mi span{display:block;font-size:11px;line-height:1.2;color:var(--mut);margin-top:1px}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_ESCENARIO = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.card{position:relative;background:var(--card);border-radius:28px;padding:18px 20px;height:100%;overflow:hidden;display:flex;flex-direction:column}.caps{display:flex;gap:7px;margin-top:10px}.cap{flex:1;height:34px;border-radius:999px}.cap.f{background:var(--ink)}.cap.v{border:1.4px dashed var(--fai)}.cap.f{animation:ap .5s cubic-bezier(.2,.8,.2,1) both}.cap:nth-child(2){animation-delay:.04s}.cap:nth-child(3){animation-delay:.08s}.cap:nth-child(4){animation-delay:.12s}.cap:nth-child(5){animation-delay:.16s}.cap:nth-child(6){animation-delay:.2s}.cap:nth-child(7){animation-delay:.24s}.cap:nth-child(8){animation-delay:.28s}.cap:nth-child(9){animation-delay:.32s}.cap:nth-child(10){animation-delay:.36s}.osc{background:#161616;color:#fff;padding:18px 22px}.osc .et{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#A3A79F;gap:10px}.pto{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--coral);margin-right:8px;animation:pulso 1.6s infinite}.flc{width:36px;height:36px;border-radius:50%;background:var(--lime);display:flex;align-items:center;justify-content:center;flex:none;color:#161616}.flc svg{width:17px;height:17px}.h1{font-size:26px;font-weight:400;letter-spacing:-.03em;line-height:1.08;margin-top:2px}.osc>.h1{margin-bottom:auto}.h1 span{color:var(--lime)}.osc .caps{margin-top:12px;gap:6px}.osc .cap{height:24px}.osc .cap.f{background:var(--lime)}.osc .cap.v{border-color:#5A5D57}.osc .cap.p{background:linear-gradient(90deg,var(--lime) var(--p),transparent var(--p));border:1.4px dashed #5A5D57}.fr{display:flex;justify-content:space-between;font-size:11.5px;color:#8D918A;margin-top:6px}.bt{display:flex;align-items:center;justify-content:space-between;background:#fff;color:#161616;border-radius:999px;padding:9px 12px 9px 20px;margin-top:12px;font-size:14px;font-weight:500;white-space:nowrap}.bt b{font-weight:700}.bt svg{width:15px;height:15px}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}.bt.on{background:var(--lime)}@keyframes ap{from{opacity:0;transform:scale(.6)}}@keyframes sube{from{transform:scaleY(0)}}@keyframes pulso{0%{box-shadow:0 0 0 0 rgba(239,90,60,.7)}70%{box-shadow:0 0 0 9px rgba(239,90,60,0)}100%{box-shadow:0 0 0 0 rgba(239,90,60,0)}}";
const CSS_VIAS = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.vp{background:rgba(255,255,255,.82);border:1px solid var(--lin);border-radius:22px;padding:14px 14px 6px}.vp .h{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;font-weight:600;margin-bottom:6px}.vp .h em{font-style:normal;font-size:11px;color:var(--mut);font-weight:400}.vr{padding:7px 0 8px;border-top:1px solid var(--lin)}.vr .n{display:flex;justify-content:space-between;font-size:12.5px;font-weight:500;white-space:nowrap}.vr .n b{font-weight:600;font-variant-numeric:tabular-nums}.vr .bar{height:8px;border-radius:999px;border:1px dashed var(--fai);margin:6px 0 4px;position:relative}.vr .bar i{position:absolute;left:-1px;top:-1px;bottom:-1px;border-radius:999px;background:var(--ink);transform-origin:left;animation:crece .9s cubic-bezier(.2,.8,.2,1) both}.vr .bar i.l{background:var(--lime);box-shadow:inset 0 0 0 1px var(--ink)}.vr .s{font-size:11px;color:var(--mut)}.vr .s s{text-decoration:none;color:#B8361B;font-weight:600}.vr.cerr .n{color:#B8361B}.cz{font-size:10px;font-weight:700;letter-spacing:.04em;color:#fff;background:var(--coral);border-radius:999px;padding:2px 7px}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}@keyframes sube{from{transform:scaleY(0)}}@keyframes crece{from{transform:scaleX(0)}}";

// ---------------------------------------------------------------- iconos (las VAR de SVG del DAX)
const CAJA = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='6' width='18' height='12' rx='2'/><path d='M7.5 6v12M12 6v12M16.5 6v12'/></svg>";
const FLECHA = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M7 17 17 7M9 7h8v8'/></svg>";
const RUTA = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='6' cy='18' r='2'/><circle cx='18' cy='6' r='2'/><path d='M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16'/></svg>";
const ARO = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='8' stroke-opacity='.25'/><path d='M12 4a8 8 0 0 1 8 8'/></svg>";
const RELOJ = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M12 7v5l3.5 2'/></svg>";
const CERRAR = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6.5 6.5l11 11M17.5 6.5l-11 11'/></svg>";
const PLAY = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M8 5.5v13l10.5-6.5z'/></svg>";
const MESES = "ene feb mar abr may jun jul ago sep oct nov dic ";

// ---------------------------------------------------------------- ayudas con la semántica de DAX
/** Igualdad de textos de DAX: no distingue mayúsculas y el blanco vale "". */
const mismo = (a, b) => (esBlank(a) ? "" : String(a)).toLowerCase() === (esBlank(b) ? "" : String(b)).toLowerCase();
/** Producto y cociente de DAX: con un blanco, blanco. */
const por = (a, b) => (esBlank(a) || esBlank(b) ? BLANK : a * b);
const div = (a, b) => (esBlank(a) ? BLANK : a / b);
/** MAX y MIN de dos valores: el blanco cuenta como 0. */
const max2 = (a, b) => (esBlank(a) && esBlank(b) ? BLANK : Math.max(a ?? 0, b ?? 0));
const min2 = (a, b) => (esBlank(a) && esBlank(b) ? BLANK : Math.min(a ?? 0, b ?? 0));
/** SWITCH ( valor, clave1, r1, …, otro ) con pares [clave, resultado]. */
const segun = (v, pares, otro) => { for (const [k, r] of pares) if (mismo(v, k)) return r; return otro; };
/** Nombre largo de una vía (Exposición y Vías). */
const nombreVia = (v) => segun(v, [["Cabo", "Cabo de Buena Esperanza"], ["Suez", "Canal de Suez"], ["Europa", "Carretera europea"], ["Aérea", "Avión"]], v);
/** Nombre de una vía en el pie de Exposición. */
const cortoVia = (v) => segun(v, [["Europa", "Carretera"], ["Aérea", "Avión"]], v);

export function crear(modelo, html) {
  const { M, T } = modelo;
  const esBase = (f) => mismo(modelo.escenarioElegido(f), "Base");
  /** Fecha y mes abreviado: DAY ( x ) & " " & TRIM ( MID ( meses, … ) ). */
  const diaMes = (x) => (esBlank(x) ? BLANK : num(dia(x)) + " " + TRIM(MID(MESES, (mes(x) - 1) * 4 + 1, 4)));
  /** Incidencias visibles: solo las filtra Escenarios (Incidencias[Escenario] → Escenarios). */
  const incidencias = (f) => T.Incidencias.filter((i) => !f.escenario || f.escenario.has(i.Escenario));
  /** ADDCOLUMNS ( CALCULATETABLE ( VALUES ( Envios[Vía] ), en tránsito a t ), … ): un grupo por vía con sus envíos. */
  const porVia = (envios) => GROUPBY(envios, (e) => e["Vía"]).map((g) => ({ via: g.clave, filas: g.filas }));
  /** Envíos en tránsito a t con unos filtros (t es el Momento del contexto de fuera). */
  const enTransitoA = (f, t) => modelo.Envios(f).filter((e) => e.Salida <= t && e.Entrega > t);

  return {
    // Valor en tránsito a mediodía frente a la base, con una cápsula por categoría.
    "HTML · En tránsito": (f) => {
      const base = esBase(f);
      const v = COALESCE(M["Valor en tránsito (€)"](f), 0);
      const vb = COALESCE(M["Valor en tránsito (Base)"](f), 0);
      const d = DIVIDE(v - vb, vb);
      const cargas = COALESCE(M["Envíos en tránsito"](f), 0);
      const retr = COALESCE(M["Envíos retrasados en tránsito"](f), 0);
      const elegidas = new Set(modelo.categoriasVisibles(f).map((c) => c["Categoría"]));
      const filtrado = f.categorias != null;
      // ALL ( 'Categorías'[…] ) con su valor: la fila sustituye el filtro del segmentador de categorías.
      const cats = T["Categorías"].map((c) => ({ c, v: COALESCE(M["Valor en tránsito (€)"](con(f, { categorias: [c["Nombre corto"]] })), 0) }));
      const mx = MAXX(cats, (x) => x.v);
      const mayor = MAXX(TOPN(1, cats, [(x) => x.v, "DESC"]), (x) => x.c["Categoría"]);
      const barras = CONCATENATEX(cats, (x) => {
        const ca = x.c["Categoría"], nc = x.c["Nombre corto"];
        return "<div class='cc" + (filtrado && !elegidas.has(ca) ? " ap" : "") + "' title='" + cat(ca) + "'><div class='tr'><i class='"
          + (x.v <= 0 ? "o" : mismo(ca, mayor) ? "l" : "") + "' style='height:" + FORMAT(por(DIVIDE(x.v, mx), 100), "0.0", "en-US") + "%'></i></div><span>"
          + (LEN(nc) > 9 ? LEFT(nc, 7) + "." : cat(nc)) + "</span><em>" + FORMAT(x.v / 1000000, "0.0", "es-ES") + "</em></div>";
      }, "", [(x) => x.c.Orden, "ASC"]);
      const badge = base || vb === 0 ? ""
        : "<span class='bdg" + (d > 0.02 ? " mal" : "") + "'>" + FLECHA + (d > 0 ? "+" : "") + FORMAT(por(d, 100), "0", "es-ES") + " %</span>";
      return "<style>" + CSS_TRANSITO + "</style><div class='t'>" + "<div class='card'><div class='hd'><div class='chip'>" + CAJA + "</div><div class='tt'>En tránsito hoy<em>"
        + FORMAT(cargas, "#,0", "es-ES") + (cargas === 1 ? " carga, " : " cargas, ") + FORMAT(retr, "#,0", "es-ES") + " con retraso · M€ por categoría</em></div><div class='mas'>···</div></div>"
        + "<div class='big'><b>" + FORMAT(v / 1000000, "0.0", "es-ES") + "</b><u>M€</u>" + (!base ? "<i>/ " + FORMAT(vb / 1000000, "0.0", "es-ES") + " base</i>" : "") + badge + "</div>"
        + "<div class='caps'>" + barras + "</div></div></div>";
    },

    // Parte del valor en tránsito que depende de la vía más cargada, en diez cápsulas.
    "HTML · Exposición": (f) => {
      const t = modelo.momento(f);
      const valor = COALESCE(M["Valor en tránsito (€)"](f), 0);
      const vias = porVia(enTransitoA(f, t)).map((g) => ({ via: g.via, v: SUMX(g.filas, (e) => e["Valor (€)"]) }));
      const viaTop = MAXX(TOPN(1, vias, [(x) => x.v, "DESC"]), (x) => x.via);
      const vTop = COALESCE(MAXX(vias, (x) => x.v), 0);
      const pct = DIVIDE(vTop, valor);
      const n = ROUND(por(pct, 10), 0);
      const nombre = nombreVia(viaTop);
      const caps = CONCATENATEX(GENERATESERIES(1, 10, 1), (s) => "<div class='cap " + (s.Value <= n ? "f" : "v") + "'></div>", "", [(s) => s.Value, "ASC"]);
      const otras = CONCATENATEX(
        TOPN(2, vias.filter((x) => !mismo(x.via, viaTop)), [(x) => x.v, "DESC"]),
        (x) => cat(cortoVia(x.via)) + " " + FORMAT(DIVIDE(x.v, valor), "0 %", "es-ES"),
        " · ", [(x) => x.v, "DESC"]);
      return "<style>" + CSS_EXPOSICION + "</style><div class='t'>" + "<div class='card lima'><div class='hd'><div class='chip'>" + RUTA + "</div><div class='tt'>Exposición por vía<em>valor en tránsito que depende de una sola ruta</em></div><div class='mas'>···</div></div>"
        + (valor <= 0
          ? "<div class='pie' style='margin-top:30px'>No hay mercancía en tránsito con estos filtros.</div>"
          : "<div class='big'><b>" + FORMAT(por(pct, 100), "0", "es-ES") + "</b><u>%</u><i>/ " + cat(nombre) + "</i>"
            + "<span class='bdg neu'>" + ARO + FORMAT(vTop / 1000000, "0.0", "es-ES") + " M€</span></div>"
            + "<div class='caps'>" + caps + "</div><div class='pie'>" + (mismo(otras, "") ? "Todo el valor va por una sola vía." : otras) + "</div>")
        + "</div></div>";
    },

    // Retraso previsto de lo que está en tránsito, con puntualidad, retraso entregado y flete de 30 días.
    "HTML · Servicio": (f) => {
      const base = esBase(f);
      const r = COALESCE(M["Retraso en tránsito (días)"](f), 0);
      const rb = COALESCE(M["Retraso en tránsito (Base)"](f), 0);
      const d = r - rb;
      const punt = COALESCE(M["Puntualidad %"](f), 0);
      const puntB = COALESCE(M["Puntualidad (Base)"](f), 0);
      const dp = (punt - puntB) * 100;
      const rm = COALESCE(M["Retraso medio (días)"](f), 0);
      const dr = rm - COALESCE(M["Retraso medio (Base)"](f), 0);
      const fl = COALESCE(M["Flete (30 días)"](f), 0);
      const flB = M["Flete (Base)"](f);                 // sin COALESCE: puede ser blanco
      const dfl = DIVIDE(fl - (flB ?? 0), flB);          // fl − blanco = fl
      const badge = base || ABS(d) < 0.05 ? ""
        : "<span class='bdg" + (d > 0.5 ? " mal" : "") + "'>" + FLECHA + (d > 0 ? "+" : "") + FORMAT(d, "0.0", "es-ES") + " d</span>";
      const cambia = !esBlank(dfl) && ABS(dfl) >= 0.005;  // ABS ( blanco ) >= 0,005 es falso
      return "<style>" + CSS_SERVICIO + "</style><div class='t'>" + "<div class='card'><div class='hd'><div class='chip'>" + RELOJ + "</div><div class='tt'>Retraso en tránsito<em>media de lo que aún no ha llegado</em></div><div class='mas'>···</div></div>"
        + "<div class='big'><b>" + FORMAT(r, "0.0", "es-ES") + "</b><u>días</u>" + (!base ? "<i>/ " + FORMAT(rb, "0.0", "es-ES") + " base</i>" : "") + badge + "</div>"
        + "<div class='tres'>"
        + "<div class='mi'><b>" + FORMAT(punt, "0 %", "es-ES") + "</b>"
        + (!base && ABS(dp) >= 0.5 ? "<s class='" + (dp < 0 ? "m" : "") + "'>" + (dp > 0 ? "+" : "") + FORMAT(dp, "0", "es-ES") + " pp</s>" : "") + "<span>puntualidad 30 d</span></div>"
        + "<div class='mi'><b>" + FORMAT(rm, "0.0", "es-ES") + " d</b>"
        + (!base && ABS(dr) >= 0.05 ? "<s class='" + (dr > 0 ? "m" : "") + "'>" + (dr > 0 ? "+" : "") + FORMAT(dr, "0.0", "es-ES") + "</s>" : "") + "<span>retraso entregado</span></div>"
        + "<div class='mi'><b>" + FORMAT(fl / 1000, "#,0", "es-ES") + " mil €</b>"
        + (!base && cambia ? "<s class='" + (dfl > 0 ? "m" : "") + "'>" + (dfl > 0 ? "+" : "") + FORMAT(dfl * 100, "0", "es-ES") + " %</s>" : "") + "<span>flete 30 días</span></div>"
        + "</div></div></div>";
    },

    // Tarjeta negra del escenario: el cierre activo, su avance por semanas y las cargas desviadas.
    "HTML · Escenario": (f) => {
      const hoy = modelo.fechaElegida(f);
      const t = modelo.momento(f);
      const inc = incidencias(f);
      const cierres = inc.filter((i) => mismo(i.Tipo, "Cierre"));
      const c1 = TOPN(1, cierres, [(i) => i.Desde, "ASC"]);
      const desde = MAXX(c1, (i) => i.Desde);
      const hasta = MAXX(c1, (i) => i.Hasta);
      const lugar = SUBSTITUTE(MAXX(c1, (i) => i.Incidencia), "Cierre · ", "");
      const total = INT((hasta ?? 0) - (desde ?? 0)) + 1;
      const dias = INT(hoy - (desde ?? 0)) + 1;          // la VAR «dia» del DAX
      const semanas = max2(ROUNDUP(total / 7, 0), 1);
      const hecho = por(DIVIDE(min2(max2(dias, 0), total), total), semanas);
      const caps = CONCATENATEX(GENERATESERIES(1, semanas, 1), (s) => (s.Value <= hecho ? "<div class='cap f'></div>"
        : s.Value - 1 < hecho ? "<div class='cap p' style='--p:" + FORMAT((hecho - s.Value + 1) * 100, "0", "en-US") + "%'></div>" : "<div class='cap v'></div>"),
      "", [(s) => s.Value, "ASC"]);
      // Cargas en tránsito por las rutas alternativas (TREATAS sobre Envios[RutaID]) y la vía de esas rutas.
      const alts = modelo.alternativas;
      const nAlt = COALESCE(COUNTROWS(enTransitoA(f, t).filter((e) => alts.has(e.RutaID))), 0);
      const viaAlt = MAXX(T.Rutas.filter((r) => alts.has(r.RutaID)), (r) => r["Vía"]);
      const porAlt = mismo(viaAlt, "Cabo") ? "el Cabo" : cat("la vía ", viaAlt);
      const cong = COUNTROWS(inc.filter((i) => mismo(i.Tipo, "Congestión") && i.Desde <= hoy && i.Hasta >= hoy));
      const fd = diaMes(desde);
      const fh = diaMes(hasta);
      const estado = esBlank(desde) ? 0 : hoy < desde ? 1 : hoy <= hasta ? 2 : 3;
      const otro = MINX(T.Escenarios.filter((e) => !mismo(e.Escenario, "Base")), (e) => e.Escenario);
      const semana = min2(INT((dias - 1) / 7) + 1, semanas);
      const hayCong = !esBlank(cong) && cong > 0;
      const etiqueta = estado === 1 ? "Escenario simulado · empieza en " + num(INT(desde - hoy)) + " días"
        : estado === 2 ? (hayCong ? "Congestión en " + num(cong) + " puertos · " : "Escenario simulado · ") + "semana " + num(semana) + " de " + num(semanas)
          : estado === 3 ? (hayCong ? "Congestión en " + num(cong) + " puertos · reabierto" : "Escenario simulado · reabierto")
            : "Escenario";
      const titulo = estado === 1 ? cat(lugar, " abierto<br><span>cierra el ", fd, "</span>")
        : estado === 2 ? cat(lugar, " cerrado<br><span>día ", num(dias), " de ", num(total), "</span>")
          : estado === 3 ? cat(lugar, " reabierto<br><span>hace ", num(INT(hoy - hasta)), " días</span>")
            : "Operación normal<br><span>sin incidencias</span>";
      const soloDesv = !!f.foco;
      const boton = estado === 0
        ? (!mismo(otro, "") ? "<span>Pulsa la flecha para ver <b>" + otro + "</b></span>" : "<span>Sin escenarios de incidencia</span>")
        : nAlt > 0
          ? (soloDesv
            ? "<span>En el globo, solo las <b>" + num(nAlt) + (nAlt === 1 ? " carga</b> desviada" : " cargas</b> desviadas") + "</span>"
            : "<span><b>" + num(nAlt) + (nAlt === 1 ? " carga</b> desviada por " : " cargas</b> desviadas por ") + porAlt + "</span>")
          : "<span>Ninguna carga desviada en tránsito</span>";
      return "<style>" + CSS_ESCENARIO + "</style><div class='t'>" + "<div class='card osc'><div class='et'><span>" + (estado === 2 ? "<span class='pto'></span>" : "") + etiqueta + "</span><div class='flc'>" + FLECHA + "</div></div>"
        + "<div class='h1'>" + titulo + "</div>"
        + (estado > 0 ? "<div class='caps'>" + caps + "</div><div class='fr'><span>" + cat(fd) + "</span><span>reabre el " + cat(fh) + "</span></div>" : "<div style='height:52px'></div>")
        + "<div class='bt" + (soloDesv ? " on" : "") + "'>" + boton + (soloDesv ? CERRAR : PLAY) + "</div></div></div>";
    },

    // Panel sobre el globo: valor, cargas y retraso de cada vía, y las vías que el escenario deja sin viajes.
    "HTML · Vías": (f) => {
      const t = modelo.momento(f);
      const base = esBase(f);
      const valor = COALESCE(M["Valor en tránsito (€)"](f), 0);
      const vias = porVia(enTransitoA(f, t)).map((g) => ({
        via: g.via,
        v: SUMX(g.filas, (e) => e["Valor (€)"]),
        n: COUNTROWS(g.filas),
        d: AVERAGEX(g.filas, (e) => max2(e["Retraso (días)"], 0)),
      }));
      const hoyVias = vias.map((x) => x.via);
      const viaTop = MAXX(TOPN(1, vias, [(x) => x.v, "DESC"]), (x) => x.via);
      // Las mismas vías en el escenario Base, a la misma hora t.
      const enBase = porVia(enTransitoA(modelo.base(f), t)).map((g) => ({ via: g.via, b: SUMX(g.filas, (e) => e["Valor (€)"]) }));
      const sinViajes = enBase.filter((x) => !hoyVias.some((h) => mismo(h, x.via)));
      const filas = CONCATENATEX(vias, (x) =>
        "<div class='vr'><div class='n'><span>" + cat(nombreVia(x.via)) + "</span><b>" + FORMAT(div(x.v, 1000000), "0.0", "es-ES") + " M€</b></div>"
        + "<div class='bar'><i class='" + (mismo(x.via, viaTop) ? "l" : "") + "' style='width:" + FORMAT(max2(por(DIVIDE(x.v, valor), 100), 4), "0.0", "en-US") + "%'></i></div>"
        + "<div class='s'>" + num(x.n) + (x.n === 1 ? " carga · " : " cargas · ") + (x.d > 2 ? "<s>+" + FORMAT(x.d, "0.0", "es-ES") + " d</s>" : "en plazo") + "</div></div>",
      "", [(x) => x.v, "DESC"]);
      const cerradas = base ? BLANK : CONCATENATEX(sinViajes, (x) =>
        "<div class='vr cerr'><div class='n'><span>" + cat(nombreVia(x.via)) + "</span><span class='cz'>SIN VIAJES</span></div>"
        + "<div class='s'>en la base llevaría " + FORMAT(div(x.b, 1000000), "0.0", "es-ES") + " M€</div></div>",
      "", [(x) => x.b, "DESC"]);
      return "<style>" + CSS_VIAS + "</style><div class='t'>" + "<div class='vp'><div class='h'>Vías hoy<em>valor en tránsito</em></div>"
        + (valor <= 0 ? "<div class='vr'><div class='s'>Nada en tránsito con estos filtros.</div></div>" : cat(filas, cerradas)) + "</div></div>";
    },
  };
}
