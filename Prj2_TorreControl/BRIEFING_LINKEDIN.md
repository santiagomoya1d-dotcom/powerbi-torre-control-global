# Briefing para el post de LinkedIn · Torre de control global en Power BI

Documento de contexto para el agente que redacta y optimiza el post. Reúne qué es el informe, qué enseña la imagen, cómo se construyó, las cifras comprobadas y lo que **no** hay que afirmar. El post lo firma **Santiago Moya**. Es el **segundo proyecto de la serie**, tras el almacén isométrico en 3D, que tuvo muy buena acogida.

---

## 1. En una frase

Un globo terráqueo en 3D **dentro de Power BI**, que se gira con el ratón. Muestra cada buque, vuelo y camión de una red de aprovisionamiento el día que elijas, y compara la operación normal con un **cierre simulado del canal de Suez**: los barcos rodean África, el informe calcula el retraso y avisa de qué cargas llegarán cuando ya no quede stock. Datos ficticios, construido con IA (Claude) como compañero de desarrollo.

## 2. Qué se ve en la imagen

Página única, **«Torre de control»**, 1920×1080, estética de sala de control espacial (fondo de estrellas, paneles de cristal):

- **Cabecera:** «Torre de control · aprovisionamiento global», el día que se está viendo y dos etiquetas: «Escenario · Cierre de Suez» (en rojo, latiendo) y «Datos ficticios».
- **Centro, el globo 3D:**
  - **La Tierra:** océano iluminado con atmósfera, y la noche sobre Asia según la fecha.
  - **Las rutas:** la del Cabo de Buena Esperanza en ámbar, llena de buques; la zona de Suez cerrada, latiendo en rojo; un vuelo de carga cruzando Asia hacia Madrid; las rutas del Atlántico.
  - **Los barcos:** portacontenedores vistos desde arriba, con casco, contenedores de colores, puente de mando y estela, orientados según su rumbo. Un halo marca el retraso: blanco en plazo, ámbar con retraso y rosa latiendo si van más de 7 días tarde.
  - **El avión:** vuela sobre un arco que se eleva por encima del globo, con su sombra proyectada en el suelo.
  - **Las rutas activas:** brillan, con pulsos de luz que avanzan hacia el destino.
  - **El destino:** España resaltada, con el almacén de Madrid latiendo.
  - **Controles:** botones de vista arriba (Asia → Europa, Atlántico, Europa, Mundo) y la pista «Arrastra para girar · rueda para acercar».
- **Columna izquierda:**
  - **En tránsito hoy:** 6,6 M€, +0,7 M€ frente a la base, con buques, vuelos, camiones y cargas.
  - **Servicio:** anillo de puntualidad y retraso de lo que está en tránsito.
  - **Exposición por vía:** «El 80 % del valor en tránsito depende de una sola vía».
  - **Coste del flete.**
  - **Qué está pasando:** el escenario y sus incidencias.
- **Columna derecha:**
  - **Riesgo de rotura en el almacén:** 21 cargas y 1,2 M€, con la lista de proveedores y días de retraso.
  - **Llegadas al almacén:** los próximos 14 días.
  - **Valor en tránsito por categoría.**
- **Abajo:** la curva del año (escenario frente a base), que se pincha para viajar a ese día.

Por defecto abre el **5 de marzo de 2026**, en la cuarta semana del cierre simulado.

## 3. Qué permite hacer

- **Girar el mundo:**
  - arrastrar para girar y usar la rueda para acercar;
  - las vistas predefinidas llevan el globo con un giro animado.
- **Viajar en el tiempo:** al pinchar un día de la curva se recalculan las posiciones, la noche, las alertas y las llegadas.
- **Comparar escenarios:** al pasar de «Cierre de Suez» a «Base», las rutas vuelven a cruzar el canal y los barcos se ponen en hora. Cada indicador muestra la diferencia.
- **Leer cada viaje:** la ficha de cada barco, vuelo o camión dice su ruta, sus contenedores, el valor, las categorías y la llegada prevista frente al plan.
- **Filtrar:** por modo de transporte y por categoría; los barcos sin esa categoría se atenúan.
- **Anticipar:**
  - avisa de las cargas cuyo retraso supera los días de stock de seguridad de su categoría;
  - mide cuánto del valor en tránsito depende de una sola vía.

## 4. Cómo está hecho

1. **Datos simulados (Python):**
   - un año de aprovisionamiento de un almacén ficticio en Madrid, con 22 proveedores en 11 países, 16 rutas por mar, aire y carretera, salidas semanales de buque, vuelos programados y camiones;
   - se guarda la posición de cada viaje cada día;
   - los dos escenarios comparten los mismos pedidos y el mismo azar, así que la diferencia es solo la incidencia.
2. **Modelo en Power BI:** 13 tablas, 8 relaciones y 45 medidas DAX, comprobadas con consultas DAX contra la simulación.
3. **El globo, con Deneb (Vega):**
   - Power BI no trae mapas 3D que se puedan girar;
   - el globo es una proyección ortográfica dibujada con Vega, con giro, zoom, vistas animadas, la noche calculada con la posición del Sol para cada fecha y las rutas trazadas por círculo máximo sobre la esfera;
   - el mapa del mundo (Natural Earth) va dentro del propio objeto visual.
4. **Tarjetas animadas, con HTML Content:** medidas DAX que devuelven HTML, CSS y SVG.
5. **Diseño en Figma:** fondo de estrellas, órbita, paneles de cristal y logotipo.
6. **Informe como código:** la página la escribe un script en formato PBIP/PBIR y se valida contra los esquemas de Microsoft; el modelo vive en TMDL.
7. **Plantilla:** toda la red está en un archivo de configuración. Añadir un proveedor, una ruta o un escenario nuevo (por ejemplo, el cierre de Panamá) es cambiar ese archivo y lanzar una orden. Trae una guía para que otro agente de IA lo adapte.

## 5. Cifras comprobadas

| Dato | Valor |
|---|---|
| Red | 22 proveedores ficticios en 11 países · 16 rutas (10 marítimas, 3 aéreas, 3 por carretera) · 1 almacén |
| Volumen | 2.672 cargas al año por escenario · 141 M€ de mercancía |
| Viajes | unos 1.290 buques, vuelos y camiones por escenario · 25.528 posiciones diarias |
| Escenario simulado | cierre del canal de Suez del 9/2 al 22/3/2026 |
| Efecto en Asia e India (salidas del 15/1 al 22/3) | llegadas a tiempo del 90 % al 5 % · retraso medio de 0,9 a 14,1 días |
| Desvíos | 158 cargas (8,8 M€) rodean el Cabo de Buena Esperanza |
| El 5 de marzo, con el cierre | 6,6 M€ en tránsito (5,9 M€ en la base) · 80 % por una sola vía · 21 cargas con riesgo de rotura (1,2 M€) · flete de 30 días de 648 mil €, frente a 373 mil € |
| Flete del año | +11 % con el cierre |
| Modelo | 13 tablas, 8 relaciones, 45 medidas DAX |
| Código | unas 1.500 líneas de Python |

## 6. Papel de la IA (para contarlo con honestidad)

- **La IA (Claude, en Claude Code) hizo de equipo de desarrollo:**
  - escribió el simulador, la geometría del globo y las medidas DAX;
  - montó y comprobó el modelo dentro de Power BI mediante el servidor MCP de modelado;
  - diseñó el fondo en Figma mediante su conexión MCP;
  - escribió y validó los archivos del informe.
- **El autor eligió el tema y marcó el nivel:**
  - que la gente vea algo que no sabía que se podía hacer en Power BI;
  - que hable de lo que preocupa a un director de compras: plazos, retrasos y dependencia de una ruta.
- **Mensaje de fondo:** la IA multiplica lo que una persona con criterio de negocio puede construir. El criterio sigue siendo humano.

## 7. Ángulos posibles

- **«¿Y si mañana se cierra Suez?»:** el informe lo responde con un clic. Los barcos rodean África, el retraso pasa de 1 a 14 días y aparecen las roturas de stock.
- **«Un globo que gira dentro de Power BI»:** casi nadie sabe que se puede.
- **«El 80 % de lo que viene depende de una sola ruta»:** riesgo de concentración, en una tarjeta.
- **«No es un mapa, es una máquina del tiempo»:** eliges un día y ves dónde estaba cada barco.
- **«Segunda entrega de la serie»:** del almacén a la red global que lo abastece.
- **Llamada a la acción:** el repositorio es público; se puede descargar, probar y adaptar a la propia red.

## 8. Lo que no hay que afirmar

- **Los datos son 100 % ficticios.** Proveedores («Proveedor 05 · Suzhou»), buques, cifras y tarifas son inventados. No representan a ninguna empresa real ni al empleador del autor; no lo menciones.
- **El cierre de Suez es un escenario simulado**, no una predicción ni un análisis de un suceso real. Los tiempos de tránsito y los fletes son ilustrativos.
- **No es seguimiento en tiempo real** ni está conectado a navieras o a sistemas de localización de buques: las posiciones salen de una simulación.
- **No es 3D real ni un motor de videojuego:** es una proyección ortográfica dibujada con Vega dentro de Power BI. Se puede decir «globo 3D interactivo».
- **Deneb, HTML Content y el mapa son de terceros** (licencias MIT, MIT e ISC, con datos de Natural Earth en dominio público).

## 9. Glosario rápido

- **Deneb:** objeto visual de Power BI para dibujar con Vega o Vega-Lite.
- **Proyección ortográfica:** la forma de dibujar una esfera tal como se vería desde el espacio.
- **Círculo máximo:** el camino más corto entre dos puntos de la esfera. Por eso las rutas aéreas se ven curvas.
- **Terminador:** la línea que separa el día de la noche.
- **Cobertura (días):** cuántos días aguanta el stock de seguridad del almacén sin reponer.
- **PBIP / PBIR / TMDL:** formatos de proyecto de Power BI en archivos de texto, pensados para Git.
