# -*- coding: utf-8 -*-
"""
Valida los JSON del informe (formato PBIR) contra sus esquemas públicos de Microsoft (el $schema de
cada archivo), resolviendo las referencias remotas. Necesita conexión a internet y los paquetes
jsonschema y referencing (pip install jsonschema referencing).

Uso:  python herramientas/validar_pbir.py            (valida Prj2_TorreControl.Report, junto al .pbip)
      python herramientas/validar_pbir.py "<carpeta .Report>"
Sale con código 1 si algún archivo no cumple su esquema.

Power BI Desktop a veces escribe una versión de esquema que Microsoft aún no ha publicado (por ejemplo,
visualContainer 2.14.0). En ese caso valida con la versión publicada más cercana por debajo y lo dice.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

from jsonschema import Draft7Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT7

RAIZ = Path(__file__).resolve().parent.parent
cache: dict = {}


def bajar(uri: str):
    if uri not in cache:
        with urllib.request.urlopen(uri, timeout=30) as r:
            cache[uri] = json.loads(r.read().decode("utf-8"))
    return cache[uri]


def publicado(uri: str) -> str:
    """El esquema pedido o, si aún no está publicado, la versión anterior más cercana que sí lo esté."""
    try:
        bajar(uri)
        return uri
    except urllib.error.HTTPError as e:
        m = re.search(r"/(\d+)\.(\d+)\.(\d+)/schema\.json$", uri)
        if e.code != 404 or not m:
            raise
        mayor, menor, parche = map(int, m.groups())
        candidatas = [(mayor, menor, p) for p in range(parche - 1, -1, -1)] +                      [(mayor, n, p) for n in range(menor - 1, -1, -1) for p in range(9, -1, -1)]
        for v in candidatas:
            otra = uri[:m.start()] + "/{}.{}.{}/schema.json".format(*v)
            try:
                bajar(otra)
                return otra
            except urllib.error.HTTPError:
                continue
        raise


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    informe = Path(sys.argv[1]) if len(sys.argv) > 1 else next(
        c for base in (RAIZ, RAIZ.parent) for c in base.glob("*.Report"))
    registro = Registry(retrieve=lambda uri: Resource.from_contents(bajar(uri), default_specification=DRAFT7))
    fallos, avisados = 0, set()
    for f in sorted(informe.rglob("*.json")):
        if {"StaticResources", "CustomVisuals", ".pbi"} & set(f.parts):
            continue
        doc = json.loads(f.read_text(encoding="utf-8-sig"))
        pedido = doc.get("$schema")
        if not pedido:
            continue
        uri = publicado(pedido)
        if uri != pedido and pedido not in avisados:
            avisados.add(pedido)
            print(f"  (sin publicar: {pedido.split('/definition/')[-1]}; se valida con {uri.split('/definition/')[-1]})")
        errores = sorted(Draft7Validator(bajar(uri), registry=registro).iter_errors(doc), key=lambda e: list(e.path))
        if uri != pedido:   # el esquema anterior exige su propia URL en $schema: eso no es un error del archivo
            errores = [e for e in errores if list(e.path) != ["$schema"]]
        rel = f.relative_to(informe)
        if errores:
            fallos += 1
            print(f"✗ {rel}  ({uri.split('/definition/')[-1]})")
            for e in errores[:6]:
                print("    -", "/".join(map(str, e.path)) or "(raíz)", ":", e.message[:220])
        else:
            print(f"✓ {rel}")
    print("Archivos con errores:", fallos)
    sys.exit(1 if fallos else 0)


if __name__ == "__main__":
    main()
