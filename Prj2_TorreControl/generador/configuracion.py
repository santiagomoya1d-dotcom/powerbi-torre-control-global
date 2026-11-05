# -*- coding: utf-8 -*-
"""
Lee y valida red.config.json, la única descripción de la red de aprovisionamiento, y ofrece la
geometría que comparten el simulador y la escena del globo: trayectorias de cada ruta por círculo
máximo, distancias e interpolación de posiciones sobre la esfera.
"""
from __future__ import annotations

import csv
import json
import math
from dataclasses import dataclass
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent          # carpeta Prj2_TorreControl
CONFIG = RAIZ / "red.config.json"
DATOS = RAIZ / "datos"
RADIO_TIERRA_KM = 6371.0


def _sin_comentarios(x):
    if isinstance(x, dict):
        return {k: _sin_comentarios(v) for k, v in x.items() if not str(k).startswith("_")}
    if isinstance(x, list):
        return [_sin_comentarios(v) for v in x]
    return x


# ------------------------------------------------------------------ geometría esférica
def _vec(lon: float, lat: float) -> tuple[float, float, float]:
    lo, la = math.radians(lon), math.radians(lat)
    return math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)


def _lonlat(v) -> tuple[float, float]:
    x, y, z = v
    return math.degrees(math.atan2(y, x)), math.degrees(math.atan2(z, math.hypot(x, y)))


def distancia_km(a: tuple, b: tuple) -> float:
    va, vb = _vec(*a), _vec(*b)
    d = max(-1.0, min(1.0, sum(p * q for p, q in zip(va, vb))))
    return math.acos(d) * RADIO_TIERRA_KM


def intermedio(a: tuple, b: tuple, t: float) -> tuple[float, float]:
    """Punto a la fracción t del arco de círculo máximo entre a y b."""
    va, vb = _vec(*a), _vec(*b)
    om = math.acos(max(-1.0, min(1.0, sum(p * q for p, q in zip(va, vb)))))
    if om < 1e-9:
        return a
    s = math.sin(om)
    k1, k2 = math.sin((1 - t) * om) / s, math.sin(t * om) / s
    return _lonlat(tuple(k1 * p + k2 * q for p, q in zip(va, vb)))


@dataclass
class Trayectoria:
    puntos: list            # [(lon, lat), ...]
    acumulado: list         # km acumulados en cada punto
    nombres: list           # nombre de cada punto (id de nodo o de punto de paso)

    @property
    def km(self) -> float:
        return self.acumulado[-1]

    def en(self, f: float) -> tuple[float, float]:
        """Posición a la fracción f (0 = salida, 1 = llegada) del recorrido."""
        f = max(0.0, min(1.0, f))
        objetivo = f * self.km
        for i in range(1, len(self.puntos)):
            if objetivo <= self.acumulado[i] or i == len(self.puntos) - 1:
                tramo = self.acumulado[i] - self.acumulado[i - 1]
                t = 0.0 if tramo <= 0 else (objetivo - self.acumulado[i - 1]) / tramo
                return intermedio(self.puntos[i - 1], self.puntos[i], max(0.0, min(1.0, t)))
        return self.puntos[-1]

    def fraccion_de(self, nombre: str) -> float | None:
        """Fracción del recorrido en la que se pasa por un punto con nombre (p. ej. SUEZ)."""
        return self.acumulado[self.nombres.index(nombre)] / self.km if nombre in self.nombres else None


# ------------------------------------------------------------------ configuración
@dataclass
class Configuracion:
    ruta: Path
    datos: dict

    def __getitem__(self, clave):
        return self.datos[clave]

    def coordenadas(self, nombre: str) -> tuple[float, float]:
        for n in self.datos["nodos"] + self.datos["almacenes"]:
            if n["id"] == nombre:
                return n["lon"], n["lat"]
        if nombre in self.datos["puntos"]:
            lon, lat = self.datos["puntos"][nombre]
            return lon, lat
        raise KeyError(nombre)

    def ruta_por_id(self, rid: str) -> dict:
        return next(r for r in self.datos["rutas"] if r["id"] == rid)

    @property
    def alternativas(self) -> set:
        return {r["alternativa"] for r in self.datos["rutas"] if r.get("alternativa")}

    def ruta_habitual(self, origen: str) -> dict:
        """Ruta que se usa normalmente desde un origen (no la alternativa de otra)."""
        for r in self.datos["rutas"]:
            if origen in r["origenes"] and r["id"] not in self.alternativas:
                return r
        raise KeyError(f"No hay ruta desde {origen}")

    def trayectoria(self, ruta: dict, origen: str) -> Trayectoria:
        entradas = ruta.get("entradas", {}).get(origen, [])
        resto = ruta["puntos"]
        if entradas and entradas[-1] in resto:
            resto = resto[resto.index(entradas[-1]) + 1:]
        nombres = [origen] + entradas + resto
        puntos = [self.coordenadas(n) for n in nombres]
        acum = [0.0]
        for a, b in zip(puntos, puntos[1:]):
            acum.append(acum[-1] + distancia_km(a, b))
        return Trayectoria(puntos=puntos, acumulado=acum, nombres=nombres)

    @property
    def categorias(self) -> list:
        return self.datos["categorias"]

    @property
    def escenarios(self) -> list:
        return self.datos["escenarios"]


def cargar(ruta: str | Path | None = None) -> Configuracion:
    ruta = Path(ruta) if ruta else CONFIG
    if not ruta.exists():
        raise SystemExit(f"No encuentro la configuración: {ruta}")
    try:
        d = _sin_comentarios(json.loads(ruta.read_text(encoding="utf-8")))
    except json.JSONDecodeError as e:
        raise SystemExit(f"{ruta.name} no es un JSON válido: {e}")
    cfg = Configuracion(ruta=ruta, datos=d)
    err: list[str] = []

    ids = [n["id"] for n in d.get("nodos", []) + d.get("almacenes", [])] + list(d.get("puntos", {}))
    if len(ids) != len(set(ids)):
        err.append("hay identificadores repetidos entre nodos, almacenes y puntos")
    for r in d.get("rutas", []):
        for n in r["origenes"] + r["puntos"] + [p for e in r.get("entradas", {}).values() for p in e]:
            if n not in ids:
                err.append(f"rutas.{r['id']}: no existe el punto «{n}»")
        if r.get("alternativa") and r["alternativa"] not in {x["id"] for x in d["rutas"]}:
            err.append(f"rutas.{r['id']}: la alternativa «{r['alternativa']}» no existe")
        if r["modo"] not in ("Marítimo", "Aéreo", "Carretera"):
            err.append(f"rutas.{r['id']}: modo «{r['modo']}» (debe ser Marítimo, Aéreo o Carretera)")
    cats = {c["nombre"] for c in d.get("categorias", [])}
    for p in d.get("proveedores", []):
        if p["categoria"] not in cats:
            err.append(f"proveedores.{p['id']}: categoría «{p['categoria']}» no está en categorias")
        if p["origen"] not in ids:
            err.append(f"proveedores.{p['id']}: origen «{p['origen']}» no existe")
        else:
            try:
                cfg.ruta_habitual(p["origen"])
            except KeyError:
                err.append(f"proveedores.{p['id']}: ninguna ruta sale de «{p['origen']}»")
        if "aereo" in p and not any(p["aereo"]["origen"] in r["origenes"] for r in d["rutas"] if r["modo"] == "Aéreo"):
            err.append(f"proveedores.{p['id']}: no hay ruta aérea desde «{p['aereo']['origen']}»")
    nombres_esc = [e["nombre"] for e in d.get("escenarios", [])]
    if "Base" not in nombres_esc:
        err.append("escenarios: hace falta uno llamado «Base»")
    for e in d.get("escenarios", []):
        for c in e.get("cierres", []):
            if c["paso"] not in ids:
                err.append(f"escenarios.{e['nombre']}: el paso «{c['paso']}» no existe")
    t = d.get("torre", {})
    if t.get("escenario_por_defecto") not in nombres_esc:
        err.append("torre.escenario_por_defecto: debe ser uno de los escenarios")
    try:
        date.fromisoformat(t.get("fecha_por_defecto", ""))
    except ValueError:
        err.append("torre.fecha_por_defecto: usa AAAA-MM-DD")
    for c in d.get("categorias", []):
        if "|" in c["nombre"]:
            err.append(f"categorias.{c['nombre']}: el nombre no puede llevar «|»")
    if err:
        raise SystemExit(f"La configuración {ruta.name} tiene problemas:\n  - " + "\n  - ".join(err))
    return cfg


def escribir_csv(ruta: Path, filas: list[dict], columnas: list[str] | None = None) -> None:
    columnas = columnas or (list(filas[0]) if filas else [])
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with ruta.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=columnas, lineterminator="\r\n")
        w.writeheader()
        for fila in filas:
            w.writerow({k: fila.get(k) for k in columnas})


def argumentos(descripcion: str, salida: str | None = None):
    import argparse
    p = argparse.ArgumentParser(description=descripcion)
    p.add_argument("--config", help="ruta de la configuración (por defecto, red.config.json)")
    if salida:
        p.add_argument("--salida", help=salida)
    return p
