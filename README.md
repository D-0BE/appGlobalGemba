# GlobalGemba 🌍

Sistema de gestión de empleados: fichajes, vacaciones, tareas e informes.

---

## Estructura del proyecto

```
appGlobalGemba/
├── back/
│   ├── database/
│   │   ├── schema.sql          ← Esquema completo de PostgreSQL
│   │   └── seed.sql            ← Datos de prueba (equipo + tareas)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           ← Conexión a PostgreSQL (pg Pool)
│   │   ├── middleware/
│   │   │   └── auth.js         ← Verificación de JWT + control de roles
│   │   ├── routes/
│   │   │   ├── auth.js         ← POST /login · POST /logout
│   │   │   ├── usuarios.js     ← GET /me · GET /:id · PUT /:id · GET /
│   │   │   ├── fichajes.js     ← GET · GET /activo · POST /entrada · PUT /:id/salida
│   │   │   ├── vacaciones.js   ← GET · POST · PUT /aprobar · PUT /rechazar · DELETE
│   │   │   └── tareas.js       ← GET · GET /:id · POST · PUT /:id
│   │   └── index.js            ← Entry point Express
│   ├── .env                    ← Variables de entorno locales (NO subir a git)
│   ├── .env.example            ← Plantilla de variables de entorno
│   ├── .gitignore
│   ├── package.json
│   └── docker-compose.yml
└── front/
    └── appGlobalGemba/         ← App React + Vite
        └── src/
            ├── components/
            │   ├── Login.jsx
            │   ├── Dashboard.jsx
            │   ├── Vacaciones.jsx
            │   └── Perfiles.jsx
            └── App.jsx
```

---

## Base de datos

### Tablas

| Tabla             | Descripción                                       |
|-------------------|---------------------------------------------------|
| `roles`           | admin · jefe · empleado                           |
| `departamentos`   | Unidades organizativas con jefe asignado          |
| `usuarios`        | Empleados con rol, departamento y foto            |
| `horarios`        | Franjas horarias por usuario y días de la semana  |
| `fichajes`        | Entrada/salida con tipo (normal/teletrabajo/viaje) |
| `vacaciones`      | Solicitudes con flujo pendiente→aprobado/rechazado |
| `festivos`        | Días festivos nacionales y locales                |
| `tareas`          | Tareas con estado, prioridad y fecha límite       |
| `tareas_usuarios` | Asignación N:M de tareas a empleados              |
| `informes`        | Informes de actividad vinculados a tareas         |

### Diagrama de relaciones

```
roles ──── usuarios ──── departamentos
               │               │
           horarios         tareas ──── tareas_usuarios
           fichajes             │
           vacaciones       informes
```

---

## Levantar el entorno

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución
- [Node.js](https://nodejs.org/) v18+

---

### 1. Base de datos (PostgreSQL + pgAdmin)

```bash
cd back
docker-compose up -d
```

| Parámetro | Valor             |
|-----------|-------------------|
| Host      | `localhost`       |
| Puerto    | `5432`            |
| BD        | `globalgemba`     |
| Usuario   | `gemba_user`      |
| Password  | `gemba_pass_dev`  |

**pgAdmin** → [http://localhost:5050](http://localhost:5050)
- Email: `admin@globalgemba.com` · Password: `admin123`
- Conectar servidor: `Host: postgres` · Puerto: `5432` · User: `gemba_user`

```bash
# Ver logs
docker-compose logs -f postgres

# Parar
docker-compose down

# Reset completo (borra datos)
docker-compose down -v
```

---

### 2. API — Node.js + Express

```bash
cd back

# Primera vez: instalar dependencias
npm install

# Crear fichero de entorno local (solo la primera vez)
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux

# Arrancar en modo desarrollo (con hot-reload)
npm run dev
```

La API queda disponible en **http://localhost:3001**

Verificar que funciona:
```
GET http://localhost:3001/api/health
→ { "status": "ok", "timestamp": "..." }
```

---

### 3. Frontend — React + Vite

```bash
cd front/appGlobalGemba

# Primera vez
npm install

# Arrancar
npm run dev
```

El frontend queda disponible en **http://localhost:5173**

---

## API — Endpoints

> Todas las rutas marcadas con 🔒 requieren cabecera `Authorization: Bearer <token>`

### Autenticación
| Método | Ruta               | Descripción             | Auth |
|--------|--------------------|-------------------------|------|
| POST   | `/api/auth/login`  | Login → devuelve JWT    | ❌   |
| POST   | `/api/auth/logout` | Cierra sesión           | 🔒   |

### Usuarios
| Método | Ruta                  | Descripción                         | Auth       |
|--------|-----------------------|-------------------------------------|------------|
| GET    | `/api/usuarios/me`    | Perfil del usuario autenticado      | 🔒         |
| GET    | `/api/usuarios/:id`   | Perfil de cualquier usuario         | 🔒         |
| PUT    | `/api/usuarios/:id`   | Actualizar perfil (propio o admin)  | 🔒         |
| GET    | `/api/usuarios`       | Listar todos los usuarios           | 🔒 jefe/admin |

### Fichajes
| Método | Ruta                       | Descripción                          | Auth |
|--------|----------------------------|--------------------------------------|------|
| GET    | `/api/fichajes`             | Mis fichajes (`?mes=YYYY-MM`)        | 🔒   |
| GET    | `/api/fichajes/activo`      | Fichaje abierto actualmente          | 🔒   |
| POST   | `/api/fichajes/entrada`     | Registrar entrada (`tipo` opcional)  | 🔒   |
| PUT    | `/api/fichajes/:id/salida`  | Registrar salida                     | 🔒   |

### Vacaciones
| Método | Ruta                            | Descripción                        | Auth          |
|--------|---------------------------------|------------------------------------|---------------|
| GET    | `/api/vacaciones`               | Mis solicitudes (`?estado=...`)    | 🔒            |
| POST   | `/api/vacaciones`               | Nueva solicitud                    | 🔒            |
| PUT    | `/api/vacaciones/:id/aprobar`   | Aprobar solicitud                  | 🔒 jefe/admin |
| PUT    | `/api/vacaciones/:id/rechazar`  | Rechazar solicitud                 | 🔒 jefe/admin |
| DELETE | `/api/vacaciones/:id`           | Cancelar solicitud pendiente propia| 🔒            |

### Tareas
| Método | Ruta              | Descripción                            | Auth          |
|--------|-------------------|----------------------------------------|---------------|
| GET    | `/api/tareas`     | Mis tareas (`?estado=...`)             | 🔒            |
| GET    | `/api/tareas/:id` | Detalle de una tarea                   | 🔒            |
| POST   | `/api/tareas`     | Crear tarea (con asignación)           | 🔒 jefe/admin |
| PUT    | `/api/tareas/:id` | Actualizar tarea / cambiar estado      | 🔒            |

---

## Variables de entorno

El fichero `.env.example` contiene la plantilla. Cópialo a `.env` en tu máquina local:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=globalgemba
DB_USER=gemba_user
DB_PASSWORD=gemba_pass_dev
JWT_SECRET=cambia_esto_en_produccion
PORT=3001
```

> ⚠️ El `.env` está en `.gitignore` y **nunca debe subirse al repositorio**.  
> El `.env.example` sí sube a git y sirve de documentación para el equipo.

---

## Equipo

| Área         | Tarea                             | Responsable     | Estado       |
|--------------|-----------------------------------|-----------------|--------------|
| **Backend**  | Base de datos (schema + seed)     | David           | ✅ Completo  |
| **Backend**  | API REST (Express + JWT)          | Todos           | ✅ Completo  |
| **Frontend** | Login                             | Álvaro          | 🔧 En curso  |
| **Frontend** | Dashboard / Calendario / Fichajes | Rodrigo + David | 🔧 En curso  |
| **Frontend** | Vacaciones                        | Roberto         | 🔧 En curso  |
| **Frontend** | Perfiles / Ajustes                | Jorge           | 🔧 En curso  |
| **Admin**    | Gestión y reporting               | (pendiente)     | ⏳ Pendiente |
