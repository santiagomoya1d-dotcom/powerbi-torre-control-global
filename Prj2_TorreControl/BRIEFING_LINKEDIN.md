# Briefing para el post de LinkedIn · Torre de control global en Power BI

Documento de contexto para el agente que redacta y optimiza el post. Reúne qué es el informe, qué enseña la imagen, cómo se construyó, las cifras comprobadas y lo que **no** hay que afirmar. El post lo firma **Santiago Moya**. Es el **segundo proyecto de la serie**, tras el almacén isométrico en 3D, que tuvo muy buena acogida.

---

## 1. En una frase

Un globo terráqueo en 3D **dentro de Power BI**, que se gira con el ratón. Muestra cada buque, vuelo y camión de una red de aprovisionamiento el día que elijas, y compara la operación normal con un **cierre simulado del canal de Suez**: los barcos rodean África, el informe calcula el retraso y avisa de qué cargas llegarán cuando ya no quede stock. Se usa como una aplicación, con menú, paneles de detalle, calendario y ayuda. Datos ficticios, construido con IA (Claude) como compañero de desarrollo.

## 2. Qué se ve en la imagen

La página principal, **«Torre de control»** (1920×1080), tiene estética de aplicación moderna: fondo gris claro, tarjetas muy redondeadas, tinta casi negra con un acento lima, pastillas y barras en cápsula.

- **Barra lateral negra:** es el menú. Globo, barco, avión y camión llevan a las cuatro páginas; abajo, el calendario y la ayuda.
- **Cabecera:** «Torre de control de la red y sus rutas», con iconos en pastilla dentro del título. A la derecha, el día que se está viendo, la etiqueta «Datos ficticios · simulación» y el selector de escenario en pastillas («Base» / «Cierre de Suez»).
- **Pastillas de filtro:** las siete categorías y los tres modos de transporte.
- **Centro, el globo 3D:**
  - **La Tierra:** mar gris salvia y continentes blancos, con un aro de cristal y su sombra sobre la tarjeta, como un objeto. La noche cae, suave, sobre Asia según la fecha.
  - **Las rutas:** las que tienen viajes ese día llevan una banda lima con un trazo negro. Destacan la del Cabo de Buena Esperanza, llena de buques, y la zona de Suez cerrada, marcada en coral con la pastilla «CANAL DE SUEZ · CERRADO».
  - **Los barcos:** portacontenedores vistos desde arriba, con casco negro, contenedores de colores, puente de mando y estela, orientados según su rumbo. Un halo marca el retraso: gris en plazo, ámbar con retraso y coral si van más de 7 días tarde.
  - **El avión:** vuela sobre un arco que se eleva por encima del globo, con su sombra proyectada en el suelo.
  - **Los camiones:** negros con una franja lima, por las carreteras de Europa.
  - **El destino:** España en lima, con el almacén CD-01 y su haz de luz.
  - **Panel «Vías hoy»** dentro del globo: valor, cargas y retraso de cada vía. El Canal de Suez aparece «sin viajes», con lo que llevaría en la base.
  - **Controles:** botones de vista arriba (Asia → Europa, Atlántico, Europa, Mundo), zoom y la pista «Arrastra para girar · rueda para acercar».
- **Columna izquierda:**
  - **En tránsito hoy:** 6,6 M€ frente a 5,9 M€ en la base (+11 %), con una cápsula por categoría.
  - **Exposición por vía** (tarjeta lima): 80 % por el Cabo de Buena Esperanza, en diez cápsulas.
  - **Retraso en tránsito:** 12,4 días frente a 1,2, con puntualidad, retraso entregado y flete de 30 días (+73 %).
  - **La curva del año** (escenario frente a base), que se pincha para viajar a ese día.
- **Centro, bajo el globo:** **Llegadas al almacén** de los próximos 14 días (o 30) en cápsulas: lima a tiempo, negro con retraso.
- **Columna derecha:**
  - **Tarjeta negra del escenario:** «Canal de Suez cerrado, día 25 de 42», con el avance por semanas y «96 cargas desviadas por el Cabo».
  - **Fichas:** 32 buques (uno fondeado esperando atraque), 1 vuelo y 6 camiones en ruta.
  - **Riesgo de rotura en el almacén:** 21 cargas y 1,2 M€, con los proveedores más afectados y sus días de retraso.

Por defecto abre el **5 de marzo de 2026**, en la cuarta semana del cierre simulado.

**Las otras tres páginas (Mar, Aire y Carretera)** desglosan la red por modo de transporte con gráficos y tablas nativos de Power BI: valor en tránsito, retraso, puntualidad y flete; la curva del año; el valor por ruta y por categoría; los días de puerto a puerto previstos y reales; y los envíos en tránsito más retrasados.

## 3. Qué permite hacer

- **Girar el mundo:**
  - arrastrar para girar y usar la rueda para acercar;
  - las vistas predefinidas llevan el globo con un giro animado.
- **Viajar en el tiempo:** al pinchar un día de la curva, o al elegirlo en el calendario, se recalculan las posiciones, la noche, las alertas y las llegadas.
- **Comparar escenarios:** con la flecha de la tarjeta negra o con el selector de arriba. Al pasar de «Cierre de Suez» a «Base», las rutas vuelven a cruzar el canal y los barcos se ponen en hora. Cada indicador muestra la diferencia.
- **Aislar el desvío:** la pastilla «96 cargas desviadas por el Cabo» deja en el globo solo esas cargas.
- **Ir al detalle:** los tres puntos de cada tarjeta abren un panel con lo que hay detrás del número (las cargas de más valor, las más retrasadas, el valor por vía y origen).
- **Leer cada viaje:** la ficha de cada barco, vuelo o camión dice su ruta, sus contenedores, el valor, las categorías y la llegada prevista frente al plan.
- **Filtrar:** con las pastillas, por categoría y por modo de transporte; los barcos sin esa categoría se atenúan.
- **Anticipar:**
  - avisa de las cargas cuyo retraso supera los días de stock de seguridad de su categoría;
  - mide cuánto del valor en tránsito depende de una sola vía.
- **Ayuda dentro del informe:** el botón de ayuda explica cómo leer la torre y qué hace cada botón.

## 4. Cómo está hecho

1. **Datos simulados (Python):**
   - un año de aprovisionamiento de un almacén ficticio en Madrid, con 22 proveedores en 11 países, 16 rutas por mar, aire y carretera, salidas semanales de buque, vuelos programados y camiones;
   - se guarda la posición de cada viaje cada día;
   - los dos escenarios comparten los mismos pedidos y el mismo azar, así que la diferencia es solo la incidencia.
2. **Modelo en Power BI:** 16 tablas, 10 relaciones y 69 medidas DAX (46 de cálculo y 23 que dibujan HTML), comprobadas con consultas DAX contra la simulación.
3. **El globo, con Deneb (Vega):**
   - Power BI no trae mapas 3D que se puedan girar;
   - el globo es una proyección ortográfica dibujada con Vega, con giro, zoom, vistas animadas, la noche calculada con la posición del Sol para cada fecha y las rutas trazadas por círculo máximo sobre la esfera;
   - el mapa del mundo (Natural Earth) va dentro del propio objeto visual.
4. **Tarjetas y paneles con HTML Content:** medidas DAX que devuelven HTML, CSS y SVG.
5. **Botones que parecen de una app:** los iconos y pastillas se dibujan en HTML y encima llevan botones nativos transparentes de Power BI con marcadores. Así funcionan el menú de páginas, los paneles de detalle, el calendario, la ayuda y el cambio de escenario.
6. **Rendimiento:** la curva del año lee una tabla puente precalculada (una consulta para los 365 días en vez de una por día) y el globo solo se redibuja al moverlo.
7. **Diseño:** estilo claro de aplicación moderna (tinta, lima y gris salvia, letra Segoe UI Variable).
8. **Informe como código:** todo el informe está en archivos de texto (PBIP/PBIR) y se valida contra los esquemas de Microsoft; el modelo vive en TMDL. El globo y el tema salen de scripts.
9. **Plantilla:** toda la red está en un archivo de configuración. Añadir un proveedor, una ruta o un escenario nuevo (por ejemplo, el cierre de Panamá) es cambiar ese archivo y lanzar una orden. Trae una guía para que otro agente de IA lo adapte. El repositorio incluye los datos, así que el informe se abre listo.

## 5. Cifras comprobadas

| Dato | Valor |
|---|---|
| Red | 22 proveedores ficticios en 11 países · 16 rutas (10 marítimas, 3 aéreas, 3 por carretera) · 1 almacén |
| Volumen | 2.672 cargas al año por escenario · 141 M€ de mercancía |
| Viajes | unos 1.290 buques, vuelos y camiones por escenario · 25.528 posiciones diarias |
| Escenario simulado | cierre del canal de Suez del 9/2 al 22/3/2026 |
| Efecto en Asia e India (salidas del 15/1 al 22/3) | llegadas a tiempo del 90 % al 5 % · retraso medio de 0,9 a 14,1 días |
| Desvíos | 158 cargas (8,8 M€) rodean el Cabo de Buena Esperanza |
| El 5 de marzo, con el cierre | 6,6 M€ en tránsito (5,9 M€ en la base) · 80 % por una sola vía · 21 cargas con riesgo de rotura (1,2 M€) · 96 cargas desviadas por el Cabo · flete de 30 días de 648 mil €, frente a 373 mil € |
| Flete del año | +11 % con el cierre |
| Informe | 4 páginas · menú, paneles de detalle, calendario y ayuda con botones nativos y marcadores |
| Modelo | 16 tablas, 10 relaciones, 69 medidas DAX |
| Código | unas 1.700 líneas de Python |

## 6. Papel de la IA (para contarlo con honestidad)

- **La IA (Claude, en Claude Code) hizo de equipo de desarrollo:**
  - escribió el simulador, la geometría del globo y las medidas DAX;
  - montó y comprobó el modelo dentro de Power BI mediante el servidor MCP de modelado;
  - escribió y validó los archivos del informe, incluidos los botones y los marcadores.
- **El autor eligió el tema y marcó el nivel:**
  - que la gente vea algo que no sabía que se podía hacer en Power BI;
  - que hable de lo que preocupa a un director de compras: plazos, retrasos y dependencia de una ruta;
  - el estilo visual, a partir de una referencia de diseño de aplicaciones.
- **Mensaje de fondo:** la IA multiplica lo que una persona con criterio de negocio puede construir. El criterio sigue siendo humano.

## 7. Ángulos posibles

- **«¿Y si mañana se cierra Suez?»:** el informe lo responde con un clic. Los barcos rodean África, el retraso pasa de 1 a 14 días y aparecen las roturas de stock.
- **«Un globo que gira dentro de Power BI»:** casi nadie sabe que se puede.
- **«Un Power BI que parece una app»:** menú lateral, paneles que se abren, calendario y ayuda, con botones nativos debajo del diseño.
- **«El 80 % de lo que viene depende de una sola ruta»:** riesgo de concentración, en una tarjeta.
- **«No es un mapa, es una máquina del tiempo»:** eliges un día y ves dónde estaba cada barco.
- **«Segunda entrega de la serie»:** del almacén a la red global que lo abastece.
- **Llamada a la acción:** el repositorio es público; se descarga, se abre con los datos dentro y se puede adaptar a la propia red.

## 8. Lo que no hay que afirmar

- **Los datos son 100 % ficticios.** Proveedores («Proveedor 05 · Suzhou»), buques, cifras y tarifas son inventados. No representan a ninguna empresa real ni al empleador del autor; no lo menciones.
- **El cierre de Suez es un escenario simulado**, no una predicción ni un análisis de un suceso real. Los tiempos de tránsito y los fletes son ilustrativos.
- **No es seguimiento en tiempo real** ni está conectado a navieras o a sistemas de localización de buques: las posiciones salen de una simulación.
- **No es 3D real ni un motor de videojuego:** es una proyección ortográfica dibujada con Vega dentro de Power BI. Se puede decir «globo 3D interactivo».
- **Las rutas y los barcos no están animados de forma continua:** el globo se mueve cuando lo giras, lo acercas o cambias de vista o de día. No digas que los barcos «navegan en directo».
- **Deneb, HTML Content y el mapa son de terceros** (licencias MIT, MIT e ISC, con datos de Natural Earth en dominio público).

## 9. Glosario rápido

- **Deneb:** objeto visual de Power BI para dibujar con Vega o Vega-Lite.
- **Proyección ortográfica:** la forma de dibujar una esfera tal como se vería desde el espacio.
- **Círculo máximo:** el camino más corto entre dos puntos de la esfera. Por eso las rutas aéreas se ven curvas.
- **Terminador:** la línea que separa el día de la noche.
- **Cobertura (días):** cuántos días aguanta el stock de seguridad del almacén sin reponer.
- **Marcador (bookmark):** estado guardado de una página de Power BI; un botón lo aplica (abrir un panel, cambiar de escenario).
- **PBIP / PBIR / TMDL:** formatos de proyecto de Power BI en archivos de texto, pensados para Git.
