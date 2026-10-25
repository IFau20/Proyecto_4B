# Proyecto 4B — Comparador de precios de computadores

Primer avance semanal del ramo **Diseño de Software**. Permite visualizar un catálogo de computadores de ejemplo con sus tres criterios de comparación seleccionados: **RAM, GPU y procesador**.

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

### Próximas semanas (pendiente)

Búsqueda y filtros; comparación entre computadores; integración de fuentes reales de precios, disponibilidad e historial, según la pauta del proyecto.
