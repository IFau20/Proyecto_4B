# PC Tracker — Comparador de notebooks (Proyecto 4B)

Proyecto académico de Diseño de Software. **Solo notebooks reales**, identificados por modelo y SKU de fabricante; no se cargan productos ni precios ficticios en la interfaz.

## Funcionalidades

- React + Vite, Deno 2 REST y CSS responsive.
- Catálogo de **48 modelos reales** y publicaciones comerciales asociadas, con fotografías leídas de metadatos de páginas de producto.
- Búsqueda y filtros combinables: **RAM, GPU y procesador**.
- Comparación por tiendas: precios obtenidos por scraper y, cuando bloquean la consulta, **referencias publicadas** separadas explícitamente de precios verificados.
- Carrusel: solo rebajas **iguales o superiores a 20% respecto del precio normal de la misma tienda**. No considera diferencias entre tiendas como descuento. Las referencias deben ser recientes y se etiquetan como no verificadas en vivo.
- Historial por notebook/SKU y tienda, fechas, rangos 7/30/90 días, un año, todo, y gráfico. Se guardan únicamente **observaciones realmente capturadas**, sin inventar historia previa. Enlace al historial externo de SoloTodo cuando existe ficha.
- Scrapers de stock y horarios: estado desconocido cuando no hay datos, etiquetas de cada tienda y fechas de consulta. La ubicación de tiendas no demuestra stock físico por sucursal.
- Localizador de tiendas con permisos de geolocalización del navegador. El cálculo de distancia es local.
- Modo oscuro y traducciones propias español/inglés.
- SSO Microsoft Entra OIDC condicionado a configuración real. **No se muestra mensaje ni botón de SSO si está deshabilitado**.

## Limitaciones que deben entenderse antes de la entrega

Las páginas comerciales pueden bloquear consultas automatizadas. La auditoría de GitHub Actions del 15 de noviembre detectó 13 imágenes de 13 modelos, **0 precios en vivo** y 3 estados de stock entre 18 fichas. Los valores de referencia de fichas web no se convierten silenciosamente en precios en vivo. Si la tienda bloquea la consulta, la diferencia de precios en vivo y el estado de stock se mantienen como no verificados.

El historial empieza a construirse cuando el servicio observa precios en vivo; no puede representar años anteriores sin datos auténticos. Los archivos de historial residen en `backend/data/price-history.json` y requieren un volumen persistente si la app se despliega. El SSO debe registrarse en Microsoft Entra antes de poder comprobar un ingreso institucional.

## Iniciar desde una apertura nueva de PowerShell

```powershell
$project = Join-Path $HOME "PCTracker"
if (-not (Test-Path "$project\.git")) {
  git clone --branch develop https://github.com/IFau20/Proyecto_4B.git "$project"
}
Set-Location $project
git switch develop
git pull --ff-only origin develop
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start.ps1"
```

Requiere Git, Node.js LTS y Deno 2. URL: http://127.0.0.1:5173.

## Pruebas y auditoría

```powershell
Set-Location "$HOME\PCTracker\backend"
deno task test
deno task audit:catalog
Set-Location "$HOME\PCTracker\frontend"
npm.cmd ci
npm.cmd test
npm.cmd run build
```

GitHub Actions ejecuta los tests y la compilación. Los diagnósticos que acceden a tiendas son informativos y no causan fallos cuando un comercio los bloquea.

## Documentación adicional

- [Arquitectura y catálogo real](docs/REAL_NOTEBOOK_CATALOG.md)
- [Historial de precios](docs/HISTORY.md)
- [Horarios y ubicaciones](docs/STORE_LOCATIONS.md)
- [SSO institucional](docs/SSO.md)
- [DEMO de 5 minutos](docs/DEMO_5_MIN.md)

Las carpetas `docs/AVANCE_*` conservan el registro histórico de entregas anteriores; algunos archivos antiguos describen el prototipo ficticio original y no representan el estado actual.

## Atribución

Implementación, pruebas y documentación asistidas por ChatGPT (OpenAI). Referencias de productos y enlaces provienen de las fichas públicas de SoloTodo y comercios mencionados; no se copian los datos históricos propietarios ni se eluden medidas antibot.

## Historial público y mejoras visuales (15 de noviembre de 2026)

El historial intenta recuperar los últimos 365 días desde el endpoint público de SoloTodo,
validando la identidad del notebook por el código de fabricante. Si la API no responde,
no contiene observaciones válidas o identifica otro producto, usa el historial persistente
que PC Tracker ha recopilado por sus propios medios. Se distingue el origen y no se
inventan precios anteriores.

Los descuentos condicionados a tarjetas, convenios, cupones o membresías se excluyen
de las ofertas destacadas y del precio principal de las tarjetas. Los valores
publicados de referencia se muestran con la etiqueta pequeña **Precio referencial**
si aún no existe un precio obtenido por el scraper. Las fotografías se entregan
preferentemente desde un proxy restringido del propio backend, con fallback al
enlace de origen y un estado vacío cuando ambas fuentes fallan.

Pruebas específicas: `cd backend; deno task audit:public-history`.
La fuente pública no tiene SLA y no se eluden controles ni sesiones de SoloTodo.

## Ampliación de catálogo e historial — noviembre de 2026

- **36 notebooks reales**, 23 más que en la versión anterior; cada SKU tiene una ficha de producto y especificaciones propias. Marcas: ASUS, Lenovo, HP, Acer y Gigabyte. Los precios se obtienen de publicaciones de tiendas o se señalan como últimos precios históricos con su fecha: nunca se generan precios ficticios.
- El feed público de comercios se consulta en **lotes de hasta 12 productos** para no perder resultados con catálogos grandes. Las ofertas se emparejan por SKU exacto y se excluyen publicaciones reacondicionadas identificadas.
- El historial de precios **oculta tiendas sin observaciones** dentro del período seleccionado, tanto en la leyenda como en las tarjetas de resumen. Si no hay registros, se muestra un mensaje en lugar de tarjetas vacías.
- Auditoría de referencia: 36 modelos, 115 publicaciones de tiendas, 102 referencias de precios, 27 modelos con precios publicados por comercios, 7 con solo precio histórico y 2 sin precio recuperable en esa consulta. Esta cobertura puede variar según las fuentes; no equivale a 102 cotizaciones vivas.
- Ver los 23 modelos añadidos en [docs/CATALOG_EXPANSION.md](docs/CATALOG_EXPANSION.md).

## Mejoras de rendimiento y paginación (noviembre 2026)

- **12 notebooks por página**, con navegación numérica, siguiente/anterior, filtros preservados y vuelta a la página 1 al modificar filtros.
- Catálogo de **48 configuraciones reales** y directorio físico de **23 sucursales/puntos de atención**. Solo se muestran seis resultados cercanos cuando el usuario concede ubicación.
- Scraping concurrente limitado (6 solicitudes comerciales, 8 imágenes, 3 historiales) para reducir bloqueos y picos de carga.
- Actualización del catálogo y de horarios sin bloquear las peticiones cuando existe una versión en memoria; la versión caducada se actualiza de forma independiente.
- Nombres de comercios guardados durante una hora, reutilizados entre consultas del historial.
- Las 21 coordenadas de sucursales ya verificadas se guardan localmente para evitar geocodificar cada vez.
- Caché de fotografías limitada a 40 archivos; el frontend carga fotos en segundo plano solo para las tarjetas visibles.
- El guardado del historial se hace mediante **una escritura atómica por ciclo**, en vez de reabrir el archivo por cada SKU, evitando reescrituras y consultas duplicadas de modelos Lenovo/HP.
- El catálogo utiliza caché HTTP de 60 segundos; los datos de tiendas no son garantía de stock físico.

## Carga rápida y actualización comercial no bloqueante (15 noviembre 2026)

PC Tracker separa la navegación del catálogo del proceso de actualización comercial:

1. `GET /api/notebooks?preview=1` responde inmediatamente con las **48 identidades reales** y características de `NOTEBOOKS`. Incluye solo precios publicados de referencia atribuidos, cuando existen; no inventa montos ni hace scraping durante la petición.
2. En paralelo, el navegador consulta `GET /api/notebooks`, que espera la actualización del backend y sustituye la vista con las ofertas disponibles. La página, filtros, paginación y navegación siguen funcionando.
3. Se reutiliza la última carga válida en `sessionStorage` por hasta **cinco minutos**, para que recargar o regresar a la misma pestaña no requiera volver a esperar a las tiendas.
4. El backend limita las solicitudes directas a comercios (6 simultáneas) y consulta las fichas públicas en grupos de 12 con como máximo **dos solicitudes simultáneas**. La redirección/copia de las imágenes no bloquea la respuesta rápida del catálogo.
5. Las consultas `GET /api/notebook-image?sku=...` ya no esperan la construcción del catálogo completo; primero usan las fuentes permitidas disponibles. Cuando se reciben nuevas imágenes válidas, el frontend vuelve a intentarlo.
6. Las consultas concurrentes de distintos visitantes comparten la misma promesa de actualización en el backend; no se dispara una ronda completa de scraping por visitante.

**Rendimiento medido en GitHub Actions:** una construcción completa de 48 notebooks tardó **8.453 s** antes y **5.102 s** con consultas independientes en paralelo (reducción cercana al 40%). Son ejecuciones puntuales, no garantías de tiempo. El tiempo de respuesta del preview no depende de fuentes comerciales, aunque la actualización de descuentos sí depende de las tiendas y puede tardar o fallar.

**Protecciones:** el precio exclusivo de una tarjeta no se trata como descuento general. Los valores publicados de referencia e históricos se siguen identificando y no se guardan como observaciones en vivo. El historial y el stock requieren evidencia auténtica. Los tests incluyen catálogo rápido, actualización progresiva, caché de sesión y límite de concurrencia de las consultas públicas.
