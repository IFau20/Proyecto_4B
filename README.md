# PC Tracker — Proyecto 4B

Comparador académico de notebooks construido con React/Vite y un backend Deno 2/TypeScript. El catálogo incluye 48 modelos identificados por código de fabricante.

## Funcionalidades

- Búsqueda y filtros combinados por RAM mínima, GPU y procesador; paginación de 12 equipos.
- Comparación del mismo modelo entre comercios, con precios comprobados, referencias y fechas diferenciadas.
- Historial por tienda y período: fuente pública SoloTodo y respaldo con observaciones locales.
- Consulta de stock online y, para publicaciones compatibles de PC Factory, stock físico por sucursal.
- Horarios oficiales, consulta de feriados y hasta seis sucursales cercanas, filtrables por stock confirmado.
- Inicio de sesión con Google; Microsoft como alternativa configurable. El catálogo es público.
- Interfaz responsive, modo oscuro y traducciones locales español/inglés.

## Requisitos y ejecución en Windows

Instalar Git, Node.js LTS y Deno 2. Desde PowerShell:

```powershell
$project = Join-Path $HOME "PCTracker"
if (-not (Test-Path "$project\.git")) {
  git clone --branch main https://github.com/IFau20/Proyecto_4B.git "$project"
}
Set-Location $project
git switch main
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start.ps1"
```

Abrir **http://localhost:5173**. El script prepara dependencias y abre el frontend y el backend en ventanas separadas. Cerrarlas detiene el servicio. Mantener `localhost` durante el inicio de sesión.

### Inicio de sesión

Crear un cliente OAuth Web en Google con callback `http://localhost:8000/api/auth/callback`, y ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-google-sso.ps1"
```

Las credenciales se guardan en `backend/.env`, excluido de Git. Reiniciar los servidores después de configurar. El usuario confirmó el funcionamiento real del ingreso Google en su instalación. Para configurar otra instalación, consultar [SSO](docs/SSO.md).

### Ejecución manual

En terminales separadas:

```powershell
cd backend
deno task dev
```

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

## Pruebas y auditorías

Desde la carpeta correspondiente:

```powershell
cd backend
deno task test
deno task auth:status
deno task audit:comparison
deno task audit:rubric
```

```powershell
cd frontend
npm.cmd ci
npm.cmd test
npm.cmd run build
```

Los tests y la compilación se ejecutan en GitHub Actions. Las auditorías comerciales son diagnósticos: sus resultados dependen de la respuesta de cada sitio y no garantizan disponibilidad actual.

## Datos y limitaciones

No todos los notebooks tienen tres ofertas vigentes. Un precio histórico fechado no es una cotización actual y «sin verificar» no significa agotado. El stock online no demuestra existencias en una sucursal; las cantidades físicas pueden ser aproximadas. Los precios por transferencia y las condiciones especiales se identifican por separado.

El historial propio se guarda en `backend/data/price-history.json`; necesita almacenamiento persistente al desplegar. Las sesiones son locales en memoria y se pierden al reiniciar. La fecha seleccionada se aplica a horarios y feriados; no predice stock futuro. Las distancias son geográficas aproximadas, no rutas de conducción.

## Documentación

- [Arquitectura y datos](docs/ARCHITECTURE.md)
- [Configuración Google y alternativa Microsoft](docs/SSO.md)
- [Fuentes y atribución de imágenes](docs/SOURCES.md)

Implementación, pruebas y documentación asistidas por ChatGPT/OpenAI. El uso de fuentes públicas se atribuye; no se eluden controles de acceso. Los modelos, enlaces y adaptadores se mantienen en el código y requieren actualización cuando cambian las fuentes.
