# Mathware

Aplicación web de evaluación académica con autenticación, historial, administración y generación de preguntas con Groq.

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
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (opcional; por defecto `llama-3.1-8b-instant`)

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
- La clave de Groq se guarda solo en el backend.
- El frontend no expone secretos.
- El acceso a administración está reservado al usuario propietario.

## Despliegue recomendado

Puedes desplegarla en servicios como Render, Railway, Vercel + backend externo o cualquier hosting con Node.js. Para público real, asegúrate de:

- configurar `PORT`
- configura `SUPABASE_DB_URL` con la cadena PostgreSQL de Supabase
- configurar `ADMIN_USERNAME`
- configurar `ADMIN_PASSWORD`
- configurar `GROQ_API_KEY`
- configurar `GROQ_MODEL` (opcional)

El backend crea automáticamente las tablas `users` y `quiz_history` en Supabase al iniciar.
Obtén `SUPABASE_DB_URL` desde Supabase: **Connect > ORMs > URI** o desde la cadena de conexión de PostgreSQL.
No uses la `anon key` en esta variable y no publiques la contraseña de la base de datos.

## Cuenta administradora

Define `ADMIN_USERNAME` y `ADMIN_PASSWORD` en `.env` antes de usar la aplicación fuera de tu equipo. No publiques esas credenciales ni el archivo `.env`.
