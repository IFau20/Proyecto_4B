# PC Tracker: preparación de presentación, demo y preguntas

Guía para Ignacio Fau. Proyecto individual 4B, Diseño de Software. Preparada para la versión `develop` con Google SSO; el usuario confirmó que el ingreso real funciona. Las últimas comprobaciones de código fueron 112 pruebas backend y 47 frontend aprobadas, y compilación correcta. Esto no garantiza que las tiendas respondan de la misma forma el día de la exposición.

## 1. La idea que debes recordar

**«PC Tracker permite buscar notebooks por RAM, GPU y procesador, comparar el mismo modelo entre tiendas y decidir con precios, historial y disponibilidad cercana, indicando qué datos están comprobados».**

Si te quedas en blanco, vuelve a estas cinco palabras: **buscar, comparar, historial, disponibilidad, confianza**.

No necesitas recitar nombres de archivos. Debes poder explicar qué problema resuelves, qué hace cada parte y por qué no puedes asegurar un dato que una tienda no entrega.

## 2. Qué se evalúa y qué puedes demostrar

El PDF exige una demo sin PPT, de máximo cinco minutos, y preguntas técnicas. El 70% corresponde al proceso iterativo, commits semanales y mejoras incrementales; el 30% a presentación y preguntas. No equivale a 70% solo por tener muchas funciones.

| Exigencia | Qué mostrar | Precisión necesaria |
|---|---|---|
| Tres criterios | Filtros de RAM, GPU y procesador | RAM es un mínimo; GPU y procesador son selección exacta. |
| Tres fuentes | Ofertas de un mismo modelo en tres comercios distintos | Tres URLs de una tienda no son tres comercios. No todos los modelos tienen tres ofertas vigentes. |
| Historial | Gráfico, fechas y tiendas | Un solo punto no prueba una tendencia; una línea plana puede representar observaciones sin cambio. |
| Horarios y fechas | Horario de sucursal y selección de fecha | En feriado, no inventar un horario especial. |
| Stock | Estado por tienda y, donde exista, por sucursal | Stock online no prueba stock físico. |
| Georreferencia | Permiso de ubicación y sucursales ordenadas por distancia | Solo se confirma stock donde hay evidencia del modelo y sucursal. |
| Responsive | Ancho móvil y escritorio | Mostrar botones, tarjetas y desplazamiento; no solo reducir la ventana. |
| Multilenguaje propio | Cambiar ES/EN y mostrar varios textos | Diccionario local, no Google Translate. |
| SSO | Entrar con Google, regresar y cerrar sesión | Una cuenta local o un botón por sí solos no demuestran SSO. |
| Código y fuentes | Código con identificadores en inglés y atribución | La IA está permitida; debes entender el código. |

**Alcance por confirmar:** el PDF dice «Comparador de precios - Computadores» y mezcla RAM/GPU/procesador con presupuesto y reseñas. Nuestro enfoque de notebooks filtrados por características es defendible, pero no hay confirmación docente localizada de esa interpretación. Los proyectos revisados de compañeros eligieron componentes separados. No presentar su elección como una regla del profesor.

**Calendario:** en el historial revisado no había commits entre 5–11 de octubre, 12–18 de octubre y 26 de octubre–1 de noviembre. Si preguntan, reconocerlo; muchos commits posteriores no reemplazan esas semanas. No alterar fechas.

## 3. Preparación el día anterior

1. Actualizar y ejecutar la misma copia que vas a mostrar. Desde la carpeta real del repositorio, no desde una ruta supuesta:

```powershell
git switch develop
git pull --ff-only origin develop
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start.ps1"
```

2. Esperar a que se actualicen las ofertas. El script instala dependencias y abre servidores; no reservar esos minutos para la exposición.
3. Usar `http://localhost:5173`. Mantener `localhost` durante el login y el callback, sin alternar con `127.0.0.1`.
4. Probar ingreso Google y logout con la cuenta de la demo. Si otra persona prueba en modo de prueba de Google, verificar antes que su cuenta esté autorizada cuando corresponda.
5. Comprobar los dos modelos sugeridos abajo y elegir un historial que tenga varias observaciones. Anotar lo que responde ese día, sin comprometer montos en el discurso.
6. Dar permiso de ubicación previamente en el equipo de exposición. Si el navegador se usa por primera vez, ensayar también el diálogo de permiso.
7. Ensayar exactamente el cambio de ancho móvil y la vuelta a escritorio.
8. Tener cargador, conexión estable y alternativa de internet que ya hayas probado. En proyector, desactivar notificaciones y usar un tamaño de texto legible.
9. No dejar `.env`, claves, terminales con secretos o pantallas de configuración de OAuth abiertas para compartir.
10. Cronometrar dos ensayos. Objetivo: terminar en 4:30–4:45 para absorber esperas.

Verificación opcional previa, no durante los cinco minutos:

```powershell
Set-Location backend
deno task auth:status
deno task test
Set-Location ..\frontend
npm.cmd test
npm.cmd run build
```

El estado SSO no imprime el secreto. Un diagnóstico configurado no sustituye probar el ingreso real. Las auditorías de tiendas pueden tardar o devolver fallos externos; sirven para elegir casos de demo, no para prometer disponibilidad.

## 4. Casos preparados y navegación correcta

| Caso | Buscar por nombre | Identidad para reconocer la ficha | Objetivo |
|---|---|---|---|
| Comparación | `15-fd0331la` | HP 15-fd0331la, SKU D0CJ4LA | Revisar si ofrece tres o más comercios ese día. Antes se verificaron cuatro, pero el resultado puede cambiar. |
| Sucursales | `15IRX10` | Lenovo LOQ 15IRX10, SKU 83JE0184CL; 16 GB, RTX 5050, i7-13645HX | Consultar stock físico de PC Factory y distancia. |
| Historial | Elegir el que tenga varias fechas al ensayar | Comprobar nombre y SKU en su ficha | Mostrar evolución real, no solo un precio antiguo aislado. |

**La búsqueda no incluye el SKU.** El código busca sobre nombre, GPU y procesador. No escribir D0CJ4LA esperando que aparezca por ese identificador.

**Limpiar filtros antes de cambiar de caso.** Por ejemplo, RAM mínima de 16 GB ocultará el HP de 8 GB. No es un error: todos los filtros se aplican juntos.

Para cambiar el notebook de historial y cercanía, pulsar **Ver historial de este notebook** en la tarjeta. Ambos paneles usan el modelo seleccionado. No suponer que escribir en el buscador cambia automáticamente la selección de los paneles.

## 5. Demo con acciones y palabras: máximo cinco minutos

No leer todo literalmente. Aprender las ideas y las transiciones. El login se prueba antes; Google puede agregar esperas impredecibles.

| Tiempo | Acción | Qué decir |
|---|---|---|
| 0:00–0:20 | Mostrar el inicio | «PC Tracker ayuda a elegir un notebook comparando el mismo modelo en distintas tiendas. Elegí RAM, GPU y procesador para orientar la búsqueda y añadí historial y disponibilidad cercana para apoyar la decisión». |
| 0:20–0:45 | Entrar con Google y regresar | «La autenticación se delega a Google. PC Tracker no recibe mi contraseña; valida la identidad devuelta y crea una sesión propia». |
| 0:45–1:15 | Combinar filtros y luego limpiarlos | «Los filtros se aplican juntos: RAM mínima y selección de GPU o procesador. El catálogo se reduce a los equipos que cumplen esas condiciones». |
| 1:15–2:00 | Buscar `15-fd0331la`, abrir **Comparar tiendas** | «Aquí comparo el mismo equipo entre comercios. Al abrir esta vista, el backend vuelve a consultar las fuentes. Se distinguen precios verificados, referencias e información que no se pudo comprobar». Mostrar tres comercios si la consulta actual los entrega. |
| 2:00–2:40 | Pulsar historial de un modelo ensayado; elegir período | «El historial agrupa precios por tienda y fecha. Puede provenir de SoloTodo o de observaciones propias, y la interfaz identifica la fuente. No presento precios antiguos como ofertas actuales». Señalar un cambio real si existe. |
| 2:40–3:35 | Limpiar filtros, buscar Lenovo LOQ 15IRX10, pulsar su historial y **Buscar cerca de mí** | «Con mi permiso, el navegador obtiene mi ubicación. Primero se filtran las sucursales con stock confirmado para este notebook y luego se ordenan por distancia. Puedo incluir sucursales sin confirmar, pero no se presentan como disponibles». |
| 3:35–4:00 | Mostrar horarios y cambiar fecha, por ejemplo a 25 de diciembre del año correspondiente | «La fecha elegida se aplica a los horarios y feriados. El stock corresponde a la consulta actual, no a una predicción de existencias para esa fecha». |
| 4:00–4:25 | Cambiar ES/EN y mostrar ancho móvil | «Las traducciones están definidas localmente. La interfaz adapta tarjetas y controles al ancho de pantalla». Volver a escritorio si hay tiempo. |
| 4:25–4:45 | Cerrar sesión y terminar | «Puedo cerrar la sesión local. El catálogo sigue siendo público. La aplicación reúne comparación, historial y disponibilidad, conservando la diferencia entre dato confirmado y dato desconocido». |

**Si quedan 30 segundos:** priorizar idioma y vista móvil. No ocuparlos mostrando modo oscuro, pruebas o archivos; son secundarios frente a los requisitos.

**Si el ingreso demora:** no repetir clics. Explicar brevemente la espera y continuar con el catálogo público; mostrar el ingreso al final si vuelve a tiempo. Reconocer si no se logró demostrar en esa sesión, aunque antes haya funcionado.

## 6. Explicación de la arquitectura en lenguaje cotidiano

Respuesta de 30 segundos:

«Dividí la aplicación en una interfaz React y un backend Deno con TypeScript. React recibe las acciones del usuario y muestra la información. Deno expone rutas HTTP que consultan fuentes comerciales, validan los datos y devuelven JSON. El historial propio se conserva en un archivo local. Google acredita la identidad y Deno mantiene una sesión con una cookie. Separar estas responsabilidades evita colocar secretos y extracción de tiendas en el navegador».

Términos básicos:

| Término | Significado y ejemplo |
|---|---|
| Frontend | Lo que ve y utiliza el usuario: tarjetas, filtros y gráfico. |
| Backend | Servicio que procesa consultas y contacta tiendas/Google. |
| React | Biblioteca con la que se construyen componentes de interfaz. |
| Componente | Parte reutilizable de la pantalla, por ejemplo una tarjeta de notebook. |
| Deno | Entorno que ejecuta el backend JavaScript/TypeScript. |
| TypeScript | JavaScript con tipos que ayudan a detectar usos incorrectos antes de ejecutar. No valida automáticamente una respuesta externa. |
| API | Interfaz de comunicación: el frontend pide un historial a una ruta del backend. |
| Endpoint | Ruta concreta de una API, como `/api/history`. |
| HTTP | Protocolo de peticiones y respuestas utilizado entre navegador y servidor. |
| GET / POST | GET consulta datos; POST se usa, por ejemplo, para cerrar sesión. |
| JSON | Formato de intercambio de datos, con objetos, listas, textos y números. |
| Scraping | Extracción programática de información publicada en páginas. Puede leer HTML o datos estructurados; algunas integraciones consultan una API pública. |
| SKU / part number | Código que identifica la variante del equipo. El SKU interno de una tienda puede ser diferente; aquí se contrasta el identificador del fabricante. |
| Caché | Guarda temporalmente un resultado para reutilizarlo sin repetir la consulta. |
| Persistencia | Datos que sobreviven al reinicio: el historial local en disco. |
| Asíncrono | Una tarea espera red sin detener innecesariamente otras tareas. |
| Concurrencia | Varias consultas avanzan durante el mismo período; no significa solicitudes ilimitadas. |
| SSO | Inicio de sesión mediante un proveedor de identidad existente, aquí Google. |
| OAuth 2.0 / OIDC | OAuth define autorización; OpenID Connect añade identidad para autenticar. Usamos OIDC sobre el flujo de código. |
| Token | Credencial o mensaje de identidad emitido para un propósito. El ID token de Google no es nuestra cookie de sesión. |
| Cookie | Dato que el navegador envía al servidor; en este caso identifica la sesión local. |

## 7. Recorrido completo de los datos

### Abrir la aplicación

React consulta una vista rápida del catálogo y, en paralelo, otra con ofertas actualizadas. Los 48 modelos son un catálogo definido en el proyecto; no es un rastreador de todos los notebooks de internet. Las ofertas se enriquecen desde las fuentes vinculadas. El resultado rápido permite navegar mientras terminan las consultas. Una actualización fallida no debe borrar una vista útil ya cargada.

### Comparar tiendas

La tarjeta dispara `GET /api/verify-notebook?sku=...`. El backend comprueba que el modelo exista, consulta enlaces de comercios permitidos, verifica identidad/moneda/precio y devuelve ofertas con estado y fecha. La verificación del mismo modelo reutiliza resultados durante unos diez minutos; no es monitoreo continuo en tiempo real. Se limita la concurrencia de comprobación a cuatro fuentes.

### Ver historial

`GET /api/history?sku=...` intenta primero la fuente pública SoloTodo para ese modelo, contrastando el part number y solicitando el último año. Si no obtiene una serie válida, usa observaciones propias. Para cuatro modelos se conserva una observación histórica antigua, atribuida y fechada, como último respaldo. No se mezclan falsamente esos registros antiguos con capturas nuevas propias.

El recolector propio se intenta al arrancar y cada seis horas mientras el servidor está encendido. La aplicación no crea observaciones por cada segundo ni inventa meses de funcionamiento. El historial local agrupa SKU, comercio, precio y fecha. Evita registros del mismo SKU/comercio separados por menos de seis horas, conserva hasta 10.000 puntos y escribe mediante una cola y un archivo temporal que luego reemplaza al definitivo. Es persistencia JSON, no una base SQL.

### Buscar cerca

El navegador pide permiso y obtiene latitud/longitud. El frontend recibe sucursales y consulta stock del modelo. Filtra por stock, calcula distancia y muestra hasta seis. Las coordenadas del visitante se procesan en su navegador; el backend no necesita recibirlas para ordenar. La distancia es geográfica aproximada, no kilómetros por carretera ni tiempo de viaje. «Ver en mapa» abre un servicio externo con la dirección de la tienda.

### Entrar con Google

1. El navegador abre `/api/auth/login` en el backend.
2. Deno genera state, nonce y un secreto PKCE temporal; redirige a Google.
3. Google autentica al usuario y devuelve un código al callback registrado.
4. Deno intercambia ese código, usando el Client Secret y el verificador PKCE, por tokens.
5. Valida el ID token: firma, emisor, destinatario, nonce y expiración; también authorized party si viene presente.
6. Crea una sesión propia en memoria y entrega una cookie HttpOnly/SameSite.
7. `/api/auth/me` informa si existe una sesión; logout la elimina y vence la cookie.

La contraseña se introduce en Google. No se guarda ni se envía a PC Tracker. El Client ID identifica la aplicación; el Client Secret es una credencial de la aplicación en el backend, no la contraseña del usuario. El correo Google solo se incorpora si Google lo marca como verificado.

La sesión dura hasta ocho horas y se pierde si se reinicia Deno. El catálogo permanece público; el login no crea favoritos, cuentas personales persistentes ni permisos de administrador.

## 8. Preguntas técnicas con respuestas modelo

### Producto y requisitos

**1. ¿Qué problema resuelve?**

«Evita recorrer tiendas sin contexto: reúne ofertas del mismo notebook, su historial y sucursales cercanas cuando hay evidencia. El usuario puede buscar por las tres características seleccionadas».

**2. ¿Qué tiene distinto de SoloTodo?**

«Es un proyecto académico acotado con catálogo propio de modelos vinculados a fuentes. Reutiliza datos públicos atribuidos y consultas directas, y añade su propia interfaz y verificación de disponibilidad por sucursal. No pretende tener su cobertura ni reemplazarlo».

**3. ¿Por qué notebooks y no componentes separados?**

«Interpreté RAM, GPU y procesador como criterios para buscar computadores completos, coherente con el título y con que la lista también incluye presupuesto y reseñas. El enunciado admite otra interpretación. Si el alcance esperado son componentes por separado, esa diferencia debe acordarse con el profesor; no afirmo que ya esté aprobada».

**4. ¿Se puede usar sin iniciar sesión?**

«Sí. El catálogo es público. Google permite autenticar al usuario y mantener una sesión, pero actualmente no hay funciones privadas que requieran bloquear el catálogo». No inventar favoritos para justificar el login.

**5. ¿Qué no está garantizado?**

«Tres ofertas vigentes para cada modelo, stock físico de todas las tiendas o precios permanentemente actualizados. La cobertura depende de lo publicado y de que las fuentes respondan. Se informa la diferencia entre disponible, agotado y sin verificar».

### Precios, fuentes y stock

**6. ¿Cómo sabes que comparas el mismo producto?**

«No basta el nombre comercial: vinculo la ficha al código de fabricante y verifico ese identificador según la fuente. Equipos llamados LOQ pueden tener RAM, GPU o procesadores distintos».

**7. ¿Hay scraping real o son datos manuales?**

«Hay ambas cosas con roles distintos: la lista de modelos y algunos enlaces están definidos en el proyecto; las consultas extraen precios, stock y horarios. Se usan HTML, JSON-LD y endpoints públicos. Los datos de referencia se etiquetan; no se presentan como comprobaciones directas».

**8. ¿Qué es JSON-LD?**

«Datos estructurados incluidos en una página web. Una tienda puede describir un Product con offers, price y availability; el scraper los interpreta y valida».

**9. ¿Por qué usar la API de PC Factory?**

«La página carga información mediante JavaScript. Leer solo su HTML inicial no basta. El adaptador consulta los endpoints públicos que usa la ficha para identidad, precio y stock, sin entrar a cuentas ni carritos».

**10. ¿Cómo obtienes el stock físico?**

«La fuente devuelve sucursales y cantidades aproximadas. Se relaciona cada sucursal con nuestro directorio y se comprueba el notebook. La dirección de una tienda no permite deducir stock».

**11. ¿Qué diferencia hay entre agotado y sin verificar?**

«Agotado significa que una fuente informa ausencia. Sin verificar significa que no hay evidencia suficiente o que falló la consulta. No convierto un error de red en agotado».

**12. ¿Se actualiza en tiempo real?**

«Se consulta y se cachea por períodos; se muestra fecha de comprobación. No hay una conexión permanente a cada tienda. Por eso prefiero decir información consultada recientemente, no tiempo real garantizado».

**13. ¿Qué ocurre si cambia una tienda o bloquea consultas?**

«El adaptador puede dejar de obtener datos. Hay timeouts, manejo de errores y enlaces oficiales; se conserva la distinción entre referencia y verificación. Habría que mantener ese adaptador o incorporar otra fuente, sin inventar el resultado».

**14. ¿Cómo calculas la diferencia de precio?**

«Ordeno importes válidos del mismo modelo. La diferencia es mayor menos menor. Con $600.000 y $550.000, la diferencia es $50.000. Las referencias se identifican y las condiciones de pago importan; no es ahorro final garantizado con despacho incluido».

**15. ¿Cómo calculas el descuento?**

«Cuando existe un precio base válido mayor al actual: (precio base − actual) / precio base × 100. Con $600.000 y $480.000 da 20%. Un precio de referencia de la tienda no demuestra por sí solo que realmente se vendiera antes a ese monto».

**16. ¿Por qué algunos modelos solo muestran precios antiguos?**

«No encontré una oferta vigente válida para su código exacto. Muestro el último registro real con su fecha. Eso no significa que el equipo pueda comprarse hoy a ese precio».

### Historial, horarios y ubicación

**17. ¿De dónde sale un historial anterior a la creación de la app?**

«De una fuente pública externa, SoloTodo, identificada en pantalla. Nuestro historial propio solo contiene capturas hechas por el recolector. No afirmo haber medido antes de que existiera la app».

**18. ¿Puedes detectar una tendencia con un punto?**

«No. Un punto aporta una observación; varias fechas permiten comparar cambios. Tampoco una variación pasada garantiza precios futuros».

**19. ¿Por qué el gráfico es escalonado?**

«Representa cambios de precio observados, sin interpolar una bajada suave entre ellos. La serie no debe extenderse más allá de su última observación ni simular un precio actual».

**20. ¿Cómo evitas duplicar el historial?**

«Se identifica SKU y comercio, y se omiten capturas con menos de seis horas de separación respecto del último registro. Las escrituras se encolan y se reemplaza el archivo final mediante uno temporal».

**21. ¿Qué sucede si reinicias el programa?**

«El historial guardado en disco permanece. La caché y las sesiones en memoria se pierden. En un hosting sin disco persistente habría que configurar almacenamiento permanente».

**22. ¿Dónde calculas cercanía?**

«En el frontend, usando latitud y longitud del visitante y de cada sucursal. Aplico una distancia sobre la esfera terrestre y ordeno resultados. No calculo rutas de conducción».

**23. ¿Qué haces si se deniega la ubicación?**

«Muestro el error y no invento dónde está el usuario. La comparación y el historial siguen disponibles».

**24. ¿Elegir una fecha futura predice stock?**

«No. La fecha sirve para horarios y calendario; el stock muestra la consulta actual. Las existencias futuras no se pueden deducir de esos datos».

**25. ¿Un feriado implica que la tienda esté cerrada?**

«No lo presupongo. Se informa el feriado y que el horario especial no está confirmado salvo evidencia explícita. Un calendario fallido tampoco prueba que sea un día ordinario».

### Interfaz y JavaScript

**26. ¿Qué hacen useState, useEffect y useMemo aquí?**

«useState conserva datos que cambian, como filtros. useEffect coordina tareas como pedir el catálogo cuando se monta la pantalla. useMemo reutiliza cálculos como los resultados filtrados mientras sus dependencias no cambien. Ninguno sustituye un servidor ni una base de datos».

**27. ¿Por qué no modificas directamente un array del estado?**

«Genero un valor nuevo con filter, map o copias y uso el setter. Así React puede reconocer el cambio y volver a renderizar de forma predecible».

**28. ¿Para qué sirve AbortController?**

«Permite cancelar una solicitud y evitar que una respuesta antigua sobrescriba el estado cuando cambia el modelo o se desmonta la pantalla».

**29. ¿Cómo funcionan los filtros combinados?**

«Cada equipo debe cumplir todas las condiciones activas, un AND lógico. RAM usa mayor o igual al mínimo; GPU y procesador se comparan con la alternativa elegida. Al cambiar filtros se vuelve a la primera página».

**30. ¿Por qué hay dos consultas iniciales al catálogo?**

«Una entrega identidades y referencias rápidamente; la otra actualiza las ofertas sin bloquear toda la navegación. Además hay caché de sesión para recuperar una vista útil».

**31. ¿Cómo hiciste responsive y multilenguaje?**

«Con CSS que adapta distribución y controles al ancho, y un diccionario local español/inglés. Cambiar idioma modifica el estado y vuelve a mostrar los textos; no se consulta una API de traducción».

### Autenticación y seguridad

**32. ¿OAuth es lo mismo que iniciar sesión?**

«OAuth se centra en autorización; para identidad usamos OpenID Connect, que entrega un ID token verificable. En la app empleo el flujo de código con Google».

**33. ¿Por qué necesitas backend para Google?**

«Ahí permanece el Client Secret y se intercambia el código, se valida el token y se crea la sesión. El frontend no debe llevar ese secreto en su bundle».

**34. ¿Qué verificas del token?**

«Que tenga una firma válida de Google, que el emisor sea Google, que esté dirigido a nuestro cliente, que no haya expirado y que el nonce coincida con el intento iniciado. Si viene authorized party, también debe coincidir. No basta decodificar el JSON».

**35. ¿Para qué sirven state, nonce y PKCE?**

«State relaciona el retorno con el intento del navegador y protege frente a callbacks falsificados. Nonce vincula el ID token al intento. PKCE obliga a presentar el verificador del flujo que inició la aplicación, de modo que un código interceptado no baste por sí solo».

**36. ¿Dónde guardas las contraseñas y los tokens?**

«La contraseña queda en Google. Las credenciales de la aplicación se configuran en el backend mediante .env ignorado por Git. El servidor valida el ID token y crea un identificador de sesión; el navegador recibe una cookie HttpOnly, no el Client Secret».

**37. ¿Qué es HttpOnly? ¿Cifra la cookie?**

«HttpOnly impide que JavaScript de la página la lea con document.cookie; no significa que la cifre. En HTTPS se añade Secure. SameSite limita ciertos envíos entre sitios. Son controles diferentes, no una protección absoluta por sí solos».

**38. ¿JWT significa cifrado?**

«No. Un token firmado permite comprobar integridad y emisor; su contenido puede ser legible. Por eso no se colocan contraseñas en él».

**39. ¿Autenticación y autorización son iguales?**

«Autenticación comprueba quién eres. Autorización decide qué puedes hacer. Actualmente autentico con Google, pero el catálogo es público y no he implementado roles ni funciones privadas».

**40. ¿Qué hace logout?**

«Elimina la sesión local del servidor y vence su cookie. No cierra la cuenta Google en otros sitios».

**41. ¿Qué significan 400, 401, 403, 404, 405 y 503?**

«400: solicitud inválida, por ejemplo fecha o state incorrectos. 401: no se pudo validar el ingreso. 403: operación prohibida, por ejemplo logout de un origen no permitido. 404: ruta o modelo desconocido. 405: método no admitido. 503: servicio temporalmente no disponible, como una verificación comercial fallida».

### Calidad y decisiones

**42. ¿Por qué Deno y React?**

«Se alinean con el trabajo del curso y permiten separar interfaz de consultas y validación. Deno ejecuta TypeScript con permisos explícitos; React organiza la pantalla con componentes y estado».

**43. ¿Por qué no usaste una base SQL?**

«El historial de este prototipo es pequeño y se guarda en JSON con escritura controlada. Simplifica la instalación. Para varios servidores, mayor volumen o consultas complejas migraría a una base de datos».

**44. ¿Qué prueban tus tests?**

«Comprueban parsers, validaciones, filtros, estados de interfaz y flujos de autenticación. En Google se firman tokens de prueba y se sustituyen respuestas HTTP. Las pruebas no garantizan stock actual de las tiendas; por eso también hubo comprobaciones en vivo y probé el login real».

**45. ¿Utilizaste IA?**

«Sí, está permitida por el enunciado y se declara la asistencia de ChatGPT/OpenAI. La utilicé para implementar, revisar y probar. Debo poder explicar el flujo y las decisiones; las pruebas y las consultas reales se usan para comprobar los resultados».

**46. ¿Cumpliste todos los commits semanales?**

«No completamente. Hay semanas sin commits y las mejoras posteriores no reemplazan ese requisito. Puedo mostrar el historial real y explicar el avance que sí se registró». No prometer una nota ni ocultar fechas.

**47. ¿Qué mejorarías después?**

«Primero confirmaría el alcance con el profesor. Técnicamente ampliaría la cobertura comprobable de comercios y sucursales, migraría persistencia y sesiones si se despliega con varias instancias, y mejoraría monitoreo y mantenimiento de adaptadores. Son mejoras futuras, no funciones que ya atribuyo al sistema».

## 9. Dónde mostrar el código si lo solicitan

Tener estos archivos abiertos antes de exponer; no recorrer todo el repositorio en los cinco minutos.

| Archivo | Qué explicar y localizar |
|---|---|
| `frontend/src/App.jsx` | Estado de filtros/catálogo, efectos de carga, tarjetas, petición al abrir comparación y botón Google. |
| `frontend/src/catalogFilters.js` | `getFilterOptions` y `filterComputers`: normalización, RAM mínima y condiciones combinadas. |
| `frontend/src/FeaturesPanel.jsx` | `nearestSixStores`, `hoursOnDate`, permiso geográfico y carga de stock del modelo seleccionado. |
| `frontend/src/PriceHistoryChart.jsx` | Filtrado por fechas, series por tienda y gráfico escalonado. |
| `frontend/src/i18n.js` | Diccionario local y selección de idioma. |
| `backend/server.ts` | Inicio del servidor y recolección de precios al arrancar/cada seis horas. |
| `backend/handler.ts` | Selección de endpoints, validación de parámetros y códigos HTTP. |
| `backend/notebooks.ts` | Identidades del catálogo, parsers, caché y `verifyNotebookOffers`. |
| `backend/pcFactory.ts` | Consulta de identidad/precio/stock y transformación a registros de sucursal. |
| `backend/pcFactoryStores.ts` | Extracción del widget oficial de horarios y sucursales. |
| `backend/history.ts` | Validación, agrupación, separación de capturas y escritura del JSON. |
| `backend/solotodoHistory.ts` | Fuente pública primero y respaldo local/histórico si no hay serie válida. |
| `backend/auth.ts` | Proveedor, login, callback, validación de token, cookie, sesión y logout. |
| `backend/auth_test.ts` | Prueba de firma real con red simulada y rechazo de claims incorrectos. |

Rutas de ejemplo para explicar, no para reemplazar la demo visual:

```text
GET /api/notebooks?preview=1
GET /api/notebooks
GET /api/verify-notebook?sku=D0CJ4LA
GET /api/history?sku=D0CJ4LA
GET /api/stores?nearby=1
GET /api/branch-stock?sku=83JE0184CL
GET /api/holidays?date=2026-12-25
GET /api/auth/me
GET /api/auth/login
GET /api/auth/callback
POST /api/auth/logout
```

El callback recibe parámetros del proveedor; no se prueba escribiéndolo vacío. Con el servidor iniciado, las rutas pueden consultarse por el proxy `/api` del frontend. La URL de login dirige al backend para que la cookie temporal y el callback compartan origen.

## 10. Cómo explicar una función sin memorizarla línea por línea

Usar este orden: **qué recibe → qué comprueba → qué transforma → qué devuelve → qué pasa si falla**.

Ejemplo con filtros: «Recibe equipos y filtros, normaliza el texto, comprueba que cada equipo cumpla búsqueda/RAM/GPU/procesador y devuelve un array nuevo. Si no coincide ninguno, devuelve una lista vacía que la interfaz explica».

Ejemplo con PC Factory: «Recibe enlace y SKU, valida que el enlace sea de la tienda permitida, consulta identidad/precio/stock, contrasta el part number y convierte sucursales a nuestro formato. Si no puede comprobar algo, no lo reemplaza por existencias inventadas».

Ejemplo con auth: «Recibe una petición de login o retorno, valida intento y token, crea una sesión y devuelve redirección/cookie. Si no coinciden los controles, rechaza el ingreso».

Si no recuerdas un detalle: «No recuerdo el nombre exacto, pero el flujo funciona así… Puedo mostrar la función que lo realiza». No inventar una explicación para llenar el silencio.

## 11. Plan de contingencia durante la demo

| Situación | Acción | Explicación breve |
|---|---|---|
| No aparece un equipo | Limpiar filtros y buscar por nombre. | «Las condiciones se combinan; este filtro estaba excluyendo el modelo». |
| Una tienda no responde | Mostrar el estado y continuar a otra fuente/modelo ya ensayado. | «Este dato no pudo verificarse; el error no se interpreta como agotado». |
| Solo hay referencias | Señalar la etiqueta y abrir la fuente oficial si hay tiempo. | «Esto es una referencia atribuida, no una nueva comprobación directa». |
| El historial está vacío | Revisar período y usar el modelo ensayado con varias observaciones. | «No hay datos para este rango. No se genera una tendencia artificial». |
| No hay sucursales con stock | Desmarcar el filtro de confirmadas, sin decir que están disponibles. | «Ahora incluyo otras sucursales para consultar, conservando su estado desconocido». |
| Se deniega ubicación | Revisar permiso; si no hay tiempo, seguir. | «El cálculo cercano necesita permiso; el catálogo funciona sin él». |
| Google falla | Revisar origen/cuenta autorizada si hay tiempo; continuar con catálogo público. | «La autenticación depende del proveedor. No presentaré una sesión simulada». |
| Backend detenido | Reiniciarlo si hay margen; no editar código en vivo. | «La interfaz no puede consultar datos si el servicio está detenido». |
| Se reinicia Deno y se pierde sesión | Ingresar de nuevo. | «Las sesiones de este prototipo residen en memoria». |

Puedes guardar capturas o una grabación de respaldo antes de la exposición, claramente identificadas como evidencia previa, si el profesor acepta ese apoyo. No sustituir una demo real por un video fingiendo que es una consulta actual.

## 12. Errores de discurso que debes evitar

- «Todos los modelos tienen tres precios actuales»: no está garantizado.
- «Todo está en tiempo real»: hay cachés y actualizaciones periódicas.
- «Sin verificar significa agotado»: no son equivalentes.
- «La tienda está cerca, así que tiene el notebook»: proximidad no prueba stock.
- «El gráfico es todo historial recolectado por mí»: puede venir de SoloTodo y se indica.
- «Google guarda mi base de usuarios»: no hay una base propia persistente de usuarios implementada.
- «La app requiere login para ver el catálogo»: actualmente es público.
- «Logout cierra mi Google»: solo cierra la sesión de PC Tracker.
- «JWT está cifrado»: una firma no equivale a cifrado.
- «Los tests prueban que la tienda tiene stock ahora»: prueban comportamientos del código.
- «Hay alertas de precio, favoritos, roles o predicción»: no se deben atribuir funciones ausentes.
- «Todos los requisitos de proceso están cumplidos»: los commits semanales tienen brechas reales.
- «El profesor aprobó notebooks»: no se ha localizado esa aprobación.

## 13. Ensayo y autoevaluación

Primero haz un recorrido completo sin hablar. Luego uno con el guion y cronómetro. Finalmente responde estas diez preguntas sin leer:

1. ¿Qué problema resuelve y cuáles son los tres criterios?
2. ¿Cómo pasa una petición desde React hasta una tienda y vuelve a pantalla?
3. ¿Cómo reconoces el mismo modelo?
4. ¿Qué distingue precio directo, referencia y precio histórico?
5. ¿De dónde sale el historial y dónde se conserva el propio?
6. ¿Qué diferencia hay entre stock online, físico y desconocido?
7. ¿Cómo eliges las seis sucursales y qué fecha representa el stock?
8. ¿Cómo funciona Google sin conocer tu contraseña?
9. ¿Qué hacen state, nonce y PKCE?
10. ¿Qué limitaciones reales tiene la versión actual?

Para cada una: si puedes explicarla en 20–40 segundos con un ejemplo de PC Tracker, estás preparado. Si solo puedes recitar una definición, vuelve al archivo correspondiente y sigue el recorrido de datos.

Guarda esta tarjeta mental para antes de entrar:

**Problema → filtros → tres tiendas → historial → stock cercano/horarios → Google/idioma/móvil → límites claros.**

La meta es demostrar una aplicación que entiendes, con evidencia visible y explicaciones honestas; no enumerar cada mejora del repositorio ni memorizar todo el código.
