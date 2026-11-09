// FORMAT de DAX para los formatos que usan las medidas del informe. Se reproduce a mano porque Intl no escribe
// lo mismo que Power BI: con es-ES, Intl deja «1234» sin separador y DAX escribe «1.234».
// Las fechas son números de serie de DAX: días desde el 30/12/1899, con la hora en la parte decimal.

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre",
  "noviembre", "diciembre"];
const EPOCA = Date.UTC(1899, 11, 30);

export const BLANK = null;
export const esBlank = (v) => v === null || v === undefined;

/** Fecha de JavaScript (UTC) de un número de serie de DAX. */
export function aFecha(serie) {
  return new Date(EPOCA + Math.round(serie * 86400000));
}

/** Número de serie de DAX de una fecha "aaaa-mm-dd". */
export function serie(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return (Date.UTC(a, m - 1, d) - EPOCA) / 86400000;
}

export const anio = (s) => aFecha(s).getUTCFullYear();
export const mes = (s) => aFecha(s).getUTCMonth() + 1;
export const dia = (s) => aFecha(s).getUTCDate();
export const diaSemana = (s) => aFecha(s).getUTCDay();

/** Redondeo de FORMAT: a la mitad, lejos del cero, con margen para los decimales que el binario no representa. */
export function redondear(x, decimales) {
  const f = 10 ** decimales;
  const r = Math.round(Math.abs(x) * f + 1e-7) / f;
  return x < 0 ? -r : r;
}

function numero(x, decimales, cultura, agrupar) {
  const r = redondear(x, decimales);
  const neg = r < 0 && r !== 0;
  let [ent, dec] = Math.abs(r).toFixed(decimales).split(".");
  const miles = cultura === "es-ES" ? "." : ",";
  const coma = cultura === "es-ES" ? "," : ".";
  if (agrupar) ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, miles);
  return (neg ? "-" : "") + ent + (dec ? coma + dec : "");
}

/** FORMAT(valor, patrón, cultura). Con valor en blanco, FORMAT devuelve texto vacío. */
export function FORMAT(valor, patron, cultura = "es-ES") {
  if (esBlank(valor)) return "";
  switch (patron) {
    case "0": return numero(valor, 0, cultura, false);
    case "0.0": return numero(valor, 1, cultura, false);
    case "0.00": return numero(valor, 2, cultura, false);
    case "#,0": return numero(valor, 0, cultura, true);
    case "0 %": return numero(valor * 100, 0, cultura, false) + " %";
    case "dd/mm": {
      const f = aFecha(valor);
      return String(f.getUTCDate()).padStart(2, "0") + "/" + String(f.getUTCMonth() + 1).padStart(2, "0");
    }
    case "yyyy-mm-dd": {
      const f = aFecha(valor);
      return `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, "0")}-${String(f.getUTCDate()).padStart(2, "0")}`;
    }
    case 'dddd, d "de" mmmm "de" yyyy': {
      const f = aFecha(valor);
      return `${DIAS[f.getUTCDay()]}, ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]} de ${f.getUTCFullYear()}`;
    }
    default:
      throw new Error(`Formato no previsto: ${patron}`);
  }
}

/** DIVIDE de DAX: en blanco si el divisor es 0 o está en blanco. */
export function DIVIDE(a, b, alternativo = null) {
  if (esBlank(b) || b === 0) return alternativo;
  if (esBlank(a)) return null;
  return a / b;
}

/** Comparación de textos como la ordenación de Power BI (sin distinguir mayúsculas). */
export const comparaTexto = (a, b) => String(a).localeCompare(String(b), "es", { sensitivity: "accent" });
