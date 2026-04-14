# GlobalGemba 🌍

Sistema de gestión de empleados: fichajes, vacaciones, tareas e informes.

---

## Estructura del proyecto

```
appGlobalGemba/
├── database/
│   ├── schema.sql   ← Esquema completo de PostgreSQL
│   └── seed.sql     ← Datos de prueba (equipo + tareas)
├── docker-compose.yml
└── README.md
```

---

## Base de datos

### Tablas

| Tabla            | Descripción                                      |
|------------------|--------------------------------------------------|
| `roles`          | admin · jefe · empleado                          |
| `departamentos`  | Unidades organizativas con jefe asignado         |
| `usuarios`       | Empleados con rol, departamento y foto           |
| `horarios`       | Franjas horarias por usuario y días de la semana |
| `fichajes`       | Entrada/salida con tipo (normal/teletrabajo/viaje)|
| `vacaciones`     | Solicitudes con flujo pendiente→aprobado/rechazado|
| `festivos`       | Días festivos nacionales y locales               |
| `tareas`         | Tareas con estado, prioridad y fecha límite      |
| `tareas_usuarios`| Asignación N:M de tareas a empleados            |
| `informes`       | Informes de actividad vinculados a tareas        |

### Diagrama de relaciones

```
roles ──── usuarios ──── departamentos
               │               │
           horarios         tareas ──── tareas_usuarios
           fichajes             │
           vacaciones       informes
```

---

## Levantar la base de datos

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución

### Comandos

```bash
# Levantar PostgreSQL + pgAdmin
docker-compose up -d

# Ver logs
docker-compose logs -f postgres

# Parar
docker-compose down

# Parar y borrar datos (reset completo)
docker-compose down -v
```

### Cadena de conexión

```
Host:     localhost
Puerto:   5432
DB:       globalgemba
Usuario:  gemba_user
Password: gemba_pass_dev
```

### pgAdmin (interfaz web)

Accede a **http://localhost:5050**  
- Email: `admin@globalgemba.com`  
- Password: `admin123`

Para conectar el servidor en pgAdmin:  
`Host: postgres` · `Puerto: 5432` · `User: gemba_user`

---

## Variables de entorno (`.env`)

Crea un archivo `.env` en la raíz para el backend:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=globalgemba
DB_USER=gemba_user
DB_PASSWORD=gemba_pass_dev
JWT_SECRET=cambia_esto_en_produccion
```

---

## Equipo

| Área       | Tarea                                | Responsable       |
|------------|--------------------------------------|-------------------|
| **Backend**| Estructura del proyecto              | Todos             |
| **Backend**| Base de datos                        | David             |
| **Frontend**| Login                               | Álvaro            |
| **Frontend**| Dashboard / Calendario / Fichajes   | Rodrigo + David   |
| **Frontend**| Vacaciones                          | Roberto           |
| **Frontend**| Perfiles / Ajustes                  | Jorge             |
| **Admin**  | Gestión y reporting                  | (pendiente)       |
