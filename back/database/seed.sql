-- ============================================================
-- GlobalGemba - Datos de prueba (seed)
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- ============================================================
-- DEPARTAMENTOS de ejemplo
-- ============================================================
INSERT INTO departamentos (nombre) VALUES
    ('Ingeniería'),
    ('Recursos Humanos'),
    ('Operaciones'),
    ('Marketing');

-- ============================================================
-- USUARIOS de ejemplo
-- Contraseña para todos: "GlobalGemba2024!"
-- Hash de ejemplo (bcrypt rounds=12) - reemplazar en producción
-- ============================================================
INSERT INTO usuarios (nombre, apellidos, email, password_hash, fecha_nacimiento, departamento_id, rol_id, activo)
VALUES
    -- Admin
    ('Admin',    'Sistema',      'admin@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly001',
     '1985-01-15',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'admin'),
     TRUE),

    -- Jefes de departamento
    ('Carlos',   'Rodríguez',   'carlos.rodriguez@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly002',
     '1980-03-22',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'jefe'),
     TRUE),

    ('Laura',    'Martínez',    'laura.martinez@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly003',
     '1982-07-10',
     (SELECT id FROM departamentos WHERE nombre = 'Recursos Humanos'),
     (SELECT id FROM roles WHERE nombre = 'jefe'),
     TRUE),

    -- Empleados
    ('Álvaro',   'García',      'alvaro.garcia@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly004',
     '1995-11-05',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'empleado'),
     TRUE),

    ('Rodrigo',  'López',       'rodrigo.lopez@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly005',
     '1997-04-18',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'empleado'),
     TRUE),

    ('Roberto',  'Sánchez',     'roberto.sanchez@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly006',
     '1993-09-30',
     (SELECT id FROM departamentos WHERE nombre = 'Operaciones'),
     (SELECT id FROM roles WHERE nombre = 'empleado'),
     TRUE),

    ('Jorge',    'Fernández',   'jorge.fernandez@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly007',
     '1996-12-14',
     (SELECT id FROM departamentos WHERE nombre = 'Marketing'),
     (SELECT id FROM roles WHERE nombre = 'empleado'),
     TRUE),

    ('David',    'Pérez',       'david.perez@globalgemba.com',
     '$2b$12$examplehashfordemopurposesonly008',
     '1994-06-21',
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'),
     (SELECT id FROM roles WHERE nombre = 'empleado'),
     TRUE);

-- ============================================================
-- Asignar jefes a departamentos
-- ============================================================
UPDATE departamentos SET jefe_id = (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com')
    WHERE nombre = 'Ingeniería';

UPDATE departamentos SET jefe_id = (SELECT id FROM usuarios WHERE email = 'laura.martinez@globalgemba.com')
    WHERE nombre = 'Recursos Humanos';

-- ============================================================
-- HORARIOS de ejemplo (lunes a viernes, 9:00-18:00)
-- ============================================================
INSERT INTO horarios (usuario_id, hora_entrada, hora_salida, dias_semana)
SELECT id, '09:00', '18:00', ARRAY[1,2,3,4,5]
FROM usuarios
WHERE activo = TRUE;

-- ============================================================
-- FESTIVOS 2024 (España - nacionales)
-- ============================================================
INSERT INTO festivos (fecha, descripcion, nacional) VALUES
    ('2024-01-01', 'Año Nuevo',                             TRUE),
    ('2024-01-06', 'Epifanía del Señor (Reyes Magos)',      TRUE),
    ('2024-03-29', 'Viernes Santo',                         TRUE),
    ('2024-04-01', 'Lunes de Pascua',                       FALSE),
    ('2024-05-01', 'Fiesta del Trabajo',                    TRUE),
    ('2024-08-15', 'Asunción de la Virgen',                 TRUE),
    ('2024-10-12', 'Fiesta Nacional de España',             TRUE),
    ('2024-11-01', 'Todos los Santos',                      TRUE),
    ('2024-12-06', 'Día de la Constitución Española',       TRUE),
    ('2024-12-08', 'Inmaculada Concepción',                 TRUE),
    ('2024-12-25', 'Navidad',                               TRUE);

-- ============================================================
-- TAREAS de ejemplo
-- ============================================================
INSERT INTO tareas (titulo, descripcion, estado, prioridad, fecha_limite, creado_por, departamento_id)
VALUES
    ('Diseño esquema BD',
     'Crear y documentar el esquema PostgreSQL del sistema GlobalGemba',
     'en_progreso', 'alta', '2024-04-20',
     (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com'),
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería')),

    ('Implementar login',
     'Pantalla de autenticación con JWT y bcrypt',
     'pendiente', 'alta', '2024-04-25',
     (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com'),
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería')),

    ('Módulo vacaciones',
     'CRUD de solicitudes de vacaciones con flujo de aprobación',
     'pendiente', 'media', '2024-05-10',
     (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com'),
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería')),

    ('Dashboard calendario',
     'Pantalla principal con registro de jornada laboral y calendario',
     'pendiente', 'alta', '2024-05-01',
     (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@globalgemba.com'),
     (SELECT id FROM departamentos WHERE nombre = 'Ingeniería'));

-- ============================================================
-- ASIGNACIÓN DE TAREAS
-- ============================================================
-- Diseño esquema BD → David
INSERT INTO tareas_usuarios (tarea_id, usuario_id)
    SELECT t.id, u.id FROM tareas t, usuarios u
    WHERE t.titulo = 'Diseño esquema BD'
      AND u.email  = 'david.perez@globalgemba.com';

-- Login → Álvaro
INSERT INTO tareas_usuarios (tarea_id, usuario_id)
    SELECT t.id, u.id FROM tareas t, usuarios u
    WHERE t.titulo = 'Implementar login'
      AND u.email  = 'alvaro.garcia@globalgemba.com';

-- Vacaciones → Roberto
INSERT INTO tareas_usuarios (tarea_id, usuario_id)
    SELECT t.id, u.id FROM tareas t, usuarios u
    WHERE t.titulo = 'Módulo vacaciones'
      AND u.email  = 'roberto.sanchez@globalgemba.com';

-- Dashboard calendario → Rodrigo + David
INSERT INTO tareas_usuarios (tarea_id, usuario_id)
    SELECT t.id, u.id FROM tareas t, usuarios u
    WHERE t.titulo = 'Dashboard calendario'
      AND u.email IN ('rodrigo.lopez@globalgemba.com', 'david.perez@globalgemba.com');
