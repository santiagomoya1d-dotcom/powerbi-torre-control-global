// Filas que recibe el globo (modelo.datosGlobo) en varias situaciones: las guarda o las compara con las guardadas.
// Sirve para comprobar que un cambio de rendimiento en el modelo no cambia lo que dibuja el globo.
// Uso:  node web/pruebas/globo.mjs --guardar <archivo.json>   |   node web/pruebas/globo.mjs --comparar <archivo.json>
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crearModelo, filtros } from "../../../docs/js/modelo.js";
import { serie } from "../../../docs/js/formato.js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const datos = JSON.parse(readFileSync(join(AQUI, "..", "..", "..", "docs", "datos", "datos.json"), "utf8"));
const contextos = JSON.parse(readFileSync(join(AQUI, "contextos.json"), "utf8"));
const modelo = crearModelo(datos);
const salida = {};
const t0 = performance.now();
for (const c of contextos) {
  const f = { ...c.f };
  if (f.fechas) f.fechas = f.fechas.map(serie);
  modelo.limpiarCache();
  salida[c.id] = modelo.datosGlobo(filtros(f));
}
const ms = performance.now() - t0;
const [modo, archivo] = process.argv.slice(2);
if (modo === "--guardar") {
  writeFileSync(archivo, JSON.stringify(salida));
  console.log(`guardado: ${Object.keys(salida).length} situaciones, ${Object.values(salida).reduce((a, x) => a + x.length, 0)} filas, ${ms.toFixed(0)} ms`);
} else {
  const antes = JSON.parse(readFileSync(archivo, "utf8"));
  const distintos = Object.keys(salida).filter((k) => JSON.stringify(salida[k]) !== JSON.stringify(antes[k]));
  console.log(`${Object.keys(salida).length - distintos.length} de ${Object.keys(salida).length} situaciones iguales · ${ms.toFixed(0)} ms${distintos.length ? " · distintas: " + distintos.join(", ") : ""}`);
  process.exit(distintos.length ? 1 : 0);
}
