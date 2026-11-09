// Medidas HTML del grupo «marco»: las cabeceras y barras laterales de las cuatro páginas, la leyenda del globo, las
// fichas de vehículos, los paneles de ayuda y del calendario, y la hoja de estilo común. Traducidas de las medidas
// «HTML · …» de Medidas.tmdl: el CSS de cada medida va copiado tal cual del DAX y el HTML se arma con las mismas
// piezas, de modo que el texto sale idéntico al de Power BI (lo comprueba Prj2_TorreControl/web/pruebas/comprobar.mjs).
import { COALESCE, FORMAT, MAXX, cat, esBlank, num } from "../dax.js";
import { comparaTexto } from "../formato.js";

// ---------------------------------------------------------------- ayudas
/** El «=» de DAX entre textos: no distingue mayúsculas y el blanco vale lo mismo que "". */
const igual = (a, b) => comparaTexto(esBlank(a) ? "" : a, esBlank(b) ? "" : b) === 0;

/** SELECTEDVALUE ( Tabla[col] ) sobre unas filas: el valor si solo hay uno distinto; si no, en blanco. */
const seleccionado = (filas, col) => { const s = new Set(filas.map((r) => r[col])); return s.size === 1 ? [...s][0] : null; };

const FECHA_LARGA = 'dddd, d "de" mmmm "de" yyyy';

/** Icono de 24 × 24 con trazo redondeado, como los dibuja el DAX: solo cambian el dibujo y el grosor. */
const svg = (dibujo, grosor = "1.7") => "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='"
  + grosor + "' stroke-linecap='round' stroke-linejoin='round'>" + dibujo + "</svg>";

const GLOBO = "<circle cx='12' cy='12' r='9'/><ellipse cx='12' cy='12' rx='4' ry='9'/><path d='M3 12h18'/>";
const ICONO = {
  logo: svg(GLOBO, "1.8"),
  globo: svg(GLOBO),
  barco: svg("<path d='M3 15h18l-2.4 5H5.4z'/><path d='M6 15V9.5h12V15'/><path d='M9.5 9.5V6h5v3.5'/>"),
  avion: svg("<path d='M12 3c.9 0 1.4 1.2 1.4 2.6v4.2l7.1 4.1v1.8l-7.1-2.1v3.6l2.2 1.6V20L12 19l-3.6 1v-1.2l2.2-1.6v-3.6l-7.1 2.1v-1.8l7.1-4.1V5.6C10.6 4.2 11.1 3 12 3z'/>"),
  camion: svg("<path d='M2.5 7h11v9h-11z'/><path d='M13.5 10h4l3 3v3h-7'/><circle cx='6.5' cy='17.5' r='1.8'/><circle cx='17' cy='17.5' r='1.8'/>"),
  calendario: svg("<rect x='3.5' y='5' width='17' height='15' rx='3'/><path d='M3.5 10h17M8 3v4M16 3v4'/>"),
  ayuda: svg("<circle cx='12' cy='12' r='9'/><path d='M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6M12 16.8v.3'/>"),
  caja: svg("<rect x='3' y='6' width='18' height='12' rx='2'/><path d='M7.5 6v12M12 6v12M16.5 6v12'/>"),
  reloj: svg("<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3.5 2'/>"),
  ruta: svg("<circle cx='6' cy='18' r='2'/><circle cx='18' cy='6' r='2'/><path d='M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16'/>"),
  capas: svg("<path d='m12 3 9 5-9 5-9-5z'/><path d='m3 13 9 5 9-5'/>"),
  barras: svg("<path d='M5 20V11M10 20V5M15 20v-6M20 20V9'/>"),
  ancla: svg("<circle cx='12' cy='5.5' r='2'/><path d='M12 7.5V21M5 13a7 7 0 0 0 14 0M8.5 11h7'/>", "2"),
  flecha: svg("<path d='M7 17 17 7M9 7h8v8'/>", "2"),
  cerrar: svg("<path d='M6.5 6.5l11 11M17.5 6.5l-11 11'/>", "2"),
};

// ---------------------------------------------------------------- CSS de cada medida, copiado tal cual del DAX
// Cada tarjeta lleva solo las reglas que usa (la hoja entera es «HTML · Estilo»). Las cuatro cabeceras comparten el
// mismo CSS, y también las cuatro barras laterales.
const CSS_CABECERA = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}.cab{display:flex;justify-content:space-between;align-items:flex-start;height:100%}.ti{font-size:50px;font-weight:400;letter-spacing:-.035em;line-height:1.06;white-space:nowrap}.pl{display:inline-flex;align-items:center;justify-content:center;width:62px;height:40px;border-radius:999px;vertical-align:6px;margin:0 6px}.pl svg{width:21px;height:21px}.pl.g{background:#fff;border:1px solid var(--lin)}.pl.l{background:var(--lime)}.der{display:flex;align-items:center;gap:10px;margin-top:22px}.fe{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--lin);border-radius:999px;padding:7px 18px 7px 8px}.fe .ci{width:34px;height:34px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center}.fe .ci svg{width:17px;height:17px}.fe b{display:block;font-size:14px;font-weight:600}.fe span{display:block;font-size:11.5px;color:var(--mut)}.fe b::first-letter,.fe span::first-letter{text-transform:uppercase}.fic{font-size:11.5px;font-weight:600;border-radius:999px;padding:9px 14px;border:1px dashed var(--fai);color:var(--ink2);white-space:nowrap}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_BARRA = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.lat{background:#161616;border-radius:26px;height:100%;display:flex;flex-direction:column;align-items:center;padding:14px 0}.logo{width:48px;height:48px;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:26px;color:#161616}.logo svg{width:24px;height:24px}.lb{width:46px;height:46px;border-radius:15px;display:flex;align-items:center;justify-content:center;margin:5px 0;color:#9A9E97}.lb svg{width:21px;height:21px}.lb.a{background:#2E2F2D;color:#fff}.sp{flex:1}.av{width:48px;height:48px;border-radius:50%;background:var(--lime);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;letter-spacing:.02em;margin-top:8px;color:#161616}";
const CSS_LEYENDA = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.ly{display:flex;justify-content:center;align-items:center;gap:6px;height:100%}.ly span{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--ink2);background:#fff;border:1px solid var(--lin);border-radius:999px;padding:5px 11px;white-space:nowrap}.ly .a{width:9px;height:9px;border-radius:50%}.ly .ra{width:18px;height:4px;border-radius:2px;background:#161616;box-shadow:0 0 0 2.5px var(--lime)}.ly .rp{width:18px;border-top:1.6px dashed #A3A79F}.ly .rc{width:11px;height:11px;border-radius:50%;border:1.6px dashed var(--coral)}.ly .pv{width:9px;height:9px;transform:rotate(45deg);background:#F3A3C6;border:1.2px solid #161616;border-radius:1px}.ly{gap:5px}.ly span{padding:5px 10px}";
const CSS_FICHAS = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.card{position:relative;background:var(--card);border-radius:28px;padding:18px 20px;height:100%;overflow:hidden;display:flex;flex-direction:column}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.fx{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;height:100%}.fx .card{display:block;padding:14px 16px;border-radius:24px}.fx .top{display:flex;justify-content:space-between;align-items:flex-start}.fx .chip{width:36px;height:36px;border-radius:12px}.fx b{display:block;font-size:34px;font-weight:300;letter-spacing:-.04em;margin-top:6px;line-height:1;font-variant-numeric:tabular-nums}.fx span{font-size:12px;color:var(--ink2)}.fx em{font-style:normal;font-size:10.5px;font-weight:600;border-radius:999px;padding:3px 8px;background:#fff;color:var(--ink2);border:1px solid var(--lin)}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}.fx em{display:inline-flex;align-items:center;gap:4px}.fx em svg{width:12px;height:12px}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_AYUDA = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.lima{background:var(--lime)}.lima .chip{border-color:transparent}.tres{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:8px;margin-top:10px}.it{display:flex;align-items:center;gap:12px;background:var(--card);border-radius:20px;padding:10px 14px 10px 10px}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}.pn{position:relative;margin:14px;height:calc(100% - 28px);background:#fff;border:1px solid var(--lin);border-radius:28px;padding:22px 26px;box-shadow:0 4px 10px rgba(22,22,22,.10);display:flex;flex-direction:column;overflow:hidden}.ph{display:flex;align-items:center;gap:14px;padding-right:56px}.ph .tt{font-size:22px;font-weight:400;letter-spacing:-.03em;flex:1;min-width:0}.ph .tt em{display:block;font-style:normal;font-size:12px;color:var(--mut);letter-spacing:0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pn .x{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--lin);display:flex;align-items:center;justify-content:center}.pn .x svg{width:16px;height:16px}.pf{margin-top:auto;padding-top:10px;font-size:11.5px;color:var(--mut)}.ay{display:grid;grid-template-columns:1fr 1fr;gap:16px 30px;margin-top:20px}.ay>div{display:flex;gap:12px;align-items:flex-start}.ay b{display:block;font-size:13.5px;font-weight:600;margin-bottom:3px}.ay span{font-size:12px;color:var(--ink2);line-height:1.45}.ay .chip{width:34px;height:34px;border-radius:11px}.ay .chip svg{width:17px;height:17px}@keyframes sube{from{transform:scaleY(0)}}";
const CSS_CALENDARIO = "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}.t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}.chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}.al{display:flex;flex-direction:column;gap:8px;height:100%}svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}.pn{position:relative;margin:14px;height:calc(100% - 28px);background:#fff;border:1px solid var(--lin);border-radius:28px;padding:22px 26px;box-shadow:0 4px 10px rgba(22,22,22,.10);display:flex;flex-direction:column;overflow:hidden}.ph{display:flex;align-items:center;gap:14px;padding-right:56px}.ph .tt{font-size:22px;font-weight:400;letter-spacing:-.03em;flex:1;min-width:0}.ph .tt em{display:block;font-style:normal;font-size:12px;color:var(--mut);letter-spacing:0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pn .x{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--lin);display:flex;align-items:center;justify-content:center}.pn .x svg{width:16px;height:16px}.cl{position:absolute;left:26px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut)}.vd{position:absolute;left:26px;right:26px;bottom:20px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--mut);gap:16px}.vd b{color:var(--ink);font-weight:600}@keyframes sube{from{transform:scaleY(0)}}";

/** Principio de cada tarjeta: su CSS y el contenedor .t, que cada medida cierra al final. */
const abre = (css) => "<style>" + css + "</style><div class='t'>";

// ---------------------------------------------------------------- medidas fijas (no dependen de los filtros)
/** HTML · Barra lateral (y · Mar, · Aire, · Carretera): logo, las cuatro páginas con la actual encendida, hueco,
 *  calendario, ayuda y avatar. actual: 0 torre, 1 mar, 2 aire, 3 carretera. */
function barraLateral(actual) {
  const boton = (icono, i) => "<div class='lb" + (i === actual ? " a" : "") + "'>" + icono + "</div>";
  return abre(CSS_BARRA) + "<div class='lat'><div class='logo'>" + ICONO.logo + "</div>"
    + [ICONO.globo, ICONO.barco, ICONO.avion, ICONO.camion].map(boton).join("")
    + "<div class='sp'></div><div class='lb'>" + ICONO.calendario + "</div><div class='lb'>" + ICONO.ayuda + "</div>"
    + "<div class='av'>CD</div></div></div>";
}
const BARRA = [0, 1, 2, 3].map(barraLateral);

/** HTML · Leyenda: leyenda del globo en pastillas. */
const LEYENDA = abre(CSS_LEYENDA)
  + "<div class='ly'><span><i class='a' style='background:#161616'></i>En plazo</span><span><i class='a' style='background:#F0AE3A'></i>3 a 7 días tarde</span>"
  + "<span><i class='a' style='background:#EF5A3C'></i>Más de 7 días tarde</span><span><i class='ra'></i>Ruta con viajes hoy</span>"
  + "<span><i class='rp'></i>Ruta sin viajes</span><span><i class='rc'></i>Paso cerrado</span><span><i class='pv'></i>Proveedor</span></div></div>";

/** HTML · Panel ayuda: cómo leer la torre y qué hace cada botón, en una rejilla de dos columnas. */
const punto = (icono, titulo, texto) => "<div><div class='chip'>" + icono + "</div><div><b>" + titulo + "</b><span>"
  + texto + "</span></div></div>";
const PANEL_AYUDA = abre(CSS_AYUDA)
  + "<div class='pn'><div class='ph'><div class='chip'>" + ICONO.ayuda + "</div><div class='tt'>Cómo leer la torre<em>"
  + "todo lo que ves es del mediodía del día elegido · datos ficticios" + "</em></div></div><div class='x'>" + ICONO.cerrar + "</div>"
  + "<div class='ay'>"
  + punto(ICONO.globo, "El globo", "Cada punto es un buque, un avión o un camión en ruta. Negro, en plazo; ámbar, de 3 a 7 días tarde; coral, más de 7. Arrastra para girarlo y usa la rueda para acercarte.")
  + punto(ICONO.calendario, "El día", "Pincha un día en la curva de abajo o abre el calendario de la barra lateral. Sin elegir nada, la torre enseña su día por defecto.")
  + punto(ICONO.flecha, "El escenario", "La tarjeta negra cuenta el cierre. La flecha cambia entre la base y el cierre; la pastilla blanca deja en el globo solo las cargas desviadas por el Cabo.")
  + punto(ICONO.barco, "La barra lateral", "Globo, barco, avión y camión son las páginas: la torre y una por modo de transporte, con sus tablas y gráficos. Abajo, el calendario y esta ayuda.")
  + punto(ICONO.caja, "Las tarjetas", "Los tres puntos de cada tarjeta abren el detalle que hay detrás del número: cargas, vías, orígenes y retrasos.")
  + punto(ICONO.capas, "Los filtros", "Las pastillas de arriba filtran por categoría y por modo de transporte (otro clic lo quita); en el globo se atenúan los barcos que no llevan esa categoría. «Base» y «Cierre de Suez» cambian el escenario.")
  + punto(ICONO.barras, "Las llegadas", "Lo que entra en el almacén cada día de los próximos 14 o 30 días: lima, a tiempo; negro, con retraso.")
  + "</div><div class='pf'>Torre de control de aprovisionamiento · simulación con datos inventados.</div></div></div>";

/** HTML · Estilo: la hoja de estilo completa de las tarjetas, de referencia (sin <style>), línea a línea como en DAX. */
const ESTILO = [
  "html,body{margin:0;padding:0;overflow:hidden;background:transparent}*{box-sizing:border-box}",
  ".t{--ink:#161616;--ink2:#3B3D3A;--mut:#6F746C;--fai:#B9BDB5;--lin:#E2E5DF;--card:#F7F8F5;--lime:#E2F27A;--coral:#EF5A3C;--amber:#F0AE3A;font-family:'Segoe UI Variable Display','Segoe UI Variable Text','Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;height:100vh}",
  ".card{position:relative;background:var(--card);border-radius:28px;padding:18px 20px;height:100%;overflow:hidden;display:flex;flex-direction:column}",
  ".hd{display:flex;align-items:center;gap:12px}.hd .tt{font-size:15px;font-weight:600;letter-spacing:-.01em;flex:1;min-width:0}",
  ".hd .tt em{display:block;font-style:normal;font-size:11.5px;font-weight:400;color:var(--mut);letter-spacing:0;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".chip{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;flex:none}.chip svg{width:19px;height:19px}",
  ".mas{opacity:.8;font-size:18px;line-height:1;letter-spacing:-1px;transform:rotate(90deg)}",
  ".big{display:flex;align-items:baseline;gap:8px;margin-top:6px;white-space:nowrap}.card>.big{margin-bottom:auto}",
  ".big b{font-size:52px;font-weight:300;letter-spacing:-.045em;line-height:.9;font-variant-numeric:tabular-nums}",
  ".big u{text-decoration:none;font-size:22px;font-weight:400;letter-spacing:-.02em;margin-left:-4px}.big i{font-style:normal;font-size:14px;color:var(--mut)}",
  ".bdg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;border-radius:999px;padding:5px 10px;background:var(--lime);align-self:center;margin-left:auto;white-space:nowrap}",
  ".bdg.mal{background:#FBE0D8;color:#B8361B}.bdg.neu{background:rgba(255,255,255,.6)}.bdg.neg{background:var(--ink);color:var(--lime)}.bdg svg{width:13px;height:13px}",
  ".caps{display:flex;gap:7px;margin-top:10px}.cap{flex:1;height:34px;border-radius:999px}.cap.f{background:var(--ink)}.cap.v{border:1.4px dashed var(--fai)}",
  ".cap.f{animation:ap .5s cubic-bezier(.2,.8,.2,1) both}.cap:nth-child(2){animation-delay:.04s}.cap:nth-child(3){animation-delay:.08s}.cap:nth-child(4){animation-delay:.12s}.cap:nth-child(5){animation-delay:.16s}.cap:nth-child(6){animation-delay:.2s}.cap:nth-child(7){animation-delay:.24s}.cap:nth-child(8){animation-delay:.28s}.cap:nth-child(9){animation-delay:.32s}.cap:nth-child(10){animation-delay:.36s}@keyframes ap{from{opacity:0;transform:scale(.6)}}",
  ".pie{margin-top:9px;font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".lima{background:var(--lime)}.lima .chip{border-color:transparent}.lima .cap.v{border-color:rgba(22,22,22,.35)}.lima .big i,.lima .pie{color:rgba(22,22,22,.62)}",
  ".cc{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px}.cc.ap{opacity:.28}",
  ".tr{width:22px;height:60px;border-radius:999px;border:1.3px dashed var(--fai);position:relative}",
  ".tr i{position:absolute;left:3px;right:3px;bottom:3px;min-height:13px;max-height:calc(100% - 6px);border-radius:999px;background:var(--ink);transform-origin:bottom;animation:sube .9s cubic-bezier(.2,.8,.2,1) both}",
  ".tr i.l{background:var(--lime);box-shadow:inset 0 0 0 1.4px var(--ink)}.tr i.o{display:none}",
  ".cc span{font-size:10.5px;color:var(--ink2);margin-top:4px;white-space:nowrap}.cc em{font-style:normal;font-size:10px;color:var(--mut);font-variant-numeric:tabular-nums}",
  "@keyframes sube{from{transform:scaleY(0)}}@keyframes crece{from{transform:scaleX(0)}}",
  ".tres{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:8px;margin-top:10px}.mi{background:#fff;border-radius:18px;padding:6px 12px 7px;white-space:nowrap}",
  ".mi b{font-size:20px;font-weight:500;line-height:1.25;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.mi s{text-decoration:none;font-size:11px;font-weight:600;margin-left:6px;color:#4E6B00}",
  ".mi s.m{color:#B8361B}.mi span{display:block;font-size:11px;line-height:1.2;color:var(--mut);margin-top:1px}",
  ".osc{background:#161616;color:#fff;padding:18px 22px}.osc .et{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#A3A79F;gap:10px}",
  ".pto{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--coral);margin-right:8px;animation:pulso 1.6s infinite}",
  "@keyframes pulso{0%{box-shadow:0 0 0 0 rgba(239,90,60,.7)}70%{box-shadow:0 0 0 9px rgba(239,90,60,0)}100%{box-shadow:0 0 0 0 rgba(239,90,60,0)}}",
  ".flc{width:36px;height:36px;border-radius:50%;background:var(--lime);display:flex;align-items:center;justify-content:center;flex:none;color:#161616}.flc svg{width:17px;height:17px}",
  ".h1{font-size:26px;font-weight:400;letter-spacing:-.03em;line-height:1.08;margin-top:2px}.osc>.h1{margin-bottom:auto}.h1 span{color:var(--lime)}",
  ".osc .caps{margin-top:12px;gap:6px}.osc .cap{height:24px}.osc .cap.f{background:var(--lime)}.osc .cap.v{border-color:#5A5D57}",
  ".osc .cap.p{background:linear-gradient(90deg,var(--lime) var(--p),transparent var(--p));border:1.4px dashed #5A5D57}",
  ".fr{display:flex;justify-content:space-between;font-size:11.5px;color:#8D918A;margin-top:6px}",
  ".bt{display:flex;align-items:center;justify-content:space-between;background:#fff;color:#161616;border-radius:999px;padding:9px 12px 9px 20px;margin-top:12px;font-size:14px;font-weight:500;white-space:nowrap}",
  ".bt b{font-weight:700}.bt svg{width:15px;height:15px}",
  ".fx{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;height:100%}.fx .card{display:block;padding:14px 16px;border-radius:24px}",
  ".fx .top{display:flex;justify-content:space-between;align-items:flex-start}.fx .chip{width:36px;height:36px;border-radius:12px}",
  ".fx b{display:block;font-size:34px;font-weight:300;letter-spacing:-.04em;margin-top:6px;line-height:1;font-variant-numeric:tabular-nums}.fx span{font-size:12px;color:var(--ink2)}",
  ".fx em{font-style:normal;font-size:10.5px;font-weight:600;border-radius:999px;padding:3px 8px;background:#fff;color:var(--ink2);border:1px solid var(--lin)}",
  ".al{display:flex;flex-direction:column;gap:8px;height:100%}.ca{background:var(--card);border-radius:24px;padding:16px 18px}",
  ".res{display:flex;align-items:baseline;gap:10px;margin-top:10px}.res b{font-size:44px;font-weight:300;letter-spacing:-.045em;line-height:1}.res .rl{font-size:13px;color:var(--ink2);line-height:1.25}",
  ".it{display:flex;align-items:center;gap:12px;background:var(--card);border-radius:20px;padding:10px 14px 10px 10px}",
  ".ini{width:40px;height:40px;border-radius:13px;background:#fff;border:1px solid var(--lin);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;position:relative;flex:none}",
  ".ini i{position:absolute;right:-3px;top:-3px;width:11px;height:11px;border-radius:50%;border:2px solid var(--card)}",
  ".it .tx{flex:1;min-width:0}.t1{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".ct{font-size:10.5px;font-weight:500;color:var(--ink2);background:#fff;border:1px solid var(--lin);border-radius:999px;padding:1px 7px;margin-left:7px;vertical-align:1px}",
  ".t2{font-size:11.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}",
  ".dd{font-size:12px;font-weight:600;border-radius:999px;padding:4px 9px;white-space:nowrap}.dd.rot{background:var(--ink);color:var(--lime)}.dd.ret{background:#fff;border:1px solid var(--lin)}",
  ".ok{font-size:13px;color:var(--ink2)}",
  ".vp{background:rgba(255,255,255,.82);border:1px solid var(--lin);border-radius:22px;padding:14px 14px 6px}",
  ".vp .h{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;font-weight:600;margin-bottom:6px}.vp .h em{font-style:normal;font-size:11px;color:var(--mut);font-weight:400}",
  ".vr{padding:7px 0 8px;border-top:1px solid var(--lin)}.vr .n{display:flex;justify-content:space-between;font-size:12.5px;font-weight:500;white-space:nowrap}.vr .n b{font-weight:600;font-variant-numeric:tabular-nums}",
  ".vr .bar{height:8px;border-radius:999px;border:1px dashed var(--fai);margin:6px 0 4px;position:relative}",
  ".vr .bar i{position:absolute;left:-1px;top:-1px;bottom:-1px;border-radius:999px;background:var(--ink);transform-origin:left;animation:crece .9s cubic-bezier(.2,.8,.2,1) both}",
  ".vr .bar i.l{background:var(--lime);box-shadow:inset 0 0 0 1px var(--ink)}.vr .s{font-size:11px;color:var(--mut)}.vr .s s{text-decoration:none;color:#B8361B;font-weight:600}",
  ".vr.cerr .n{color:#B8361B}.cz{font-size:10px;font-weight:700;letter-spacing:.04em;color:#fff;background:var(--coral);border-radius:999px;padding:2px 7px}",
  ".ley{display:flex;align-items:center;gap:16px;font-size:12px;color:var(--ink2);white-space:nowrap}.ley i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}",
  ".sel{background:#fff;border:1px solid var(--lin);border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:500;white-space:nowrap}",
  ".tot{font-size:12px;color:var(--mut)}.tot b{color:var(--ink);font-weight:600}",
  "svg .b{animation:sube .9s cubic-bezier(.2,.8,.2,1) both;transform-box:fill-box;transform-origin:bottom}",
  ".ly{display:flex;justify-content:center;align-items:center;gap:6px;height:100%}",
  ".ly span{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--ink2);background:#fff;border:1px solid var(--lin);border-radius:999px;padding:5px 11px;white-space:nowrap}",
  ".ly .a{width:9px;height:9px;border-radius:50%}.ly .ra{width:18px;height:4px;border-radius:2px;background:#161616;box-shadow:0 0 0 2.5px var(--lime)}",
  ".ly .rp{width:18px;border-top:1.6px dashed #A3A79F}.ly .rc{width:11px;height:11px;border-radius:50%;border:1.6px dashed var(--coral)}",
  ".cab{display:flex;justify-content:space-between;align-items:flex-start;height:100%}",
  ".ti{font-size:50px;font-weight:400;letter-spacing:-.035em;line-height:1.06;white-space:nowrap}",
  ".pl{display:inline-flex;align-items:center;justify-content:center;width:62px;height:40px;border-radius:999px;vertical-align:6px;margin:0 6px}.pl svg{width:21px;height:21px}",
  ".pl.g{background:#fff;border:1px solid var(--lin)}.pl.l{background:var(--lime)}.der{display:flex;align-items:center;gap:10px;margin-top:22px}",
  ".fe{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--lin);border-radius:999px;padding:7px 18px 7px 8px}",
  ".fe .ci{width:34px;height:34px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center}.fe .ci svg{width:17px;height:17px}",
  ".fe b{display:block;font-size:14px;font-weight:600}.fe span{display:block;font-size:11.5px;color:var(--mut)}.fe b::first-letter,.fe span::first-letter{text-transform:uppercase}",
  ".fic{font-size:11.5px;font-weight:600;border-radius:999px;padding:9px 14px;border:1px dashed var(--fai);color:var(--ink2);white-space:nowrap}",
  ".lat{background:#161616;border-radius:26px;height:100%;display:flex;flex-direction:column;align-items:center;padding:14px 0}",
  ".logo{width:48px;height:48px;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:26px;color:#161616}.logo svg{width:24px;height:24px}",
  ".lb{width:46px;height:46px;border-radius:15px;display:flex;align-items:center;justify-content:center;margin:5px 0;color:#9A9E97}.lb svg{width:21px;height:21px}.lb.a{background:#2E2F2D;color:#fff}",
  ".sp{flex:1}.av{width:48px;height:48px;border-radius:50%;background:var(--lime);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;letter-spacing:.02em;margin-top:8px;color:#161616}",
  ".lb.al{background:var(--coral);color:#fff}.bt.on{background:var(--lime)}",
  ".pn{position:relative;margin:14px;height:calc(100% - 28px);background:#fff;border:1px solid var(--lin);border-radius:28px;padding:22px 26px;box-shadow:0 4px 10px rgba(22,22,22,.10);display:flex;flex-direction:column;overflow:hidden}",
  ".ph{display:flex;align-items:center;gap:14px;padding-right:56px}.ph .tt{font-size:22px;font-weight:400;letter-spacing:-.03em;flex:1;min-width:0}.ph .tt em{display:block;font-style:normal;font-size:12px;color:var(--mut);letter-spacing:0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".pn .x{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;background:var(--card);border:1px solid var(--lin);display:flex;align-items:center;justify-content:center}.pn .x svg{width:16px;height:16px}",
  ".pk{display:flex;gap:8px;margin-top:16px}.pk div{background:var(--card);border-radius:16px;padding:8px 16px 9px}.pk b{font-size:22px;font-weight:400;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.pk span{display:block;font-size:11px;color:var(--mut)}.pk .lima span{color:rgba(22,22,22,.62)}",
  ".tb{width:100%;border-collapse:collapse;margin-top:14px;font-size:12.5px}.tb th{text-align:left;font-weight:500;color:var(--mut);font-size:11px;padding:0 10px 7px;border-bottom:1px solid var(--lin);white-space:nowrap}",
  ".tb td{padding:6px 10px;border-bottom:1px solid var(--lin);white-space:nowrap;max-width:230px;overflow:hidden;text-overflow:ellipsis}.tb .n{text-align:right;font-variant-numeric:tabular-nums}.tb td:first-child,.tb th:first-child{padding-left:0}.tb td:last-child,.tb th:last-child{padding-right:0}",
  ".tb .gr{color:var(--mut)}.tb tr.cerr td{color:#B8361B}.mb{display:inline-block;width:64px;height:6px;border-radius:999px;background:var(--lin);vertical-align:middle;margin-right:8px;position:relative;overflow:hidden}.mb i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--ink)}.mb i.l{background:#9DB300}",
  ".dd.am{background:#FCEBC8;color:#8A5A00}.dd.co{background:#FBE0D8;color:#B8361B}.dd.pl{background:var(--card);color:var(--mut);font-weight:500}",
  ".pf{margin-top:auto;padding-top:10px;font-size:11.5px;color:var(--mut)}",
  ".ay{display:grid;grid-template-columns:1fr 1fr;gap:16px 30px;margin-top:20px}.ay>div{display:flex;gap:12px;align-items:flex-start}.ay b{display:block;font-size:13.5px;font-weight:600;margin-bottom:3px}.ay span{font-size:12px;color:var(--ink2);line-height:1.45}.ay .chip{width:34px;height:34px;border-radius:11px}.ay .chip svg{width:17px;height:17px}",
  ".cl{position:absolute;left:26px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut)}.vd{position:absolute;left:26px;right:26px;bottom:20px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--mut);gap:16px}.vd b{color:var(--ink);font-weight:600}",
  ".fx em{display:inline-flex;align-items:center;gap:4px}.fx em svg{width:12px;height:12px}",
  ".ly .pv{width:9px;height:9px;transform:rotate(45deg);background:#F3A3C6;border:1.2px solid #161616;border-radius:1px}",
  ".ly{gap:5px}.ly span{padding:5px 10px}",
].join("");

// ---------------------------------------------------------------- piezas de las medidas que dependen de los filtros
/** Título de la cabecera en dos líneas: «texto (pastilla lima) línea 1 / y (pastilla blanca) línea 2». */
const titulo = (texto, lima, linea1, blanca, linea2) => texto + "<span class='pl l'>" + lima + "</span>" + linea1
  + "<br>y<span class='pl g'>" + blanca + "</span>" + linea2;

/** Ficha de HTML · Fichas: icono (con una pastilla opcional al lado), la cifra y su rótulo en singular o plural. */
const ficha = (icono, pastilla, n, uno, varios) => "<div class='card'><div class='top'><div class='chip'>" + icono
  + "</div>" + pastilla + "</div><b>" + num(n) + "</b><span>" + (n === 1 ? uno : varios) + "</span></div>";

export function crear(modelo, html) {
  const { T, M } = modelo;

  /** HTML · Cabecera (y · Mar, · Aire, · Carretera): título, aviso de datos ficticios y el día que se ve. Debajo del
   *  día va la nota de la torre si se ve su día y su escenario por defecto; si no, la descripción del escenario. */
  function cabecera(f, ti) {
    const ficticios = igual(seleccionado(T.Torre, "Datos ficticios"), "Sí");
    const esc = modelo.escenarioElegido(f);
    // LOOKUPVALUE: busca entre las filas de Escenarios que dejan ver los filtros
    const descEsc = seleccionado(T.Escenarios.filter((e) => (!f.escenario || f.escenario.has(e.Escenario))
      && igual(e.Escenario, esc)), "Descripción");
    const nota = !modelo.calendarioFiltrado(f) && igual(esc, MAXX(T.Torre, (t) => t["Escenario por defecto"]))
      ? seleccionado(T.Torre, "Nota de la fecha") : null;
    const sub = !igual(nota, "") ? nota : descEsc;
    const fecha = FORMAT(modelo.fechaElegida(f), FECHA_LARGA, "es-ES");
    return abre(CSS_CABECERA) + "<div class='cab'><div class='ti'>" + ti + "</div>"
      + "<div class='der'>" + (ficticios ? "<span class='fic'>Datos ficticios · simulación</span>" : "")
      + "<div class='fe'><div class='ci'>" + ICONO.calendario + "</div><div><b>" + fecha + "</b><span>" + cat(sub)
      + "</span></div></div></div></div></div>";
  }

  return {
    "HTML · Cabecera": (f) => {
      const nombre = COALESCE(seleccionado(T.Torre, "Nombre"), "Torre de control");
      return cabecera(f, titulo(cat(nombre), ICONO.globo, "de la red", ICONO.barco, "sus rutas"));
    },
    "HTML · Cabecera · Mar": (f) => cabecera(f, titulo("Por mar", ICONO.barco, "buques", ICONO.caja, "puertos")),
    "HTML · Cabecera · Aire": (f) => cabecera(f, titulo("Por aire", ICONO.avion, "vuelos", ICONO.reloj, "urgencias")),
    "HTML · Cabecera · Carretera": (f) => cabecera(f, titulo("Por carretera", ICONO.camion, "camiones", ICONO.ruta, "proveedores")),

    "HTML · Barra lateral": () => BARRA[0],
    "HTML · Barra lateral · Mar": () => BARRA[1],
    "HTML · Barra lateral · Aire": () => BARRA[2],
    "HTML · Barra lateral · Carretera": () => BARRA[3],

    "HTML · Leyenda": () => LEYENDA,

    // Buques, vuelos y camiones en ruta el día elegido; junto al barco, los buques fondeados esperando atraque.
    "HTML · Fichas": (f) => {
      const buques = COALESCE(M["Buques en el mar"](f), 0);
      const fondeados = COALESCE(M["Buques fondeados"](f), 0);
      const vuelos = COALESCE(M["Vuelos en el aire"](f), 0);
      const camiones = COALESCE(M["Camiones en ruta"](f), 0);
      const ancla = fondeados > 0
        ? "<em title='" + num(fondeados) + (fondeados === 1 ? " buque fondeado" : " buques fondeados")
          + " frente a puerto, esperando atraque'>" + ICONO.ancla + num(fondeados) + "</em>"
        : "";
      return abre(CSS_FICHAS) + "<div class='fx'>"
        + ficha(ICONO.barco, ancla, buques, "buque en el mar", "buques en el mar")
        + ficha(ICONO.avion, "", vuelos, "vuelo en el aire", "vuelos en el aire")
        + ficha(ICONO.camion, "", camiones, "camión en ruta", "camiones en ruta")
        + "</div></div>";
    },

    "HTML · Panel ayuda": () => PANEL_AYUDA,

    // Rótulos del panel del calendario y el día elegido (los meses y los días son segmentadores nativos encima).
    "HTML · Panel calendario": (f) => abre(CSS_CALENDARIO)
      + "<div class='pn'><div class='ph'><div class='chip'>" + ICONO.calendario + "</div><div class='tt'>Elegir día<em>"
      + "un mes y un día; también vale pinchar un día en la curva de abajo" + "</em></div></div><div class='x'>" + ICONO.cerrar + "</div>"
      + "<div class='cl' style='top:96px'>Mes</div><div class='cl' style='top:216px'>Día</div>"
      + "<div class='vd'><span>Viendo el <b>" + FORMAT(modelo.fechaElegida(f), FECHA_LARGA, "es-ES") + "</b></span><span>"
      + (modelo.calendarioFiltrado(f) ? "Quita la selección para volver al día por defecto" : "Es el día por defecto de la torre")
      + "</span></div></div></div>",

    "HTML · Estilo": () => ESTILO,
  };
}
