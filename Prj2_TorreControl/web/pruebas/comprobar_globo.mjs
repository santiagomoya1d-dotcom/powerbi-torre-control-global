// Compara las filas del globo de la web (modelo.datosGlobo) con las que recibe Deneb en Power BI (esperado_globo.json,
// sacado con sacar_globo.py): mismos viajes y mismos valores en cada situación de contextos.json.
// Uso:  node web/pruebas/comprobar_globo.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crearModelo, filtros } from "../../../docs/js/modelo.js";
import { serie } from "../../../docs/js/formato.js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const datos = JSON.parse(readFileSync(join(AQUI, "..", "..", "..", "docs", "datos", "datos.json"), "utf8"));
const contextos = JSON.parse(readFileSync(join(AQUI, "contextos.json"), "utf8"));
const esperado = JSON.parse(readFileSync(join(AQUI, "esperado_globo.json"), "utf8"));
const modelo = crearModelo(datos);
const igual = (a, b) => (a ?? null) === (b ?? null) || (typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)));

let bien = 0, mal = 0;
for (const c of contextos) {
  const pbi = esperado[c.id];
  if (!pbi) continue;
  const f = { ...c.f };
  if (f.fechas) f.fechas = f.fechas.map(serie);
  modelo.limpiarCache();
  const web = new Map(modelo.datosGlobo(filtros(f)).map((x) => [x.ViajeID, x]));
  const fallos = [];
  if (web.size !== pbi.length) fallos.push(`${web.size} viajes en la web y ${pbi.length} en Power BI`);
  for (const fila of pbi) {
    const w = web.get(fila.ViajeID);
    if (!w) { fallos.push(`falta ${fila.ViajeID}`); continue; }
    for (const [k, v] of Object.entries(fila)) {
      if (k === "En foco" || k === "ViajeID") continue;
      if (!igual(w[k], v)) fallos.push(`${fila.ViajeID} · ${k}: web ${JSON.stringify(w[k])} · Power BI ${JSON.stringify(v)}`);
    }
  }
  if (fallos.length) { mal++; console.log(`✗ ${c.id}: ${fallos.slice(0, 4).join(" | ")}`); } else bien++;
}
console.log(`\nGlobo: ${bien} de ${bien + mal} situaciones con las mismas filas que Power BI`);
process.exit(mal ? 1 : 0);
