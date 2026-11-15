# Verificación final del proyecto 4B

Trabajo sobre `develop`, partiendo de `b20bdbf`. React/Vite, API Deno, catálogo de 48 notebooks y los criterios RAM, GPU y procesador.

## Implementación y comprobaciones

- **Comparación de fuentes:** al abrir Comparar tiendas, `GET /api/verify-notebook?sku=...` vuelve a consultar los enlaces comerciales permitidos. Se verifica el identificador del fabricante, la moneda y el precio; las referencias del agregador conservan su etiqueta. Caché de 10 minutos, concurrencia limitada y redirecciones restringidas a la tienda de origen. La carga inicial del catálogo no espera esta consulta.
- **Resultado real obtenido:** para HP 15-fd0331la, código D0CJ4LA, se recuperaron cuatro precios directamente de Ripley, PC Factory, Eylstore y KDTEC. Es una observación puntual, no garantía de disponibilidad permanente. Ejecutar `deno task audit:comparison` para repetirla; devuelve código 1 si no consigue tres comercios.
- **Stock físico:** la página PC Factory carga mediante JavaScript. El nuevo adaptador lee los mismos endpoints públicos que su widget, comprobando ID de producto y código de fabricante. Se distinguen Internet, retiro en tienda, cantidades aproximadas y cierre informado al consultar. Para 83JE0184CL se obtuvieron 18 estados de sucursales, 16 con cantidad positiva durante la comprobación.
- **Cercanía:** se filtra por stock confirmado del notebook seleccionado antes de ordenar por distancia y limitar a seis. Un control permite incluir tiendas sin stock confirmado. Se conservan por separado fallo de consulta, resultado vacío, agotado y sin verificar; existe reintento. Las coordenadas del usuario se procesan en el navegador.
- **Horarios:** el scraper descubre el widget oficial de tiendas y extrae horarios semanales, horarios generales aplicables y coordenadas. La consulta encontró 22 horarios verificados y 22 ubicaciones con coordenadas entre 23 puntos. Los avisos particulares, incluido cierre hasta nuevo aviso, se conservan aunque exista horario general. Los avisos de la fuente se muestran como texto, nunca como HTML ejecutable.
- **Fechas:** el calendario de feriados distingue una consulta fallida de un día ordinario. Datos malformados y calendarios vacíos no prueban ausencia de feriados. La fecha elegida sirve para los horarios; el stock siempre indica su consulta actual. Una fecha festiva no permite inventar el horario especial de la tienda.
- **Historial:** se mantiene la consulta pública por código de fabricante y el respaldo local con observaciones verificadas; no se incorporan referencias como observaciones directas.
- **Idiomas:** textos nuevos incluidos en el diccionario español/inglés. Se probaron componentes reales, búsqueda, paginación, traducciones, estados de stock y errores mediante React Testing Library.

## Límite pendiente externo: SSO

El código de Microsoft Entra OIDC existe, pero un ingreso institucional real requiere registrar una aplicación Web y configurar tenant, client ID, secreto y redirect URI. No se crearon credenciales ni se simuló un inicio de sesión. Seguir `docs/SSO.md`; este requisito no debe darse por demostrado antes de completar ese ingreso.

## Validación

- 100 pruebas backend y 45 pruebas frontend aprobadas; compilación de producción y comprobación de diferencias aprobadas.
- Auditorías reales ejecutadas con el proxy configurado del entorno; esa configuración de pruebas no se incorpora al producto.
- No fue posible completar inspección visual con navegador: Chromium local falló por restricciones de sockets y el navegador remoto no pudo conectar al servidor local. La compilación y las pruebas de componentes no sustituyen la comprobación visual final en un teléfono.
- No se modifica `main` ni se crean commits retroactivos.

## Ejecución de Windows

Actualizar la copia existente y arrancar:

```powershell
Set-Location (Join-Path $HOME "PCTracker")
git switch develop
git pull --ff-only origin develop
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start.ps1"
```

## Evidencia reproducible

```text
cd backend
deno task test
deno task audit:rubric
deno task audit:comparison
deno task audit:public-history
cd ../frontend
npm ci
npm test
npm run build
```

Las comprobaciones comerciales son informativas en GitHub Actions: que el workflow esté verde no prueba que las tiendas hayan contestado con precio o stock. Leer sus resultados. Las pruebas de la aplicación sí deben pasar.

## Revisión del código

Una revisión independiente detectó redirecciones fuera de origen, identidad estructurada sin texto visible, avisos de cierre descartados, comparación incorrecta de precios según medio de pago y fallos de stock confundidos con una búsqueda vacía. Todos se reprodujeron con pruebas que fallaron primero y se corrigieron; se volvió a ejecutar el conjunto completo.
