# PC Tracker — Guía de demostración (5 minutos)

**Antes de la DEMO:** tener Node LTS, Deno 2, Git y conexión a internet. Usar la rama `develop`. Ejecutar `scripts/start.ps1` en Windows o dos terminales de desarrollo. Nunca inventar precios, stock, resultados de una tienda, ni commits de semanas pasadas.

## Guion

| Tiempo aprox. | Demostración | Evidencia |
|---|---|---|
| 0:00–0:35 | Abrir PC Tracker, mostrar que se adapta al ancho de la ventana y activar el modo oscuro. | React + CSS responsive + preferencia guardada. |
| 0:35–1:15 | Buscar y filtrar por RAM, GPU y procesador. | Tres criterios elegidos, búsqueda en catálogo API. |
| 1:15–2:00 | Abrir comparación de Lenovo y HP: cantidad de fuentes, diferencia de precios, enlaces. | Comparar tres fuentes, distinguir precios de referencia de datos vivos. |
| 2:00–2:45 | Mostrar stock publicado por tienda y estado "sin verificar" cuando se bloquea la consulta. | Scrapers de producto y verificación de SKU. |
| 2:45–3:30 | Mostrar historial real por tienda con fecha, variación y gráfico cuando existan 2+ observaciones; nunca fingir que existen datos antiguos. | `GET /api/history?sku=...`, almacenamiento JSON persistente. |
| 3:30–4:10 | Ver direcciones/horarios oficiales y "Buscar cerca de mí" (dar permiso si corresponde). | `GET /api/stores`, coordenadas y distancias; NO stock físico confirmado. |
| 4:10–4:40 | Cambiar a inglés y volver a español; demostrar traducciones sin API externa. | Traducciones locales. |
| 4:40–5:00 | Mostrar inicio Microsoft si el tenant está configurado; si no, mostrar el estado "SSO sin configurar" y explicar qué falta. | OIDC backend configurable; no fingir sesión real. |

## Requisitos originales

- **Tres criterios elegidos:** RAM, GPU y procesador.
- **Tres o más fuentes:** Lenovo 3 URLs y HP 4 URLs; precios referenciales de HP de 3 fichas reales, claramente separados de verificación en vivo.
- **Historial:** registra solamente observaciones reales con fechas y tendencias cuando haya suficiente información.
- **Horarios:** scraping de páginas de contacto y verificación de información publicada; incluye pausas de atención cuando correspondan.
- **Stock:** estados reconocidos por producto y por fuente; "sin verificar" cuando las páginas no entregan evidencia.
- **Georreferencia:** direcciones, ubicación con permiso del navegador y orden por distancia cuando hay coordenadas.
- **Responsive:** CSS con rejillas de 4/2/1 columnas y controles móviles. Hacer comprobación visual manual.
- **SSO:** backend Microsoft Entra OIDC implementado; requiere registro del cliente y secreto institucional. El inicio completo no es verificable sin ello.
- **Multilenguaje:** español/inglés con diccionario mantenido en el código, sin Google Translate.
- **GitHub:** commits incrementales en `develop`; el calendario real de commits no se puede falsificar retroactivamente.
- **Código en inglés y atribución:** módulos, funciones y pruebas en inglés, mensajes de interfaz traducidos; desarrollo asistido con ChatGPT/OpenAI.

## Preguntas técnicas posibles

**¿Cómo llega un computador al catálogo?** React realiza peticiones GET a la API Deno. Los datos ficticios vienen de JSON, los reales se consultan en tiendas mediante extractores.

**¿Cómo evitan comparar modelos distintos?** El identificador del fabricante SKU es exacto, los enlaces están permitidos explícitamente, y la falta de datos no se reemplaza por números inventados.

**¿Cómo calculan el ahorro?** Los precios válidos se ordenan de menor a mayor y se resta el mínimo al máximo. Si existe un solo precio no se informa un ahorro ficticio de cero.

**¿Por qué el historial está vacío al inicio?** Solo registra observaciones auténticas; dos fechas de consulta diferentes permiten visualizar la variación.

**¿Qué ocurre si una tienda bloquea un scraper?** Aparece "no verificado" y la app sigue funcionando; el servicio informa bloqueo o error y deja enlaces oficiales para comprobar.

**¿Cómo funcionan SSO y multilenguaje?** Microsoft Entra ID utiliza autorización OIDC con código/PKCE, cookies HttpOnly y validación de firma; idiomas mediante diccionario en archivos JS.

**¿Geolocalización confirma stock?** No. Se calcula la proximidad de ubicaciones conocidas, sin enviar las coordenadas al backend; disponibilidad por sucursal requiere una publicación específica.

## Validación antes de entregar

1. `cd backend; deno task test`.
2. `cd frontend; npm.cmd ci; npm.cmd test; npm.cmd run build`.
3. Revisar GitHub Actions en verde y la rama `develop`.
4. Comprobar diseño en móvil real o emulación, en 320, 375, 768 y 1440 px.
5. Comprobar SSO real solo después de configurar el tenant y credenciales.
6. Comparar al menos tres ofertas publicadas y mostrar claramente las limitaciones de scraping automatizado.
7. Mantener `main` sin cambios hasta aprobar el trabajo.

La app está implementada como prototipo de clase; no hay afirmación de producción comercial ni de accesibilidad exhaustivamente certificada.
