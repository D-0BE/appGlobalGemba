-- ============================================================
-- init_all.sql — Script idempotente (se puede ejecutar N veces)
-- Carga schema + datos + contraseñas correctas
-- ============================================================

-- Forzar codificación UTF-8 para caracteres especiales (ñ, á, é, etc.)
SET client_encoding = 'UTF8';

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Roles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO roles (nombre) VALUES ('admin'), ('jefe'), ('empleado')
ON CONFLICT (nombre) DO NOTHING;

-- ── Departamentos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departamentos (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre  VARCHAR(100) UNIQUE NOT NULL,
    jefe_id UUID
);
INSERT INTO departamentos (nombre) VALUES
    ('Ingeniería'), ('Recursos Humanos'), ('Operaciones'), ('Marketing')
ON CONFLICT (nombre) DO NOTHING;

-- ── Usuarios ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre                    VARCHAR(100) NOT NULL,
    primer_apellido           VARCHAR(100) NOT NULL,
    segundo_apellido          VARCHAR(100),
    dni                       VARCHAR(20),
    nacionalidad              VARCHAR(100),
    telefono                  VARCHAR(20),
    email                     VARCHAR(255) UNIQUE NOT NULL,
    email_personal            VARCHAR(255),
    password_hash             VARCHAR(255) NOT NULL,
    fecha_nacimiento          DATE,
    fecha_incorporacion       DATE,
    dias_vacaciones_curso     INTEGER DEFAULT 22,
    dias_vacaciones_anterior  INTEGER DEFAULT 0,
    departamento_id           UUID REFERENCES departamentos(id),
    rol_id                    INTEGER REFERENCES roles(id),
    activo                    BOOLEAN DEFAULT TRUE,
    foto_url                  TEXT,
    created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Hash de GlobalGemba2026! (bcrypt rounds=12)
INSERT INTO usuarios (nombre, primer_apellido, email, password_hash, fecha_nacimiento, departamento_id, rol_id, activo)
VALUES
    ('Admin', 'Sistema', 'admin@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1985-01-15',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'admin'), TRUE),

    ('Carlos', 'Rodríguez', 'carlos.rodriguez@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1980-03-22',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'jefe'), TRUE),

    ('Laura', 'Martínez', 'laura.martinez@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1982-07-10',
     (SELECT id FROM departamentos WHERE nombre = 'Recursos Humanos'),
     (SELECT id FROM roles WHERE nombre = 'jefe'), TRUE),

    ('Álvaro', 'García', 'alvaro.garcia@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1995-11-05',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'empleado'), TRUE),

    ('Rodrigo', 'López', 'rodrigo.lopez@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1997-04-18',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'empleado'), TRUE),

    ('Roberto', 'Sánchez', 'roberto.sanchez@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1993-09-30',
     (SELECT id FROM departamentos WHERE nombre = 'Operaciones'),
     (SELECT id FROM roles WHERE nombre = 'empleado'), TRUE),

    ('Jorge', 'Fernández', 'jorge.fernandez@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1996-12-14',
     (SELECT id FROM departamentos WHERE nombre = 'Marketing'),
     (SELECT id FROM roles WHERE nombre = 'empleado'), TRUE),

    ('David', 'Pérez', 'david.perez@globalgemba.com',
     '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C',
     '1994-06-21',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'empleado'), TRUE)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash;

-- ── FK jefe de departamento ───────────────────────────────────
ALTER TABLE departamentos
    ADD COLUMN IF NOT EXISTS jefe_id UUID REFERENCES usuarios(id);

UPDATE departamentos SET jefe_id = (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com')
    WHERE nombre = 'Ingeniería' AND jefe_id IS NULL;
UPDATE departamentos SET jefe_id = (SELECT id FROM usuarios WHERE email = 'laura.martinez@globalgemba.com')
    WHERE nombre = 'Recursos Humanos' AND jefe_id IS NULL;

-- ── Tablas restantes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS horarios (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    hora_entrada TIME NOT NULL,
    hora_salida  TIME NOT NULL,
    dias_semana  INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    tipo_jornada VARCHAR(10) DEFAULT 'TOTAL'
);
INSERT INTO horarios (usuario_id, hora_entrada, hora_salida, dias_semana, tipo_jornada)
SELECT id, '09:00', '19:00', ARRAY[1,2,3,4,5], 'TOTAL' FROM usuarios
WHERE activo = TRUE
  AND id NOT IN (SELECT usuario_id FROM horarios);

CREATE TABLE IF NOT EXISTS fichajes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id     UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    entrada        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    salida         TIMESTAMPTZ,
    pausa_minutos  INTEGER DEFAULT 0,
    tipo           VARCHAR(20) DEFAULT 'normal',
    estado         VARCHAR(20) DEFAULT 'abierto',
    notas          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vacaciones (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin    DATE NOT NULL,
    estado       VARCHAR(20) DEFAULT 'pendiente',
    comentario   TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS festivos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha       DATE UNIQUE NOT NULL,
    descripcion VARCHAR(200),
    nacional    BOOLEAN DEFAULT TRUE
);
INSERT INTO festivos (fecha, descripcion, nacional) VALUES
    ('2024-01-01','Año Nuevo',TRUE),
    ('2024-01-06','Reyes Magos',TRUE),
    ('2024-03-29','Viernes Santo',TRUE),
    ('2024-05-01','Fiesta del Trabajo',TRUE),
    ('2024-08-15','Asunción de la Virgen',TRUE),
    ('2024-10-12','Fiesta Nacional de España',TRUE),
    ('2024-11-01','Todos los Santos',TRUE),
    ('2024-12-06','Día de la Constitución',TRUE),
    ('2024-12-25','Navidad',TRUE)
ON CONFLICT (fecha) DO NOTHING;

CREATE TABLE IF NOT EXISTS tareas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo         VARCHAR(200) NOT NULL,
    descripcion    TEXT,
    estado         VARCHAR(30) DEFAULT 'pendiente',
    prioridad      VARCHAR(20) DEFAULT 'media',
    fecha_limite   DATE,
    creado_por     UUID REFERENCES usuarios(id),
    departamento_id UUID REFERENCES departamentos(id),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tareas_usuarios (
    tarea_id   UUID REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (tarea_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS informes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    tipo       VARCHAR(50),
    datos      JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tareas de ejemplo
INSERT INTO tareas (titulo, descripcion, estado, prioridad, fecha_limite, creado_por, departamento_id)
SELECT 'Diseño esquema BD', 'Crear y documentar el esquema PostgreSQL', 'en_progreso', 'alta', '2026-06-20',
    (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com'),
    (SELECT id FROM departamentos WHERE nombre = 'Ingeniería')
WHERE NOT EXISTS (SELECT 1 FROM tareas WHERE titulo = 'Diseño esquema BD');

INSERT INTO tareas (titulo, descripcion, estado, prioridad, fecha_limite, creado_por, departamento_id)
SELECT 'Implementar login', 'Pantalla de autenticación con JWT', 'completada', 'alta', '2026-05-30',
    (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com'),
    (SELECT id FROM departamentos WHERE nombre = 'Ingeniería')
WHERE NOT EXISTS (SELECT 1 FROM tareas WHERE titulo = 'Implementar login');

INSERT INTO tareas (titulo, descripcion, estado, prioridad, fecha_limite, creado_por, departamento_id)
SELECT 'Módulo vacaciones', 'CRUD de solicitudes de vacaciones', 'pendiente', 'media', '2026-07-10',
    (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com'),
    (SELECT id FROM departamentos WHERE nombre = 'Ingeniería')
WHERE NOT EXISTS (SELECT 1 FROM tareas WHERE titulo = 'Módulo vacaciones');
