# -*- coding: utf-8 -*-
"""
Simula un año de aprovisionamiento internacional de un almacén ficticio (Almacén CD-01, Madrid):
pedidos a proveedores de cuatro continentes, contenedores consolidados en salidas semanales de buque,
camiones por Europa y envíos urgentes por avión, con la posición diaria de cada buque, camión y vuelo.

Cada escenario de red.config.json se simula sobre los MISMOS pedidos y con el mismo azar, para que la
comparación entre escenarios muestre solo el efecto de la incidencia (por ejemplo, el cierre de Suez).

Uso:     python generar_datos.py [--config otra.config.json] [--salida carpeta]
Salida:  ../datos/*.csv  (UTF-8, separador coma, decimales con punto)
"""
from __future__ import annotations

import hashlib
import math
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from configuracion import DATOS, argumentos, cargar, escribir_csv

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
ANTELACION = 40          # días entre que la carga está lista y el mes de venta al que va destinada
CALENTAMIENTO = 90       # días simulados antes del inicio para que el primer día ya haya buques en el mar


def azar(semilla: int, *clave) -> np.random.Generator:
    """Generador reproducible para una clave: el mismo buque o la misma carga sortean lo mismo en cada escenario."""
    h = hashlib.md5(repr((semilla,) + clave).encode()).hexdigest()
    return np.random.default_rng(int(h[:16], 16))


def a_texto(t: datetime) -> str:
    return t.strftime("%Y-%m-%d %H:%M:%S")


def mediodia(d: date) -> datetime:
    return datetime.combine(d, time(12))


def main() -> None:
    args = argumentos("Simula un año de aprovisionamiento y escribe los CSV.",
                      "carpeta de los CSV (por defecto, datos/)").parse_args()
    cfg = cargar(args.config)
    carpeta = Path(args.salida) if args.salida else DATOS
    carpeta.mkdir(parents=True, exist_ok=True)
    sim = cfg["simulacion"]
    semilla = int(sim["semilla"])
    inicio, fin = date.fromisoformat(sim["inicio"]), date.fromisoformat(sim["fin"])
    rng = np.random.default_rng(semilla)
    cats = {c["nombre"]: c for c in cfg.categorias}
    nodos = {n["id"]: n for n in cfg["nodos"] + cfg["almacenes"]}
    cd = cfg["almacenes"][0]["id"]

    # ------------------------------------------------------------ cargas (iguales en todos los escenarios)
    cargas = []
    for i_p, p in enumerate(cfg["proveedores"]):
        cat = cats[p["categoria"]]
        estac = cat["estacionalidad"]
        media = sum(estac) / 12 or 1
        habitual = cfg.ruta_habitual(p["origen"])
        tasa = p["cargas_mes"] * 12 / 365
        d = inicio - timedelta(CALENTAMIENTO)
        while d <= fin:
            mes = (d + timedelta(habitual["dias"] + ANTELACION)).month
            n = rng.poisson(tasa * estac[mes - 1] / media)
            for _ in range(n):
                vmin, vmax = cat["valor_contenedor"]
                cargas.append({
                    "n": len(cargas) + 1, "prov": p, "cat": cat, "listo": datetime.combine(d, time(int(rng.integers(7, 18)))),
                    "produccion": int(rng.integers(*sim["dias_produccion"])),
                    "valor": int(rng.integers(vmin, vmax) // 100 * 100),
                    "u_aereo": float(rng.random()), "u_extra": float(rng.random()),
                    "aduana": float(rng.uniform(1.0, 3.0)), "u_camion": float(rng.random()),
                })
            d += timedelta(1)
    print(f"Cargas simuladas: {len(cargas)} (con {CALENTAMIENTO} días de calentamiento)")

    def dia_salida(origen: str, ruta_id: str) -> int:
        """Día de la semana de la salida semanal de cada servicio (fijo por puerto y ruta)."""
        return int(hashlib.md5(f"{origen}{ruta_id}".encode()).hexdigest(), 16) % 7

    filas_envios, filas_viajes, filas_pos, filas_inc = [], [], [], []
    for i_e, esc in enumerate(cfg.escenarios):
        codigo = "B" if esc["nombre"] == "Base" else f"E{i_e}"
        cierres = [(c["paso"], date.fromisoformat(c["desde"]), date.fromisoformat(c["hasta"])) for c in esc.get("cierres", [])]
        ventana = (min(c[1] for c in cierres), max(c[2] for c in cierres)) if cierres else None
        cong = esc.get("congestion_destino")
        cong_v = (date.fromisoformat(cong["desde"]), date.fromisoformat(cong["hasta"])) if cong else None
        extra = esc.get("aereo_extra")
        viajes: dict = {}

        def viaje(clave, **datos):
            if clave not in viajes:
                viajes[clave] = {**datos, "cargas": []}
            return viajes[clave]

        for c in cargas:
            p, cat = c["prov"], c["cat"]
            en_crisis = ventana and ventana[0] - timedelta(10) <= c["listo"].date() <= ventana[1]
            aereo = "aereo" in p and (c["u_aereo"] < p["aereo"]["parte"] or (
                extra and en_crisis and cat["nombre"] in extra["categorias"] and c["u_extra"] < extra["parte"]))
            habitual = cfg.ruta_habitual(p["origen"])
            if aereo:
                # Vuelos de carga programados: cada aeropuerto tiene sus días fijos de salida, de madrugada
                origen = p["aereo"]["origen"]
                ruta = cfg.ruta_habitual(origen)
                dd = (c["listo"] + timedelta(1.5)).date()
                dias_vuelo = ruta.get("dias_semana", [0, 3])
                dd += timedelta(min((x - dd.weekday()) % 7 for x in dias_vuelo))
                salida = datetime.combine(dd, time(1, 30))
                v = viaje((origen, salida.date()), modo="Aéreo", ruta=ruta, origen=origen, salida=salida,
                          id=f"{codigo}-V-{origen}-{salida:%y%m%d}", nombre=f"Vuelo {origen}–{ruta['destino']} · {salida:%d/%m}")
            elif habitual["modo"] == "Carretera":
                origen, ruta = p["origen"], habitual
                salida = c["listo"] + timedelta(0.5)
                v = viaje(("C", c["n"]), modo="Carretera", ruta=ruta, origen=origen, salida=salida,
                          id=f"{codigo}-C-{c['n']:05d}", nombre=f"Camión {p['ciudad']}–{cd} · {salida:%d/%m}")
            else:
                origen, ruta = p["origen"], habitual
                dsem = dia_salida(origen, habitual["id"])
                dd = (c["listo"] + timedelta(2)).date()
                dd += timedelta((dsem - dd.weekday()) % 7)
                salida = datetime.combine(dd, time(18))
                tray = cfg.trayectoria(ruta, origen)
                # La naviera desvía todo buque que llegaría al paso cerrado o que zarpa mientras sigue cerrado
                for paso, desde, hasta in cierres:
                    frac = tray.fraccion_de(paso)
                    if frac is not None and (salida + timedelta(ruta["dias"] * frac)).date() >= desde and salida.date() <= hasta:
                        ruta = cfg.ruta_por_id(ruta["alternativa"])
                        break
                v = viaje((origen, habitual["id"], dd), modo="Marítimo", ruta=ruta, origen=origen, salida=salida,
                          habitual=habitual, id=f"{codigo}-M-{origen}-{dd:%y%m%d}",
                          nombre=f"Buque {origen}–{ruta['destino']} · salida {dd:%d/%m}")
            v["cargas"].append(c)

        # ---------------------------------------------------- recorrido de cada viaje
        for clave, v in viajes.items():
            ruta, salida = v["ruta"], v["salida"]
            r = azar(semilla, "viaje", v["origen"], v.get("habitual", ruta)["id"], salida.date())
            if v["modo"] == "Marítimo":
                dias = ruta["dias"] * r.uniform(0.97, 1.08) + (r.uniform(2, 5) if r.random() < 0.06 else 0)
                espera = r.uniform(0, 1.5)
                llegada = salida + timedelta(dias)
                if cong_v and cong_v[0] <= llegada.date() <= cong_v[1]:
                    espera += r.uniform(*cong["dias_extra"])
            elif v["modo"] == "Carretera":
                dias = ruta["dias"] * r.uniform(0.92, 1.12) + (r.uniform(1, 2) if r.random() < 0.05 else 0)
                espera, llegada = 0.0, salida + timedelta(dias)
            else:
                dias, espera = r.uniform(0.54, 0.62), 0.0
                llegada = salida + timedelta(dias)
            fin_espera = llegada + timedelta(espera)
            v.update(llegada=llegada, fin_espera=fin_espera, dias=dias)
            tray = cfg.trayectoria(ruta, v["origen"])
            destino = ruta["destino"]
            recargo = 0.0
            if esc.get("recargo_flete") and v["modo"] == "Marítimo" and ventana and \
                    (ruta.get("alternativa") or ruta["id"] in cfg.alternativas) and \
                    ventana[0] - timedelta(14) <= salida.date() <= ventana[1] + timedelta(21):
                recargo = esc["recargo_flete"]

            # Contenedores o cargas del viaje
            valor_viaje = 0
            for c in v["cargas"]:
                hab = cfg.ruta_habitual(c["prov"]["origen"])
                if v["modo"] == "Marítimo":
                    entrega = fin_espera + timedelta(c["aduana"] + 0.6)
                    plan = salida + timedelta(hab["dias"] + 0.75 + 2.0 + 0.6)
                    palets = sim["palets_por_contenedor"]
                elif v["modo"] == "Carretera":
                    entrega = llegada
                    plan = salida + timedelta(hab["dias"])
                    palets = 33
                else:
                    entrega = llegada + timedelta(0.5 + c["aduana"] / 3 + 0.3)
                    if hab["modo"] == "Marítimo":   # el plan era el barco: el avión llega antes de lo previsto
                        dd = (c["listo"] + timedelta(2)).date()
                        dd += timedelta((dia_salida(c["prov"]["origen"], hab["id"]) - dd.weekday()) % 7)
                        plan = datetime.combine(dd, time(18)) + timedelta(hab["dias"] + 0.75 + 2.0 + 0.6)
                    else:
                        plan = salida + timedelta(2)
                    palets = 4
                if entrega.date() < inicio or c["listo"].date() > fin:
                    continue
                flete = ruta["flete"] * (1 + recargo) if v["modo"] != "Aéreo" else ruta["flete"] * (0.6 + 0.1 * palets)
                retraso = (entrega - plan).total_seconds() / 86400
                valor_viaje += c["valor"]
                filas_envios.append({
                    "EnvioID": f"{codigo}-{c['n']:05d}", "Escenario": esc["nombre"], "ViajeID": v["id"],
                    "ProveedorID": c["prov"]["id"], "Categoría": c["cat"]["nombre"], "Modo": v["modo"],
                    "Vía": ruta["via"], "RutaID": ruta["id"], "Origen": v["origen"], "Destino": destino,
                    "PO": f"PO-{(c['listo'] - timedelta(c['produccion'])):%y%m}-{c['n']:05d}",
                    "Fecha pedido": a_texto(c["listo"] - timedelta(c["produccion"])), "Listo en origen": a_texto(c["listo"]),
                    "Salida": a_texto(salida), "Llegada": a_texto(llegada), "Entrega": a_texto(entrega),
                    "Entrega prevista": a_texto(plan), "Retraso (días)": round(retraso, 1),
                    "Valor (€)": c["valor"], "Flete (€)": round(flete), "Palets": palets,
                })
            if valor_viaje == 0:
                continue
            filas_viajes.append({
                "ViajeID": v["id"], "Escenario": esc["nombre"], "Modo": v["modo"], "RutaID": ruta["id"], "Vía": ruta["via"],
                "Origen": v["origen"], "Destino": destino, "Viaje": v["nombre"],
                "Origen nombre": nodos[v["origen"]]["nombre"] if v["origen"] in nodos else v["cargas"][0]["prov"]["ciudad"],
                "Destino nombre": nodos[destino]["nombre"], "Salida": a_texto(salida),
                "Llegada": a_texto(llegada), "Fin de espera": a_texto(fin_espera),
                "Días de tránsito": round(v["dias"], 1), "Días de espera": round((fin_espera - llegada).total_seconds() / 86400, 1),
            })

            # Posición a mediodía de cada día: navegando (o en ruta) y, al llegar, fondeado esperando atraque
            d = salida.date()
            if mediodia(d) < salida:
                d += timedelta(1)
            total = (llegada - salida).total_seconds()
            fondeo = None
            while mediodia(d) <= fin_espera and d <= fin:
                t = mediodia(d)
                if d >= inicio:
                    if t <= llegada:
                        f = (t - salida).total_seconds() / total
                        lon, lat = tray.en(f)
                        lon2, lat2 = tray.en(min(1.0, f + 0.015))
                        if (lon2, lat2) == (lon, lat):
                            lon2, lat2 = tray.puntos[-1]
                        estado = {"Marítimo": "Navegando", "Aéreo": "En vuelo", "Carretera": "En carretera"}[v["modo"]]
                    else:
                        if fondeo is None:   # a unos 25 km del puerto, mar adentro, cada buque en su sitio
                            px, py = tray.puntos[-1]
                            ax, ay = tray.puntos[-2]
                            ang = math.atan2(ay - py, ax - px) + azar(semilla, "fondeo", v["id"]).uniform(-0.9, 0.9)
                            dist = 0.18 + 0.12 * azar(semilla, "radio", v["id"]).random()
                            fondeo = (px + dist * math.cos(ang), py + dist * math.sin(ang))
                        lon, lat = fondeo
                        lon2, lat2 = tray.puntos[-1]
                        estado = "Fondeado"
                    filas_pos.append({"ViajeID": v["id"], "Fecha": d.isoformat(), "Lon": round(lon, 3), "Lat": round(lat, 3),
                                      "Lon siguiente": round(lon2, 3), "Lat siguiente": round(lat2, 3),
                                      "Progreso": round(min(1.0, (t - salida).total_seconds() / total), 3), "Estado": estado})
                d += timedelta(1)

        for paso, desde, hasta in cierres:
            lon, lat = cfg.coordenadas(paso)
            n = next(x for x in cfg["nodos"] if x["id"] == paso)
            filas_inc.append({"Escenario": esc["nombre"], "Incidencia": f"Cierre · {n['nombre']}", "Tipo": "Cierre",
                              "Desde": desde.isoformat(), "Hasta": hasta.isoformat(), "Lon": lon, "Lat": lat, "Radio (km)": 450})
        if cong_v:
            for dest in sorted({r["destino"] for r in cfg["rutas"] if r["modo"] == "Marítimo"}):
                lon, lat = cfg.coordenadas(dest)
                filas_inc.append({"Escenario": esc["nombre"], "Incidencia": f"Congestión · puerto de {nodos[dest]['nombre']}",
                                  "Tipo": "Congestión", "Desde": cong_v[0].isoformat(), "Hasta": cong_v[1].isoformat(),
                                  "Lon": lon, "Lat": lat, "Radio (km)": 120})

    # ---------------------------------------------------------------- tablas de referencia
    t = cfg["torre"]
    dias = pd.date_range(inicio, fin, freq="D")
    calendario = [{"Fecha": d.date().isoformat(), "Año": d.year, "Mes": d.month, "Nombre del mes": MESES[d.month - 1],
                   "Mes corto": MESES[d.month - 1][:3], "Año-mes": d.year * 100 + d.month,
                   "Mes y año": f"{MESES[d.month - 1][:3]} {d.year % 100:02d}", "Semana ISO": int(d.isocalendar()[1]),
                   "Día de la semana": DIAS[d.weekday()]} for d in dias]
    proveedores = [{"ProveedorID": p["id"], "Proveedor": f"Proveedor {p['id'][-2:]} · {p['ciudad']}", "País": p["pais"],
                    "Ciudad": p["ciudad"], "Lon": p["lon"], "Lat": p["lat"], "Categoría": p["categoria"],
                    "Origen": p["origen"], "Modo habitual": cfg.ruta_habitual(p["origen"])["modo"]} for p in cfg["proveedores"]]
    nodos_tab = [{"NodoID": n["id"], "Nodo": n["nombre"], "País": n.get("pais", ""), "Tipo": n.get("tipo", "almacén"),
                  "Lon": n["lon"], "Lat": n["lat"]} for n in cfg["nodos"] + cfg["almacenes"]]
    rutas = []
    for r in cfg["rutas"]:
        tray = cfg.trayectoria(r, r["origenes"][0])
        rutas.append({"RutaID": r["id"], "Modo": r["modo"], "Vía": r["via"], "Destino": r["destino"],
                      "Días previstos": r["dias"], "Flete (€)": r["flete"], "Km": round(tray.km),
                      "Alternativa": r.get("alternativa", "")})
    categorias = [{"Categoría": c["nombre"], "Nombre corto": c.get("nombre_corto", c["nombre"]), "Color": c["color"],
                   "Tono claro": c["color_claro"], "Tono oscuro": c["color_oscuro"], "Orden": i + 1,
                   "Cobertura (días)": c["cobertura_dias"]} for i, c in enumerate(cfg.categorias)]
    escenarios = [{"Escenario": e["nombre"], "Orden": i + 1, "Descripción": e.get("descripcion", "")}
                  for i, e in enumerate(cfg.escenarios)]
    modos = [{"Modo": m, "Orden": i + 1} for i, m in enumerate(["Marítimo", "Aéreo", "Carretera"])]
    torre = [{"Nombre": t["nombre"], "Subtítulo": t.get("subtitulo", ""), "Datos ficticios": "Sí" if t.get("datos_ficticios") else "No",
              "Fecha por defecto": t["fecha_por_defecto"], "Escenario por defecto": t["escenario_por_defecto"],
              "Nota de la fecha": t.get("nota_fecha_por_defecto", "")}]

    def guardar(nombre: str, filas: list) -> pd.DataFrame:
        df = pd.DataFrame(filas)
        df.to_csv(carpeta / f"{nombre}.csv", index=False, encoding="utf-8", lineterminator="\r\n")
        print(f"{nombre:<14} {len(df):>8} filas")
        return df

    env = guardar("Envios", filas_envios)
    guardar("Viajes", filas_viajes)
    guardar("Posiciones", filas_pos)
    guardar("Incidencias", filas_inc)
    guardar("Proveedores", proveedores)
    guardar("Nodos", nodos_tab)
    guardar("Rutas", rutas)
    guardar("Categorias", categorias)
    guardar("Escenarios", escenarios)
    guardar("Modos", modos)
    guardar("Calendario", calendario)
    escribir_csv(carpeta / "Torre.csv", torre)
    print(f"{'Torre':<14} {1:>8} filas")

    # ---------------------------------------------------------------- resumen por escenario
    env["Entrega"] = pd.to_datetime(env["Entrega"])
    env["Salida"] = pd.to_datetime(env["Salida"])
    en_periodo = env[(env["Entrega"].dt.date >= inicio) & (env["Entrega"].dt.date <= fin)]
    print("\nEscenario            envíos  puerta a puerta  a tiempo  retraso medio  flete total")
    for e, g in en_periodo.groupby("Escenario", sort=False):
        transito = (g["Entrega"] - g["Salida"]).dt.total_seconds().mean() / 86400
        print(f"  {e:<18} {len(g):>6}  {transito:>8.1f} días  {(g['Retraso (días)'] <= 2).mean():>7.1%}  "
              f"{g['Retraso (días)'].clip(lower=0).mean():>8.1f} días  {g['Flete (€)'].sum() / 1e6:>8.2f} M€")
    dia = pd.Timestamp(t["fecha_por_defecto"]) + pd.Timedelta(hours=12)
    for e, g in env.groupby("Escenario", sort=False):
        tr = g[(g["Salida"] <= dia) & (g["Entrega"] > dia)]
        print(f"  el {t['fecha_por_defecto']} en tránsito ({e}): {len(tr)} envíos, {tr['Valor (€)'].sum() / 1e6:.1f} M€")


if __name__ == "__main__":
    main()
