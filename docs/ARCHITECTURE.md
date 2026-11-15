# Arquitectura de PC Tracker

## Componentes

| Parte | Responsabilidad |
|---|---|
| React/Vite (`frontend/src`) | Catálogo, filtros, comparación, gráficos, geolocalización y traducciones locales. |
| API Deno (`backend/handler.ts`) | Valida rutas, métodos y parámetros; devuelve JSON y estados de error. |
| Catálogo y adaptadores (`notebooks.ts`, `liveSources.ts`, `pcFactory.ts`) | Identidad por fabricante, consulta de fuentes permitidas y normalización de precios/stock. |
| Sucursales (`stores.ts`, `pcFactoryStores.ts`, `branchStock.ts`) | Direcciones, horarios publicados y stock del notebook por sucursal cuando existe evidencia. |
| Historial (`history.ts`, `solotodoHistory.ts`) | Fuente pública primero y respaldo local persistente; fechas y fuente explícitas. |
| Autenticación (`auth.ts`) | Google/Microsoft OIDC, validación de identidad, sesión en memoria y cookie HttpOnly. |

## Flujo del catálogo

React solicita `/api/notebooks?preview=1` para navegar sin esperar todas las tiendas y consulta `/api/notebooks` en paralelo para actualizar ofertas. Se reutiliza una vista válida de sessionStorage y se evita duplicar una actualización en curso. El catálogo backend tiene caché de 15 minutos. Abrir una comparación consulta `/api/verify-notebook?sku=...`, con caché de 10 minutos y concurrencia limitada.

Los modelos están definidos en el proyecto, no se descubre todo el mercado automáticamente. Las referencias públicas ocupan un campo diferente de los precios obtenidos directamente. Se valida código de fabricante, moneda e importes; los enlaces comerciales permitidos se consultan con límites y timeouts. Los descuentos destacados deben proceder del precio base y actual de la misma tienda; las condiciones exclusivas no se presentan como descuentos generales.

## Historial y persistencia

`/api/history?sku=...` intenta recuperar observaciones públicas del último año, tras validar el part number. Si no hay serie válida, utiliza las observaciones locales; determinados modelos conservan además una observación antigua atribuida como último respaldo, sin convertirla en precio vigente.

El recolector (`server.ts`) se ejecuta al arrancar y cada seis horas mientras el servidor está encendido. El JSON propio conserva SKU, comercio, precio y fecha; evita duplicar capturas del mismo SKU/comercio separadas por menos de seis horas. Las escrituras se encolan y el archivo temporal reemplaza al definitivo. El historial propio, ignorado por Git, requiere un volumen persistente en hosting. No se inventan registros anteriores al funcionamiento del recolector ni se atribuyen series externas a capturas propias.

## Disponibilidad cercana

`/api/stores?nearby=1` devuelve sucursales; `/api/branch-stock?sku=...` consulta inventario del modelo. Se descubre el enlace comercial cuando hace falta; una consulta fallida no se cachea como ausencia de stock. PC Factory devuelve existencias aproximadas por sucursal y un indicador de cierre al consultar. Sin evidencia, la disponibilidad es desconocida.

Las coordenadas del visitante se obtienen con permiso y se procesan en el frontend. Primero se filtra por stock confirmado y después se ordena por distancia y se limita a seis sucursales. No es cálculo de rutas. `/api/holidays?date=...` consulta el calendario; una falla se distingue de un día sin feriado. Los horarios especiales requieren evidencia. La fecha seleccionada no predice existencias futuras.

## Autenticación

`/api/auth/login` redirige al proveedor configurado; `/api/auth/callback` intercambia el código y valida firma, issuer, audience, nonce y expiración del ID token. Se utilizan state de un solo uso y PKCE S256. Las credenciales del cliente permanecen en el backend. Google solo aporta correo marcado como verificado.

La sesión propia dura hasta ocho horas y reside en memoria. `/api/auth/me` consulta la sesión y `POST /api/auth/logout` la revoca. Las cookies son HttpOnly/SameSite y Secure en HTTPS. El catálogo sigue siendo público. Para varias instancias se necesitarían sesiones compartidas; reiniciar Deno invalida las sesiones actuales. Logout no cierra la cuenta del proveedor en otros sitios.

## Verificación

Los tests de parsers e interfaz usan datos controlados; la integración de autenticación verifica tokens firmados con claves de prueba y sustituye las respuestas HTTP del proveedor. Las auditorías en vivo comprueban fuentes accesibles en el momento de ejecución. Ninguna prueba automatizada garantiza stock o precios futuros.
