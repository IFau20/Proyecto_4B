# Avance 3 — 2026-11-02

## Objetivo
Implementar una primera comparación de precios **del mismo computador** entre tres fuentes, manteniendo los filtros de RAM, GPU y procesador de la semana 2.

## Cambios
1. Cambio de nombre público de CompuClaro a **PC Tracker** (encabezado, pie de página, título del navegador y documentación).
2. `backend/data/computers.json`: cada modelo ahora expone un arreglo `offers` con `sourceId`, `sourceName` y `priceClp`.
3. La respuesta de `GET /api/computers` conserva cuatro equipos y ahora proporciona tres ofertas ficticias por equipo.
4. `getPriceComparison()` ordena las ofertas por precio, encuentra la más económica y calcula la diferencia entre el máximo y el mínimo.
5. Cada tarjeta muestra el menor precio y un botón para desplegar las tres ofertas, con precio y diferencia respecto de la más barata.
6. Se incorporaron pruebas para el nuevo formato, el cálculo de precios y la interfaz.

## Cómo demostrarlo
1. Ejecutar Deno (`cd backend && deno task dev`).
2. Ejecutar React (`cd frontend && npm install && npm run dev`).
3. Comprobar que el sitio se llama **PC Tracker** y que los filtros anteriores siguen funcionando.
4. Abrir **Comparar precios (3 fuentes)** en cualquier equipo y comprobar que aparecen las tres fuentes y la diferencia de precios.
5. Comprobar que el precio principal es el menor de las tres ofertas.

## Alcance y limitaciones
- **Fuente de prueba A, B y C** son nombres ficticios; sus precios no corresponden a tiendas reales.
- No existen scrapers de precios o stock ni historial de precios todavía.
- No se modificó la rama `main` ni se incorporaron funcionalidades fuera de la pauta.
- El repositorio mantiene su nombre académico `Proyecto_4B`; **PC Tracker** es el nombre del producto.

## Verificación
```bash
cd backend
deno task test
cd ../frontend
npm install
npm test
npm run build
```

## Atribución
Asistencia para planificación, implementación y pruebas: **ChatGPT de OpenAI**. Revisar el código generado y sus resultados durante el desarrollo académico.
