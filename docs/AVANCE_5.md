# Avance 5 — Stock por tienda

Implementado el 9 de noviembre de 2026 como segunda entrega de código de esta sesión.

- La API obtiene `Offer.availability` de datos estructurados vinculados a un SKU que coincide exactamente.
- Estados: disponible, agotado, reserva o desconocido. Si falta la información, no se inventa.
- PC Tracker muestra el estado publicado por cada tienda y el momento de consulta, también en modo oscuro.
- La consulta no equivale a verificación exitosa ni garantiza stock físico en una sucursal.

**Limitaciones:** los scrapers se validan con HTML simulado; deben probarse con tiendas reales. Aún faltan horarios, georreferenciación, historial de precios y autenticación.

Pruebas: `cd backend && deno task test`, `cd frontend && npm test && npm run build`.

Código desarrollado con asistencia de ChatGPT (OpenAI).
