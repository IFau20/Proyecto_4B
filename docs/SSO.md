# Inicio de sesión Google de PC Tracker

Google es la opción recomendada para la demostración: no depende de permisos de Microsoft Entra de la universidad. Se mantiene Microsoft como alternativa configurable. El enunciado pide SSO sin indicar un proveedor.

## Activación con una cuenta real

1. Abrir https://console.cloud.google.com/ con la cuenta Google que administrará el proyecto. Si la cuenta institucional restringe la creación de proyectos, usar una cuenta personal propia.
2. Crear o seleccionar el proyecto **PC Tracker** y abrir **Google Auth Platform**.
3. En **Branding**, completar nombre de la aplicación y correos de soporte/contacto.
4. En **Audience**, usar **External** para permitir cuentas personales. Mientras esté en pruebas, añadir las cuentas que realizarán la demo como usuarios de prueba, si la consola lo solicita.
5. En **Clients → Create client**, elegir **Web application**.
6. Registrar como **Authorized redirect URI** exactamente:

   `http://localhost:8000/api/auth/callback`

   El intercambio se realiza en el backend; no es un cliente Android ni una clave API. No se necesita habilitar Gmail, Drive ni Calendar.
7. Copiar **Client ID** y **Client secret**. Desde la carpeta del proyecto ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-google-sso.ps1"
```

El asistente guarda las credenciales en `backend/.env`, excluido de Git; el secreto se introduce oculto. No enviar ese archivo ni pegar el secreto en el chat. Si ya hay una configuración Google, el asistente pide editarla manualmente para evitar sobrescrituras.

8. Reiniciar las ventanas del servidor y ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start.ps1"
```

9. Abrir **http://localhost:5173**, elegir **Continuar con Google**, completar el consentimiento y verificar el retorno. Comprobar **Cerrar sesión**. Mantener `localhost`, no cambiar a `127.0.0.1` durante el flujo.

## Configuración y diagnóstico

```dotenv
AUTH_PROVIDER=google
GOOGLE_CLIENT_ID=TU_CLIENTE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_SECRETO
APP_PUBLIC_ORIGIN=http://localhost:5173
AUTH_REDIRECT_URI=http://localhost:8000/api/auth/callback
```

Deno carga `.env` automáticamente. Las variables existentes en la terminal tienen prioridad. Ejecutar desde `backend`:

```powershell
deno task auth:status
```

El diagnóstico informa proveedor, campos ausentes y URLs, sin imprimir el secreto. Código 0 significa configuración sintácticamente válida, no un ingreso real demostrado. Un error `redirect_uri_mismatch` requiere igualar exactamente el callback del cliente y `.env`; `invalid_client` requiere revisar el ID y secreto de ese cliente Web. Si el acceso se deniega en modo de prueba, comprobar la audiencia y las cuentas autorizadas.

## Validación y límites

Se implementa OpenID Connect con código de autorización, PKCE S256, state de un solo uso y nonce. El backend valida firma RS256 con las claves públicas de Google, emisor, destinatario, expiración y authorized party cuando exista. Solo usa correo Google marcado como verificado. Cookies HttpOnly/SameSite y logout que revoca la sesión local. No se solicitan permisos de correo, archivos ni calendarios.

La prueba integrada utiliza tokens firmados con claves de prueba y sustituye solo las respuestas HTTP del proveedor. Rechaza firma, nonce, audience, issuer, expiración y authorized party incorrectos. Esto no sustituye ingresar con una cuenta Google real después de crear el cliente OAuth.

En Deno local, las sesiones residen en memoria y se pierden al reiniciar. En Vercel, las sesiones y el estado OAuth se comparten mediante el almacén privado persistente. Cerrar sesión en PC Tracker no cierra la cuenta Google en otros sitios.

Implementación propia basada en la documentación oficial: https://developers.google.com/identity/openid-connect/openid-connect . No se copió código de los repositorios de compañeros.

---

## Alternativa Microsoft

Para usar la integración existente, establecer `AUTH_PROVIDER=microsoft`. El asistente `scripts/configure-sso.ps1` selecciona Microsoft y solicita los IDs/secreto de Entra. Requiere una aplicación Web registrada con el mismo callback; consultar al administrador si la institución impide crearla.

## Registro necesario (una vez)

1. Abrir https://entra.microsoft.com/ y entrar con la cuenta que administrará el registro.
2. Ir a **Identidad → Aplicaciones → Registros de aplicaciones → Nuevo registro**.
3. Nombre: **PC Tracker**. Para acceso institucional, elegir **Cuentas solo de este directorio organizativo**.
4. En URI de redirección elegir plataforma **Web** y registrar exactamente `http://localhost:8000/api/auth/callback`.
5. Copiar **Id. de aplicación (cliente)** y **Id. de directorio (inquilino/tenant)**.
6. En **Certificados y secretos → Nuevo secreto de cliente**, generar un secreto y conservar su **Valor**; el identificador del secreto no sirve como contraseña de la aplicación.
7. Si la institución impide registrar aplicaciones, solicitar al administrador este registro. No requiere permisos de correo, archivos ni calendarios: se solicitan solamente `openid profile email`.

Documentación oficial: https://learn.microsoft.com/en-us/graph/auth-register-app-v2 y https://learn.microsoft.com/entra/identity-platform/how-to-add-redirect-uri .

## Configurar en tu PC

Después de actualizar `main`, desde la carpeta del proyecto:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-sso.ps1"
```

El asistente pide tenant ID, client ID y el Valor del secreto. El secreto se escribe de forma oculta. Se guardan en `backend/.env`, que Git ignora. No enviar ese archivo ni pegar el secreto en el chat. Se puede completar la plantilla vacía creada por start.ps1; una configuración existente se edita manualmente para no sobrescribirla accidentalmente.

Reiniciar las ventanas anteriores y ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start.ps1"
```

Abrir `http://localhost:5173`. Las tareas de Deno cargan `.env` automáticamente y el botón Iniciar sesión aparece solo con una configuración sintácticamente válida. Completar el ingreso en Microsoft, verificar la vuelta a PC Tracker y cerrar sesión.

Diagnóstico sin imprimir el secreto:

```powershell
Set-Location backend
deno task auth:status
```

Un código de salida 0 confirma únicamente que los campos están configurados; el registro y las credenciales se comprueban de verdad al ingresar. Un código 1 informa configuración pendiente. Variables existentes en la terminal tienen prioridad sobre `.env`.

## Límites

Las sesiones locales se pierden al reiniciar Deno; el adaptador de Vercel utiliza sesiones compartidas persistentes. En producción se deben registrar las URLs HTTPS reales y configurar origen/callback. Los errores de Microsoft por permisos o credenciales del tenant requieren corregir el registro real; no se sustituyen por una autenticación simulada.

## Activación en Vercel

La configuración de tu PC no se publica en Git. En el proyecto **pc-tracker-4b**, abrir **Settings → Environment Variables** y definir para producción:

```dotenv
AUTH_PROVIDER=google
GOOGLE_CLIENT_ID=TU_CLIENTE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU_SECRETO
APP_PUBLIC_ORIGIN=https://pc-tracker-4b-turbinalred-3964.vercel.app
AUTH_REDIRECT_URI=https://pc-tracker-4b-turbinalred-3964.vercel.app/api/auth/callback
```

Usar el dominio público definitivo del despliegue, sin barra final en el origen. Registrar el mismo callback HTTPS en el cliente Web de Google, conservando el callback localhost si se seguirá usando localmente. Marcar el secreto como sensible y realizar un nuevo despliegue después de guardar las variables. No utilizar variables `VITE_` para secretos.

El almacén Blob privado conectado proporciona las variables de almacenamiento del backend. `CRON_SECRET` protege la captura diaria: tampoco debe exponerse al navegador. Sin configuración OAuth válida, el catálogo público sigue disponible y el ingreso no se presenta como operativo. Para comprobarlo de verdad: entrar desde el dominio público, completar Google, verificar el nombre de usuario y cerrar sesión.
