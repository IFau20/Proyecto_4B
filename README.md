# Proyecto 4B — Comparador de precios de computadores

Prototipo desarrollado por avances semanales para el ramo **Diseño de Software**. Permite visualizar un catálogo de computadores de ejemplo con sus tres criterios de comparación seleccionados: **RAM, GPU y procesador**.

## Tecnologías utilizadas

- **React + Vite:** interfaz web responsive (carpeta `frontend/`).
- **Deno + Handler:** servidor y API REST (carpeta `backend/`).
- **JSON:** datos de ejemplo (`backend/data/computers.json`).

La interfaz **no almacena los computadores de forma fija**: solicita los datos al backend mediante `GET /api/computers`.

## Cómo ejecutar el proyecto

Requisitos: [Node.js](https://nodejs.org/) compatible con Vite 7 (versión 20.19 o superior, o 22.12+) y [Deno 2](https://deno.com/).

Abre dos terminales en la carpeta del repositorio:

**Terminal 1 — API:**

```bash
cd backend
deno task dev
```

La API responderá en `http://localhost:8000/api/computers`.

**Terminal 2 — Interfaz:**

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador. Debes mantener ambas terminales abiertas. Vite envía las solicitudes a `/api` hacia Deno automáticamente.

## Pruebas

```bash
cd backend
deno task test
```

```bash
cd frontend
npm test
npm run build
```

## Avance de la semana 1

- [x] Estructura básica frontend/backend.
- [x] API Deno que lee datos JSON.
- [x] Interfaz responsive que consulta la API.
- [x] Tarjetas con nombre, precio de ejemplo, RAM, GPU y procesador.
- [x] Estados de carga, error y catálogo vacío.
- [x] Pruebas básicas de la API y la interfaz.

**Importante:** los nombres, configuraciones y precios utilizados son *ficticios*, creados exclusivamente para demostrar el funcionamiento del proyecto. No son cotizaciones ni precios actualizados de tiendas.

## Avance de la semana 2 — 2026-11-02

- [x] Búsqueda instantánea por nombre, GPU o procesador (sin distinguir mayúsculas).
- [x] Filtros combinables: RAM mínima, GPU y procesador.
- [x] Opciones de filtros generadas a partir de los datos recibidos de la API.
- [x] Contador de resultados, aviso cuando no hay coincidencias y botón para limpiar filtros.
- [x] Pruebas de filtros y de interacción en la interfaz.

No se incorporaron tiendas reales ni cambios al backend esta semana: el propósito es mostrar un avance incremental pequeño, verificable y fácil de explicar. Véase [docs/SEMANA_2.md](docs/SEMANA_2.md).

### Próximas semanas (pendiente)

Comparación lado a lado entre computadores; integración de al menos tres fuentes reales de precios; historial de precios; stock, horarios y geolocalización, según el enunciado.
