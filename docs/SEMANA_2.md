# Avance semanal 2 — 2026-11-02

## Objetivo

Permitir que el usuario encuentre computadores dentro del catálogo de ejemplo aplicando los tres criterios elegidos: RAM, GPU y procesador.

## Cambios implementados

1. Campo de búsqueda por nombre de equipo, GPU o procesador, sin distinguir mayúsculas.
2. Selector de RAM mínima: muestra equipos que tengan al menos la cantidad indicada.
3. Selectores exactos de GPU y procesador; las alternativas proceden del catálogo consultado a la API.
4. Filtros combinables, contador de resultados y opción para restablecerlos.
5. Mensaje distinto cuando el catálogo no tiene datos y cuando los filtros no producen coincidencias.
6. Pruebas unitarias de la lógica y pruebas de integración de las interacciones de React.

## Arquitectura

- React mantiene los valores de filtros en `useState` y calcula las coincidencias sobre los datos cargados.
- `CatalogFilters.jsx` contiene la interfaz de los controles.
- `catalogFilters.js` contiene funciones puras para generar opciones y aplicar los filtros.
- Vite continúa consumiendo `GET /api/computers` del backend Deno. No se modificó el servidor.

## Pasos para demostrarlo en clase

1. Abrir el catálogo con Deno y Vite en ejecución.
2. Buscar `RTX`: deben quedar los equipos con GPU RTX.
3. Seleccionar `16 GB o más`: desaparecen los equipos de 8 GB.
4. Seleccionar una GPU y un procesador: solo se muestran los equipos que cumplen ambos filtros.
5. Buscar un nombre inexistente: aparece el aviso de cero coincidencias.
6. Pulsar **Limpiar filtros**: reaparece el catálogo completo.

## Verificaciones

Ejecutar en `frontend/`:

```bash
npm test
npm run build
```

Este avance utiliza datos **ficticios**; aún no incorpora scraping, fuentes reales, precios históricos ni geolocalización.

## Próximo avance sugerido

Comparación lado a lado de dos o más computadores seleccionados por el usuario.
