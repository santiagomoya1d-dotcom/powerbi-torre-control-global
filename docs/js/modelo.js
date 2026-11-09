// El modelo de la Torre en JavaScript: tablas, relaciones, filtros y medidas de cálculo, traducidos del DAX de
// Prj2_TorreControl.SemanticModel/definition/tables/Medidas.tmdl. Cada medida conserva su nombre de Power BI y se
// comprueba contra lo que devuelve Power BI (Prj2_TorreControl/web/pruebas).
//
// Filtros (lo que en Power BI ponen los segmentadores, los clics y las filas de un visual). null = sin filtro.
//   escenario  Set de Escenarios[Escenario]          → Viajes → Envios, Posiciones
//   modos      Set de Modos[Modo]                    → Viajes → Envios, Posiciones
//   rutas      Set de Rutas[RutaID]                  → Viajes → Envios, Posiciones
//   viajes     Set de Viajes[ViajeID]
//   categorias Set de 'Categorías'[Nombre corto]     → Envios
//   proveedores Set de Proveedores[ProveedorID]      → Envios
//   ciudades   Set de Proveedores[Ciudad]            → Envios
//   envios     Set de Envios[EnvioID]
//   fechas     Set de Calendario[Fecha] (serie)      → 'Envios por día'
//   mesAnio    Set de Calendario[Mes y año]
//   diaMes     Set de Calendario[Día del mes]
//   foco       true si 'Foco desvío' está filtrado (pastilla «solo desviadas»)
//   horizonte  Set de Horizonte[Horizonte] («14 días», «30 días»)
import { BLANK, DIVIDE, FORMAT, anio, comparaTexto, dia, esBlank, mes } from "./formato.js";

const CLAVES = ["escenario", "modos", "rutas", "viajes", "categorias", "proveedores", "ciudades", "envios", "fechas",
  "mesAnio", "diaMes", "horizonte"];

/** Filtros completos a partir de unos parciales (los Set se aceptan también como arrays). */
export function filtros(f = {}) {
  const r = { foco: !!f.foco };
  for (const k of CLAVES) r[k] = f[k] == null ? null : f[k] instanceof Set ? f[k] : new Set(f[k]);
  return r;
}

/** Los mismos filtros con algunos cambiados, como CALCULATE: con = { escenario: ["Base"] }; null quita el filtro. */
export function con(f, cambios) {
  const r = { ...f };
  for (const [k, v] of Object.entries(cambios)) {
    if (k === "foco") r.foco = !!v;
    else r[k] = v == null ? null : v instanceof Set ? v : new Set(v);
  }
  return r;
}

function clave(f) {
  let s = f.foco ? "F" : "";
  for (const k of CLAVES) if (f[k]) s += `|${k}:${[...f[k]].sort().join(",")}`;
  return s;
}

function tabla(cols) {
  const nombres = Object.keys(cols);
  const n = cols[nombres[0]].length;
  const filas = new Array(n);
  for (let i = 0; i < n; i++) {
    const r = {};
    for (const c of nombres) r[c] = cols[c][i];
    filas[i] = r;
  }
  return filas;
}

const suma = (xs, g) => { let s = 0, n = 0; for (const x of xs) { const v = g(x); if (!esBlank(v)) { s += v; n++; } } return n ? s : BLANK; };
const maximo = (xs, g) => { let m = BLANK; for (const x of xs) { const v = g(x); if (!esBlank(v) && (m === BLANK || v > m)) m = v; } return m; };
const minimo = (xs, g) => { let m = BLANK; for (const x of xs) { const v = g(x); if (!esBlank(v) && (m === BLANK || v < m)) m = v; } return m; };
const media = (xs, g) => { let s = 0, n = 0; for (const x of xs) { const v = g(x); if (!esBlank(v)) { s += v; n++; } } return n ? s / n : BLANK; };
const cuenta = (xs) => (xs.length ? xs.length : BLANK);
const distintos = (xs, g) => { const s = new Set(); for (const x of xs) s.add(g(x)); return s.size ? s.size : BLANK; };
/** SELECTEDVALUE: el valor si solo hay uno distinto; si no, el alternativo. */
const unico = (xs, g, alt = BLANK) => { const s = new Set(xs.map(g)); return s.size === 1 ? [...s][0] : alt; };

export { suma, maximo, minimo, media, cuenta, distintos, unico };

export function crearModelo(datos) {
  const T = {};
  for (const [nombre, cols] of Object.entries(datos)) T[nombre] = tabla(cols);
  for (const c of T.Calendario) c["Día del mes"] = dia(c.Fecha);              // columna calculada DAY ( Calendario[Fecha] )
  T.Horizonte = [{ Horizonte: "14 días", "Días": 14 }, { Horizonte: "30 días", "Días": 30 }];
  T["Foco desvío"] = [{ "Foco desvío": "Solo desviadas" }];

  const viaje = new Map(T.Viajes.map((v) => [v.ViajeID, v]));
  const categoria = new Map(T["Categorías"].map((c) => [c["Categoría"], c]));
  const proveedor = new Map(T.Proveedores.map((p) => [p.ProveedorID, p]));
  const ruta = new Map(T.Rutas.map((r) => [r.RutaID, r]));
  for (const e of T.Envios) { e._v = viaje.get(e.ViajeID); e._c = categoria.get(e["Categoría"]); e._p = proveedor.get(e.ProveedorID); }
  for (const p of T.Posiciones) p._v = viaje.get(p.ViajeID);
  for (const v of T.Viajes) v._r = ruta.get(v.RutaID);
  const torre = T.Torre[0];
  const d0Cal = T.Calendario[0].Fecha;
  const d1Cal = T.Calendario[T.Calendario.length - 1].Fecha;
  const alternativas = new Set(T.Rutas.map((r) => r.Alternativa).filter((a) => !esBlank(a) && a !== ""));

  // ---------------------------------------------------------------- filas visibles con unos filtros
  const pasaViaje = (v, f) => !!v && (!f.escenario || f.escenario.has(v.Escenario)) && (!f.modos || f.modos.has(v.Modo))
    && (!f.rutas || f.rutas.has(v.RutaID)) && (!f.viajes || f.viajes.has(v.ViajeID));
  const pasaEnvio = (e, f) => pasaViaje(e._v, f) && (!f.categorias || f.categorias.has(e._c["Nombre corto"]))
    && (!f.proveedores || f.proveedores.has(e.ProveedorID)) && (!f.ciudades || f.ciudades.has(e._p.Ciudad))
    && (!f.envios || f.envios.has(e.EnvioID));

  const cache = new Map();
  const memo = (tipo, f, calc) => {
    const k = tipo + "#" + clave(f);
    if (!cache.has(k)) cache.set(k, calc());
    return cache.get(k);
  };
  // Índices por viaje y por envío: con un solo viaje o envío en el filtro (filas del globo, clic en una fila de la
  // tabla) se parte de sus filas en vez de recorrer la tabla entera. El filtro que se aplica después es el mismo.
  const agrupar = (filas, k) => { const m = new Map(); for (const x of filas) { if (!m.has(x[k])) m.set(x[k], []); m.get(x[k]).push(x); } return m; };
  const enviosPorViaje = agrupar(T.Envios, "ViajeID");
  const posicionesPorViaje = agrupar(T.Posiciones, "ViajeID");
  const envioPorId = new Map(T.Envios.map((e) => [e.EnvioID, e]));
  const unoDe = (s) => (s && s.size === 1 ? s.values().next().value : undefined);
  const baseEnvios = (f) => {
    const e = unoDe(f.envios);
    if (e !== undefined) return envioPorId.has(e) ? [envioPorId.get(e)] : [];
    const v = unoDe(f.viajes);
    return v !== undefined ? enviosPorViaje.get(v) || [] : T.Envios;
  };
  const basePosiciones = (f) => { const v = unoDe(f.viajes); return v !== undefined ? posicionesPorViaje.get(v) || [] : T.Posiciones; };
  const Envios = (f) => memo("Envios", f, () => baseEnvios(f).filter((e) => pasaEnvio(e, f)));
  const Posiciones = (f) => memo("Posiciones", f, () => basePosiciones(f).filter((p) => pasaViaje(p._v, f)));
  const Viajes = (f) => memo("Viajes", f, () => T.Viajes.filter((v) => pasaViaje(v, f)));
  /** VALUES ( Calendario[Fecha] ) con los filtros del calendario. */
  const Calendario = (f) => memo("Calendario", f, () => T.Calendario.filter((c) => (!f.fechas || f.fechas.has(c.Fecha))
    && (!f.mesAnio || f.mesAnio.has(c["Mes y año"])) && (!f.diaMes || f.diaMes.has(c["Día del mes"]))));
  const calendarioFiltrado = (f) => !!(f.fechas || f.mesAnio || f.diaMes);

  // ---------------------------------------------------------------- 1 · Momento
  function fechaElegida(f) {
    const d0 = !esBlank(torre["Fecha por defecto"]) ? torre["Fecha por defecto"] : d1Cal;
    const cand = Calendario(f);
    const n = cand.length;
    let r;
    if (n === 1) r = cand[0].Fecha;
    else if (n === 0 || !calendarioFiltrado(f)) r = d0;
    else if (f.diaMes) r = maximo(cand.filter((c) => anio(c.Fecha) === anio(d0) && mes(c.Fecha) === mes(d0)), (c) => c.Fecha);
    else r = maximo(cand.filter((c) => dia(c.Fecha) <= dia(d0)), (c) => c.Fecha);
    return esBlank(r) ? d0 : r;
  }
  const momento = (f) => fechaElegida(f) + 0.5;
  const escenarioElegido = (f) => (f.escenario && f.escenario.size === 1 ? [...f.escenario][0] : torre["Escenario por defecto"]);

  const enTransito = (f) => { const t = momento(f); return Envios(f).filter((e) => e.Salida <= t && e.Entrega > t); };
  const entregados30 = (f) => { const t = momento(f); return Envios(f).filter((e) => e.Entrega > t - 30 && e.Entrega <= t); };
  const posicionesDelDia = (f) => { const d = fechaElegida(f); return Posiciones(f).filter((p) => p.Fecha === d); };
  const base = (f) => con(f, { escenario: ["Base"] });
  const sinCatProv = (f) => con(f, { categorias: null, proveedores: null, ciudades: null });

  /** 'Envios por día': valor en tránsito a mediodía de cada día del calendario, por día (índice 0 = primer día). */
  function curva(f) {
    return memo("curva", f, () => {
      // Cada envío suma su valor a los días cuyo mediodía cae entre su salida y su entrega (GENERATESERIES de la tabla
      // calculada); con diferencias acumuladas basta una pasada. Sin filas ese día, la suma queda en blanco, como en DAX.
      const n = d1Cal - d0Cal + 1;
      const valor = new Float64Array(n + 1);
      const filas = new Int32Array(n + 1);
      for (const e of Envios(f)) {
        const desde = Math.max(Math.ceil(e.Salida - 0.5), d0Cal);
        const hasta = Math.min(Math.ceil(e.Entrega - 0.5) - 1, d1Cal);
        if (hasta < desde) continue;
        valor[desde - d0Cal] += e["Valor (€)"];
        valor[hasta - d0Cal + 1] -= e["Valor (€)"];
        filas[desde - d0Cal] += 1;
        filas[hasta - d0Cal + 1] -= 1;
      }
      const salida = new Array(n);
      let v = 0, c = 0;
      for (let i = 0; i < n; i++) { v += valor[i]; c += filas[i]; salida[i] = c > 0 ? Math.round(v) : BLANK; }
      return salida;
    });
  }

  const M = {
    "Fecha elegida": fechaElegida,
    "Momento": momento,
    "Escenario elegido": escenarioElegido,
    "Título del momento": (f) => {
      const nota = unico(T.Torre, (t) => t["Nota de la fecha"]);
      const pista = Calendario(f).length !== 1 && nota !== "" && !esBlank(nota) ? "  ·  " + nota : "";
      return FORMAT(fechaElegida(f), 'dddd, d "de" mmmm "de" yyyy', "es-ES") + pista;
    },
    // 2 · En tránsito
    "Envíos en tránsito": (f) => cuenta(enTransito(f)),
    "Valor en tránsito (€)": (f) => suma(enTransito(f), (e) => e["Valor (€)"]),
    "Envíos retrasados en tránsito": (f) => cuenta(enTransito(f).filter((e) => e["Retraso (días)"] > 2)),
    "Valor retrasado en tránsito (€)": (f) => suma(enTransito(f).filter((e) => e["Retraso (días)"] > 2), (e) => e["Valor (€)"]),
    "Buques en el mar": (f) => distintos(posicionesDelDia(f).filter((p) => p._v.Modo === "Marítimo"), (p) => p.ViajeID),
    "Vuelos en el aire": (f) => distintos(posicionesDelDia(f).filter((p) => p._v.Modo === "Aéreo"), (p) => p.ViajeID),
    "Camiones en ruta": (f) => distintos(posicionesDelDia(f).filter((p) => p._v.Modo === "Carretera"), (p) => p.ViajeID),
    "Buques fondeados": (f) => distintos(posicionesDelDia(f).filter((p) => p.Estado === "Fondeado"), (p) => p.ViajeID),
    "Retraso en tránsito (días)": (f) => media(enTransito(f), (e) => Math.max(e["Retraso (días)"] ?? 0, 0)),
    "Tránsito diario (€)": (f) => {
      const c = curva(f);
      return suma(Calendario(f), (d) => c[d.Fecha - d0Cal]);
    },
    // 3 · Servicio
    "Entregas (30 días)": (f) => cuenta(entregados30(f)),
    "Puntualidad %": (f) => DIVIDE(cuenta(entregados30(f).filter((e) => e["Retraso (días)"] <= 2)), M["Entregas (30 días)"](f)),
    "Retraso medio (días)": (f) => media(entregados30(f), (e) => Math.max(e["Retraso (días)"] ?? 0, 0)),
    "Puerta a puerta (días)": (f) => media(entregados30(f), (e) => (e.Entrega - e.Salida) * 1.0),
    "Flete (30 días)": (f) => { const t = momento(f); return suma(Envios(f).filter((e) => e.Salida > t - 30 && e.Salida <= t), (e) => e["Flete (€)"]); },
    // 4 · Frente a Base
    "Valor en tránsito (Base)": (f) => M["Valor en tránsito (€)"](base(f)),
    "Envíos en tránsito (Base)": (f) => M["Envíos en tránsito"](base(f)),
    "Puntualidad (Base)": (f) => M["Puntualidad %"](base(f)),
    "Retraso medio (Base)": (f) => M["Retraso medio (días)"](base(f)),
    "Puerta a puerta (Base)": (f) => M["Puerta a puerta (días)"](base(f)),
    "Flete (Base)": (f) => M["Flete (30 días)"](base(f)),
    "Retraso en tránsito (Base)": (f) => M["Retraso en tránsito (días)"](base(f)),
    "Tránsito diario (Base)": (f) => M["Tránsito diario (€)"](base(f)),
    // 5 · Globo (se evalúan en la fila de un viaje: filtros con viajes = [ViajeID])
    "Lon hoy": (f) => maximo(posicionesDelDia(f), (p) => p.Lon),
    "Lat hoy": (f) => maximo(posicionesDelDia(f), (p) => p.Lat),
    "Lon siguiente hoy": (f) => maximo(posicionesDelDia(f), (p) => p["Lon siguiente"]),
    "Lat siguiente hoy": (f) => maximo(posicionesDelDia(f), (p) => p["Lat siguiente"]),
    "Progreso hoy": (f) => maximo(posicionesDelDia(f), (p) => p.Progreso),
    "Estado hoy": (f) => unico(posicionesDelDia(f), (p) => p.Estado),
    "Contenedores del viaje": (f) => (esBlank(M["Lon hoy"](f)) ? BLANK : Envios(f).length),
    "Contenedores sin filtro": (f) => (esBlank(M["Lon hoy"](f)) ? BLANK : cuenta(Envios(sinCatProv(f)))),
    "Retraso del viaje": (f) => (esBlank(M["Lon hoy"](f)) ? BLANK : maximo(Envios(sinCatProv(f)), (e) => e["Retraso (días)"])),
    "Valor del viaje (texto)": (f) => {
      if (esBlank(M["Lon hoy"](f))) return BLANK;
      const v = suma(Envios(sinCatProv(f)), (e) => e["Valor (€)"]);
      return !esBlank(v) && v >= 1000000 ? FORMAT(v / 1000000, "0.0", "es-ES") + " M€" : FORMAT(esBlank(v) ? BLANK : v / 1000, "0", "es-ES") + " mil €";
    },
    "Categorías del viaje": (f) => {
      if (esBlank(M["Lon hoy"](f))) return BLANK;
      const cats = [...new Set(Envios(sinCatProv(f)).map((e) => e["Categoría"]))].sort(comparaTexto);
      return cats.join(", ");
    },
    "Llegada prevista del viaje": (f) => {
      if (esBlank(M["Lon hoy"](f))) return BLANK;
      const r = M["Retraso del viaje"](f);
      const fin = maximo(Envios(sinCatProv(f)), (e) => e.Entrega);
      const plan = minimo(Envios(sinCatProv(f)), (e) => e["Entrega prevista"]);
      return FORMAT(fin, "dd/mm") + (!esBlank(r) && r > 0.5 ? " (plan inicial " + FORMAT(plan, "dd/mm") + ")" : "");
    },
    "Fecha del globo": (f) => (esBlank(M["Lon hoy"](f)) ? BLANK : FORMAT(fechaElegida(f), "yyyy-mm-dd")),
    "Escenario del globo": (f) => (esBlank(M["Lon hoy"](f)) ? BLANK : escenarioElegido(f)),
    "En foco": (f) => {
      if (esBlank(M["Lon hoy"](f))) return BLANK;
      if (!f.foco) return 1;
      const r = unico(Viajes(f), (v) => v.RutaID);
      return !esBlank(r) && alternativas.has(r) ? 1 : BLANK;
    },
    // 6 · Colores y tablas
    "Color de categoría": (f) => unico(categoriasVisibles(f), (c) => c.Color, "#64748B"),
    "En tránsito ahora": (f) => (enTransito(f).length ? 1 : BLANK),
    "Días previstos": (f) => (Envios(f).length ? maximo(rutasVisibles(f), (r) => r["Días previstos"]) : BLANK),
    "Días reales (60 d)": (f) => { const t = momento(f); return media(Envios(f).filter((e) => e.Llegada > t - 60 && e.Llegada <= t), (e) => e.Llegada - e.Salida); },
  };

  function categoriasVisibles(f) { return T["Categorías"].filter((c) => !f.categorias || f.categorias.has(c["Nombre corto"])); }
  function rutasVisibles(f) { return T.Rutas.filter((r) => !f.rutas || f.rutas.has(r.RutaID)); }

  /** Las filas que recibe Deneb: una por viaje en ruta ese día, con las columnas y medidas del objeto visual. */
  function datosGlobo(f) {
    const filas = [];
    for (const v of Viajes(con(f, { viajes: null })).slice().sort((a, b) => comparaTexto(a.ViajeID, b.ViajeID))) {
      const fv = con(f, { viajes: [v.ViajeID] });
      if (esBlank(M["Lon hoy"](fv)) || M["En foco"](fv) !== 1) continue;
      const fila = {};
      for (const c of ["ViajeID", "Viaje", "Modo", "RutaID", "Vía", "Origen", "Destino", "Origen nombre", "Destino nombre"]) fila[c] = v[c];
      for (const m of ["Lon hoy", "Lat hoy", "Lon siguiente hoy", "Lat siguiente hoy", "Estado hoy", "Progreso hoy",
        "Contenedores del viaje", "Contenedores sin filtro", "Retraso del viaje", "Valor del viaje (texto)",
        "Categorías del viaje", "Llegada prevista del viaje", "Fecha del globo", "Escenario del globo"]) fila[m] = M[m](fv);
      filas.push(fila);
    }
    return filas;
  }

  return {
    T, M, curva, datosGlobo, d0Cal, d1Cal, alternativas,
    Envios, Posiciones, Viajes, Calendario, calendarioFiltrado, fechaElegida, momento, escenarioElegido,
    enTransito, entregados30, pasaEnvio, pasaViaje, categoriasVisibles, rutasVisibles, base, sinCatProv,
    medida: (nombre, f) => {
      const m = M[nombre];
      if (!m) throw new Error(`Medida sin traducir: ${nombre}`);
      return m(f);
    },
    limpiarCache: () => cache.clear(),
  };
}
