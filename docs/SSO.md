# Inicio de sesión Microsoft de PC Tracker

## Estado

El código implementa autorización OIDC con PKCE, state de un solo uso, nonce, validación de firma RS256 y de issuer/audience/expiración, cookies HttpOnly/SameSite y cierre de sesión. La prueba de integración recorre código de autorización → token firmado → sesión → consulta del usuario → logout; solo la red de Microsoft se sustituye por respuestas de prueba, nunca la validación criptográfica.

Para usar una cuenta real, Microsoft exige una aplicación registrada. Esa aplicación no se puede reemplazar por IDs inventados, una sesión de GitHub ni el correo/contraseña de la universidad. Esta entrega no afirma que un usuario real ya haya ingresado.

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

Después de actualizar `develop`, desde la carpeta del proyecto:

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

Las sesiones residen en memoria y se pierden al reiniciar el servidor. Para un despliegue público se deben registrar las URLs HTTPS reales, cambiar origen/callback y utilizar un almacén compartido de sesiones si existen varias instancias. Los errores de Microsoft por permisos o credenciales del tenant requieren corregir el registro real; no se sustituyen por una autenticación simulada.
