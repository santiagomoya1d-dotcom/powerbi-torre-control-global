# -*- coding: utf-8 -*-
"""
Saca de Power BI Desktop (con el informe abierto) lo que devuelve cada medida en cada situación de contextos.json,
para comprobar que la versión web calcula y escribe lo mismo (comprobar.mjs).

Uso:  python web/pruebas/sacar_esperado.py            → web/pruebas/esperado.json
Necesita Power BI Desktop abierto con Prj2_TorreControl y el modelo cargado.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
MEDIDAS = RAIZ.parent / "Prj2_TorreControl.SemanticModel" / "definition" / "tables" / "Medidas.tmdl"

# Filtro de contextos.json → columna del modelo
COLUMNAS = {
    "escenario": "Escenarios[Escenario]", "modos": "Modos[Modo]", "rutas": "Rutas[RutaID]", "viajes": "Viajes[ViajeID]",
    "categorias": "'Categorías'[Nombre corto]", "proveedores": "Proveedores[ProveedorID]", "ciudades": "Proveedores[Ciudad]",
    "envios": "Envios[EnvioID]", "fechas": "Calendario[Fecha]", "mesAnio": "Calendario[Mes y año]",
    "diaMes": "Calendario[Día del mes]", "horizonte": "Horizonte[Horizonte]",
}


def literal(v):
    if isinstance(v, bool):
        return "TRUE()" if v else "FALSE()"
    if isinstance(v, (int, float)):
        return str(v)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        a, m, d = v.split("-")
        return f"DATE ( {int(a)}, {int(m)}, {int(d)} )"
    return '"' + v.replace('"', '""') + '"'


def filtros_dax(f: dict) -> list[str]:
    salida = []
    for k, v in f.items():
        if k == "foco":
            if v:
                salida.append("TREATAS ( { \"Solo desviadas\" }, 'Foco desvío'[Foco desvío] )")
            continue
        salida.append(f"TREATAS ( {{ {', '.join(literal(x) for x in v)} }}, {COLUMNAS[k]} )")
    return salida


def medidas() -> list[str]:
    return re.findall(r"^\tmeasure '?(.+?)'? =", MEDIDAS.read_text(encoding="utf-8"), re.M)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    nombres = medidas()
    contextos = json.loads((AQUI / "contextos.json").read_text(encoding="utf-8"))
    consultas = []
    for c in contextos:
        fs = filtros_dax(c["f"])
        cols = ", ".join(f'"m{i}", [{n}]' for i, n in enumerate(nombres))
        dax = f"EVALUATE ROW ( {cols} )" if not fs else f"EVALUATE CALCULATETABLE ( ROW ( {cols} ), {', '.join(fs)} )"
        consultas.append({"id": c["id"], "dax": dax})
    entrada, crudo = AQUI / "_consultas.json", AQUI / "_crudo.json"
    entrada.write_text(json.dumps(consultas, ensure_ascii=False), encoding="utf-8")
    r = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(AQUI / "ejecutar_dax.ps1"),
                        "-Entrada", str(entrada), "-Salida", str(crudo)], capture_output=True, text=True)
    print(r.stdout.strip(), r.stderr.strip()[:2000])
    res = json.loads(crudo.read_text(encoding="utf-8-sig"))
    esperado = {}
    for c in contextos:
        x = res[c["id"]]
        if not x["ok"]:
            print(f"  {c['id']}: ERROR {x['error'][:300]}")
            continue
        fila = x["filas"][0] if x["filas"] else [None] * len(nombres)
        esperado[c["id"]] = dict(zip(nombres, fila))
    (AQUI / "esperado.json").write_text(json.dumps(esperado, ensure_ascii=False, indent=1), encoding="utf-8")
    entrada.unlink(missing_ok=True)
    crudo.unlink(missing_ok=True)
    print(f"esperado.json: {len(esperado)} contextos × {len(nombres)} medidas")


if __name__ == "__main__":
    main()
