# PC Tracker — Comparador de notebooks (Proyecto 4B)

Proyecto académico de Diseño de Software. **Solo notebooks reales**, identificados por modelo y SKU de fabricante; no se cargan productos ni precios ficticios en la interfaz.

## Funcionalidades

- React + Vite, Deno 2 REST y CSS responsive.
- Catálogo de **13 modelos reales** y 18 fichas comerciales asociadas, con fotografías leídas de metadatos de páginas de producto.
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
