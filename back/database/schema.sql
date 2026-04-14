-- ============================================================
-- GlobalGemba - Esquema de base de datos PostgreSQL
-- Rama: feature/database-schema
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

INSERT INTO roles (nombre, descripcion) VALUES
    ('admin',      'Acceso total al sistema'),
    ('jefe',       'Aprueba vacaciones y gestiona su equipo'),
    ('empleado',   'Acceso estándar de trabajador');

-- ============================================================
-- DEPARTAMENTOS
-- ============================================================
CREATE TABLE departamentos (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre   VARCHAR(100) NOT NULL UNIQUE,
    jefe_id  UUID  -- FK añadida después de crear usuarios
);

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE usuarios (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre           VARCHAR(100) NOT NULL,
    apellidos        VARCHAR(150) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    foto_url         VARCHAR(500),
    departamento_id  UUID REFERENCES departamentos(id) ON DELETE SET NULL,
    rol_id           UUID NOT NULL REFERENCES roles(id),
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FK circular: jefe del departamento es un usuario
ALTER TABLE departamentos
    ADD CONSTRAINT fk_departamentos_jefe
    FOREIGN KEY (jefe_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ============================================================
-- HORARIOS
-- Días de la semana: 1=lunes ... 7=domingo
-- ============================================================
CREATE TABLE horarios (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    hora_entrada TIME NOT NULL,
    hora_salida  TIME NOT NULL,
    dias_semana  SMALLINT[] NOT NULL,  -- ej: {1,2,3,4,5}
    CONSTRAINT chk_horas CHECK (hora_salida > hora_entrada)
);

-- ============================================================
-- FICHAJES
-- tipo:   'normal' | 'teletrabajo' | 'viaje'
-- estado: 'abierto' | 'cerrado'
-- ============================================================
CREATE TABLE fichajes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    entrada         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    salida          TIMESTAMP WITH TIME ZONE,
    pausa_minutos   SMALLINT NOT NULL DEFAULT 0,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'normal',
    estado          VARCHAR(10) NOT NULL DEFAULT 'abierto',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_tipo   CHECK (tipo   IN ('normal', 'teletrabajo', 'viaje')),
    CONSTRAINT chk_estado CHECK (estado IN ('abierto', 'cerrado')),
    CONSTRAINT chk_salida CHECK (salida IS NULL OR salida > entrada),
    CONSTRAINT chk_pausa  CHECK (pausa_minutos >= 0)
);

-- ============================================================
-- VACACIONES
-- estado: 'pendiente' | 'aprobado' | 'rechazado'
-- ============================================================
CREATE TABLE vacaciones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE NOT NULL,
    estado          VARCHAR(15) NOT NULL DEFAULT 'pendiente',
    aprobado_por    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo_rechazo  TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_estado_vac  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    CONSTRAINT chk_fechas_vac  CHECK (fecha_fin >= fecha_inicio)
);

-- ============================================================
-- FESTIVOS
-- ============================================================
CREATE TABLE festivos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha       DATE         NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    nacional    BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_festivo_fecha UNIQUE (fecha)
);

-- ============================================================
-- TAREAS
-- estado:   'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
-- prioridad: 'baja' | 'media' | 'alta'
-- ============================================================
CREATE TABLE tareas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    estado          VARCHAR(15)  NOT NULL DEFAULT 'pendiente',
    prioridad       VARCHAR(10)  NOT NULL DEFAULT 'media',
    fecha_limite    DATE,
    creado_por      UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_estado_tarea    CHECK (estado    IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
    CONSTRAINT chk_prioridad_tarea CHECK (prioridad IN ('baja', 'media', 'alta'))
);

-- ============================================================
-- TAREAS_USUARIOS  (tabla intermedia: asignación individual)
-- ============================================================
CREATE TABLE tareas_usuarios (
    tarea_id    UUID NOT NULL REFERENCES tareas(id)    ON DELETE CASCADE,
    usuario_id  UUID NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
    PRIMARY KEY (tarea_id, usuario_id)
);

-- ============================================================
-- INFORMES DE ACTIVIDAD
-- ============================================================
CREATE TABLE informes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id    UUID NOT NULL REFERENCES tareas(id)   ON DELETE CASCADE,
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido   TEXT NOT NULL,
    archivo_url VARCHAR(500),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Fichajes: consultas frecuentes por usuario y rango de fechas
CREATE INDEX idx_fichajes_usuario      ON fichajes (usuario_id);
CREATE INDEX idx_fichajes_entrada      ON fichajes (entrada);
CREATE INDEX idx_fichajes_usuario_mes  ON fichajes (usuario_id, DATE_TRUNC('month', entrada));

-- Vacaciones: filtrar por usuario y estado
CREATE INDEX idx_vacaciones_usuario    ON vacaciones (usuario_id);
CREATE INDEX idx_vacaciones_estado     ON vacaciones (estado);

-- Tareas: filtrar por estado, prioridad y departamento
CREATE INDEX idx_tareas_estado         ON tareas (estado);
CREATE INDEX idx_tareas_departamento   ON tareas (departamento_id);
CREATE INDEX idx_tareas_creado_por     ON tareas (creado_por);

-- Usuarios: búsquedas por departamento y rol
CREATE INDEX idx_usuarios_departamento ON usuarios (departamento_id);
CREATE INDEX idx_usuarios_rol          ON usuarios (rol_id);
