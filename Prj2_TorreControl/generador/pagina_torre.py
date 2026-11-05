# -*- coding: utf-8 -*-
"""
Escribe la página «Torre de control» del informe en formato PBIR (archivos de texto del proyecto PBIP).

Uso:     python generador/pagina_torre.py [--config otra.config.json] [--proyecto "<carpeta con Prj2_TorreControl.Report>"]
Después: en Power BI Desktop, «Aplicar cambios externos» (o cerrar y abrir el .pbip).

Lee de los archivos que ya guardó Power BI las versiones de esquema y los identificadores de
Deneb y HTML Content, para escribir lo mismo que escribiría Desktop.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from configuracion import argumentos, cargar

RAIZ = Path(__file__).resolve().parent.parent          # carpeta Prj2_TorreControl
_p = argumentos("Escribe la página «Torre de control» del informe (PBIR).")
_p.add_argument("--proyecto", help="carpeta que contiene Prj2_TorreControl.Report (por defecto, la raíz del repositorio)")
_p.add_argument("--escena", help="especificación Vega (por defecto, globo/torre_globo.vega.json)")
ARGS = _p.parse_args()
CFG = cargar(ARGS.config)
PROYECTO = Path(ARGS.proyecto) if ARGS.proyecto else next(c for c in (RAIZ, RAIZ.parent) if any(c.glob("*.Report")))
INFORME = next(PROYECTO.glob("*.Report"))
DEF = INFORME / "definition"
PAGINA = "torre"
TEMA = "TemaTorreOscuro.json"
FONDO = "FondoTorre.png"
ESQ = "https://developer.microsoft.com/json-schemas/fabric/item/report/definition"


def leer(p: Path):
    return json.loads(p.read_text(encoding="utf-8-sig"))


def escribir(p: Path, obj) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def esquema(nombre: str, defecto: str) -> str:
    for f in DEF.rglob(f"{nombre}.json"):
        s = leer(f).get("$schema")
        if s:
            return s
    if nombre == "visual":
        version = leer(DEF / "report.json").get("themeCollection", {}).get("baseTheme", {}).get("reportVersionAtImport", {})
        if isinstance(version, dict) and version.get("visual"):
            return f"{ESQ}/visualContainer/{version['visual']}/schema.json"
    return f"{ESQ}/{defecto}/schema.json"


# ----------------------------------------------------------------- expresiones
def lit(v):
    return {"expr": {"Literal": {"Value": v}}}


def texto(s: str):
    return lit("'" + s.replace("'", "''") + "'")


def color(h: str):
    return {"solid": {"color": texto(h)}}


def col(tabla: str, campo: str):
    return {"Column": {"Expression": {"SourceRef": {"Entity": tabla}}, "Property": campo}}


def med(tabla: str, campo: str):
    return {"Measure": {"Expression": {"SourceRef": {"Entity": tabla}}, "Property": campo}}


def proy(campo: dict, nombre_corto: str | None = None):
    tipo = "Column" if "Column" in campo else "Measure"
    tabla = campo[tipo]["Expression"]["SourceRef"]["Entity"]
    prop = campo[tipo]["Property"]
    return {"field": campo, "queryRef": f"{tabla}.{prop}", "nativeQueryRef": nombre_corto or prop}


def contenedor():
    return {
        "background": [{"properties": {"show": lit("false")}}],
        "border": [{"properties": {"show": lit("false")}}],
        "dropShadow": [{"properties": {"show": lit("false")}}],
        "visualHeader": [{"properties": {"show": lit("false")}}],
        "padding": [{"properties": {k: lit("0D") for k in ("top", "bottom", "left", "right")}}],
        "title": [{"properties": {"show": lit("false")}}],
    }


def visual(nombre: str, x, y, ancho, alto, z, cuerpo: dict, filtros: dict | None = None) -> dict:
    v = {"$schema": esquema("visual", "visualContainer/2.12.0"), "name": nombre,
         "position": {"x": x, "y": y, "z": z, "width": ancho, "height": alto, "tabOrder": z}, "visual": cuerpo}
    if filtros:
        v["filterConfig"] = filtros
    return v


def filtro_in(tabla: str, campo: str, valor_literal: str):
    return {"Version": 2, "From": [{"Name": "t", "Entity": tabla, "Type": 0}],
            "Where": [{"Condition": {"In": {"Expressions": [{"Column": {"Expression": {"SourceRef": {"Source": "t"}}, "Property": campo}}],
                                            "Values": [[{"Literal": {"Value": valor_literal}}]]}}}]}


# --------------------------------------------------------------- objetos visuales
def identificador(nombre: str) -> str:
    rep = DEF / "report.json"
    ids = []
    if rep.exists():
        r = leer(rep)
        ids += list(r.get("publicCustomVisuals", []))
        for paquete in r.get("resourcePackages", []):
            ids += [paquete.get("name", "")] + [i.get("name", "") for i in paquete.get("items", [])]
    ids += [leer(f).get("visual", {}).get("visualType", "") for f in DEF.rglob("visual.json")]
    ids += [c.name for c in (INFORME / "CustomVisuals").glob("*")] if (INFORME / "CustomVisuals").exists() else []
    for i in ids:
        if nombre.lower() in i.lower():
            return i.replace(".pbiviz.json", "")
    raise SystemExit(f"No encuentro el objeto visual {nombre} en el informe: impórtalo y guarda.")


def html(nombre, x, y, ancho, alto, z, medida, guid):
    return visual(nombre, x, y, ancho, alto, z, {
        "visualType": guid,
        "query": {"queryState": {"content": {"projections": [proy(med("Medidas", medida))]}}},
        "objects": {"contentFormatting": [{"properties": {"format": texto("html"), "renderMode": texto("rebuild"),
                                                          "userSelect": lit("false"), "noDataMessage": texto("")}}],
                    "compatibility": [{"properties": {"legacyRendering": lit("true")}}]},
        "visualContainerObjects": contenedor(),
        "drillFilterOtherVisuals": True,
    })


CAMPOS_GLOBO = ["ViajeID", "Viaje", "Modo", "RutaID", "Vía", "Origen", "Destino", "Origen nombre", "Destino nombre"]
MEDIDAS_GLOBO = ["Lon hoy", "Lat hoy", "Lon siguiente hoy", "Lat siguiente hoy", "Estado hoy", "Progreso hoy",
                 "Contenedores del viaje", "Contenedores sin filtro", "Retraso del viaje", "Valor del viaje (texto)",
                 "Categorías del viaje", "Llegada prevista del viaje", "Fecha del globo", "Escenario del globo"]


def deneb(nombre, x, y, ancho, alto, z, guid, spec: str):
    campos = [col("Viajes", c) for c in CAMPOS_GLOBO] + [med("Medidas", m) for m in MEDIDAS_GLOBO]
    return visual(nombre, x, y, ancho, alto, z, {
        "visualType": guid,
        "query": {"queryState": {"dataset": {"projections": [proy(c) for c in campos]}}},
        "objects": {"vega": [{"properties": {
            "provider": texto("vega"), "jsonSpec": texto(spec), "jsonConfig": texto("{}"), "renderMode": texto("canvas"),
            "enableTooltips": lit("true"), "enableContextMenu": lit("true"), "enableSelection": lit("false"),
            "enableHighlight": lit("false")}}]},
        "visualContainerObjects": contenedor(),
        "drillFilterOtherVisuals": True,
    })


def botonera(nombre, x, y, ancho, alto, z, tabla, campo, valor_literal, columnas, unica=True, letra=11):
    """Segmentador de botones (fichas redondeadas, una fila) con estilo propio para la opción elegida."""
    def por_estado(normal, elegido, encima=None):
        filas = [{"properties": normal, "selector": {"id": "default"}},
                 {"properties": elegido, "selector": {"id": "selection:selected"}}]
        if encima:
            filas.append({"properties": encima, "selector": {"id": "interaction:hover"}})
        return filas

    objetos = {
        "selection": [{"properties": {"singleSelect": lit("true" if unica else "false"),
                                      "strictSingleSelect": lit("true" if unica else "false"),
                                      "selectAllCheckboxEnabled": lit("false")}}],
        "layout": [{"properties": {"style": texto("Cards"), "orientation": lit("2L"), "rowCount": lit("1L"),
                                   "columnCount": lit(f"{columnas}L"), "autoGrid": lit("false"),
                                   "cellPadding": lit("4L"), "maxTiles": lit(f"{columnas}L")}}],
        "shapeCustomRectangle": [{"properties": {"tileShape": texto("rectangleRoundedByPixel"), "rectangleRoundedCurve": lit("8L")}}],
        "fillCustom": por_estado({"show": lit("true"), "fillColor": color("#0C1322"), "transparency": lit("0D")},
                                 {"show": lit("true"), "fillColor": color("#2DD4BF"), "transparency": lit("0D")},
                                 {"show": lit("true"), "fillColor": color("#16233B"), "transparency": lit("0D")}),
        "outline": por_estado({"show": lit("true"), "lineColor": color("#22324D"), "weight": lit("1D"), "transparency": lit("0D")},
                              {"show": lit("true"), "lineColor": color("#5EEAD4"), "weight": lit("1D"), "transparency": lit("0D")}),
        "value": por_estado({"show": lit("true"), "fontColor": color("#94A3B8"), "fontSize": lit(f"{letra}D"),
                             "fontFamily": texto("Segoe UI Semibold"), "horizontalAlignment": texto("center")},
                            {"show": lit("true"), "fontColor": color("#04211D"), "fontSize": lit(f"{letra}D"),
                             "fontFamily": texto("Segoe UI Semibold"), "horizontalAlignment": texto("center")}),
        "glowCustom": [{"properties": {"show": lit("false")}}],
        "label": [{"properties": {"show": lit("false")}}],
    }
    if valor_literal:
        objetos["general"] = [{"properties": {"filter": {"filter": filtro_in(tabla, campo, valor_literal)}}}]
    return visual(nombre, x, y, ancho, alto, z, {
        "visualType": "advancedSlicerVisual",
        "query": {"queryState": {"Values": {"projections": [proy(col(tabla, campo))]}}},
        "objects": objetos,
        "visualContainerObjects": contenedor(),
        "drillFilterOtherVisuals": True,
    })


def curva(nombre, x, y, ancho, alto, z):
    escenario, base = "Valor en tránsito (€)", "Valor en tránsito (Base)"
    return visual(nombre, x, y, ancho, alto, z, {
        "visualType": "lineChart",
        "query": {"queryState": {
            "Category": {"projections": [proy(col("Calendario", "Fecha")) | {"active": True}]},
            "Y": {"projections": [proy(med("Medidas", escenario), "En el escenario elegido"), proy(med("Medidas", base), "Escenario Base")]},
        }},
        "objects": {
            "dataPoint": [{"properties": {"fill": color("#F43F5E")}, "selector": {"metadata": f"Medidas.{escenario}"}},
                          {"properties": {"fill": color("#475569")}, "selector": {"metadata": f"Medidas.{base}"}}],
            "lineStyles": [{"properties": {"strokeWidth": lit("2D")}}],
            "valueAxis": [{"properties": {"gridlineShow": lit("true"), "labelColor": color("#64748B"), "gridlineColor": color("#1E293B"),
                                          "labelDisplayUnits": lit("1000000D"), "showAxisTitle": lit("false")}}],
            "categoryAxis": [{"properties": {"labelColor": color("#64748B"), "showAxisTitle": lit("false"), "gridlineShow": lit("false")}}],
            "legend": [{"properties": {"show": lit("true"), "position": texto("TopRight"), "labelColor": color("#94A3B8"),
                                       "fontSize": lit("9D"), "showTitle": lit("false")}}],
        },
        "visualContainerObjects": contenedor(),
        "drillFilterOtherVisuals": True,
    })


def barras(nombre, x, y, ancho, alto, z):
    colores = [{"properties": {"fill": {"solid": {"color": {"expr": med("Medidas", "Color de categoría")}}}},
                "selector": {"data": [{"dataViewWildcard": {"matchingOption": 1}}]}}]
    return visual(nombre, x, y, ancho, alto, z, {
        "visualType": "clusteredBarChart",
        "query": {
            "queryState": {
                "Category": {"projections": [proy(col("Categorías", "Categoría")) | {"active": True}]},
                "Y": {"projections": [proy(med("Medidas", "Valor en tránsito (€)"))]},
            },
            "sortDefinition": {"sort": [{"field": med("Medidas", "Valor en tránsito (€)"), "direction": "Descending"}], "isDefaultSort": True},
        },
        "objects": {
            "dataPoint": colores,
            "labels": [{"properties": {"show": lit("true"), "color": color("#E2E8F0"), "fontSize": lit("9D"),
                                       "labelDisplayUnits": lit("1000000D"), "labelPrecision": lit("1L")}}],
            "valueAxis": [{"properties": {"show": lit("false"), "gridlineShow": lit("false")}}],
            "categoryAxis": [{"properties": {"labelColor": color("#CBD5E1"), "fontSize": lit("10D"), "showAxisTitle": lit("false")}}],
        },
        "visualContainerObjects": contenedor(),
        "drillFilterOtherVisuals": True,
    })


# ------------------------------------------------------------------------ tema y fondo
def registrar_recursos() -> bool:
    rep_path = DEF / "report.json"
    rep = leer(rep_path)
    carpeta = INFORME / "StaticResources" / "RegisteredResources"
    carpeta.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(RAIZ / "informe" / TEMA, carpeta / TEMA)
    tc = rep.setdefault("themeCollection", {})
    tc["customTheme"] = {"name": TEMA, "reportVersionAtImport": tc.get("baseTheme", {}).get("reportVersionAtImport", "5.66"),
                         "type": "RegisteredResources"}
    paquetes = rep.setdefault("resourcePackages", [])
    reg = next((p for p in paquetes if p.get("type") == "RegisteredResources"), None)
    if reg is None:
        reg = {"name": "RegisteredResources", "type": "RegisteredResources", "items": []}
        paquetes.append(reg)
    reg["items"] = [i for i in reg.get("items", []) if i.get("name") not in (TEMA, FONDO)]
    reg["items"].append({"name": TEMA, "path": TEMA, "type": "CustomTheme"})
    hay_fondo = (RAIZ / "informe" / FONDO).exists()
    if hay_fondo:   # diseñado en Figma (archivo «Torre de control · Power BI»)
        shutil.copyfile(RAIZ / "informe" / FONDO, carpeta / FONDO)
        reg["items"].append({"name": FONDO, "path": FONDO, "type": "Image"})
    escribir(rep_path, rep)
    return hay_fondo


# --------------------------------------------------------------------- página
def main() -> None:
    g_deneb = identificador("deneb")
    g_html = identificador("htmlContent")
    ruta_escena = Path(ARGS.escena) if ARGS.escena else RAIZ / "globo" / "torre_globo.vega.json"
    spec = json.dumps(json.loads(ruta_escena.read_text(encoding="utf-8")), ensure_ascii=False, separators=(",", ":"))
    hay_fondo = registrar_recursos()

    paginas = DEF / "pages"
    meta_path = paginas / "pages.json"
    meta = leer(meta_path) if meta_path.exists() else {"$schema": f"{ESQ}/pagesMetadata/1.1.0/schema.json"}
    orden = [p for p in meta.get("pageOrder", []) if p != PAGINA]
    for carpeta in [c for c in paginas.iterdir() if c.is_dir() and c.name != PAGINA]:
        vis = list((carpeta / "visuals").glob("*/visual.json"))
        if all(not leer(v).get("visual", {}).get("query") for v in vis):
            shutil.rmtree(carpeta)
            orden = [p for p in orden if p != carpeta.name]
    dir_pag = paginas / PAGINA
    if dir_pag.exists():
        shutil.rmtree(dir_pag)
    fondo = {"color": color("#04070F"), "transparency": lit("0D")}
    if hay_fondo:
        fondo["image"] = {"image": {"name": texto(FONDO), "scaling": texto("Fit"),
                                    "url": {"expr": {"ResourcePackageItem": {"PackageName": "RegisteredResources", "PackageType": 1, "ItemName": FONDO}}}}}
    escribir(dir_pag / "page.json", {
        "$schema": esquema("page", "page/2.1.0"), "name": PAGINA, "displayName": "Torre de control",
        "displayOption": "FitToPage", "height": 1080, "width": 1920,
        "objects": {"background": [{"properties": fondo}],
                    "outspace": [{"properties": {"color": color("#02040A"), "transparency": lit("0D")}}]},
        "visualInteractions": [
            {"source": "barrasCategoria", "target": "curvaTransito", "type": "DataFilter"},
            {"source": "curvaTransito", "target": "barrasCategoria", "type": "DataFilter"},
        ],
    })
    esc_def = CFG["torre"]["escenario_por_defecto"].replace("'", "''")
    n_esc = len(CFG.escenarios)
    # Rejilla del fondo diseñado en Figma: columna izquierda (32 · 420), escenario del globo (476 · 968) y
    # columna derecha (1468 · 420). Los rótulos ESCENARIO, MODO y los de la curva y las barras están en el fondo.
    objetos = [
        html("cabecera", 104, 20, 1784, 64, 1000, "HTML · Cabecera", g_html),
        botonera("selectorEscenario", 138, 110, 306, 40, 2000, "Escenarios", "Escenario", f"'{esc_def}'", n_esc),
        html("indicadores", 32, 172, 420, 876, 3000, "HTML · Indicadores", g_html),
        botonera("selectorModo", 552, 110, 330, 40, 4000, "Modos", "Modo", None, 3, unica=False),
        deneb("globo", 476, 156, 968, 704, 5000, g_deneb, spec),
        html("leyenda", 476, 862, 968, 24, 5500, "HTML · Leyenda", g_html),
        curva("curvaTransito", 484, 918, 952, 124, 6000),
        html("alertas", 1468, 100, 420, 452, 7000, "HTML · Alertas", g_html),
        html("llegadas", 1468, 566, 420, 196, 8000, "HTML · Llegadas", g_html),
        barras("barrasCategoria", 1476, 810, 404, 230, 9000),
    ]
    for v in objetos:
        escribir(dir_pag / "visuals" / v["name"] / "visual.json", v)
    meta["pageOrder"] = [PAGINA] + orden
    meta["activePageName"] = PAGINA
    escribir(meta_path, meta)
    print(f"Página escrita con {len(objetos)} objetos visuales{' y fondo' if hay_fondo else ' (sin fondo todavía)'}. "
          f"Deneb={g_deneb} HTML={g_html}")


if __name__ == "__main__":
    main()
