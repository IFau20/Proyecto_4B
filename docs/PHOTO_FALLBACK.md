# Product photo fallback for the two previously broken models

Some SoloTodo photos resolve to `api.solotodo.com/products/.../picture/`, which returned HTTP 406 during the GitHub runner audit on November 15, 2026. A restricted same-origin proxy therefore uses the following **model-family** photographs as fallback:

- Lenovo LOQ 15ARP9 (83JC0080CL): product-family image published by Lenovo: https://p4-ofp.static.pub/fes/cms/2024/04/24/bor6k5n2pohl9j145ripyl85iwo76e960068.png
- HP 250R G10 (DB9V5AT#ABM): HP 250R G10 family image published in a retailer's product listing: https://www.buyitdirect.ie/Images/C38LJAT_1_Supersize.jpg?v=3

The images illustrate the correct laptop *model family*, but may show another keyboard, CPU configuration or operating system, so are not proof of the exact retail SKU's physical details. Product specs and prices remain tied to manufacturer SKU. The proxy only permits trusted HTTPS image hosts and validates content types; it never allows arbitrary image URLs from clients. Photos are linked remotely, not committed as binary assets.
