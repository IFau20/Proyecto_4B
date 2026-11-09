# Auditoría de comparación de precios y stock

## Qué verifica PC Tracker

1. Exactitud de modelo: las tres URLs están fijadas para el Lenovo LOQ SKU 83JC0080CL.
2. Precio: un valor solo se publica cuando se puede leer un precio CLP de un producto con SKU coincidente o el precio explícito de transferencia de la ficha específica de SP Digital.
3. Stock: se lee \`schema.org/Offer.availability\` y, cuando está disponible, el aviso específico de agotado de Centrale/Winpy. El texto «Stock online» sin una cantidad o estado no se interpreta como disponible.
4. Estados de error: respuestas 403/429, HTTP fallido, red y páginas sin datos se distinguen de un precio verificado.
5. Verificación: la API expone un resumen \`{totalSources, verifiedPrices, verifiedStocks, comparable, stockComplete}\`.
6. Comparación: si falta un segundo precio, la página no muestra diferencias ficticias de $0.

## Probar con sitios reales

\`\`\`powershell
cd backend
deno task check:live
\`\`\`

El código de salida es 0 solo si se verificaron los tres precios y los tres estados de stock; en caso contrario, 1. El resultado contiene detalles por tienda y enlaces.

## Probar el proyecto

\`\`\`powershell
cd backend
deno task test
cd ../frontend
npm.cmd ci
npm.cmd test
npm.cmd run build
\`\`\`

Se incorporó GitHub Actions para ejecutar ambos conjuntos de pruebas. Este test automatizado usa HTML simulado para no depender del estado momentáneo de las tiendas.

## Advertencia

La verificación directa desde el entorno de desarrollo no pudo completarse por restricciones de conectividad. Además, las fichas de Centrale y Winpy se muestran agotadas en la investigación web. Por ello, aunque la lógica de comparación y el tratamiento del stock están implementados, **no se afirma que las tres fuentes tengan simultáneamente precio y stock confirmado**.

El stock publicado en línea no equivale al stock físico por sucursal. No se eluden CAPTCHAs ni mecanismos de protección.

Asistencia: ChatGPT (OpenAI).
