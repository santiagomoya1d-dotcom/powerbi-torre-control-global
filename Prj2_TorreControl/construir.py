# -*- coding: utf-8 -*-
"""
Construye todo a partir de red.config.json, en orden, y para en el primer fallo:
datos (simulación de los escenarios) → globo (Vega) → informe (PBIR: el globo y el tema).

Uso:
  python construir.py                 simula el año con la configuración y lo monta todo
  python construir.py --sin-datos     solo globo e informe (cambios de aspecto)
  python construir.py --config otra.json --prueba CARPETA
                                      variante de prueba: datos, globo y banco.html en CARPETA,
                                      sin tocar datos/ ni el informe
Lánzalo con Power BI Desktop cerrado. Después abre el .pbip y pulsa «Actualizar» si cambiaron los datos.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent


def paso(titulo: str, *args: str) -> None:
    print(f"\n=== {titulo}", flush=True)
    r = subprocess.run([sys.executable, *args], cwd=RAIZ, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    if r.returncode:
        raise SystemExit(f"\nParado en «{titulo}» (código {r.returncode}). Corrige lo que indica y vuelve a lanzarlo.")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description="Construye datos, globo y página a partir de la configuración.")
    p.add_argument("--config", help="otra configuración (por defecto, red.config.json)")
    p.add_argument("--sin-datos", action="store_true", help="no volver a simular")
    p.add_argument("--prueba", metavar="CARPETA", help="escribir todo en CARPETA, sin tocar datos/ ni el informe")
    args = p.parse_args()
    cfg = ["--config", args.config] if args.config else []
    prueba = Path(args.prueba).resolve() if args.prueba else None
    datos = str(prueba / "datos") if prueba else None
    escena = str(prueba / "torre_globo.vega.json") if prueba else None

    paso("Configuración", "-c", "import sys; sys.path.insert(0, 'generador'); from configuracion import cargar; "
         f"c = cargar({args.config!r} if {bool(args.config)} else None); "
         "print(f\"{len(c['proveedores'])} proveedores, {len(c['rutas'])} rutas, {len(c.escenarios)} escenarios: \" "
         "+ ', '.join(e['nombre'] for e in c.escenarios))")
    if not args.sin_datos:
        paso("Simulación", "generador/generar_datos.py", *cfg, *(["--salida", datos] if datos else []))
    paso("Globo", "globo/construir_globo.py", *cfg, *(["--salida", escena] if escena else []))
    if prueba:
        paso("Banco de pruebas", "herramientas/banco.py", *cfg, "--datos", datos, "--escena", escena,
             "--salida", str(prueba / "banco.html"))
        print(f"\nVariante lista en {prueba}. Ábrela con: python -m http.server --directory \"{prueba}\" "
              "y luego http://localhost:8000/banco.html")
    else:
        paso("Informe (globo y tema)", "generador/pagina_torre.py", *cfg)
        print("\nListo. Abre el .pbip en Power BI Desktop y pulsa «Actualizar» si cambiaron los datos.")


if __name__ == "__main__":
    main()
