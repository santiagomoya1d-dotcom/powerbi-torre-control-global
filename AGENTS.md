# Guía para agentes de IA

Este repositorio es una plantilla: un informe de Power BI con un globo 3D (Deneb + Vega) que muestra una red de aprovisionamiento día a día y compara escenarios. Toda la red se describe en **un archivo de configuración**. Esta guía dice qué tocar para cada cambio, en qué orden y cómo comprobarlo. Para personas, el punto de entrada es el [README](README.md).

## Regla de oro

**No edites a mano lo que se genera.** Cambia la configuración o el script que lo genera y vuelve a construir:

| Archivo generado | Lo genera |
|---|---|
| `Prj2_TorreControl/datos/*.csv` | `generador/generar_datos.py` |
| `Prj2_TorreControl/globo/torre_globo.vega.json` | `globo/construir_globo.py` |
| La especificación Vega dentro del visual del globo (`Prj2_TorreControl.Report/definition/pages/torre/visuals/globo/visual.json`) y el tema en `StaticResources/RegisteredResources/` | `generador/pagina_torre.py` |

**Lo demás se edita en Power BI Desktop** y se guarda como texto:
- las cuatro páginas (Torre, Mar, Aire y Carretera) y sus objetos visuales;
- los botones transparentes que van encima de los iconos dibujados en HTML;
- los paneles ocultos y los marcadores (`definition/bookmarks/`).

`pagina_torre.py` no los toca: si la página `torre` existe, solo cambia el globo y el tema. Con `--nueva` rehace la página base desde cero, sin botones ni paneles, y los marcadores que apuntan a ellos dejarían de funcionar.

El modelo semántico (`Prj2_TorreControl.SemanticModel/definition/**/*.tmdl`) **no** se genera. Ya lee la red de las tablas, así que cambiar puertos, rutas, proveedores o escenarios no exige tocarlo.

## Mapa

```
Prj2_TorreControl/
  red.config.json            ÚNICA descripción de la red
  construir.py               datos → globo → informe, para en el primer fallo
  generador/
    configuracion.py         lee y valida la configuración; geometría esférica (rutas por círculo máximo)
    generar_datos.py         simulador: cargas, viajes, posición diaria y escenarios (semilla fija)
    pagina_torre.py          lleva el globo y el tema al informe (PBIR)
  globo/construir_globo.py   especificación Vega del globo
  mapa/countries-110m.json   world-atlas (Natural Earth), incrustado en el globo
  herramientas/
    banco.py                 dibuja el globo con datos de muestra en un HTML, sin Power BI
    validar_pbir.py          valida el informe contra los esquemas JSON de Microsoft
  informe/                   tema claro (fuente; se copia al informe)
```

## Requisitos

- Python 3.11 o posterior con `pandas` y `numpy`.
- Para `validar_pbir.py`: `jsonschema` y `referencing`, además de conexión a internet.

## Recetas

Todas terminan con `python construir.py`, que se lanza desde `Prj2_TorreControl/` con Power BI Desktop cerrado. Después abre el informe, pulsa «Actualizar» si cambiaron los datos (con `CarpetaDatos` apuntando a la carpeta `datos/` de tu copia) y guarda.

| Petición | Qué cambiar |
|---|---|
| Añadir un proveedor | `proveedores`. Necesita una `categoria` de `categorias` y un `origen`, que es un nodo o punto del que salga una ruta. Si va a veces por avión, añade `aereo: {origen, parte}`. |
| Añadir un puerto y su ruta | Un nodo en `nodos` y una ruta en `rutas`. La ruta va de los puertos de `origenes` hasta `destino`, pasando por `puntos`, que son ids de `nodos` o de `puntos`. Los puntos de mar deben quedar en el agua: el tramo entre dos puntos se dibuja por círculo máximo. |
| Una ruta alternativa | Otra ruta con los mismos orígenes. En la habitual pon `alternativa: <id>` y en `pasa_por` los pasos que atraviesa. La alternativa solo se dibuja cuando hay viajes por ella. |
| Un escenario nuevo (por ejemplo, el cierre de Panamá o de Ormuz) | Añádelo a `escenarios` con `cierres: [{paso, desde, hasta}]`. El paso debe ser un nodo de tipo `paso` que esté en la ruta (`pasa_por`) y la ruta necesita `alternativa`. Opcionales: `recargo_flete`, `aereo_extra` y `congestion_destino`. |
| Otro almacén de destino | `almacenes`. El informe usa el primero. |
| Categorías o colores | `categorias`: color, nombre corto, `cobertura_dias` (para el riesgo de rotura) y `estacionalidad`. |
| Día o escenario por defecto | `torre.fecha_por_defecto` y `torre.escenario_por_defecto`. Elige un día con buques en ruta; el resumen del simulador ayuda. |
| Vistas del globo | `vista.vistas`: nombre, lon, lat y zoom. `vista.vista_inicial` es la que se abre. |
| Rótulos que tapan rutas o buques | En el nodo, `"rotulo": "derecha"` (por defecto), `"izquierda"` o `"abajo"`. Si la pastilla no cabe en el lienzo, cambia de lado sola. |
| Animación del globo | `vista.animado`. En `false` (de serie), las cuentas de las rutas y los latidos quedan quietos y Power BI no redibuja el globo 25 veces por segundo; en `true` se mueven. |
| Aspecto del globo | Constantes y marcas de `globo/construir_globo.py`: la paleta (`TINTA`, `LIMA`, `CORAL`, `AMBAR`, `COLOR_VIA`) y los vehículos por piezas `BUQUE`, `AVION` y `CAMION` (rutas SVG en un marco común, de y = -1 en proa a y = 1 en popa). Luego `python construir.py --sin-datos`. |
| Aspecto de las tarjetas | Las medidas `HTML · …` del grupo «7 · HTML». Cada una lleva su propio CSS, solo las reglas que usa, para que Power BI no cargue la hoja entera en cada tarjeta. `HTML · Estilo` guarda la hoja completa como referencia. Los colores son variables CSS al principio de cada medida (`.t{--ink:…;--lime:…}`): para cambiar uno, cámbialo en todas. Los colores de los visuales nativos están en `informe/TemaTorreClaro.json` y en los propios visuales. |

## Cómo comprobar

1. **`python construir.py`.** Para en el primer fallo. La configuración se valida entera y lista todos los problemas a la vez.
2. **Globo sin Power BI.**
   - `python herramientas/banco.py --vista "2026-03-05@Cierre de Suez" --vista "2026-03-05@Base"` escribe `herramientas/banco.html`.
   - Para verlo, sirve la carpeta con `python -m http.server` y ábrelo en un navegador.
   - Formato de cada vista: `fecha@escenario@modo@categoría`.
3. **Informe.** `python herramientas/validar_pbir.py "<ruta de Prj2_TorreControl.Report>"` debe terminar con «Archivos con errores: 0».
4. **Modelo.** Con Power BI Desktop abierto y el servidor MCP de modelado: `EVALUATE FILTER(INFO.MEASURES(), [State] <> 1)` debe devolver una tabla vacía.
5. **Botones.** En Desktop se prueban con Ctrl + clic: menú de páginas, «···» de cada tarjeta (paneles), flecha y pastilla de la tarjeta del escenario, calendario y ayuda.

## Cosas que no son evidentes

- **Semilla y azar por clave.** Cada buque o carga sortea su tránsito con un generador derivado de su clave. Por eso un buque tarda lo mismo en todos los escenarios y la comparación solo muestra el efecto de la incidencia.
- **Desvíos.** La naviera desvía cualquier salida que llegaría al paso mientras está cerrado, y también la que zarpa con el paso aún cerrado. El plan inicial (`Entrega prevista`) es siempre el de la ruta habitual: así el desvío se ve como retraso.
- **El globo recibe solo lo que se mueve.** Las medidas del grupo «5 · Globo» devuelven vacío para los viajes que ese día no están en ruta. Power BI descarta esas filas, de modo que el conjunto que llega a Deneb es pequeño. Cualquier medida nueva que se añada al globo debe seguir la misma regla (`IF ( NOT ISBLANK ( [Lon hoy] ), … )`). El globo, además, solo recibe las filas con `[En foco] = 1`, que es lo que hace la pastilla «solo desviadas».
- **Calendario sin relacionar.** El día se elige pinchando la curva o con los selectores de mes y día del panel del calendario. «Fecha elegida» resuelve las tres cosas (un día, un mes suelto o un día del mes suelto) y, sin nada elegido, usa el día por defecto. Las medidas calculan con `[Momento]`, que es el mediodía de ese día.
- **La curva del año** lee la tabla oculta `Envios por día` (un registro por envío y día en tránsito), con `[Tránsito diario (€)]`: una sola consulta para los 365 días en vez de una por día.
- **Botones sobre HTML.** Los iconos y pastillas se dibujan en las medidas HTML; encima de cada uno hay un botón o un segmentador nativo sin relleno. Las medidas pintan su estado (icono activo, pastilla encendida) leyendo los filtros, por ejemplo `ISFILTERED ( 'Foco desvío' )`. Si mueves una tarjeta, mueve también su botón.
- **Objetos visuales certificados.**
  - Son Deneb (`deneb7E15AEF80B9E4D4F8E12924291ECE89A`) y HTML Content Secure (`htmlContent443BE3AD55E043BF878BED274D3A6865`), de AppSource.
  - El informe solo los nombra en `report.json` (`publicCustomVisuals`), y Power BI los descarga al abrirlo.
  - No importes las versiones standalone ni la edición normal de HTML Content: cambian el identificador del visual y no están certificadas.
  - HTML Content Secure limpia el HTML antes de pintarlo. Solo pasan las etiquetas y los atributos de su lista; quita las `url()` externas, `attr()`, los scripts, los atributos `on…` y los recursos remotos. Las reglas están en su [documentación](https://github.com/dm-p/powerbi-visuals-html-content/blob/main/docs/sanitization-rules.md).
  - Deneb certificado no carga nada de internet: los datos y el mapa van dentro de la especificación.
- **Vega dentro de Deneb.**
  - Las transformaciones `geoshape` de una marca leen el campo como `datum.campo` (por ejemplo, `field: 'datum.geo'`).
  - La noche se construye como expresión de una señal.
  - No hay funciones flecha.
- **DAX.**
  - Las tablas con tilde van entre comillas: `'Categorías'`.
  - `desc`, `top` e `id` no valen como nombres de variable.
  - Al escribir números dentro de un SVG, usa `FORMAT(x, "0.0", "en-US")`, porque si no saldrían con coma decimal.
  - En CSS, no reutilices el nombre de una clase de tarjeta para otra pieza: una pastilla con la clase de la tarjeta negra hereda su relleno.
- **Saltos de línea.** Los `.py`, `.md` y `red.config.json` usan LF; los CSV, los TMDL y los JSON del informe, CRLF, como los escribe Power BI Desktop.
- **Power BI Desktop abierto.**
  - Si cambias el modelo con el servidor MCP, exporta con `ExportToTmdlFolder` y copia los archivos que difieran (salvo `database.tmdl`).
  - Si Desktop guarda después de que hayas escrito archivos del informe, los pisa: escribe con Desktop cerrado y ábrelo después.
- **Caché de datos.** `.pbi/cache.abf` (1,4 MB) se sube al repositorio para que el informe se abra con datos sin actualizar. Si cambias los datos, actualiza en Desktop y guarda antes de subirlo.

## Lo que no hay que hacer

- **No metas datos reales de nadie en el repositorio público.** Los de serie son ficticios y así se declaran (`torre.datos_ficticios`).
- **No presentes los escenarios como predicciones.** Son simulaciones con tiempos y tarifas ilustrativos.
- **No subas `.pbi/localSettings.json`.** Es la configuración local de cada equipo y ya está en `.gitignore`.
