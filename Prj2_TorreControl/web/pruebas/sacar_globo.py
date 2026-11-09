# -*- coding: utf-8 -*-
"""
Saca de Power BI Desktop (con el informe abierto) las filas que recibe el objeto visual del globo (Deneb) en cada
situación de contextos.json: una por viaje en ruta ese día, con [En foco] = 1. Las guarda en esperado_globo.json para
que comprobar_globo.mjs las compare con las de la web.
Uso:  python web/pruebas/sacar_globo.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from sacar_esperado import AQUI, filtros_dax

MEDIDAS = ["Lon hoy", "Lat hoy", "Lon siguiente hoy", "Lat siguiente hoy", "Estado hoy", "Progreso hoy",
           "Contenedores del viaje", "Contenedores sin filtro", "Retraso del viaje", "Valor del viaje (texto)",
           "Categorías del viaje", "Llegada prevista del viaje", "Fecha del globo", "Escenario del globo"]


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    contextos = json.loads((AQUI / "contextos.json").read_text(encoding="utf-8"))
    cols = ", ".join(f'"{m}", [{m}]' for m in MEDIDAS)
    consultas = []
    for c in contextos:
        tabla = f'FILTER ( SUMMARIZECOLUMNS ( Viajes[ViajeID], {cols}, "En foco", [En foco] ), [En foco] = 1 )'
        fs = filtros_dax(c["f"])
        dax = f"EVALUATE {tabla}" if not fs else f"EVALUATE CALCULATETABLE ( {tabla}, {', '.join(fs)} )"
        consultas.append({"id": c["id"], "dax": dax})
    entrada, crudo = AQUI / "_consultas_globo.json", AQUI / "_crudo_globo.json"
    entrada.write_text(json.dumps(consultas, ensure_ascii=False), encoding="utf-8")
    r = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(AQUI / "ejecutar_dax.ps1"),
                        "-Entrada", str(entrada), "-Salida", str(crudo)], capture_output=True, text=True)
    print(r.stdout.strip(), r.stderr.strip()[:2000])
    res = json.loads(crudo.read_text(encoding="utf-8-sig"))
    salida = {}
    for c in contextos:
        x = res[c["id"]]
        if not x["ok"]:
            print(f"  {c['id']}: ERROR {x['error'][:300]}")
            continue
        salida[c["id"]] = [dict(zip(["ViajeID", *MEDIDAS, "En foco"], fila)) for fila in x["filas"]]
    (AQUI / "esperado_globo.json").write_text(json.dumps(salida, ensure_ascii=False), encoding="utf-8")
    entrada.unlink(missing_ok=True)
    crudo.unlink(missing_ok=True)
    print(f"esperado_globo.json: {len(salida)} situaciones, {sum(len(v) for v in salida.values())} filas")


if __name__ == "__main__":
    main()
