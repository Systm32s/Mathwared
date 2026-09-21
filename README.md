# Mathware

Aplicación web de evaluación académica con autenticación, historial, administración y generación de preguntas con Gemini.

## Requisitos

- Node.js 18+
- npm

## Instalación

1. Clona el repositorio.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Configura tus valores reales:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `GEMINI_API_KEY`

## Ejecutar localmente

Desde la carpeta del proyecto:

```bash
cd Mathware-Mathware
npm start
```

La app quedará disponible en:

```text
http://localhost:3000
```

## Seguridad para público

- No subas el archivo `.env` ni la carpeta `data/` con datos reales.
- La clave de Gemini se guarda solo en el backend.
- El frontend no expone secretos.
- El acceso a administración está reservado al usuario propietario.

## Despliegue recomendado

Puedes desplegarla en servicios como Render, Railway, Vercel + backend externo o cualquier hosting con Node.js. Para público real, asegúrate de:

- configurar `PORT`
- configurar `ADMIN_USERNAME`
- configurar `ADMIN_PASSWORD`
- configurar `GEMINI_API_KEY`
- usar un almacenamiento persistente para SQLite o migrarlo a una base de datos externa

## Cuenta administradora

Define `ADMIN_USERNAME` y `ADMIN_PASSWORD` en `.env` antes de usar la aplicación fuera de tu equipo. No publiques esas credenciales ni el archivo `.env`.
