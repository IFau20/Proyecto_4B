# Precios y stock: ampliación del 15 de noviembre

Se buscaron por código de fabricante los 20 modelos sin ofertas actuales en la API agregadora. Se añadieron 25 enlaces de productos exactos para 12 modelos, incluyendo Tecnomas, BIP, CTMAN, UltraPC, GamingX, RumboChile, SmartDeal y más fichas de tiendas ya integradas. Son enlaces descubiertos, no 25 precios garantizados.

Las fichas de Tecnomas aportan precio publicado incluso si indican agotado. El estado se conserva. Se rechazan los importes fuera del rango validado (incluidos valores de relleno como 999.999.999), las monedas diferentes de CLP y las ofertas expresamente reacondicionadas o usadas para no mezclarlas con equipos nuevos.

## Cuatro modelos sin precio vigente recuperable

La búsqueda web y la consulta de la API histórica autenticaron los siguientes últimos registros disponibles para cada código exacto:

| Modelo / código | Último precio histórico CLP | Fecha original UTC | Fuente |
|---|---:|---|---|
| Lenovo LOQ 83DV00FYUS | 968.190 | 2025-02-21 04:09:15.850 | SoloTodo producto 266605, store-4484 |
| MSI GF63 Thin 12VE-068US | 959.750 | 2025-02-18 04:35:04.571 | SoloTodo producto 210618, store-5144 |
| Acer Aspire 5 NX.KHFAA.002 | 879.990 | 2023-08-21 05:40:56.118 | SoloTodo producto 213040, store-2306 |
| HP Pavilion A32VHUA | 729.990 | 2025-08-13 14:23:02.460 | SoloTodo producto 269756, store-2471 |

Estos valores aparecen como **Último precio registrado**, con fecha. No pasan a `priceClp`, no establecen stock actual, no se usan para descuentos ni se guardan como observaciones nuevas. Si la fuente pública reciente no tiene serie, el historial puede mostrar la observación antigua atribuida explícitamente a SoloTodo. No se afirma que esos equipos se puedan comprar hoy a esos importes.

La evidencia proviene de `https://publicapi.solotodo.com/products/{id}/pricing_history/?timestamp_after=2021-01-01T00:00:00Z`, comprobando previamente el `part_number` del producto. Los registros originales están conservados como datos atribuidos en `backend/archivedPrices.ts`.

## Stock antes de terminar la carga del catálogo

La consulta por sucursal descubre ahora las publicaciones del notebook individual cuando la vista rápida todavía no contiene un enlace PC Factory. Ni la falta inicial de enlaces ni un fallo de la tienda se guardan como ausencia de stock durante diez minutos. Solo se cachean registros físicos comprobados; los fallos de inventario se distinguen como HTTP 503 y se pueden reintentar desde la interfaz. La caché inferior de PC Factory tampoco conserva una respuesta parcial que no pudo consultar stock.

Los puntos físicos con stock siguen siendo los que informan evidencia de sucursal (PC Factory); otras tiendas pueden informar solo stock online. No se deriva stock físico de su dirección.

## SSO

Las tareas de Deno cargan `backend/.env` automáticamente. `scripts/configure-sso.ps1` configura los IDs y pide el secreto oculto; el archivo se excluye de Git. `deno task auth:status` informa si está configurado, sin mostrar el secreto. La prueba integrada recorre autorización, token firmado, cookie de sesión, usuario y logout; la red de Microsoft se sustituye en la prueba, pero la firma criptográfica se verifica realmente.

**La activación real necesita el registro de una aplicación Microsoft Entra.** La configuración existente en este entorno no contiene tenant ID, client ID ni secreto. No se puede afirmar un ingreso real completo antes de proporcionar ese registro. Instrucciones operativas en [SSO.md](SSO.md).

## Verificación

Pruebas de regresión para descubrimiento tardío, fallo de stock reintentable en ambas cachés, producto reacondicionado con precio visible, fuentes añadidas, importes históricos fechados y flujo SSO. Resultado: **110 pruebas backend y 46 frontend aprobadas**, compilación de producción correcta. En la comprobación en vivo, los 48 modelos tuvieron algún precio: 40 con precio publicado y 8 únicamente histórico fechado. De 18 sucursales consultadas para 83JE0184CL, 16 informaron existencias; son resultados del momento de consulta, no una garantía posterior. El diseño móvil ya fue comprobado por el usuario mediante herramientas de desarrollador.

Los archivos de búsqueda, capturas de respuestas y pruebas locales se conservaron fuera del repositorio; nunca contienen credenciales reales de Microsoft.
