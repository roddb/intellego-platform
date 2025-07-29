# Tutorial: Configuración de Google OAuth para Intellego Platform

Este tutorial te guiará paso a paso para configurar Google OAuth en tu aplicación Next.js.

## 📋 Prerrequisitos

- Cuenta de Google
- Acceso a Google Cloud Console
- Aplicación Next.js funcionando en `http://localhost:3000`

## 🚀 Paso 1: Acceder a Google Cloud Console

1. **Abre tu navegador** y ve a: [https://console.cloud.google.com/](https://console.cloud.google.com/)

2. **Inicia sesión** con tu cuenta de Google

3. **Acepta los términos** de servicio si es la primera vez que usas Google Cloud

## 📁 Paso 2: Crear o Seleccionar un Proyecto

### Opción A: Crear un Nuevo Proyecto

1. **Haz clic** en el dropdown del proyecto (arriba a la izquierda, junto al logo de Google Cloud)

2. **Selecciona "Nuevo Proyecto"**

3. **Completa los campos:**
   - **Nombre del proyecto:** `Intellego Platform`
   - **Organización:** Deja en blanco si es personal
   - **Ubicación:** Deja el valor predeterminado

4. **Haz clic en "Crear"**

5. **Espera** a que se cree el proyecto (1-2 minutos)

6. **Selecciona el proyecto** desde el dropdown cuando esté listo

### Opción B: Usar un Proyecto Existente

1. **Haz clic** en el dropdown del proyecto
2. **Selecciona** un proyecto existente de la lista

## 🔧 Paso 3: Habilitar la API de Google+

1. **Ve al menú de navegación** (☰ arriba a la izquierda)

2. **Busca y selecciona:** "APIs y servicios" → "Biblioteca"

3. **En el buscador**, escribe: `Google+ API`

4. **Haz clic** en "Google+ API" en los resultados

5. **Haz clic en "Habilitar"**

6. **Espera** a que se habilite la API

## 🔐 Paso 4: Configurar la Pantalla de Consentimiento OAuth

1. **Ve a:** "APIs y servicios" → "Pantalla de consentimiento OAuth"

2. **Selecciona el tipo de usuario:**
   - **Externo** (para uso público)
   - **Interno** (solo para tu organización Google Workspace)
   
   💡 **Recomendación:** Selecciona "Externo" para desarrollo

3. **Haz clic en "Crear"**

4. **Completa la información obligatoria:**
   
   **Información de la aplicación:**
   - **Nombre de la aplicación:** `Intellego Platform`
   - **Correo electrónico de asistencia técnica:** Tu email
   - **Logo de la aplicación:** (Opcional) Puedes subir un logo si tienes uno

   **Información de contacto del desarrollador:**
   - **Direcciones de correo electrónico:** Tu email

5. **Haz clic en "Guardar y continuar"**

6. **En "Alcances":** Haz clic en "Guardar y continuar" (sin cambios)

7. **En "Usuarios de prueba":** 
   - **Agrega tu email** y cualquier otro email que quieras que pueda probar la app
   - **Haz clic en "Agregar usuarios"**
   - **Haz clic en "Guardar y continuar"**

8. **Revisa el resumen** y haz clic en "Volver al panel"

## 🔑 Paso 5: Crear Credenciales OAuth 2.0

1. **Ve a:** "APIs y servicios" → "Credenciales"

2. **Haz clic en "+ Crear credenciales"**

3. **Selecciona:** "ID de cliente de OAuth 2.0"

4. **Configura las credenciales:**

   **Tipo de aplicación:** `Aplicación web`
   
   **Nombre:** `Intellego Platform Web Client`
   
   **Orígenes de JavaScript autorizados:**
   ```
   http://localhost:3000
   ```
   
   **URIs de redirección autorizados:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

5. **Haz clic en "Crear"**

## 📋 Paso 6: Copiar las Credenciales

Después de crear las credenciales, aparecerá un modal con:

1. **ID de cliente:** Una cadena larga que termina en `.apps.googleusercontent.com`
2. **Secreto del cliente:** Una cadena alfanumérica

⚠️ **IMPORTANTE:** 
- **Copia ambos valores** inmediatamente
- **Guárdalos en un lugar seguro**
- **Puedes volver a acceder** haciendo clic en el ícono de descarga en la página de credenciales

## 📁 Paso 7: Configurar Variables de Entorno

1. **Abre el archivo `.env`** en la raíz de tu proyecto

2. **Actualiza las variables** con tus credenciales reales:

```env
# Google OAuth (REEMPLAZA CON TUS CREDENCIALES REALES)
GOOGLE_CLIENT_ID="tu-client-id-aqui.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret-aqui"
```

3. **Guarda el archivo**

## 🔄 Paso 8: Habilitar Google OAuth en el Código

1. **Abre:** `src/app/auth/signin/page.tsx`

2. **Busca el botón de Google** (alrededor de la línea 167)

3. **Reemplaza el botón deshabilitado** con este código funcional:

```tsx
<div className="mt-6 text-center">
  <button
    onClick={() => signIn("google")}
    className="mac-button-secondary w-full flex items-center justify-center gap-2"
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    Continuar con Google
  </button>
</div>
```

4. **Haz lo mismo** en `src/app/auth/signup/page.tsx` si existe

## 🔄 Paso 9: Reiniciar el Servidor

1. **Detén el servidor** (Ctrl+C en la terminal)

2. **Reinicia el servidor:**
```bash
npm run dev
```

3. **Espera** a que compile completamente

## ✅ Paso 10: Probar Google OAuth

1. **Abre tu navegador** y ve a: `http://localhost:3000`

2. **Ve a la página de login:** `/auth/signin`

3. **Haz clic en "Continuar con Google"**

4. **Deberías ver:**
   - Redirección a Google
   - Pantalla de selección de cuenta
   - Pantalla de permisos de la aplicación
   - Redirección de vuelta a tu aplicación

5. **Si todo funciona:**
   - Serás redirigido al dashboard
   - Tu información aparecerá en el header
   - El usuario será creado automáticamente en el sistema

## 🚨 Solución de Problemas Comunes

### Error: "redirect_uri_mismatch"
**Problema:** La URL de redirección no coincide

**Solución:**
1. Verifica que en Google Cloud Console tengas: `http://localhost:3000/api/auth/callback/google`
2. Asegúrate de no tener espacios extra o caracteres adicionales

### Error: "invalid_client"
**Problema:** Las credenciales son incorrectas

**Solución:**
1. Verifica que copiaste correctamente el Client ID y Client Secret
2. Asegúrate de que no hay espacios extra en el archivo `.env`
3. Reinicia el servidor después de cambiar las variables

### Error: "access_denied"
**Problema:** El usuario canceló o no tiene permisos

**Solución:**
1. Asegúrate de haber agregado tu email como usuario de prueba
2. Verifica que la aplicación esté configurada como "Externa"

### Error: "OAuth error"
**Problema:** Configuración general incorrecta

**Solución:**
1. Verifica que Google+ API esté habilitada
2. Confirma que la pantalla de consentimiento esté configurada
3. Revisa que todas las URLs coincidan exactamente

## 🔒 Consideraciones de Seguridad

1. **NUNCA** subas el archivo `.env` a Git
2. **Agrega** `.env` a tu `.gitignore`
3. **Para producción:** Usa variables de entorno del servidor
4. **Cambia las URLs** de desarrollo por las de producción cuando despliegues

## 📝 Para Producción

Cuando despliegues a producción (ej: Vercel):

1. **Agrega las URLs de producción** en Google Cloud Console:
   ```
   https://tu-dominio.com
   https://tu-dominio.com/api/auth/callback/google
   ```

2. **Configura variables de entorno** en tu plataforma de deployment

3. **Considera cambiar** el estado de la aplicación de "Prueba" a "Producción" en Google Cloud Console

---

## 🎉 ¡Listo!

Si seguiste todos los pasos correctamente, Google OAuth debería estar funcionando perfectamente en tu aplicación Intellego Platform.

Para cualquier problema, revisa los logs del servidor en la terminal y los errores en la consola del navegador.