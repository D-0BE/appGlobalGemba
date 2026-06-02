# GlobalGemba 🌍

Sistema de gestión de empleados: fichajes, vacaciones, tareas e informes.

---

## 🚀 Cómo levantarlo en local (en tu casa)

> Solo necesitas **Docker Desktop** instalado. Nada más.

### 1. Instala Docker Desktop (si no lo tienes)

👉 Descárgalo aquí: https://www.docker.com/products/docker-desktop/

Instálalo, ábrelo y espera a que el icono de la ballena 🐳 aparezca en la barra de tareas.

---

### 2. Clona el repositorio

Abre una terminal (PowerShell o CMD) y ejecuta:

```bash
git clone https://github.com/D-0BE/appGlobalGemba.git
cd appGlobalGemba
```

---

### 3. Levanta todo con un solo comando

```bash
docker compose up
```

Espera unos 30-60 segundos mientras se construyen las imágenes y se inicializa la base de datos.  
Cuando veas `🚀 API GlobalGemba corriendo en http://localhost:3001`, ya está listo.

---

### 4. Abre la app en el navegador

👉 **http://localhost:5173**

#### Credenciales de acceso

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@globalgemba.com` | `GlobalGemba2026!` | Admin |
| `carlos.rodriguez@globalgemba.com` | `GlobalGemba2026!` | Jefe |
| `laura.martinez@globalgemba.com` | `GlobalGemba2026!` | Jefe |
| `alvaro.garcia@globalgemba.com` | `GlobalGemba2026!` | Empleado |
| `rodrigo.lopez@globalgemba.com` | `GlobalGemba2026!` | Empleado |
| `roberto.sanchez@globalgemba.com` | `GlobalGemba2026!` | Empleado |
| `jorge.fernandez@globalgemba.com` | `GlobalGemba2026!` | Empleado |
| `david.perez@globalgemba.com` | `GlobalGemba2026!` | Empleado |

---

### 5. Parar la app

```bash
# Parar (sin borrar datos)
docker compose down

# Parar y borrar todos los datos (reset completo)
docker compose down -v
```

---

## 🐛 Solución de problemas

### El navegador no carga nada en localhost:5173
Espera 1 minuto más y recarga. Docker necesita tiempo para construir las imágenes la primera vez.

### Error "port already in use"
Algún puerto (5173, 3001 o 5432) está ocupado. Cierra otras apps o reinicia Docker Desktop.

### Los datos no aparecen / error al hacer login
Haz un reset completo:
```bash
docker compose down -v
docker compose up
```

### No tengo git instalado
Descárgalo en https://git-scm.com/ o descarga el ZIP del repo directamente desde GitHub.

---

## Servicios disponibles

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | App principal |
| **API** | http://localhost:3001/api/health | Backend REST |
| **pgAdmin** | http://localhost:5050 | Interfaz visual de la BD |

pgAdmin → Email: `admin@globalgemba.com` · Password: `admin123`

---

## Estructura del proyecto

```
appGlobalGemba/
├── back/
│   ├── database/
│   │   ├── schema.sql       ← Esquema de PostgreSQL
│   │   ├── seed.sql         ← Datos de prueba
│   │   ├── fix_passwords.sql← Corrección de contraseñas
│   │   └── init_all.sql     ← Script de inicialización completo
│   └── src/
│       ├── config/db.js     ← Conexión a PostgreSQL
│       ├── middleware/auth.js← JWT + control de roles
│       └── routes/          ← auth, usuarios, fichajes, vacaciones, tareas
└── front/appGlobalGemba/    ← App React + Vite
    └── src/
        ├── components/      ← Login, Dashboard, Vacaciones, Perfiles...
        ├── api.js           ← Llamadas al backend
        └── App.jsx
```

---

## API — Endpoints principales

> Todas las rutas marcadas con 🔒 requieren `Authorization: Bearer <token>`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login → devuelve JWT | ❌ |
| GET | `/api/usuarios/me` | Mi perfil | 🔒 |
| GET | `/api/fichajes` | Mis fichajes | 🔒 |
| POST | `/api/fichajes/entrada` | Registrar entrada | 🔒 |
| PUT | `/api/fichajes/:id/salida` | Registrar salida | 🔒 |
| GET | `/api/vacaciones` | Mis solicitudes | 🔒 |
| POST | `/api/vacaciones` | Nueva solicitud | 🔒 |
| GET | `/api/tareas` | Mis tareas | 🔒 |

---

## Equipo

| Área | Tarea | Responsable | Estado |
|------|-------|-------------|--------|
| **Backend** | Base de datos (schema + seed) | Marco | ✅ Completo |
| **Backend** | API REST (Express + JWT) | Todos | ✅ Completo |
| **Frontend** | Login | Álvaro | 🔧 En curso |
| **Frontend** | Dashboard / Calendario / Fichajes | Rodrigo + David | 🔧 En curso |
| **Frontend** | Vacaciones | Roberto | 🔧 En curso |
| **Frontend** | Perfiles / Ajustes | Jorge | 🔧 En curso |
| **Admin** | Gestión y reporting | (pendiente) | ⏳ Pendiente |
