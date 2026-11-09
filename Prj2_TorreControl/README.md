# Prj2_TorreControl · notas técnicas

Piezas que generan el informe `../Prj2_TorreControl.pbip`. **Todos los datos son ficticios.** Para la visión general, ver el [README principal](../README.md); para adaptarlo con un agente de IA, la [guía para agentes](../AGENTS.md).

## Regenerar

Desde esta carpeta, con Python 3.11 o posterior y `pandas` y `numpy`:

```
python construir.py                     # datos (semilla fija: sale siempre lo mismo), globo e informe
python construir.py --sin-datos         # solo globo e informe
python construir.py --config otra.json --prueba ../../prueba
                                        # otra red en una carpeta aparte, con banco.html para verla
```

Hazlo con Power BI Desktop cerrado. En el informe solo cambian la especificación del globo y el tema; las páginas, los botones y los marcadores se editan en Desktop. Después abre el informe y pulsa «Actualizar» si cambiaron los datos.

## La simulación

- **Cargas.** Cada proveedor genera cargas con una tasa diaria que sigue la estacionalidad de su categoría, adelantada 40 días respecto a la venta.
- **Buques.** Los contenedores esperan a la salida semanal de su servicio (un día fijo de la semana por puerto y ruta) y viajan juntos. El buque tarda el tránsito de la ruta, con una variación del −3 % al +8 %, y un 6 % de las veces sufre un temporal de 2 a 5 días. Al llegar puede esperar fondeado frente al puerto.
- **Llegada al almacén.** Tras el atraque vienen la aduana (1 a 3 días) y el camión al almacén.
- **Avión.** Algunos proveedores mandan parte de los pedidos en vuelos de carga programados, de madrugada y en días fijos.
- **Camiones.** Un camión por carga, puerta a puerta.
- **Cierre de Suez** (escenario simulado, del 9 de febrero al 22 de marzo de 2026):
  - las salidas afectadas van por la ruta alternativa del Cabo y llegan a Algeciras;
  - el flete marítimo de Asia e India sube un 60 % alrededor del cierre;
  - parte de los pedidos urgentes de higiene y Navidad pasa a avión;
  - los puertos de destino se congestionan entre el 10 de marzo y el 30 de abril.
- **Posiciones.** Se guarda la de cada viaje a mediodía de cada día, interpolada sobre la esfera, junto con un punto algo más adelante para orientar el icono.

Resultado con la configuración de serie: 2.672 cargas al año por escenario (141 M€). Las de Asia e India que salen entre el 15 de enero y el 22 de marzo pasan de llegar a tiempo en un 90 % a hacerlo en un 5 %, con 14,1 días de retraso medio. El flete del año sube un 11 %.

## Medidas clave

- `Fecha elegida` y `Momento`: el día pinchado en la curva o elegido en el calendario (o el de la tabla Torre) y su mediodía. Todo se calcula en ese instante.
- `Valor en tránsito (€)`, `Envíos en tránsito`, `Buques en el mar`, `Vuelos en el aire`, `Camiones en ruta`: el estado de la red ese día.
- `Puntualidad %`, `Retraso medio (días)`, `Flete (30 días)`: los últimos 30 días. `Retraso en tránsito (días)` anticipa lo que aún no ha llegado.
- `… (Base)`: la misma medida en el escenario base, para las diferencias.
- Grupo «5 · Globo»: una fila por viaje en ruta con posición, rumbo, estado y ficha. En blanco si ese día no se mueve. `En foco` deja pasar solo los desviados cuando está pulsada la pastilla de la tarjeta del escenario.
- `Tránsito diario (€)` y `(Base)`: la curva del año, leída de la tabla oculta `Envios por día` (un registro por envío y día en tránsito).
- Grupo «6 · Tablas»: `En tránsito ahora`, `Días previstos` y `Días reales (60 d)`, para las tablas de las páginas Mar, Aire y Carretera.
- Grupo «7 · HTML»: una medida por tarjeta (`Barra lateral`, `Cabecera`, `En tránsito`, `Exposición`, `Servicio`, `Escenario`, `Fichas`, `Vías`, `Alertas`, `Llegadas`, `Leyenda`), por panel (`Panel tránsito`, `Panel retraso`, `Panel exposición`, `Panel calendario`, `Panel ayuda`) y la barra y la cabecera de cada página de modo. Devuelven HTML, CSS y SVG para HTML Content Secure, la edición certificada. Esa edición limpia el HTML: solo admite las etiquetas y los atributos de su lista, y nada de `url()` externas ni scripts. Cada medida lleva solo el CSS que usa. `HTML · Estilo` guarda la hoja completa.

## El globo

`globo/construir_globo.py` genera una especificación Vega con:
- **Proyección y controles:** proyección ortográfica, giro arrastrando, zoom con la rueda y botones de vista con giro animado.
- **Esfera:** mar gris salvia y tierra blanca, aro de cristal, sombra en el suelo y reflejo, y la noche en tres capas, centrada en el punto antisolar con la declinación del día.
- **Rutas y red:** rutas por círculo máximo; las activas llevan banda lima y cuentas. Las zonas de incidencia, en coral (cierre) y ámbar (congestión). Proveedores, puertos y pasos, con el haz del almacén. Los rótulos van en pastillas y cambian de lado si no caben.
- **Viajes:** buques, aviones y camiones dibujados por piezas, orientados según el rumbo y con un halo según el retraso.
- **Animación:** con `vista.animado` en `false` (de serie), las cuentas y los latidos quedan quietos y el globo solo se redibuja al girarlo, acercarlo o cambiar de vista.

Los puntos de la cara oculta se esconden calculando su distancia angular al centro de la vista.
