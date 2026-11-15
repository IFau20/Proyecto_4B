# Sucursales y cálculo de proximidad

Las direcciones proceden de las páginas oficiales de las tiendas. PC Factory publica una lista de sus sucursales en https://www.pcfactory.cl/tiendas (Manuel Montt, Costanera Center, Huérfanos, Las Condes, Plaza Egaña, Open Kennedy, Plaza Norte, Florida, Maipú y Viña del Mar). Winpy, SP Digital, Centrale y PC Express publican sus direcciones en sus páginas de contacto/retiro.

Las coordenadas de 13 de las 14 ubicaciones fueron obtenidas por geocodificación pública y validadas en GitHub Actions el 15 de noviembre de 2026. Los valores se almacenaron en el catálogo local para que las búsquedas no dependan de 13 solicitudes externas cada vez. Queda una ubicación del centro comercial Costanera sin coordenadas confirmadas por el proveedor. Se intenta geocodificar únicamente esa dirección si el usuario solicita tiendas cercanas.

El usuario debe autorizar la geolocalización del navegador. Las coordenadas del usuario **no se envían al backend ni al geocodificador**; se usan únicamente en el navegador para calcular distancias Haversine en línea recta. Se muestran las seis ubicaciones válidas más cercanas ordenadas por distancia, nunca seis ubicaciones arbitrarias.

La proximidad no confirma disponibilidad de un notebook en una sucursal. Si no hay prueba de stock físico específico, aparece explícitamente como no confirmado.

Fuente: OpenStreetMap Nominatim (consulta puntual de direcciones), sitios oficiales de PC Factory, Centrale, Winpy, SP Digital, PC Express. Código asistido con ChatGPT/OpenAI.
