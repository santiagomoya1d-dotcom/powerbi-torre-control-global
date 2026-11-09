# -*- coding: utf-8 -*-
"""
Lleva al informe (PBIR) lo que sale de la configuración: la especificación del globo y el tema.

Uso:     python generador/pagina_torre.py [--config otra.config.json] [--proyecto "<carpeta con Prj2_TorreControl.Report>"]
         python generador/pagina_torre.py --nueva     rehace la página «Torre de control» base desde cero
Lánzalo con Power BI Desktop cerrado y ábrelo después: Desktop no recoge lo que cambie en los archivos mientras está abierto.

Si la página ya existe, solo cambia la especificación Vega del objeto visual del globo y registra el tema: los
botones, los paneles, los marcadores y las páginas Mar, Aire y Carretera se diseñaron en Power BI Desktop y no
se tocan. Con --nueva escribe la página base (tarjetas, globo, segmentadores y curva) sin botones ni paneles: los
marcadores que apuntan a ellos dejarían de funcionar.

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
_p.add_argument("--nueva", action="store_true", help="rehacer la página base desde cero (se pierden botones y paneles)")
ARGS = _p.parse_args()
CFG = cargar(ARGS.config)
PROYECTO = Path(ARGS.proyecto) if ARGS.proyecto else next(c for c in (RAIZ, RAIZ.parent) if any(c.glob("*.Report")))
INFORME = next(PROYECTO.glob("*.Report"))
DEF = INFORME / "definition"
PAGINA = "torre"
TEMA = "TemaTorreClaro.json"
ANTIGUOS = ("TemaTorreOscuro.json", "FondoTorre.png")   # recursos del diseño oscuro anterior
LETRA = "'Segoe UI Variable Display', 'Segoe UI', sans-serif"
TINTA, LIMA, PAPEL, TARJETA, LINEA, GRIS = "#161616", "#CFE24F", "#ECEEEA", "#F7F8F5", "#E2E5DF", "#8A8F87"
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
    """Proyección de un campo; con nombre_corto, ese es el nombre que se ve (leyenda, información sobre herramientas)."""
    tipo = "Column" if "Column" in campo else "Measure"
    tabla = campo[tipo]["Expression"]["SourceRef"]["Entity"]
    prop = campo[tipo]["Property"]
    p = {"field": campo, "queryRef": f"{tabla}.{prop}", "nativeQueryRef": nombre_corto or prop}
    if nombre_corto:
        p["displayName"] = nombre_corto
    return p


def contenedor(fondo: str | None = None, radio: int = 0, titulo: str | None = None, relleno: int = 0):
    """Marco del objeto visual: sin nada, o como tarjeta redondeada (fondo y borde del mismo color) con título."""
    c = {
        "background": [{"properties": {"show": lit("false")}}],
        "border": [{"properties": {"show": lit("false")}}],
        "dropShadow": [{"properties": {"show": lit("false")}}],
        "visualHeader": [{"properties": {"show": lit("false")}}],
        "padding": [{"properties": {k: lit(f"{relleno}D") for k in ("top", "bottom", "left", "right")}}],
        "title": [{"properties": {"show": lit("false")}}],
        "subTitle": [{"properties": {"show": lit("false")}}],
    }
    if fondo:
        c["background"] = [{"properties": {"show": lit("true"), "color": color(fondo), "transparency": lit("0D")}}]
        c["border"] = [{"properties": {"show": lit("true"), "color": color(fondo), "radius": lit(f"{radio}D")}}]
    if titulo:
        c["title"] = [{"properties": {"show": lit("true"), "text": texto(titulo), "fontColor": color(TINTA), "fontSize": lit("12D"),
                                      "fontFamily": texto(LETRA), "bold": lit("true"), "alignment": texto("left")}}]
    return c


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


def deneb(nombre, x, y, ancho, alto, z, guid, spec: str, fondo: str | None = None, radio: int = 0):
    campos = [col("Viajes", c) for c in CAMPOS_GLOBO] + [med("Medidas", m) for m in MEDIDAS_GLOBO]
    return visual(nombre, x, y, ancho, alto, z, {
        "visualType": guid,
        "query": {"queryState": {"dataset": {"projections": [proy(c) for c in campos]}}},
        "objects": {"vega": [{"properties": {
            "provider": texto("vega"), "jsonSpec": texto(spec), "jsonConfig": texto("{}"), "renderMode": texto("canvas"),
            "enableTooltips": lit("true"), "enableContextMenu": lit("true"), "enableSelection": lit("false"),
            "enableHighlight": lit("false")}}]},
        "visualContainerObjects": contenedor(fondo, radio),
        "drillFilterOtherVisuals": True,
    })


def botonera(nombre, x, y, ancho, alto, z, tabla, campo, valor_literal, columnas, unica=True, letra=12):
    """Segmentador de botones en pastillas (una fila): blancas con borde fino; la elegida, negra con letra blanca."""
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
                                   "cellPadding": lit("3L"), "maxTiles": lit(f"{columnas}L")}}],
        "shapeCustomRectangle": [{"properties": {"tileShape": texto("rectangleRoundedByPixel"),
                                                 "rectangleRoundedCurve": lit(f"{max(alto // 2 - 4, 8)}L")}}],
        "fillCustom": por_estado({"show": lit("true"), "fillColor": color("#FFFFFF"), "transparency": lit("0D")},
                                 {"show": lit("true"), "fillColor": color(TINTA), "transparency": lit("0D")},
                                 {"show": lit("true"), "fillColor": color(TARJETA), "transparency": lit("0D")}),
        "outline": por_estado({"show": lit("true"), "lineColor": color(LINEA), "weight": lit("1D"), "transparency": lit("0D")},
                              {"show": lit("true"), "lineColor": color(TINTA), "weight": lit("1D"), "transparency": lit("0D")}),
        "value": por_estado({"show": lit("true"), "fontColor": color(TINTA), "fontSize": lit(f"{letra}D"),
                             "fontFamily": texto(LETRA), "horizontalAlignment": texto("center")},
                            {"show": lit("true"), "fontColor": color("#FFFFFF"), "fontSize": lit(f"{letra}D"),
                             "fontFamily": texto(LETRA), "horizontalAlignment": texto("center")}),
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
    escenario, base = "Tránsito diario (€)", "Tránsito diario (Base)"   # leen la tabla puente Envios por día
    return visual(nombre, x, y, ancho, alto, z, {
        "visualType": "lineChart",
        "query": {"queryState": {
            "Category": {"projections": [proy(col("Calendario", "Fecha")) | {"active": True}]},
            "Y": {"projections": [proy(med("Medidas", escenario), "Escenario elegido"), proy(med("Medidas", base), "Base")]},
        }},
        "objects": {
            "dataPoint": [{"properties": {"fill": color(TINTA)}, "selector": {"metadata": f"Medidas.{escenario}"}},
                          {"properties": {"fill": color(LIMA)}, "selector": {"metadata": f"Medidas.{base}"}}],
            "lineStyles": [{"properties": {"strokeWidth": lit("2D")}}],
            "valueAxis": [{"properties": {"gridlineShow": lit("true"), "labelColor": color(GRIS), "gridlineColor": color(LINEA),
                                          "labelDisplayUnits": lit("1000000D"), "showAxisTitle": lit("false"), "fontSize": lit("8D"),
                                          "fontFamily": texto(LETRA)}}],
            "categoryAxis": [{"properties": {"labelColor": color(GRIS), "showAxisTitle": lit("false"), "gridlineShow": lit("false"),
                                             "fontSize": lit("8D"), "fontFamily": texto(LETRA)}}],
            "legend": [{"properties": {"show": lit("true"), "position": texto("TopRight"), "labelColor": color("#3B3D3A"),
                                       "fontSize": lit("8D"), "showTitle": lit("false"), "fontFamily": texto(LETRA)}}],
        },
        "visualContainerObjects": contenedor(TARJETA, 28, "Valor en tránsito en el año · pincha un día para viajar", 14),
        "drillFilterOtherVisuals": True,
    })


# ------------------------------------------------------------------------ tema y fondo
def registrar_recursos() -> None:
    rep_path = DEF / "report.json"
    rep = leer(rep_path)
    carpeta = INFORME / "StaticResources" / "RegisteredResources"
    carpeta.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(RAIZ / "informe" / TEMA, carpeta / TEMA)
    for viejo in ANTIGUOS:
        (carpeta / viejo).unlink(missing_ok=True)
    tc = rep.setdefault("themeCollection", {})
    tc["customTheme"] = {"name": TEMA, "reportVersionAtImport": tc.get("baseTheme", {}).get("reportVersionAtImport", "5.66"),
                         "type": "RegisteredResources"}
    paquetes = rep.setdefault("resourcePackages", [])
    reg = next((p for p in paquetes if p.get("type") == "RegisteredResources"), None)
    if reg is None:
        reg = {"name": "RegisteredResources", "type": "RegisteredResources", "items": []}
        paquetes.append(reg)
    reg["items"] = [i for i in reg.get("items", []) if i.get("name") not in (TEMA, *ANTIGUOS)]
    reg["items"].append({"name": TEMA, "path": TEMA, "type": "CustomTheme"})
    escribir(rep_path, rep)


# --------------------------------------------------------------------- página
def main() -> None:
    g_deneb = identificador("deneb")
    g_html = identificador("htmlContent")
    ruta_escena = Path(ARGS.escena) if ARGS.escena else RAIZ / "globo" / "torre_globo.vega.json"
    spec = json.dumps(json.loads(ruta_escena.read_text(encoding="utf-8")), ensure_ascii=False, separators=(",", ":"))
    registrar_recursos()

    paginas = DEF / "pages"
    if (paginas / PAGINA).exists() and not ARGS.nueva:
        for f in (paginas / PAGINA / "visuals").glob("*/visual.json"):
            v = leer(f)
            if v.get("visual", {}).get("visualType") == g_deneb:
                v["visual"]["objects"]["vega"][0]["properties"]["jsonSpec"] = texto(spec)
                escribir(f, v)
                print(f"Globo actualizado en {f.parent.name} y tema registrado; el resto de la página no se toca.")
                return
        raise SystemExit("La página «torre» existe pero no encuentro el globo (Deneb). Usa --nueva para rehacerla.")
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
    escribir(dir_pag / "page.json", {
        "$schema": esquema("page", "page/2.1.0"), "name": PAGINA, "displayName": "Torre de control",
        "displayOption": "FitToPage", "height": 1080, "width": 1920,
        "objects": {"background": [{"properties": {"color": color(PAPEL), "transparency": lit("0D")}}],
                    "outspace": [{"properties": {"color": color("#E3E6E0"), "transparency": lit("0D")}}]},
    })
    esc_def = CFG["torre"]["escenario_por_defecto"].replace("'", "''")
    n_esc = len(CFG.escenarios)
    # Rejilla de 1920 × 1080 (estilo claro): barra lateral negra (20 · 76); columna izquierda de indicadores (124 · 424);
    # globo y llegadas en el centro (564 · 896); escenario, fichas y riesgo a la derecha (1476 · 424). 16 px entre tarjetas.
    objetos = [
        html("barraLateral", 20, 20, 76, 1040, 500, "HTML · Barra lateral", g_html),
        html("cabecera", 124, 20, 1416, 112, 1000, "HTML · Cabecera", g_html),
        botonera("selectorEscenario", 1556, 40, 344, 52, 2000, "Escenarios", "Escenario", f"'{esc_def}'", n_esc, letra=13),
        botonera("selectorCategoria", 124, 144, 952, 40, 2500, "Categorías", "Nombre corto", None, len(CFG.categorias), unica=False),
        botonera("selectorModo", 1092, 144, 368, 40, 2600, "Modos", "Modo", None, 3, unica=False),
        html("kpiTransito", 124, 200, 424, 248, 3000, "HTML · En tránsito", g_html),
        html("kpiExposicion", 124, 464, 424, 210, 3100, "HTML · Exposición", g_html),
        html("kpiServicio", 124, 690, 424, 194, 3200, "HTML · Servicio", g_html),
        curva("curvaTransito", 124, 900, 424, 160, 3300),
        deneb("globo", 564, 200, 896, 596, 5000, g_deneb, spec, TARJETA, 28),
        html("vias", 580, 262, 220, 430, 5400, "HTML · Vías", g_html),
        html("leyenda", 580, 752, 864, 34, 5500, "HTML · Leyenda", g_html),
        html("llegadas", 564, 812, 896, 248, 6000, "HTML · Llegadas", g_html),
        html("escenario", 1476, 144, 424, 248, 7000, "HTML · Escenario", g_html),
        html("fichas", 1476, 408, 424, 124, 7100, "HTML · Fichas", g_html),
        html("alertas", 1476, 548, 424, 512, 7200, "HTML · Alertas", g_html),
    ]
    for v in objetos:
        escribir(dir_pag / "visuals" / v["name"] / "visual.json", v)
    meta["pageOrder"] = [PAGINA] + orden
    meta["activePageName"] = PAGINA
    escribir(meta_path, meta)
    print(f"Página escrita con {len(objetos)} objetos visuales. Deneb={g_deneb} HTML={g_html}")


if __name__ == "__main__":
    main()
