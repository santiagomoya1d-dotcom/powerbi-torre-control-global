// Las 23 medidas «HTML · …» del informe, traducidas de DAX: devuelven exactamente el mismo HTML que Power BI
// (lo comprueba Prj2_TorreControl/web/pruebas/comprobar.mjs). Cada grupo vive en su archivo de js/html/.
import { crear as marco } from "./html/marco.js";
import { crear as indicadores } from "./html/indicadores.js";
import { crear as listas } from "./html/listas.js";

export function crearMedidasHtml(modelo) {
  const m = {};
  for (const grupo of [marco, indicadores, listas]) Object.assign(m, grupo(modelo, m));
  return m;
}
