# Fuentes y atribución

PC Tracker usa identidades y enlaces de productos públicos. La procedencia exacta por modelo permanece en `backend/notebooks.ts`, `retailerLinks.ts`, `archivedPrices.ts` y los adaptadores correspondientes. No hay garantía de cobertura completa ni disponibilidad permanente.

## Precios e historial

- SoloTodo: perfiles de modelos y API pública `https://publicapi.solotodo.com`. Los datos de referencia se separan de las verificaciones directas; el historial externo se etiqueta y valida por part number.
- Comercios vinculados en el catálogo: PC Factory, Ripley, Paris, SP Digital, Winpy, Centrale, PC Express, GreenChip, TiShop, Eylstore, KDTEC, Notebook Store, Falabella, HP, ASUS, Tecnomas, BIP, UltraPC, GamingX, RumboChile, CTMAN y SmartDeal. Un enlace no garantiza una oferta vigente.
- PC Factory: servicios públicos de identidad, precio e inventario bajo `https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos/`. Las sucursales se vinculan a los identificadores publicados; no se infiere stock físico del stock online.

## Horarios, ubicaciones y fechas

- PC Factory: https://www.pcfactory.cl/tiendas y su widget público.
- SP Digital: https://www.spdigital.cl/myaccount/directions/
- Winpy: https://www.winpy.cl/retiros-y-despachos
- Centrale: https://centrale.cl/contacto/
- PC Express: https://tienda.pc-express.cl/sucursales-y-horarios
- Calendario de feriados: https://feriados.devschile.cl/api/holidays/2026 (el adaptador consulta el año solicitado).

Las coordenadas y enlaces de fuente se conservan en el directorio de tiendas. Horarios habituales no garantizan apertura especial durante feriados.

## Autenticación

Implementación basada en OpenID Connect de Google: https://developers.google.com/identity/openid-connect/openid-connect . Alternativa Microsoft: https://learn.microsoft.com/entra/identity-platform/ . No se copió código de compañeros.

## Imágenes

### Fallbacks de imágenes

Product images returned by SoloTodo and retail `og:image` sometimes fail HTTP 406 or hotlink restrictions despite an apparently valid image URL. PC Tracker now attempts a limited, documented list of real external product photographs for these models, then the originally extracted URL, through the restricted same-origin image proxy. It does not change user-agent identities or bypass authentication.

| Notebook SKU | External fallback | Identification |
|---|---|---|
| 83LY003NCL | media.solotodo.com, res.cloudinary.com | Exact Lenovo Legion 5 15IRX10 SKU; [SoloTodo product](https://www.solotodo.cl/products/279220-lenovo-legion-5-15irx10-83ly003ncl), [Tecnomas product](https://www.tecnomas.cl/producto/lenovo-legion-5-15irx10-83ly003ncl) |
| 82XM00M4CL | media-cdn.bnn.in.th, microless.com | Lenovo IdeaPad Slim 3 15ABR8 family |
| BA1U9LA | cdn.panacompu.com | HP Victus 15-fb3009la exact model |
| CH8Z6LA | cdn.panacompu.com | HP Victus 15-fb30xx family; appearance only |
| 83GSX029CL | ipl.com.vn, lacuracao.pe | Lenovo LOQ 15IAX9 family |
| 83GSX013CL | lacuracao.pe | Lenovo LOQ 15IAX9 family |
| NH.DADAL.002.1 | cdn1.technopark.ru | Acer Nitro Lite NL16-71G family |
| BM6U5LA | media.falabella.com | HP Omen 16-ap0002la exact model |
| D62W3LA | imagenes.deltron.com.pe | HP HyperX OMEN 15-ga0001la exact model |

Photos can show slightly different RAM/SSD/keyboard configurations within a model family. Specifications and prices are still tied to the exact manufacturer SKU. Source hotlinks may be refused even after this improvement; the UI retains an empty-state fallback rather than a broken image. Image availability is independent of seller availability.

Additional SKU-matched retailer pages have been added to the catalog for HP Victus BA1U9LA and CH8Z6LA; their prices are parsed only when the published SKU and recognized price labels are present.


Las imágenes pertenecen a sus respectivos titulares; enlazar una imagen no transfiere sus derechos. La aplicación no utiliza imágenes generadas como fotografías de productos. Implementación, pruebas y documentación asistidas por ChatGPT/OpenAI.
