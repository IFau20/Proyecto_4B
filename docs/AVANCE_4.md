# Avance 4 — Integración de fuentes de precios (9 de noviembre de 2026)

Modelo piloto: Lenovo LOQ 15ARP9, fabricante SKU **83JC0080CL**, Ryzen 7 7435HS, 24 GB RAM y RTX 4050.

Fuentes de venta del **mismo SKU**:
- [Centrale](https://centrale.cl/producto/notebook-lenovo-loq-15-6-ryzen-7-7435hs-24gb-1tb-ssd-rtx-4050-w11h/)
- [SP Digital](https://www.spdigital.cl/lv-loq-gen-9-r7-7435hs-241tb-156-fhd-144hz-rtx-4050-6gb-luna-grey/)
- [Winpy](https://www.winpy.cl/venta/notebook-gamer-lenovo-loq-de-15-6-ryzen-7-7435hs-rtx-4050-24gb-ram-1tb-ssd-win11/)

Se implementa \`GET /api/live-comparisons\` en Deno. El backend consulta páginas de producto con timeout de 6 segundos, restringe URLs a una lista fija y busca precios en \`schema.org/Product\` + \`Offer\`, validando el código del fabricante y CLP. Las respuestas se guardan en memoria por diez minutos; una consulta fallida devuelve \`priceClp: null\`, no una cifra inventada.

React agrega el modelo real junto al catálogo de prueba anterior, sin confundirlo con los cuatro modelos ficticios. Al desplegar comparación muestra los enlaces oficiales y \`No verificado\` cuando faltan datos.

**Pendiente de verificar:** ejecutar la extracción directamente contra las tres tiendas con conectividad real y confirmar sus formatos HTML. Tener tres URL verificadas no equivale a tres precios obtenidos; algunas tiendas pueden bloquear consultas o carecer de datos estructurados.

Pruebas: \`cd backend && deno task test\`; \`cd frontend && npm test && npm run build\`.

Asistencia de programación: ChatGPT (OpenAI); las páginas y los datos de tiendas pertenecen a sus respectivos proveedores.
