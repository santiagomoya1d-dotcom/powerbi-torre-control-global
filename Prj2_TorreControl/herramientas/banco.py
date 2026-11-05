# -*- coding: utf-8 -*-
"""
Banco de pruebas del globo sin Power BI: calcula con pandas lo mismo que las medidas que recibe Deneb
(una fila por buque, vuelo o camión en ruta el día elegido) y escribe un HTML que dibuja la
especificación Vega con vega-embed, para revisar la escena en el navegador antes de abrir Power BI.

Uso:  python herramientas/banco.py [--vista "2026-03-05@Cierre de Suez@Marítimo@Bebidas"]... [--salida banco.html]
      --vista  FECHA[@escenario[@modo[@categoría]]]; se puede repetir. Por defecto, la fecha y el escenario
               por defecto de la configuración.
Ábrelo con un servidor local: python -m http.server  →  http://localhost:8000/herramientas/banco.html
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "generador"))
from configuracion import DATOS, argumentos, cargar  # noqa: E402

VEGA = "https://cdn.jsdelivr.net/npm/vega@5.30.0/build/vega.min.js"
VEGA_EMBED = "https://cdn.jsdelivr.net/npm/vega-embed@6.26.0/build/vega-embed.min.js"


def euros(v: float) -> str:
    return (f"{v / 1e6:.1f} M€" if v >= 1e6 else f"{v / 1e3:.0f} mil €").replace(".", ",")


def muestra(d: dict, fecha: str, escenario: str, modo: str | None, categoria: str | None) -> list[dict]:
    """Las filas que Power BI pasaría a Deneb: medidas por viaje en ruta ese día."""
    v, p, e = d["viajes"], d["posiciones"], d["envios"]
    hoy = p[p.Fecha == fecha].merge(v[v.Escenario == escenario], on="ViajeID")
    if modo:
        hoy = hoy[hoy.Modo == modo]
    env = e[e.Escenario == escenario]
    filas = []
    for r in hoy.to_dict("records"):
        todos = env[env.ViajeID == r["ViajeID"]]
        filtrados = todos if categoria is None else todos[todos["Categoría"] == categoria]
        cats = todos.groupby("Categoría")["Valor (€)"].sum().sort_values(ascending=False).index[:3]
        retraso = float(todos["Retraso (días)"].max()) if len(todos) else 0
        llegada = pd.to_datetime(todos["Entrega"]).max()
        plan = pd.to_datetime(todos["Entrega prevista"]).min()
        filas.append({
            "ViajeID": r["ViajeID"], "Viaje": r["Viaje"], "Modo": r["Modo"], "RutaID": r["RutaID"], "Vía": r["Vía"],
            "Origen": r["Origen"], "Destino": r["Destino"], "Origen nombre": r["Origen nombre"], "Destino nombre": r["Destino nombre"],
            "Lon hoy": r["Lon"], "Lat hoy": r["Lat"], "Lon siguiente hoy": r["Lon siguiente"], "Lat siguiente hoy": r["Lat siguiente"],
            "Estado hoy": r["Estado"], "Progreso hoy": r["Progreso"],
            "Contenedores del viaje": len(filtrados), "Contenedores sin filtro": len(todos),
            "Valor del viaje (texto)": euros(todos["Valor (€)"].sum()), "Retraso del viaje": round(retraso, 1),
            "Categorías del viaje": ", ".join(cats),
            "Llegada prevista del viaje": f"{llegada:%d/%m}" + (f" (plan inicial {plan:%d/%m})" if retraso > 0.5 else ""),
            "Fecha del globo": fecha, "Escenario del globo": escenario,
        })
    return filas


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argumentos("Dibuja el globo con datos de muestra en un HTML.", "ruta del HTML (por defecto, herramientas/banco.html)")
    p.add_argument("--vista", action="append", help="FECHA[@escenario[@modo[@categoría]]]")
    p.add_argument("--datos", help="carpeta de los CSV (por defecto, datos/)")
    p.add_argument("--escena", help="especificación Vega (por defecto, globo/torre_globo.vega.json)")
    p.add_argument("--ancho", type=int, default=1000)
    p.add_argument("--alto", type=int, default=800)
    args = p.parse_args()
    cfg = cargar(args.config)
    carpeta = Path(args.datos) if args.datos else DATOS
    escena = Path(args.escena) if args.escena else RAIZ / "globo" / "torre_globo.vega.json"
    salida = Path(args.salida) if args.salida else Path(__file__).resolve().with_name("banco.html")
    spec = json.loads(escena.read_text(encoding="utf-8"))
    d = {"viajes": pd.read_csv(carpeta / "Viajes.csv"), "posiciones": pd.read_csv(carpeta / "Posiciones.csv"),
         "envios": pd.read_csv(carpeta / "Envios.csv")}
    t = cfg["torre"]
    bloques = []
    for i, vista in enumerate(args.vista or [f"{t['fecha_por_defecto']}@{t['escenario_por_defecto']}"]):
        partes = (vista.split("@") + [None] * 4)[:4]
        fecha, esc, modo, cat = partes[0], partes[1] or t["escenario_por_defecto"], partes[2] or None, partes[3] or None
        filas = muestra(d, fecha, esc, modo, cat)
        sp = json.loads(json.dumps(spec))
        sp["width"], sp["height"] = args.ancho, args.alto
        next(x for x in sp["data"] if x["name"] == "dataset")["values"] = filas
        titulo = f"{fecha} · {esc}" + (f" · {modo}" if modo else "") + (f" · {cat}" if cat else "") + f" · {len(filas)} en ruta"
        bloques.append((f"v{i}", titulo, sp))
        print(titulo)
    html = ["<!doctype html><html lang='es'><head><meta charset='utf-8'><title>Banco del globo</title>",
            f"<script src='{VEGA}'></script><script src='{VEGA_EMBED}'></script>",
            "<style>body{background:#050914;color:#CBD5E1;font-family:'Segoe UI',sans-serif;margin:16px}"
            "h3{font-weight:500;font-size:14px}pre{color:#F87171}</style></head><body>"]
    for id_, titulo, _ in bloques:
        html.append(f"<h3>{titulo}</h3><div id='{id_}'></div><pre id='{id_}e'></pre>")
    html.append("<script>window.vistas = [];")
    for id_, _, sp in bloques:
        html.append(f"vegaEmbed('#{id_}', {json.dumps(sp, ensure_ascii=False)}, {{renderer: 'canvas', actions: false}})"
                    f".then(r => window.vistas.push(r.view))"
                    f".catch(e => document.getElementById('{id_}e').textContent = e.toString());")
    html.append("</script></body></html>")
    salida.write_text("\n".join(html), encoding="utf-8")
    print("Escrito:", salida)


if __name__ == "__main__":
    main()
