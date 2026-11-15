# Notebook image fallbacks

Product images returned by SoloTodo and retail `og:image` sometimes fail HTTP 406 or hotlink restrictions despite an apparently valid image URL. PC Tracker now attempts a limited, documented list of real external product photographs for these models, then the originally extracted URL, through the restricted same-origin image proxy. It does not change user-agent identities or bypass authentication.

| Notebook SKU | External fallback | Identification |
|---|---|---|
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
