# -*- coding: utf-8 -*-
"""
Construye la especificación Vega del globo (torre_globo.vega.json) para Deneb.

Lo fijo va incrustado: el mapa del mundo (world-atlas, Natural Earth), las rutas de red.config.json
trazadas por círculo máximo, puertos, pasos, proveedores, el almacén y las zonas de incidencia.
Lo que depende del momento y de los filtros llega de Power BI en el conjunto «dataset»: una fila por
buque, vuelo o camión en ruta el día elegido, con su posición y sus contenedores.

La Tierra se dibuja con proyección ortográfica: se gira arrastrando, se acerca con la rueda y tiene
botones de vista con giro animado. La noche se calcula con la fecha elegida (declinación del Sol).

Uso: python construir_globo.py [--config otra.config.json] [--salida otro.vega.json]
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "generador"))
from configuracion import RAIZ, argumentos, cargar  # noqa: E402

ARGS = argumentos("Genera la especificación Vega del globo.",
                  "ruta del .vega.json (por defecto, globo/torre_globo.vega.json)").parse_args()
CFG = cargar(ARGS.config)
SALIDA = Path(ARGS.salida) if ARGS.salida else Path(__file__).resolve().with_name("torre_globo.vega.json")
MAPA = json.loads((RAIZ / "mapa" / "countries-110m.json").read_text(encoding="utf-8"))

# Nombres de país en el mapa (Natural Earth, en inglés)
PAIS_MAPA = {"China": "China", "Vietnam": "Vietnam", "Corea del Sur": "South Korea", "India": "India",
             "Turquía": "Turkey", "Brasil": "Brazil", "México": "Mexico", "Estados Unidos": "United States of America",
             "Italia": "Italy", "Polonia": "Poland", "Marruecos": "Morocco", "España": "Spain", "Francia": "France",
             "Alemania": "Germany", "Portugal": "Portugal", "Japón": "Japan", "Tailandia": "Thailand",
             "Indonesia": "Indonesia", "Malasia": "Malaysia", "Bangladés": "Bangladesh", "Pakistán": "Pakistan",
             "Egipto": "Egypt", "Sudáfrica": "South Africa", "Reino Unido": "United Kingdom", "Países Bajos": "Netherlands",
             "Chile": "Chile", "Perú": "Peru", "Argentina": "Argentina", "Colombia": "Colombia", "Canadá": "Canada"}

# --------------------------------------------------------------------- paleta
COLOR_VIA = {"Suez": "#38BDF8", "Cabo": "#F59E0B", "Atlántico": "#2DD4BF", "Mediterráneo": "#A78BFA",
             "Europa": "#94A3B8", "Aérea": "#E879F9"}
VEHICULO = {"ok": "#F8FAFC", "leve": "#FBBF24", "grave": "#FB7185"}
# Vehículos vistos desde arriba, por piezas. Cada pieza es una ruta SVG en un marco común en el que el
# vehículo va de y = -1 (proa o morro) a y = 1 (popa o cola); todas se dibujan con el mismo tamaño y giro,
# así encajan como una maqueta. (nombre, ruta, relleno, trazo)


def cajas(cajas_xy: list) -> str:
    return "".join(f"M{x:.3f},{y:.3f}h{w:.3f}v{h:.3f}h{-w:.3f}Z" for x, y, w, h in cajas_xy)


# Contenedores: 8 bahías de dos columnas repartidas entre cuatro colores (patrón fijo)
_BAHIAS = [(-0.6 + k * 0.145, 0.12) for k in range(8)]
_PATRON = "RAAMVRMA" + "AVRRMAVA"
_COL = {"R": [], "A": [], "M": [], "V": []}
for k, (y0, alto) in enumerate(_BAHIAS):
    _COL[_PATRON[k]].append((-0.135, y0, 0.128, alto))
    _COL[_PATRON[8 + k]].append((0.007, y0, 0.128, alto))
BUQUE = [
    ("estela", "M-0.1,0.98L-0.27,1.85M0.1,0.98L0.27,1.85M0,1.02L0,1.55", None, "#E0F2FE"),
    ("casco", "M0,-1C0.11,-0.88,0.18,-0.66,0.18,-0.36L0.18,0.9Q0.18,1,0.08,1L-0.08,1Q-0.18,1,-0.18,0.9L-0.18,-0.36C-0.18,-0.66,-0.11,-0.88,0,-1Z",
     "#1B2A40", "#7C93B5"),
    ("cont_rojo", cajas(_COL["R"]), "#E2584D", None),
    ("cont_azul", cajas(_COL["A"]), "#3B82F6", None),
    ("cont_ambar", cajas(_COL["M"]), "#F2A93B", None),
    ("cont_verde", cajas(_COL["V"]), "#22B8A0", None),
    ("puente", cajas([(-0.16, 0.6, 0.32, 0.17)]), "#F1F5F9", None),
    ("chimenea", cajas([(-0.05, 0.8, 0.1, 0.08)]), "#334155", None),
]
_AVION = ("M0,-1C0.06,-0.95,0.08,-0.85,0.08,-0.7L0.08,-0.2L0.95,0.18L0.95,0.3L0.08,0.12L0.07,0.62L0.36,0.82L0.36,0.92L0,0.84"
          "L-0.36,0.92L-0.36,0.82L-0.07,0.62L-0.08,0.12L-0.95,0.3L-0.95,0.18L-0.08,-0.2L-0.08,-0.7C-0.08,-0.85,-0.06,-0.95,0,-1Z")
AVION = [
    ("fuselaje", _AVION, "#F8FAFC", "#64748B"),
    ("motores", cajas([(0.36, -0.02, 0.09, 0.17), (-0.45, -0.02, 0.09, 0.17)]), "#94A3B8", None),
    ("franja", cajas([(-0.022, -0.62, 0.044, 1.2)]), "#E879F9", None),
    ("cabina", "M-0.05,-0.86L0.05,-0.86L0.06,-0.78L-0.06,-0.78Z", "#1E3A5F", None),
]
CAMION = [
    ("remolque", cajas([(-0.38, -0.46, 0.76, 1.46)]), "#E2E8F0", "#475569"),
    ("techo", cajas([(-0.3, -0.38, 0.6, 1.3)]), "#CBD5E1", None),
    ("cabina", "M-0.34,-1L0.34,-1L0.34,-0.54L-0.34,-0.54Z", "#38BDF8", "#0C4A6E"),
    ("luna", cajas([(-0.26, -0.96, 0.52, 0.12)]), "#0B1220", None),
]
R = math.pi / 180


def r3(v: float) -> float:
    return round(v, 3)


def circulo(lon: float, lat: float, radio_km: float, pasos: int = 48) -> list:
    """Polígono de un círculo sobre la esfera, en el sentido que d3-geo entiende como interior."""
    d = radio_km / 6371.0
    pts = []
    for i in range(pasos + 1):
        b = 2 * math.pi * i / pasos
        la = math.asin(math.sin(lat * R) * math.cos(d) + math.cos(lat * R) * math.sin(d) * math.cos(b))
        lo = lon * R + math.atan2(math.sin(b) * math.sin(d) * math.cos(lat * R), math.cos(d) - math.sin(lat * R) * math.sin(la))
        pts.append([r3(lo / R), r3(la / R)])
    return pts


def anillo_noche(radio: float) -> str:
    """Expresión Vega del casquete de radio dado (grados) centrado en el punto antisolar."""
    cr, sr = math.cos(radio * R), math.sin(radio * R)
    pts = []
    for b in range(0, 361, 6):
        cb, sb = round(math.cos(b * R), 6), round(math.sin(b * R), 6)
        la = f"asin(sA * {cr:.6f} + cA * {sr:.6f} * {cb})"
        pts.append(f"[antiLon + atan2({sb} * {sr:.6f} * cA, {cr:.6f} - sA * sin({la})) * 180 / PI, {la} * 180 / PI]")
    return "{type: 'Feature', geometry: {type: 'Polygon', coordinates: [[" + ", ".join(pts) + "]]}}"


# --------------------------------------------------------------------- datos fijos
t = CFG["torre"]
nodos = {n["id"]: n for n in CFG["nodos"] + CFG["almacenes"]}
cd = CFG["almacenes"][0]

carriles = []
for r in CFG["rutas"]:
    for o in r["origenes"]:
        tray = CFG.trayectoria(r, o)
        carriles.append({"type": "Feature", "clave": f"{r['id']}|{o}", "ruta": r["id"], "via": r["via"], "modo": r["modo"],
                         "alternativa": r["id"] in CFG.alternativas, "color": COLOR_VIA.get(r["via"], "#94A3B8"),
                         "geometry": {"type": "LineString", "coordinates": [[r3(x), r3(y)] for x, y in tray.puntos]}})

puntos_red = []
for n in CFG["nodos"]:
    puntos_red.append({"id": n["id"], "nombre": n["nombre"], "pais": n.get("pais", ""), "tipo": n["tipo"],
                       "lon": n["lon"], "lat": n["lat"]})
puntos_red.append({"id": cd["id"], "nombre": cd["nombre"], "pais": cd["pais"], "tipo": "almacén", "lon": cd["lon"], "lat": cd["lat"]})
color_cat = {c["nombre"]: c["color"] for c in CFG.categorias}
proveedores = [{"id": p["id"], "nombre": f"Proveedor {p['id'][-2:]} · {p['ciudad']}", "ciudad": p["ciudad"], "pais": p["pais"],
                "categoria": p["categoria"], "color": color_cat[p["categoria"]], "lon": p["lon"], "lat": p["lat"],
                "olon": CFG.coordenadas(p["origen"])[0], "olat": CFG.coordenadas(p["origen"])[1]} for p in CFG["proveedores"]]
enlaces = [{"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[p["lon"], p["lat"]], [p["olon"], p["olat"]]]}}
           for p in proveedores]
paises_proveedor = sorted({PAIS_MAPA.get(p["pais"], p["pais"]) for p in CFG["proveedores"]})
pais_destino = PAIS_MAPA.get(cd["pais"], cd["pais"])

incidencias = []
for e in CFG.escenarios:
    for c in e.get("cierres", []):
        lon, lat = CFG.coordenadas(c["paso"])
        incidencias.append({"type": "Feature", "escenario": e["nombre"], "tipo": "Cierre", "nombre": nodos[c["paso"]]["nombre"],
                            "desde": c["desde"], "hasta": c["hasta"], "lon": lon, "lat": lat,
                            "geometry": {"type": "Polygon", "coordinates": [circulo(lon, lat, 520)]}})
    if e.get("congestion_destino"):
        cg = e["congestion_destino"]
        for dest in sorted({r["destino"] for r in CFG["rutas"] if r["modo"] == "Marítimo"}):
            lon, lat = CFG.coordenadas(dest)
            incidencias.append({"type": "Feature", "escenario": e["nombre"], "tipo": "Congestión", "nombre": nodos[dest]["nombre"],
                                "desde": cg["desde"], "hasta": cg["hasta"], "lon": lon, "lat": lat,
                                "geometry": {"type": "Polygon", "coordinates": [circulo(lon, lat, 140)]}})

# Arcos de los vuelos: el círculo máximo entre origen y destino, en 41 puntos; en el globo se elevan sobre la
# superficie (más altos cuanto más largo es el vuelo), con la sombra de la ruta pintada en el suelo
from configuracion import intermedio, distancia_km  # noqa: E402

arcos, altura_vuelo = [], {}
for r in CFG["rutas"]:
    if r["modo"] != "Aéreo":
        continue
    for o in r["origenes"]:
        a, b = CFG.coordenadas(o), CFG.coordenadas(r["destino"])
        h = round(0.03 + 0.11 * distancia_km(a, b) / 20000, 3)
        altura_vuelo[r["id"]] = h
        for k in range(41):
            lon, lat = intermedio(a, b, k / 40)
            arcos.append({"clave": f"{r['id']}|{o}", "t": k / 40, "lon": r3(lon), "lat": r3(lat), "H": h, "color": COLOR_VIA["Aérea"]})

ALTURAS = json.dumps(altura_vuelo).replace('"', "'")   # altura máxima de cada vuelo, para las expresiones Vega
vistas = CFG["vista"]["vistas"]
inicial = next(v for v in vistas if v["nombre"] == CFG["vista"]["vista_inicial"])


# --------------------------------------------------------------------- utilidades de expresión
def visible(lon: str = "datum.lon", lat: str = "datum.lat") -> str:
    """Coseno de la distancia angular al centro de la vista: positivo si el punto está en la cara visible."""
    return f"(sin(lat0 * PI / 180) * sin({lat} * PI / 180) + cos(lat0 * PI / 180) * cos({lat} * PI / 180) * cos(({lon} - lon0) * PI / 180))"


def geo(nombre: str) -> dict:
    return {"type": "geoshape", "projection": "proy", **({"field": nombre} if nombre else {})}


def campo(nombre: str) -> str:
    return f"data('dataset')[0]['{nombre}']"


def pagina(nombre: str, defecto: str) -> str:
    """Valor común a todas las filas del conjunto (una medida de página); si no hay filas, el de la configuración."""
    return f"length(data('dataset')) && {campo(nombre)} ? {campo(nombre)} : {defecto}"


# --------------------------------------------------------------------- especificación
spec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": f"{t['nombre']} · {t.get('subtitulo', '')}: globo de la red de aprovisionamiento. Generado por "
                   f"globo/construir_globo.py a partir de {CFG.ruta.name}: no editar a mano. Mapa: world-atlas (Natural Earth).",
    "background": "transparent",
    "padding": 0,
    "autosize": "none",
    "signals": [
        {"name": "fecha", "update": pagina("Fecha del globo", f"'{t['fecha_por_defecto']}'")},
        {"name": "escenario", "update": pagina("Escenario del globo", f"'{t['escenario_por_defecto']}'")},
        {"name": "reloj", "value": 0, "on": [{"events": {"type": "timer", "throttle": 40}, "update": "now()"}]},
        # Giro y zoom: arrastrar, rueda, botones de vista (con giro animado) y botones + / −
        {"name": "zoom", "value": inicial["zoom"], "on": [
            {"events": {"type": "wheel", "consume": True}, "update": "clamp(zoom * pow(1.0016, -event.deltaY), 0.7, 6)"},
            {"events": "@botonZoom:click", "update": "clamp(zoom * datum.factor, 0.7, 6)"},
            {"events": {"signal": "reloj"}, "update": "destino ? zoom + (destino[2] - zoom) * 0.12 : zoom"}]},
        {"name": "radio", "update": "min(width, height) * 0.43 * zoom"},
        {"name": "cx", "update": "width / 2"},
        {"name": "cy", "update": "height / 2 + 6"},
        {"name": "inicio", "value": None, "on": [{"events": "mousedown", "update": "[x(), y(), giroX, giroY]"}]},
        {"name": "destino", "value": None, "on": [
            {"events": "mousedown", "update": "null"},
            {"events": "@botonVista:click", "update": "[datum.lon, datum.lat, datum.zoom]"}]},
        {"name": "giroX", "value": -inicial["lon"], "on": [
            {"events": "[mousedown, window:mouseup] > window:mousemove", "update": "inicio[2] + (x() - inicio[0]) * 57 / radio"},
            {"events": {"signal": "reloj"}, "update": "destino ? giroX + ((((-destino[0] - giroX) % 360) + 540) % 360 - 180) * 0.12 : giroX"}]},
        {"name": "giroY", "value": -inicial["lat"], "on": [
            {"events": "[mousedown, window:mouseup] > window:mousemove", "update": "clamp(inicio[3] - (y() - inicio[1]) * 57 / radio, -85, 85)"},
            {"events": {"signal": "reloj"}, "update": "destino ? giroY + (-destino[1] - giroY) * 0.12 : giroY"}]},
        {"name": "lon0", "update": "-giroX"},
        {"name": "lat0", "update": "-giroY"},
        {"name": "arrastrando", "value": False, "on": [{"events": "mousedown", "update": "true"},
                                                       {"events": "window:mouseup", "update": "false"}]},
        # Sol: declinación del día elegido; la noche se centra en el punto antisolar (a las 12:00 UTC)
        {"name": "diaDelAño", "update": "dayofyear(toDate(fecha))"},
        {"name": "antiLat", "update": "23.44 * cos(2 * PI / 365 * (diaDelAño + 10))"},
        {"name": "antiLon", "value": 180},
        {"name": "sA", "update": "sin(antiLat * PI / 180)"},
        {"name": "cA", "update": "cos(antiLat * PI / 180)"},
        # Flujo de los pulsos por las rutas (período del patrón: 16,5 px)
        {"name": "flujo", "update": "-((reloj / 40) % 165)"},
        {"name": "latido", "update": "(reloj % 1800) / 1800"},
        {"name": "encima", "value": None, "on": [
            {"events": "@vehiculoBarco:mouseover, @vehiculoAvion:mouseover, @vehiculoCamion:mouseover", "update": "datum.id"},
            {"events": "@vehiculoBarco:mouseout, @vehiculoAvion:mouseout, @vehiculoCamion:mouseout", "update": "null"}]},
        {"name": "encimaClave", "value": None, "on": [
            {"events": "@vehiculoBarco:mouseover, @vehiculoAvion:mouseover, @vehiculoCamion:mouseover", "update": "datum.clave"},
            {"events": "@vehiculoBarco:mouseout, @vehiculoAvion:mouseout, @vehiculoCamion:mouseout", "update": "null"}]},
        # Tamaño de los vehículos: crecen al acercar, pero menos que el globo
        {"name": "escalaV", "update": "pow(clamp(zoom, 0.8, 5), 0.7)"},
    ],
    "projections": [{"name": "proy", "type": "orthographic", "scale": {"signal": "radio"},
                     "rotate": [{"signal": "giroX"}, {"signal": "giroY"}, 0],
                     "translate": [{"signal": "cx"}, {"signal": "cy"}], "clipAngle": 90}],
    "data": [
        {"name": "dataset"},
        {"name": "esfera", "values": [{"type": "Sphere"}]},
        {"name": "reticula", "transform": [{"type": "graticule", "step": [15, 15]}]},
        {"name": "paises", "values": MAPA, "format": {"type": "topojson", "feature": "countries"}, "transform": [
            {"type": "formula", "as": "papel", "expr": f"datum.properties.name == '{pais_destino}' ? 'destino' : "
                                                       f"indexof({json.dumps(paises_proveedor)}, datum.properties.name) >= 0 ? 'proveedor' : 'otro'"}]},
        {"name": "noche", "values": [{"capa": 0}, {"capa": 1}, {"capa": 2}], "transform": [
            {"type": "formula", "as": "geo", "expr": f"datum.capa == 0 ? {anillo_noche(92)} : datum.capa == 1 ? {anillo_noche(84)} : {anillo_noche(76)}"}]},
        {"name": "viajes", "source": "dataset", "transform": [
            {"type": "filter", "expr": "isValid(datum['Lon hoy']) && isValid(datum['Lat hoy'])"},
            {"type": "formula", "as": "id", "expr": "datum.ViajeID"},
            {"type": "formula", "as": "lon", "expr": "datum['Lon hoy']"},
            {"type": "formula", "as": "lat", "expr": "datum['Lat hoy']"},
            {"type": "formula", "as": "lon2", "expr": "datum['Lon siguiente hoy']"},
            {"type": "formula", "as": "lat2", "expr": "datum['Lat siguiente hoy']"},
            {"type": "formula", "as": "n", "expr": "datum['Contenedores del viaje'] || 0"},
            {"type": "formula", "as": "nTotal", "expr": "datum['Contenedores sin filtro'] || datum['Contenedores del viaje'] || 0"},
            {"type": "formula", "as": "atenuado", "expr": "datum.n == 0"},
            {"type": "formula", "as": "retraso", "expr": "datum['Retraso del viaje'] || 0"},
            {"type": "formula", "as": "nivel", "expr": "datum.retraso > 7 ? 'grave' : datum.retraso > 2 ? 'leve' : 'ok'"},
            {"type": "formula", "as": "clave", "expr": "datum.RutaID + '|' + datum.Origen"},
            {"type": "geopoint", "projection": "proy", "fields": ["lon", "lat"], "as": ["x", "y"]},
            {"type": "geopoint", "projection": "proy", "fields": ["lon2", "lat2"], "as": ["x2", "y2"]},
            {"type": "formula", "as": "cara", "expr": visible()},
            # Los aviones vuelan por encima de la superficie: altura según el punto del vuelo
            {"type": "formula", "as": "h", "expr": "datum.Modo == 'Aéreo' ? (" + ALTURAS + "[datum.RutaID] || 0.08) * sin(PI * clamp(datum['Progreso hoy'] || 0, 0, 1)) : 0"},
            {"type": "formula", "as": "h2", "expr": "datum.Modo == 'Aéreo' ? (" + ALTURAS + "[datum.RutaID] || 0.08) * sin(PI * clamp((datum['Progreso hoy'] || 0) + 0.03, 0, 1)) : 0"},
            {"type": "formula", "as": "xa", "expr": "cx + (datum.x - cx) * (1 + datum.h)"},
            {"type": "formula", "as": "ya", "expr": "cy + (datum.y - cy) * (1 + datum.h)"},
            {"type": "formula", "as": "xa2", "expr": "cx + (datum.x2 - cx) * (1 + datum.h2)"},
            {"type": "formula", "as": "ya2", "expr": "cy + (datum.y2 - cy) * (1 + datum.h2)"},
            {"type": "formula", "as": "visible", "expr": "datum.cara > 0 || (1 + datum.h) * sqrt(max(0, 1 - datum.cara * datum.cara)) > 1.01"},
            {"type": "formula", "as": "angulo", "expr": "atan2(datum.ya2 - datum.ya, datum.xa2 - datum.xa) * 180 / PI + 90"},
            {"type": "formula", "as": "lado", "expr": "(datum.Modo == 'Marítimo' ? 22 + 3.2 * sqrt(datum.nTotal) : datum.Modo == 'Aéreo' ? 26 : 13) * escalaV"},
        ]},
        {"name": "barcos", "source": "viajes", "transform": [{"type": "filter", "expr": "datum.Modo == 'Marítimo'"}]},
        {"name": "aviones", "source": "viajes", "transform": [{"type": "filter", "expr": "datum.Modo == 'Aéreo'"}]},
        {"name": "camiones", "source": "viajes", "transform": [{"type": "filter", "expr": "datum.Modo == 'Carretera'"}]},
        {"name": "progresoVuelos", "source": "aviones", "transform": [
            {"type": "aggregate", "groupby": ["clave"], "fields": ["Progreso hoy"], "ops": ["max"], "as": ["p"]}]},
        {"name": "activas", "source": "viajes", "transform": [
            {"type": "aggregate", "groupby": ["clave"], "fields": ["n"], "ops": ["sum"], "as": ["n"]}]},
        {"name": "carriles", "values": carriles, "transform": [
            {"type": "formula", "as": "activa", "expr": "indata('activas', 'clave', datum.clave)"},
            {"type": "filter", "expr": "!datum.alternativa || datum.activa"}]},
        {"name": "carrilesActivos", "source": "carriles", "transform": [{"type": "filter", "expr": "datum.activa && datum.modo != 'Aéreo'"}]},
        {"name": "carrilEncima", "source": "carriles", "transform": [{"type": "filter", "expr": "encimaClave && datum.clave == encimaClave && datum.modo != 'Aéreo'"}]},
        {"name": "arcos", "values": arcos, "transform": [
            {"type": "lookup", "from": "progresoVuelos", "key": "clave", "fields": ["clave"], "values": ["p"], "as": ["p"], "default": -1},
            {"type": "geopoint", "projection": "proy", "fields": ["lon", "lat"], "as": ["x", "y"]},
            {"type": "formula", "as": "cara", "expr": "(sin(lat0 * PI / 180) * sin(datum.lat * PI / 180) + cos(lat0 * PI / 180) * cos(datum.lat * PI / 180) * cos((datum.lon - lon0) * PI / 180))"},
            {"type": "formula", "as": "h", "expr": "datum.H * sin(PI * datum.t)"},
            {"type": "formula", "as": "xs", "expr": "cx + (datum.x - cx) * (1 + datum.h)"},
            {"type": "formula", "as": "ys", "expr": "cy + (datum.y - cy) * (1 + datum.h)"},
            {"type": "formula", "as": "visible", "expr": "datum.cara > 0 || (1 + datum.h) * sqrt(max(0, 1 - datum.cara * datum.cara)) > 1.01"},
            {"type": "formula", "as": "activo", "expr": "datum.p >= 0"},
            {"type": "formula", "as": "recorrido", "expr": "datum.p >= 0 && datum.t <= datum.p + 0.001"}]},
        {"name": "incidencias", "values": incidencias, "transform": [
            {"type": "filter", "expr": "datum.escenario == escenario && fecha >= datum.desde && fecha <= datum.hasta"},
            {"type": "geopoint", "projection": "proy", "fields": ["lon", "lat"], "as": ["x", "y"]},
            {"type": "formula", "as": "cara", "expr": visible()}]},
        {"name": "enlaces", "values": enlaces},
        {"name": "proveedores", "values": proveedores, "transform": [
            {"type": "geopoint", "projection": "proy", "fields": ["lon", "lat"], "as": ["x", "y"]},
            {"type": "formula", "as": "cara", "expr": visible()}]},
        {"name": "red", "values": puntos_red, "transform": [
            {"type": "geopoint", "projection": "proy", "fields": ["lon", "lat"], "as": ["x", "y"]},
            {"type": "formula", "as": "cara", "expr": visible()}]},
        {"name": "vistas", "values": [dict(v, i=i) for i, v in enumerate(vistas)], "transform": [
            {"type": "formula", "as": "ancho", "expr": "length(datum.nombre) * 6.6 + 26"},
            {"type": "window", "ops": ["sum"], "fields": ["ancho"], "as": ["acum"]},
            {"type": "formula", "as": "x0", "expr": "16 + datum.acum - datum.ancho + datum.i * 6"}]},
        {"name": "zoomBotones", "values": [{"t": "+", "factor": 1.35, "i": 0}, {"t": "−", "factor": 1 / 1.35, "i": 1}]},
    ],
}

# --------------------------------------------------------------------- marcas
def capa(datos, enc, nombre=None, transform=None, tipo="shape", interactiva=False):
    m = {"type": tipo, "from": {"data": datos}, "interactive": interactiva, "encode": {"update": enc}}
    if nombre:
        m["name"] = nombre
    if transform:
        m["transform"] = transform
    return m


texto = {"font": {"value": "Segoe UI"}}


def halo(datos: str, x: str, y: str, factor: float):
    """Halo de estado bajo cada vehículo: blanco en plazo, ámbar con retraso, rosa (y latiendo) si va muy tarde."""
    stops = lambda c, a: [{"offset": 0, "color": f"rgba({c},{a})"}, {"offset": 1, "color": f"rgba({c},0)"}]
    grad = lambda c, a: "{gradient: 'radial', x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.5, stops: " + \
        json.dumps(stops(c, a)).replace('"', "'") + "}"
    return capa(datos, {"x": {"field": x}, "y": {"field": y}, "shape": {"value": "circle"},
                        "size": {"signal": f"pow(datum.lado * {factor} * (datum.nivel == 'grave' ? 1 + 0.35 * latido : 1), 2)"},
                        "fill": {"signal": f"datum.nivel == 'grave' ? {grad('251,113,133', 0.55)} : datum.nivel == 'leve' ? "
                                           f"{grad('251,191,36', 0.45)} : {grad('226,232,240', 0.22)}"},
                        "opacity": {"signal": "(datum.visible && !datum.atenuado) ? (datum.nivel == 'grave' ? 1 - 0.4 * latido : 1) : 0"}},
                tipo="symbol")


def piezas(datos: str, lista: list, x: str = "x", y: str = "y", nombre_interactiva: str | None = None, sombra: bool = False):
    """Dibuja un vehículo por piezas con el mismo tamaño y giro. La primera pieza con relleno recibe el ratón."""
    marcas = []
    for k, (nombre, ruta, relleno, trazo) in enumerate(lista):
        enc = {"x": {"field": x}, "y": {"field": y}, "shape": {"value": ruta}, "angle": {"field": "angulo"},
               "size": {"signal": "datum.lado * datum.lado"},
               "opacity": {"signal": "datum.visible ? (datum.atenuado ? 0.16 : 1) : 0"}}
        if sombra:
            # sombra del avión en el suelo, más separada cuanto más alto vuela
            enc.update({"fill": {"value": "#00040D"}, "opacity": {"signal": "datum.cara > 0 && !datum.atenuado ? 0.4 : 0"},
                        "x": {"signal": "datum.x + 3 + 70 * datum.h * escalaV"}, "y": {"signal": "datum.y + 5 + 110 * datum.h * escalaV"}})
        elif relleno:
            enc["fill"] = {"value": relleno}
            if trazo:
                enc["stroke"] = {"signal": f"encima == datum.id ? '#FFFFFF' : '{trazo}'"}
                enc["strokeWidth"] = {"signal": "encima == datum.id ? 1.6 : 0.6"}
        else:   # estela: más visible al acercar; nada si el buque está fondeado
            enc.update({"fill": {"value": "transparent"}, "stroke": {"value": trazo}, "strokeWidth": {"value": 0.9},
                        "strokeOpacity": {"signal": "datum['Estado hoy'] == 'Fondeado' ? 0 : clamp(0.12 * zoom, 0.12, 0.45)"},
                        "strokeCap": {"value": "round"}})
        m = {"type": "symbol", "from": {"data": datos}, "interactive": False, "encode": {"update": enc}}
        if nombre_interactiva and relleno and trazo and not sombra and not any(mm.get("name") for mm in marcas):
            m.update(name=nombre_interactiva, interactive=True)
            enc["cursor"] = {"value": "pointer"}
            enc["tooltip"] = {"signal": "datum.visible ? (datum.Modo == 'Marítimo' ? {"
                                        + COMUNES.replace("CARGA", "'Contenedores': datum.nTotal") + "} : {"
                                        + COMUNES.replace("CARGA", "'Cargas': datum.nTotal") + "}) : null"}
        marcas.append(m)
    return marcas


def vehiculos():
    """Buques y camiones sobre la superficie; arcos de vuelo y aviones por encima."""
    fondeo = capa("barcos", {"x": {"field": "x"}, "y": {"field": "y"}, "shape": {"value": "circle"},
                             "size": {"signal": "datum['Estado hoy'] == 'Fondeado' ? pow(datum.lado * 1.15, 2) : 0"}, "fill": {"value": "transparent"},
                             "stroke": {"value": "#FBBF24"}, "strokeWidth": {"value": 1.2}, "strokeDash": {"value": [2, 3]},
                             "opacity": {"signal": "datum.visible && !datum.atenuado ? 0.9 : 0"}}, tipo="symbol")
    arco = lambda enc: {"type": "group", "from": {"facet": {"name": "arco", "data": "arcos", "groupby": "clave"}},
                        "marks": [{"type": "line", "from": {"data": "arco"}, "interactive": False, "encode": {"update": {
                            "x": {"field": "xs"}, "y": {"field": "ys"}, "defined": {"signal": "datum.visible"}, **enc}}}]}
    recorrido = lambda enc: {"type": "group", "from": {"facet": {"name": "arcoHecho", "data": "arcos", "groupby": "clave"}},
                             "marks": [{"type": "line", "from": {"data": "arcoHecho"}, "interactive": False, "encode": {"update": {
                                 "x": {"field": "xs"}, "y": {"field": "ys"}, "defined": {"signal": "datum.visible && datum.recorrido"}, **enc}}}]}
    return [
        halo("camiones", "x", "y", 1.5), *piezas("camiones", CAMION, nombre_interactiva="vehiculoCamion"),
        fondeo, halo("barcos", "x", "y", 1.25), *piezas("barcos", BUQUE, nombre_interactiva="vehiculoBarco"),
        # Vuelos: arco tenue, tramo recorrido con brillo, pulsos, sombra en el suelo y avión en altura
        arco({"stroke": {"field": "color"}, "strokeOpacity": {"signal": "datum.activo ? 0.35 : 0.14"}, "strokeWidth": {"value": 1},
              "strokeDash": {"value": [3, 4]}}),
        recorrido({"stroke": {"field": "color"}, "strokeOpacity": {"value": 0.18}, "strokeWidth": {"value": 7}, "strokeCap": {"value": "round"}}),
        recorrido({"stroke": {"field": "color"}, "strokeOpacity": {"value": 0.95}, "strokeWidth": {"value": 1.6}}),
        arco({"stroke": {"value": "#FDF4FF"}, "strokeOpacity": {"signal": "datum.activo ? 0.9 : 0"}, "strokeWidth": {"value": 2.4},
              "strokeCap": {"value": "round"}, "strokeDash": {"value": [0.5, 16]}, "strokeDashOffset": {"signal": "flujo"}}),
        *piezas("aviones", AVION[:1], sombra=True),
        halo("aviones", "xa", "ya", 1.5), *piezas("aviones", AVION, x="xa", y="ya", nombre_interactiva="vehiculoAvion"),
    ]
# Ficha de cada buque, vuelo o camión (CARGA se sustituye por contenedores o cargas según el modo)
COMUNES = ("'Viaje': datum.Viaje, "
           "'Ruta': datum['Origen nombre'] + ' → ' + datum['Destino nombre'] + ' (vía ' + datum['Vía'] + ')', "
           "'Estado': datum['Estado hoy'] + ' · ' + format(datum['Progreso hoy'] * 100, '.0f') + ' % del recorrido', "
           "CARGA, 'Valor de la carga': datum['Valor del viaje (texto)'], 'Categorías': datum['Categorías del viaje'], "
           "'Llegada prevista': datum['Llegada prevista del viaje'], "
           "'Retraso': datum.retraso > 0.5 ? '+' + format(datum.retraso, '.0f') + ' días sobre lo previsto' : 'En plazo'")
spec["marks"] = [
    # Atmósfera: halo azul alrededor del disco
    {"type": "symbol", "interactive": False, "encode": {"update": {
        "x": {"signal": "cx"}, "y": {"signal": "cy"}, "shape": {"value": "circle"}, "size": {"signal": "pow(radio * 2.36, 2)"},
        "fill": {"value": {"gradient": "radial", "x1": 0.5, "y1": 0.5, "r1": 0.415, "x2": 0.5, "y2": 0.5, "r2": 0.5,
                           "stops": [{"offset": 0, "color": "rgba(56,189,248,0.42)"}, {"offset": 0.35, "color": "rgba(45,212,191,0.12)"},
                                     {"offset": 1, "color": "rgba(56,189,248,0)"}]}}}}},
    # Océano con luz desde arriba a la izquierda
    capa("esfera", {"fill": {"value": {"gradient": "radial", "x1": 0.36, "y1": 0.3, "r1": 0, "x2": 0.5, "y2": 0.5, "r2": 0.66,
                                       "stops": [{"offset": 0, "color": "#14406E"}, {"offset": 0.55, "color": "#0A2547"},
                                                 {"offset": 1, "color": "#040D1E"}]}},
                    "stroke": {"value": "#7DD3FC"}, "strokeOpacity": {"value": 0.55}, "strokeWidth": {"value": 1.2}},
         transform=[geo(None)]),
    capa("reticula", {"stroke": {"value": "#2B5A8A"}, "strokeOpacity": {"value": 0.35}, "strokeWidth": {"value": 0.5}, "fill": {"value": None}},
         transform=[geo(None)]),
    capa("paises", {
        "fill": {"signal": "datum.papel == 'destino' ? '#0F766E' : datum.papel == 'proveedor' ? '#1E3A5F' : '#16253D'"},
        "stroke": {"signal": "datum.papel == 'destino' ? '#5EEAD4' : datum.papel == 'proveedor' ? '#4B7BAF' : '#2A4466'"},
        "strokeWidth": {"signal": "datum.papel == 'otro' ? 0.45 : 0.8"},
        "tooltip": {"signal": "datum.papel == 'proveedor' ? {'País con proveedores': datum.properties.name} : null"}},
         transform=[geo(None)], interactiva=True),
    # Reflejo: brillo suave en la parte iluminada, para que la esfera tenga volumen
    capa("esfera", {"fill": {"value": {"gradient": "radial", "x1": 0.32, "y1": 0.26, "r1": 0, "x2": 0.32, "y2": 0.26, "r2": 0.55,
                                       "stops": [{"offset": 0, "color": "rgba(186,230,253,0.13)"}, {"offset": 1, "color": "rgba(186,230,253,0)"}]}}},
         transform=[geo(None)]),
    # Noche (tres casquetes para que el terminador sea suave)
    capa("noche", {"fill": {"value": "#000207"}, "fillOpacity": {"signal": "datum.capa == 0 ? 0.42 : 0.2"}},
         transform=[geo("datum.geo")]),
    # Zonas de incidencia que laten
    capa("incidencias", {
        "fill": {"signal": "datum.tipo == 'Cierre' ? '#F43F5E' : '#F59E0B'"},
        "fillOpacity": {"signal": "0.10 + 0.14 * (1 - latido)"},
        "stroke": {"signal": "datum.tipo == 'Cierre' ? '#FB7185' : '#FBBF24'"}, "strokeWidth": {"value": 1.4},
        "strokeDash": {"value": [4, 3]}, "strokeOpacity": {"value": 0.9}}, transform=[geo(None)]),
    # Rutas: todas, tenues y punteadas; las activas, con halo, núcleo y pulsos de luz que viajan hacia el destino
    capa("carriles", {"stroke": {"field": "color"}, "strokeOpacity": {"signal": "datum.modo == 'Aéreo' ? 0.16 : datum.activa ? 0.2 : 0.13"},
                      "strokeWidth": {"signal": "datum.modo == 'Carretera' ? 0.7 : 0.9"}, "fill": {"value": None},
                      "strokeDash": {"signal": "datum.activa && datum.modo != 'Aéreo' ? [1, 0] : [1.5, 3.5]"}}, transform=[geo(None)]),
    capa("carrilesActivos", {"stroke": {"field": "color"}, "strokeOpacity": {"value": 0.07},
                             "strokeWidth": {"signal": "datum.modo == 'Carretera' ? 4 : 9"}, "fill": {"value": None},
                             "strokeCap": {"value": "round"}, "strokeJoin": {"value": "round"}}, transform=[geo(None)]),
    capa("carrilesActivos", {"stroke": {"field": "color"}, "strokeOpacity": {"value": 0.22},
                             "strokeWidth": {"signal": "datum.modo == 'Carretera' ? 2 : 3.2"}, "fill": {"value": None},
                             "strokeCap": {"value": "round"}, "strokeJoin": {"value": "round"}}, transform=[geo(None)]),
    capa("carrilesActivos", {"stroke": {"field": "color"}, "strokeOpacity": {"value": 0.85},
                             "strokeWidth": {"signal": "datum.modo == 'Carretera' ? 0.8 : 1.1"}, "fill": {"value": None}}, transform=[geo(None)]),
    capa("carrilesActivos", {"stroke": {"value": "#F8FAFC"}, "strokeOpacity": {"value": 0.9},
                             "strokeWidth": {"signal": "datum.modo == 'Carretera' ? 1.8 : 2.6"}, "fill": {"value": None},
                             "strokeCap": {"value": "round"}, "strokeDash": {"value": [0.5, 16]}, "strokeDashOffset": {"signal": "flujo"}},
         transform=[geo(None)]),
    capa("carrilEncima", {"stroke": {"value": "#FFFFFF"}, "strokeOpacity": {"value": 0.9}, "strokeWidth": {"value": 2},
                          "fill": {"value": None}}, transform=[geo(None)]),
    # Proveedores y su enlace con el puerto de salida
    capa("enlaces", {"stroke": {"value": "#CBD5E1"}, "strokeOpacity": {"value": 0.35}, "strokeWidth": {"value": 0.7},
                     "strokeDash": {"value": [2, 2]}, "fill": {"value": None}}, transform=[geo(None)]),
    capa("proveedores", {"x": {"field": "x"}, "y": {"field": "y"}, "shape": {"value": "diamond"},
                         "size": {"signal": "clamp(26 * zoom, 22, 90)"}, "fill": {"field": "color"},
                         "stroke": {"value": "#0B1220"}, "strokeWidth": {"value": 0.8},
                         "opacity": {"signal": "datum.cara > 0 ? 1 : 0"},
                         "tooltip": {"signal": "datum.cara > 0 ? {'Proveedor': datum.nombre, 'País': datum.pais, 'Categoría': datum.categoria} : null"}},
         tipo="symbol", interactiva=True),
    # Puertos (anillo y punto), aeropuertos y pasos
    capa("red", {"x": {"field": "x"}, "y": {"field": "y"}, "shape": {"value": "circle"},
                 "size": {"signal": "(datum.tipo == 'destino' ? 300 : datum.tipo == 'origen' ? 150 : datum.tipo == 'aeropuerto' ? 110 : 0) * clamp(zoom, 1, 2)"},
                 "fill": {"value": "transparent"}, "strokeWidth": {"value": 1},
                 "stroke": {"signal": "datum.tipo == 'destino' ? '#5EEAD4' : datum.tipo == 'aeropuerto' ? '#F0ABFC' : '#CBD5E1'"},
                 "strokeOpacity": {"signal": "datum.tipo == 'destino' ? 0.75 : 0.5"},
                 "opacity": {"signal": "datum.cara > 0.05 ? 1 : 0"}}, tipo="symbol"),
    capa("red", {"x": {"field": "x"}, "y": {"field": "y"},
                 "shape": {"signal": "datum.tipo == 'paso' ? 'diamond' : 'circle'"},
                 "size": {"signal": "(datum.tipo == 'destino' ? 46 : datum.tipo == 'paso' ? 40 : datum.tipo == 'almacén' ? 0 : 22) * clamp(zoom, 1, 2)"},
                 "fill": {"signal": "datum.tipo == 'destino' ? '#2DD4BF' : datum.tipo == 'aeropuerto' ? '#E879F9' : datum.tipo == 'paso' ? '#0B1220' : '#F1F5F9'"},
                 "stroke": {"signal": "datum.tipo == 'paso' ? '#94A3B8' : '#0B1220'"}, "strokeWidth": {"value": 1},
                 "opacity": {"signal": "datum.cara > 0.05 ? 1 : 0"},
                 "tooltip": {"signal": "datum.cara > 0 ? {'Punto': datum.nombre, 'País': datum.pais, 'Tipo': datum.tipo} : null"}},
         tipo="symbol", interactiva=True),
    # Rótulos en pastilla: pasos siempre; puertos al acercar
    capa("red", {"x": {"signal": "datum.x + 8"}, "y": {"signal": "datum.y - 15"}, "height": {"value": 15}, "cornerRadius": {"value": 7.5},
                 "width": {"signal": "length(datum.nombre) * (datum.tipo == 'paso' ? 5.9 : 6.4) + 14"},
                 "fill": {"value": "rgba(6,12,24,0.78)"}, "stroke": {"signal": "datum.tipo == 'destino' ? 'rgba(94,234,212,0.5)' : 'rgba(148,163,184,0.3)'"},
                 "strokeWidth": {"value": 0.8},
                 "opacity": {"signal": "datum.cara > 0.25 && datum.tipo != 'almacén' && datum.tipo != 'aeropuerto' && datum.id != 'GIBRALTAR' && (zoom > 1.6 || datum.tipo == 'paso') ? 1 : 0"}},
         tipo="rect"),
    capa("red", {"x": {"signal": "datum.x + 15"}, "y": {"signal": "datum.y - 7.2"}, "baseline": {"value": "middle"}, "text": {"signal": "upper(datum.nombre)"},
                 "fontSize": {"signal": "datum.tipo == 'paso' ? 8.5 : 9.2"}, "fontWeight": {"signal": "datum.tipo == 'destino' ? 'bold' : 600"},
                 "letterSpacing": {"value": 0.5}, **texto,
                 "fill": {"signal": "datum.tipo == 'paso' ? '#CBD5E1' : datum.tipo == 'destino' ? '#99F6E4' : '#E2E8F0'"},
                 "opacity": {"signal": "datum.cara > 0.25 && datum.tipo != 'almacén' && datum.tipo != 'aeropuerto' && datum.id != 'GIBRALTAR' && (zoom > 1.6 || datum.tipo == 'paso') ? 1 : 0"}},
         tipo="text"),
    # Incidencias: ondas que se expanden, barrera en el paso cerrado y rótulo en pastilla
    capa("incidencias", {"x": {"field": "x"}, "y": {"field": "y"}, "shape": {"value": "circle"}, "fill": {"value": "transparent"},
                         "size": {"signal": "pow(2 * radio * (datum.tipo == 'Cierre' ? 0.082 : 0.022) * (1 + 0.7 * latido), 2)"},
                         "stroke": {"signal": "datum.tipo == 'Cierre' ? '#FB7185' : '#FBBF24'"}, "strokeWidth": {"value": 1.5},
                         "strokeOpacity": {"signal": "0.9 * (1 - latido)"}, "opacity": {"signal": "datum.cara > 0 ? 1 : 0"}}, tipo="symbol"),
    capa("incidencias", {"x": {"field": "x"}, "y": {"field": "y"}, "shape": {"value": "cross"}, "angle": {"value": 45},
                         "size": {"signal": "datum.tipo == 'Cierre' ? 150 * clamp(zoom, 1, 2) : 0"}, "fill": {"value": "#F43F5E"},
                         "stroke": {"value": "#FFF1F2"}, "strokeWidth": {"value": 1}, "opacity": {"signal": "datum.cara > 0 ? 1 : 0"}}, tipo="symbol"),
    capa("incidencias", {"x": {"signal": "datum.x - (length(datum.nombre) + 11) * 3.3 - 10"}, "y": {"signal": "datum.y - 31 * clamp(zoom, 1, 2)"},
                         "width": {"signal": "(length(datum.nombre) + 11) * 6.6 + 20"}, "height": {"value": 18}, "cornerRadius": {"value": 9},
                         "fill": {"signal": "datum.tipo == 'Cierre' ? 'rgba(76,5,25,0.88)' : 'rgba(69,26,3,0.88)'"},
                         "stroke": {"signal": "datum.tipo == 'Cierre' ? '#FB7185' : '#FBBF24'"}, "strokeWidth": {"value": 1},
                         "opacity": {"signal": "datum.cara > 0.2 ? 1 : 0"}}, tipo="rect"),
    capa("incidencias", {"x": {"field": "x"}, "y": {"signal": "datum.y - 31 * clamp(zoom, 1, 2) + 9.5"}, "baseline": {"value": "middle"},
                         "text": {"signal": "datum.tipo == 'Cierre' ? upper(datum.nombre) + ' · CERRADO' : 'CONGESTIÓN · ' + upper(datum.nombre)"},
                         "align": {"value": "center"}, "fontSize": {"value": 9.5}, "fontWeight": {"value": "bold"}, "letterSpacing": {"value": 0.6}, **texto,
                         "fill": {"signal": "datum.tipo == 'Cierre' ? '#FFE4E6' : '#FEF3C7'"},
                         "opacity": {"signal": "datum.cara > 0.2 ? 1 : 0"}}, tipo="text"),
    # Almacén CD-01: haz de luz vertical, ondas que laten y punto
    capa("red", {"x": {"signal": "datum.x - 1.5"}, "y": {"signal": "datum.y - 46 * clamp(zoom, 1, 2)"}, "width": {"value": 3},
                 "height": {"signal": "46 * clamp(zoom, 1, 2)"},
                 "fill": {"value": {"gradient": "linear", "x1": 0, "y1": 0, "x2": 0, "y2": 1,
                                    "stops": [{"offset": 0, "color": "rgba(94,234,212,0)"}, {"offset": 1, "color": "rgba(94,234,212,0.95)"}]}},
                 "opacity": {"signal": "datum.tipo == 'almacén' && datum.cara > 0 ? 1 : 0"}}, tipo="rect"),
    capa("red", {"x": {"field": "x"}, "y": {"field": "y"}, "shape": {"value": "circle"},
                 "size": {"signal": "datum.tipo == 'almacén' ? 60 + 900 * latido : 0"}, "fill": {"value": "transparent"},
                 "stroke": {"value": "#2DD4BF"}, "strokeWidth": {"value": 1.6}, "strokeOpacity": {"signal": "1 - latido"},
                 "opacity": {"signal": "datum.cara > 0 ? 1 : 0"}}, tipo="symbol"),
    capa("red", {"x": {"field": "x"}, "y": {"field": "y"}, "shape": {"value": "circle"},
                 "size": {"signal": "datum.tipo == 'almacén' ? 90 : 0"}, "fill": {"value": "#2DD4BF"},
                 "stroke": {"value": "#ECFEFF"}, "strokeWidth": {"value": 1.5},
                 "opacity": {"signal": "datum.cara > 0 ? 1 : 0"},
                 "tooltip": {"signal": "datum.tipo == 'almacén' ? {'Destino': datum.nombre} : null"}}, tipo="symbol", interactiva=True),
    capa("red", {"x": {"signal": "datum.x - 10"}, "y": {"signal": "datum.y - 8"}, "align": {"value": "right"}, "baseline": {"value": "middle"},
                 "text": {"signal": "datum.tipo == 'almacén' ? datum.id : ''"}, "fontSize": {"value": 12}, "fontWeight": {"value": "bold"},
                 **texto, "fill": {"value": "#99F6E4"}, "opacity": {"signal": "datum.cara > 0 ? 1 : 0"}}, tipo="text"),
    *vehiculos(),
]
# Controles: botones de vista, zoom y pista de uso
boton_fondo = {"fill": {"value": "rgba(10,18,34,0.82)"}, "stroke": {"value": "rgba(148,163,184,0.35)"}, "strokeWidth": {"value": 1},
               "cornerRadius": {"value": 13}, "cursor": {"value": "pointer"}}
spec["marks"] += [
    {"type": "rect", "name": "botonVista", "from": {"data": "vistas"}, "encode": {"update": {
        "x": {"field": "x0"}, "y": {"value": 14}, "width": {"field": "ancho"}, "height": {"value": 26}, **boton_fondo,
        "stroke": {"signal": "destino && destino[0] == datum.lon && destino[1] == datum.lat ? '#5EEAD4' : 'rgba(148,163,184,0.35)'"}}}},
    {"type": "text", "from": {"data": "vistas"}, "interactive": False, "encode": {"update": {
        "x": {"signal": "datum.x0 + datum.ancho / 2"}, "y": {"value": 27}, "align": {"value": "center"}, "baseline": {"value": "middle"},
        "text": {"field": "nombre"}, "fontSize": {"value": 11}, "fontWeight": {"value": 600}, **texto,
        "fill": {"signal": "destino && destino[0] == datum.lon && destino[1] == datum.lat ? '#5EEAD4' : '#CBD5E1'"}}}},
    {"type": "rect", "name": "botonZoom", "from": {"data": "zoomBotones"}, "encode": {"update": {
        "x": {"signal": "width - 44"}, "y": {"signal": "height - 84 + datum.i * 34"}, "width": {"value": 28}, "height": {"value": 28},
        **boton_fondo, "cornerRadius": {"value": 8}}}},
    {"type": "text", "from": {"data": "zoomBotones"}, "interactive": False, "encode": {"update": {
        "x": {"signal": "width - 30"}, "y": {"signal": "height - 70 + datum.i * 34"}, "align": {"value": "center"}, "baseline": {"value": "middle"},
        "text": {"field": "t"}, "fontSize": {"value": 16}, "fontWeight": {"value": 600}, **texto, "fill": {"value": "#E2E8F0"}}}},
    {"type": "text", "interactive": False, "encode": {"update": {
        "x": {"value": 16}, "y": {"signal": "height - 14"}, "text": {"value": "Arrastra para girar · rueda para acercar"},
        "fontSize": {"value": 10.5}, **texto, "fill": {"value": "#64748B"}}}},
]

SALIDA.write_text(json.dumps(spec, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Globo escrito en {SALIDA.name}: {len(carriles)} carriles, {len(puntos_red)} puntos de red, {len(proveedores)} proveedores, "
      f"{len(incidencias)} zonas de incidencia, {SALIDA.stat().st_size // 1024} KB")
