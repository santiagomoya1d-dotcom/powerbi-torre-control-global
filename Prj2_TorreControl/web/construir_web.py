# -*- coding: utf-8 -*-
"""
Prepara los datos de la versión web del informe (docs/, la que publica GitHub Pages).

Uso:  python web/construir_web.py [--proyecto "<carpeta con Prj2_TorreControl.Report>"]

Escribe en docs/datos/:
- datos.json      las tablas del modelo (los mismos CSV que carga Power BI), por columnas; las fechas van como
                  número de serie de DAX (días desde el 30/12/1899, con la hora en la parte decimal), para que la
                  aritmética de fechas de las medidas (t - 30, mediodía = + 0,5) sea la misma en JavaScript.
- informe.json    la maqueta: páginas, objetos visuales (tipo, posición, capa, campos y formato), botones,
                  marcadores y tema, leídos de los archivos PBIR. La web se dibuja a partir de aquí.
- globo.vega.json la especificación Vega del globo, la misma que lleva el objeto visual de Deneb.

El HTML, el CSS y el JavaScript de docs/ se escriben a mano; esto solo regenera docs/datos/.
"""
from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent          # carpeta Prj2_TorreControl
REPO = RAIZ.parent
DATOS = RAIZ / "datos"
SALIDA = REPO / "docs" / "datos"
EPOCA = datetime(1899, 12, 30)                         # día 0 de las fechas de DAX

# Tipos de las columnas, como los declara Power Query en el modelo (TMDL). Lo que no aparece es texto.
TIPOS = {
    "Calendario": {"Fecha": "fecha", "Año": "entero", "Mes": "entero", "Año-mes": "entero", "Semana ISO": "entero"},
    "Categorias": {"Orden": "entero", "Cobertura (días)": "entero"},
    "Envios": {"Fecha pedido": "fecha", "Listo en origen": "fecha", "Salida": "fecha", "Llegada": "fecha",
               "Entrega": "fecha", "Entrega prevista": "fecha", "Retraso (días)": "numero", "Valor (€)": "entero",
               "Flete (€)": "entero", "Palets": "entero"},
    "Escenarios": {"Orden": "entero"},
    "Incidencias": {"Desde": "fecha", "Hasta": "fecha", "Lon": "numero", "Lat": "numero", "Radio (km)": "numero"},
    "Modos": {"Orden": "entero"},
    "Nodos": {"Lon": "numero", "Lat": "numero"},
    "Posiciones": {"Fecha": "fecha", "Lon": "numero", "Lat": "numero", "Lon siguiente": "numero",
                   "Lat siguiente": "numero", "Progreso": "numero"},
    "Proveedores": {"Lon": "numero", "Lat": "numero"},
    "Rutas": {"Días previstos": "entero", "Flete (€)": "entero", "Km": "entero"},
    "Torre": {"Fecha por defecto": "fecha"},
    "Viajes": {"Salida": "fecha", "Llegada": "fecha", "Fin de espera": "fecha", "Días de tránsito": "numero",
               "Días de espera": "numero"},
}
NOMBRE_TABLA = {"Categorias": "Categorías"}             # nombre del CSV → nombre de la tabla en el modelo


def serie(texto: str) -> float:
    formato = "%Y-%m-%d %H:%M:%S" if " " in texto else "%Y-%m-%d"
    return round((datetime.strptime(texto, formato) - EPOCA).total_seconds() / 86400, 9)


def convertir(valor: str, tipo: str | None):
    if valor == "":
        return None                                    # celda vacía = BLANK() en DAX
    if tipo == "fecha":
        return serie(valor)
    if tipo == "entero":
        return int(float(valor))
    if tipo == "numero":
        return float(valor)
    return valor


def tablas() -> dict:
    salida = {}
    for f in sorted(DATOS.glob("*.csv")):
        tipos = TIPOS.get(f.stem, {})
        with f.open(encoding="utf-8", newline="") as h:
            filas = list(csv.reader(h))
        cab, cuerpo = filas[0], [r for r in filas[1:] if any(c != "" for c in r)]
        salida[NOMBRE_TABLA.get(f.stem, f.stem)] = {c: [convertir(r[i], tipos.get(c)) for r in cuerpo] for i, c in enumerate(cab)}
    return salida


# ----------------------------------------------------------------------------------------------- informe
def leer(p: Path):
    return json.loads(p.read_text(encoding="utf-8-sig"))


def literal(x):
    """Valor de una expresión literal de PBIR ('texto', 12D, 3L, true…) como valor de Python."""
    v = (x or {}).get("expr", {}).get("Literal", {}).get("Value")
    if v is None:
        return x
    if v.startswith("'") and v.endswith("'"):
        return v[1:-1].replace("''", "'")
    if v in ("true", "false"):
        return v == "true"
    if v[-1:] in ("D", "L", "M") and v[:-1].replace(".", "", 1).replace("-", "", 1).isdigit():
        n = float(v[:-1])
        return int(n) if n.is_integer() else n
    if v.startswith("datetime'"):
        return v[9:-1]
    return v


def simplificar(obj):
    """Objetos de formato de PBIR → diccionarios simples: {objeto: [{selector?, propiedad: valor}]}."""
    if isinstance(obj, dict):
        if "expr" in obj and isinstance(obj["expr"], dict) and "Literal" in obj["expr"]:
            return literal(obj)
        if "solid" in obj and isinstance(obj["solid"], dict) and "color" in obj["solid"]:
            return simplificar(obj["solid"]["color"])
        if "expr" in obj and isinstance(obj["expr"], dict) and "ThemeDataColor" in obj["expr"]:
            t = obj["expr"]["ThemeDataColor"]
            return {"tema": t.get("ColorId"), "matiz": t.get("Percent", 0)}
        return {k: simplificar(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [simplificar(x) for x in obj]
    return obj


def campo(fld: dict) -> dict:
    tipo = next(iter(fld))
    x = fld[tipo]
    return {"tipo": tipo, "tabla": x.get("Expression", {}).get("SourceRef", {}).get("Entity"), "campo": x.get("Property")}


def filtro_guardado(objetos: dict):
    """Valores de la selección guardada de un segmentador (filtro In del objeto general)."""
    f = (objetos.get("general") or [{}])[0].get("properties", {}).get("filter", {}).get("filter")
    if not f:
        return None
    valores = []
    for w in f.get("Where", []):
        for fila in w.get("Condition", {}).get("In", {}).get("Values", []):
            valores += [literal({"expr": v}) for v in fila]
    return valores


def visual(v: dict) -> dict:
    vis = v.get("visual", {})
    q = vis.get("query", {}).get("queryState", {})
    salida = {
        "nombre": v["name"], "tipo": vis.get("visualType"), "pos": v["position"], "oculto": bool(v.get("isHidden")),
        "campos": {rol: [dict(campo(p["field"]), nombre=p.get("displayName") or p.get("nativeQueryRef"),
                              activo=p.get("active", False)) for p in r.get("projections", [])] for rol, r in q.items()},
        "orden": [simplificar(s) for s in vis.get("query", {}).get("sortDefinition", {}).get("sort", [])],
        "objetos": simplificar(vis.get("objects", {})),
        "contenedor": simplificar(vis.get("visualContainerObjects", {})),
        "sincronizado": (vis.get("syncGroup") or {}).get("groupName"),
        "seleccion_guardada": filtro_guardado(vis.get("objects", {})),
    }
    filtros = v.get("filterConfig", {}).get("filters", [])
    if filtros:
        salida["filtros"] = [simplificar(f) for f in filtros]
    return salida


def marcador(b: dict) -> dict:
    es = b.get("explorationState", {})
    sec = es.get("activeSection")
    vc = es.get("sections", {}).get(sec, {}).get("visualContainers", {})
    salida = {"nombre": b["name"], "titulo": b.get("displayName"), "pagina": sec,
              "destinos": b.get("options", {}).get("targetVisualNames", []),
              "ocultos": [k for k, x in vc.items() if x.get("singleVisual", {}).get("display", {}).get("mode") == "hidden"],
              "datos": not b.get("options", {}).get("suppressData", False)}
    if salida["datos"]:
        # Selecciones de segmentadores que guarda el marcador (p. ej. el escenario)
        salida["selecciones"] = {k: filtro_guardado(x.get("singleVisual", {}).get("objects", {}).get("merge", {}))
                                 for k, x in vc.items() if x.get("singleVisual", {}).get("objects", {}).get("merge")}
    return salida


def formatos(proyecto: Path, clave: str = "formatString") -> dict:
    """Cadena de formato (o tipo, con clave="dataType") de cada medida y columna del modelo: {"Tabla.Campo": valor}."""
    import re
    salida = {}
    for f in sorted(next(proyecto.glob("*.SemanticModel")).glob("definition/tables/*.tmdl")):
        tabla = None
        actual = None
        for linea in f.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^table '?(.+?)'?$", linea)
            if m:
                tabla = m.group(1)
                continue
            m = re.match(r"^\t(?:measure|column) '?(.+?)'?( =.*)?$", linea)
            if m:
                actual = f"{tabla}.{m.group(1)}"
                continue
            m = re.match(rf"^\t\t{clave}: (.+)$", linea)
            if m and actual:
                salida[actual] = m.group(1).strip()
    return salida


def informe(proyecto: Path) -> dict:
    inf = next(proyecto.glob("*.Report"))
    d = inf / "definition"
    meta = leer(d / "pages" / "pages.json")
    paginas = []
    for nombre in meta["pageOrder"]:
        p = leer(d / "pages" / nombre / "page.json")
        visuales = [visual(leer(f)) for f in sorted((d / "pages" / nombre / "visuals").glob("*/visual.json"))]
        paginas.append({"nombre": nombre, "titulo": p.get("displayName"), "ancho": p.get("width"), "alto": p.get("height"),
                        "objetos": simplificar(p.get("objects", {})),
                        "interacciones": p.get("visualInteractions", []),
                        "filtros": [simplificar(f) for f in p.get("filterConfig", {}).get("filters", [])],
                        "visuales": sorted(visuales, key=lambda x: x["pos"].get("z", 0))})
    tema = leer(inf / "StaticResources" / "RegisteredResources" / "TemaTorreClaro.json")
    return {"paginas": paginas, "activa": meta.get("activePageName"), "tema": tema, "formatos": formatos(proyecto),
            "tipos": formatos(proyecto, "dataType"),
            "marcadores": [marcador(leer(f)) for f in sorted((d / "bookmarks").glob("*.bookmark.json"))]}


def main() -> None:
    p = argparse.ArgumentParser(description="Regenera docs/datos/ (versión web del informe).")
    p.add_argument("--proyecto", help="carpeta que contiene Prj2_TorreControl.Report (por defecto, la raíz del repositorio)")
    args = p.parse_args()
    proyecto = Path(args.proyecto) if args.proyecto else REPO
    SALIDA.mkdir(parents=True, exist_ok=True)
    datos = tablas()
    (SALIDA / "datos.json").write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    inf = informe(proyecto)
    (SALIDA / "informe.json").write_text(json.dumps(inf, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    escena = json.loads((RAIZ / "globo" / "torre_globo.vega.json").read_text(encoding="utf-8"))
    (SALIDA / "globo.vega.json").write_text(json.dumps(escena, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    filas = {k: len(next(iter(v.values()))) for k, v in datos.items()}
    print("datos.json:", ", ".join(f"{k} {n}" for k, n in filas.items()))
    print("informe.json:", ", ".join(f"{p['nombre']} ({len(p['visuales'])})" for p in inf["paginas"]), f"· {len(inf['marcadores'])} marcadores")
    for f in sorted(SALIDA.glob("*.json")):
        print(f"  {f.name}: {f.stat().st_size / 1024:,.0f} KB")


if __name__ == "__main__":
    main()
