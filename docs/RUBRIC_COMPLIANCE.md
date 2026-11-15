# Estado actualizado de la pauta

Ver [implementación, comprobaciones y límites de la entrega](RUBRIC_COMPLETION_2026-11-15.md). La nueva implementación consulta el servicio público de PC Factory para stock físico y precios, extrae horarios del widget oficial y verifica enlaces comerciales al abrir una comparación. SSO real sigue pendiente de configuración institucional.

---

# Evidencia para la pauta de PC Tracker

Comparación de tres tiendas: la interfaz calcula diferencias entre precios publicados por al menos tres comercios distintos si están disponibles, indicando que son referenciales. Se mantiene un conteo separado para tres precios comprobados directamente y no se presentan referencias como verificadas.

Historial: endpoint /api/history?sku=... con datos públicos de SoloTodo vinculados al SKU, respaldo con observaciones propias persistentes, gráficos por tienda, fechas y diferencias.

Horarios y fechas: los horarios habituales se verifican mediante scrapers de las webs oficiales (SP Digital, Winpy, Centrale y PC Express); desconocidos siguen siendo desconocidos. El calendario de feriados de Chile se consulta desde https://feriados.devschile.cl/api/holidays/2026 para la fecha seleccionada, sin presuponer horarios de apertura durante feriados.

Stock: los scrapers de ecommerce comprueban SKU y estados explícitos. La API pública puede informar disponibilidad online, marcada como no verificada directamente. El endpoint /api/branch-stock?sku=... revisa la sección visible de stock por sucursal en fichas PC Factory para ese SKU, sin inferir stock local a partir del dato online.

Proximidad: tras autorización del navegador, muestra las seis sucursales más cercanas y el estado comprobado del notebook en cada una si lo publica el retailer. Sin evidencia, dice stock sin verificar. Las coordenadas del usuario no se envían al backend.

Auditoría: cd backend && deno task audit:rubric emite indicadores reales separados para referencias, precios directos, stock online, stock físico, horas, fecha de feriado y sucursales; no confunde pruebas con disponibilidad actual. GitHub Actions ejecuta esta auditoría como diagnóstico informativo porque webs externas pueden bloquear bots.

Documentación de fuentes: https://www.pcfactory.cl/servicios/compra-mas-facil-con-nosotros , https://www.pcfactory.cl/producto/55428 , https://www.spdigital.cl/tracking/ , https://feriados.devschile.cl/api/holidays/2026 .

Código asistido con ChatGPT/OpenAI.

## Auditoría ejecutada el 15 de noviembre de 2026

Ejecución: https://github.com/IFau20/Proyecto_4B/actions/runs/43690922342

- 48 modelos, 37 nombres de comercios, 17 modelos con precios publicados de tres o más fuentes distintas.
- Todavía 0 modelos con tres precios confirmados directamente en esa misma ejecución; cuatro observaciones directas de precio, 105 precios de referencia.
- Siete estados de stock online comprobados directamente y 93 disponibilidades online publicadas por la fuente agregadora.
- Tres puntos con horario habitual comprobado; calendario de feriados: Navidad identificado correctamente como feriado irrenunciable.
- 23 puntos físicos, 21 con coordenadas, pero cero sucursales con stock confirmado automáticamente para el SKU de prueba 83JE0184CL en el runner de GitHub.
- Historial local del runner de pruebas vacío; el historial público se comprueba separadamente por notebook.

Esta auditoría muestra **cobertura parcial de datos de terceros**. Aunque los componentes de la pauta están implementados y pasan pruebas, la aplicación no puede garantizar tres precios directamente verificados ni disponibilidad física por sucursal cuando un comercio bloquea la consulta o no entrega datos. El enlace directo a la ficha oficial permite consultar manualmente el stock de PC Factory, sin inventar la disponibilidad.
