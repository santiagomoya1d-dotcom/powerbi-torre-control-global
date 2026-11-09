// Compara la versión web con Power BI: cada medida en cada situación de contextos.json, contra esperado.json
// (lo que devolvió Power BI, sacado con sacar_esperado.py).
// Uso:  node web/pruebas/comprobar.mjs [--medida "HTML · Fichas"] [--contexto cierre] [--detalle]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crearModelo, filtros } from "../../../docs/js/modelo.js";
import { serie } from "../../../docs/js/formato.js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DOCS = join(AQUI, "..", "..", "..", "docs");
const args = process.argv.slice(2);
const opcion = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const detalle = args.includes("--detalle");

const datos = JSON.parse(readFileSync(join(DOCS, "datos", "datos.json"), "utf8"));
const contextos = JSON.parse(readFileSync(join(AQUI, "contextos.json"), "utf8"));
const esperado = JSON.parse(readFileSync(join(AQUI, "esperado.json"), "utf8"));
const modelo = crearModelo(datos);
// Cada grupo de medidas HTML se carga por separado: si uno falla (p. ej. a medio escribir), los demás se comprueban igual.
const html = {};
for (const g of ["marco", "indicadores", "listas"]) {
  try { Object.assign(html, (await import(`../../../docs/js/html/${g}.js`)).crear(modelo, html)); }
  catch (e) { console.log(`(no se pudo cargar el grupo ${g}: ${String(e).split("\n")[0]})`); }
}
const medida = (n, f) => (n in modelo.M ? modelo.M[n](f) : html[n] ? html[n](f) : undefined);

const aFiltros = (f) => {
  const g = { ...f };
  if (g.fechas) g.fechas = g.fechas.map((x) => (typeof x === "string" ? serie(x) : x));
  return filtros(g);
};

function igual(a, b) {
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  if (typeof b === "boolean") return a === b;
  return a === b;
}

function primeraDiferencia(a, b) {
  a = String(a); b = String(b);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `en el carácter ${i}:\n      web:      …${a.slice(Math.max(0, i - 60), i + 80)}\n      Power BI: …${b.slice(Math.max(0, i - 60), i + 80)}`;
}

const soloMedida = opcion("--medida");
const soloContexto = opcion("--contexto");
const porMedida = {};
let total = 0, malos = 0;
for (const c of contextos) {
  if (soloContexto && c.id !== soloContexto) continue;
  const esp = esperado[c.id];
  if (!esp) continue;
  const f = aFiltros(c.f);
  for (const [nombre, valor] of Object.entries(esp)) {
    if (soloMedida && nombre !== soloMedida) continue;
    const r = medida(nombre, f);
    if (r === undefined) { (porMedida[nombre] ??= { sin: true }); continue; }
    total++;
    const ok = igual(r, valor);
    const pm = (porMedida[nombre] ??= { ok: 0, mal: 0, ejemplo: null });
    if (ok) pm.ok++;
    else {
      pm.mal++; malos++;
      if (!pm.ejemplo) pm.ejemplo = { contexto: c.id, web: r, pbi: valor };
    }
  }
}
const sin = Object.entries(porMedida).filter(([, v]) => v.sin).map(([k]) => k);
for (const [n, v] of Object.entries(porMedida)) {
  if (v.sin) continue;
  if (v.mal) {
    console.log(`✗ ${n}: ${v.mal} de ${v.ok + v.mal} distintas (p. ej. «${v.ejemplo.contexto}»)`);
    if (detalle || typeof v.ejemplo.pbi !== "string") {
      console.log(typeof v.ejemplo.pbi === "string" ? "   " + primeraDiferencia(v.ejemplo.web, v.ejemplo.pbi) : `   web ${v.ejemplo.web} · Power BI ${v.ejemplo.pbi}`);
    }
  } else if (detalle) console.log(`✓ ${n}: ${v.ok}`);
}
console.log(`\n${total - malos} de ${total} valores iguales que en Power BI · ${Object.values(porMedida).filter((v) => !v.sin && !v.mal).length} medidas exactas`);
if (sin.length) console.log(`Sin traducir todavía (${sin.length}): ${sin.join(", ")}`);
process.exit(malos ? 1 : 0);
