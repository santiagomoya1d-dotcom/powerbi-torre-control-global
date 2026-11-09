// Funciones de DAX que usan las medidas HTML, con su comportamiento exacto (blancos, empates, redondeos).
// BLANK es null. Una «tabla» es un array de filas (objetos); el orden de las filas no importa salvo que se diga.
import { BLANK, DIVIDE, FORMAT, esBlank, redondear } from "./formato.js";

export { BLANK, DIVIDE, FORMAT, esBlank };

/** COALESCE: el primer valor que no está en blanco. */
export const COALESCE = (...vs) => { for (const v of vs) if (!esBlank(v)) return v; return BLANK; };

/** ISBLANK */
export const ISBLANK = (v) => esBlank(v);

/** El operador & de DAX: los blancos cuentan como texto vacío. */
export const cat = (...partes) => partes.map((p) => (esBlank(p) ? "" : String(p))).join("");

/** Número de DAX en texto con &: sin formato, como lo convierte DAX (punto decimal y sin ceros sobrantes). */
export const num = (v) => (esBlank(v) ? "" : String(v));

/** ROUND: a la mitad, lejos del cero. */
export const ROUND = (x, d = 0) => (esBlank(x) ? 0 : redondear(x, d));

/** ROUNDUP: lejos del cero. */
export function ROUNDUP(x, d = 0) {
  if (esBlank(x)) return 0;
  const f = 10 ** d;
  const r = Math.ceil(Math.abs(x) * f - 1e-9) / f;
  return x < 0 ? -r : r;
}

/** INT: redondea hacia abajo (INT(-1,5) = -2). */
export const INT = (x) => (esBlank(x) ? 0 : Math.floor(x));

/** MOD: con el signo del divisor. */
export const MOD = (a, b) => { const x = esBlank(a) ? 0 : a; return x - b * Math.floor(x / b); };

export const ABS = (x) => (esBlank(x) ? BLANK : Math.abs(x));

/** TRIM de DAX: quita los espacios de los extremos y deja uno solo entre palabras. */
export const TRIM = (s) => (esBlank(s) ? "" : String(s).replace(/ +/g, " ").replace(/^ | $/g, ""));

/** MID (posición desde 1), LEFT, RIGHT, LEN, SUBSTITUTE (todas las apariciones). */
export const MID = (s, inicio, n) => (esBlank(s) ? "" : String(s).substr(inicio - 1, n));
export const LEFT = (s, n = 1) => (esBlank(s) ? "" : String(s).slice(0, n));
export const RIGHT = (s, n = 1) => (esBlank(s) ? "" : n <= 0 ? "" : String(s).slice(-n));
export const LEN = (s) => (esBlank(s) ? 0 : String(s).length);
export const SUBSTITUTE = (s, viejo, nuevo) => (esBlank(s) ? "" : String(s).split(viejo).join(nuevo));
export const REPT = (s, n) => (n > 0 ? String(s).repeat(Math.floor(n)) : "");
export const UNICHAR = (c) => String.fromCodePoint(c);

/** GENERATESERIES(a, b, paso): filas { Value }. */
export function GENERATESERIES(a, b, paso = 1) {
  const r = [];
  for (let v = a; v <= b + 1e-12; v += paso) r.push({ Value: v });
  return r;
}

/** WEEKDAY(fecha, tipo): tipo 1 = domingo 1 … sábado 7; tipo 2 = lunes 1 … domingo 7; tipo 3 = lunes 0 … domingo 6. */
export function WEEKDAY(serie, tipo = 1) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(serie * 86400000)).getUTCDay();   // 0 = domingo
  if (tipo === 2) return d === 0 ? 7 : d;
  if (tipo === 3) return d === 0 ? 6 : d - 1;
  return d + 1;
}

/**
 * Ordenación por varias claves, como ORDER BY de DAX. Cada criterio: [función, "ASC" | "DESC"] (DESC por defecto en
 * TOPN; ASC por defecto en CONCATENATEX). Los blancos van primero en ASC y al final en DESC, como en DAX.
 */
export function ordenar(filas, criterios, porDefecto = "ASC") {
  const cs = criterios.map((c) => (typeof c === "function" ? [c, porDefecto] : [c[0], c[1] || porDefecto]));
  return filas.map((f, i) => ({ f, i })).sort((a, b) => {
    for (const [g, dir] of cs) {
      const x = g(a.f), y = g(b.f);
      const r = comparar(x, y);
      if (r) return dir === "DESC" ? -r : r;
    }
    return a.i - b.i;
  }).map((x) => x.f);
}

function comparar(x, y) {
  if (esBlank(x) && esBlank(y)) return 0;
  if (esBlank(x)) return -1;
  if (esBlank(y)) return 1;
  if (typeof x === "string" || typeof y === "string") return String(x).localeCompare(String(y), "es", { sensitivity: "accent" });
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * TOPN(n, tabla, criterios…): las n primeras filas según los criterios y, como en DAX, también las que empatan con
 * la última. Sin criterios devuelve n filas cualesquiera (aquí, las n primeras). n <= 0 → tabla vacía.
 */
export function TOPN(n, filas, ...criterios) {
  if (n <= 0 || !filas.length) return [];
  if (!criterios.length) return filas.slice(0, n);
  const orden = ordenar(filas, criterios, "DESC");
  if (orden.length <= n) return orden;
  const cs = criterios.map((c) => (typeof c === "function" ? c : c[0]));
  const ultima = orden[n - 1];
  const empata = (f) => cs.every((g) => comparar(g(f), g(ultima)) === 0);
  let fin = n;
  while (fin < orden.length && empata(orden[fin])) fin++;
  return orden.slice(0, fin);
}

/** CONCATENATEX(tabla, expresión, separador, criterios…): ASC por defecto. */
export function CONCATENATEX(filas, expr, sep = "", ...criterios) {
  const orden = criterios.length ? ordenar(filas, criterios, "ASC") : filas;
  return orden.map((f) => { const v = expr(f); return esBlank(v) ? "" : String(v); }).join(sep);
}

export const SUMX = (filas, g) => { let s = 0, n = 0; for (const f of filas) { const v = g(f); if (!esBlank(v)) { s += v; n++; } } return n ? s : BLANK; };
export const MAXX = (filas, g) => { let m = BLANK; for (const f of filas) { const v = g(f); if (!esBlank(v) && (m === BLANK || comparar(v, m) > 0)) m = v; } return m; };
export const MINX = (filas, g) => { let m = BLANK; for (const f of filas) { const v = g(f); if (!esBlank(v) && (m === BLANK || comparar(v, m) < 0)) m = v; } return m; };
export const AVERAGEX = (filas, g) => { let s = 0, n = 0; for (const f of filas) { const v = g(f); if (!esBlank(v)) { s += v; n++; } } return n ? s / n : BLANK; };
export const COUNTROWS = (filas) => (filas.length ? filas.length : BLANK);

/** SWITCH(TRUE(), cond1, v1, cond2, v2, …, otro): pares [condición, valor] y valor por defecto. */
export function SWITCH(pares, otro = BLANK) {
  for (const [c, v] of pares) if (c) return typeof v === "function" ? v() : v;
  return typeof otro === "function" ? otro() : otro;
}

/** GROUPBY(tabla, clave): grupos { clave, filas } (CURRENTGROUP() = filas), en el orden en que aparecen. */
export function GROUPBY(filas, claveFn) {
  const m = new Map();
  for (const f of filas) {
    const k = claveFn(f);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(f);
  }
  return [...m].map(([clave, grupo]) => ({ clave, filas: grupo }));
}
