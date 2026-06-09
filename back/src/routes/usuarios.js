const express = require('express');
const bcrypt  = require('bcryptjs');
const pool    = require('../config/db');
const { verificarToken, requireRol } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren token
router.use(verificarToken);

// ─────────────────────────────────────────────
// GET /api/usuarios/me
// Datos del usuario autenticado + su horario
// ─────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido,
              u.dni, u.nacionalidad, u.telefono,
              u.email, u.email_personal,
              u.fecha_nacimiento, u.fecha_incorporacion,
              u.dias_vacaciones_curso, u.dias_vacaciones_anterior,
              u.foto_url, u.activo, u.created_at,
              r.nombre  AS rol,
              d.nombre  AS departamento,
              u.departamento_id,
              h.hora_entrada, h.hora_salida,
              h.dias_semana, h.tipo_jornada
       FROM usuarios u
       JOIN roles        r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       LEFT JOIN horarios h ON h.usuario_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [req.usuario.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en GET /me:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// GET /api/usuarios/departamentos
// Lista de departamentos (para formularios)
// ─────────────────────────────────────────────
router.get('/departamentos', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre FROM departamentos ORDER BY nombre`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /departamentos:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// GET /api/usuarios  (solo admin/jefe)
// Lista todos los usuarios con todos sus campos
// ─────────────────────────────────────────────
router.get('/', requireRol('admin', 'jefe'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido,
              u.dni, u.nacionalidad, u.telefono,
              u.email, u.email_personal,
              u.fecha_nacimiento, u.fecha_incorporacion,
              u.dias_vacaciones_curso, u.dias_vacaciones_anterior,
              u.foto_url, u.activo, u.created_at,
              r.nombre AS rol,
              d.nombre AS departamento,
              u.departamento_id, u.rol_id,
              h.hora_entrada, h.hora_salida,
              h.dias_semana, h.tipo_jornada
       FROM usuarios u
       JOIN roles        r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       LEFT JOIN horarios h ON h.usuario_id = u.id
       ORDER BY u.activo DESC, u.primer_apellido, u.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /usuarios:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// GET /api/usuarios/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.primer_apellido, u.segundo_apellido,
              u.dni, u.nacionalidad, u.telefono,
              u.email, u.email_personal,
              u.fecha_nacimiento, u.fecha_incorporacion,
              u.dias_vacaciones_curso, u.dias_vacaciones_anterior,
              u.foto_url, u.activo, u.created_at,
              r.nombre  AS rol,
              d.nombre  AS departamento,
              u.departamento_id,
              h.hora_entrada, h.hora_salida,
              h.dias_semana, h.tipo_jornada
       FROM usuarios u
       JOIN roles        r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       LEFT JOIN horarios h ON h.usuario_id = u.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en GET /usuarios/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// POST /api/usuarios  (solo admin)
// Crear un nuevo empleado
// ─────────────────────────────────────────────
router.post('/', requireRol('admin'), async (req, res) => {
  const {
    nombre, primer_apellido, segundo_apellido,
    dni, nacionalidad, telefono,
    email, email_personal, password, rol,
    fecha_nacimiento, fecha_incorporacion,
    dias_vacaciones_curso, dias_vacaciones_anterior,
    departamento_id, foto_url,
    tipo_jornada, hora_entrada, hora_salida,
  } = req.body;

  if (!nombre || !primer_apellido || !email || !password || !rol) {
    return res.status(400).json({ error: 'nombre, primer_apellido, email, password y rol son obligatorios' });
  }

  try {
    // Buscar rol por nombre
    const rolResult = await pool.query(
      'SELECT id FROM roles WHERE nombre = $1', [rol]
    );
    if (!rolResult.rows[0]) {
      return res.status(400).json({ error: `Rol "${rol}" no válido. Usa: admin, jefe o empleado` });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO usuarios (
         nombre, primer_apellido, segundo_apellido,
         dni, nacionalidad, telefono,
         email, email_personal, password_hash,
         fecha_nacimiento, fecha_incorporacion,
         dias_vacaciones_curso, dias_vacaciones_anterior,
         departamento_id, rol_id, foto_url
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id, nombre, primer_apellido, segundo_apellido, email, activo, created_at`,
      [
        nombre, primer_apellido, segundo_apellido || null,
        dni || null, nacionalidad || null, telefono || null,
        email, email_personal || null, passwordHash,
        fecha_nacimiento || null, fecha_incorporacion || null,
        dias_vacaciones_curso ?? 22, dias_vacaciones_anterior ?? 0,
        departamento_id || null, rolResult.rows[0].id, foto_url || null,
      ]
    );

    // Crear horario por defecto
    await pool.query(
      `INSERT INTO horarios (usuario_id, hora_entrada, hora_salida, dias_semana, tipo_jornada)
       VALUES ($1, $2, $3, ARRAY[1,2,3,4,5], $4)`,
      [
        result.rows[0].id,
        hora_entrada || '09:00',
        hora_salida  || '19:00',
        tipo_jornada || 'TOTAL',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    console.error('Error en POST /usuarios:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/usuarios/:id/toggle-activo  (solo admin)
// Bloquear o activar un usuario (sin eliminar)
// ─────────────────────────────────────────────
router.patch('/:id/toggle-activo', requireRol('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET activo = NOT activo
       WHERE id = $1
       RETURNING id, nombre, primer_apellido, email, activo`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PATCH /usuarios/:id/toggle-activo:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/usuarios/:id
// Admin: puede cambiar cualquier campo
// Empleado: solo puede cambiar sus propios datos básicos
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const esPropio = req.usuario.id === req.params.id;
  const esAdmin  = req.usuario.rol === 'admin';

  if (!esPropio && !esAdmin) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const {
    nombre, primer_apellido, segundo_apellido,
    dni, nacionalidad, telefono,
    email, email_personal,
    fecha_nacimiento, fecha_incorporacion,
    dias_vacaciones_curso, dias_vacaciones_anterior,
    foto_url, rol, departamento_id,
    tipo_jornada, hora_entrada, hora_salida,
  } = req.body;

  try {
    let rolId = undefined;

    if (esAdmin && rol) {
      const rolResult = await pool.query(
        'SELECT id FROM roles WHERE nombre = $1', [rol]
      );
      if (!rolResult.rows[0]) {
        return res.status(400).json({ error: `Rol "${rol}" no válido` });
      }
      rolId = rolResult.rows[0].id;
    }

    const result = await pool.query(
      `UPDATE usuarios SET
         nombre                   = COALESCE($1,  nombre),
         primer_apellido          = COALESCE($2,  primer_apellido),
         segundo_apellido         = COALESCE($3,  segundo_apellido),
         dni                      = COALESCE($4,  dni),
         nacionalidad             = COALESCE($5,  nacionalidad),
         telefono                 = COALESCE($6,  telefono),
         email_personal           = COALESCE($7,  email_personal),
         fecha_nacimiento         = COALESCE($8,  fecha_nacimiento),
         fecha_incorporacion      = COALESCE($9,  fecha_incorporacion),
         dias_vacaciones_curso    = COALESCE($10, dias_vacaciones_curso),
         dias_vacaciones_anterior = COALESCE($11, dias_vacaciones_anterior),
         foto_url                 = COALESCE($12, foto_url),
         email = CASE WHEN $13::text IS NOT NULL AND $14 THEN $13::text ELSE email END,
         rol_id = CASE WHEN $15::text IS NOT NULL AND $14 THEN $15::uuid ELSE rol_id END,
         departamento_id = CASE WHEN $16::text IS NOT NULL AND $14 THEN $16::uuid ELSE departamento_id END
       WHERE id = $17
       RETURNING id, nombre, primer_apellido, segundo_apellido, email, fecha_nacimiento, fecha_incorporacion, foto_url, activo`,
      [
        nombre, primer_apellido, segundo_apellido ?? null,
        dni ?? null, nacionalidad ?? null, telefono ?? null,
        email_personal ?? null,
        fecha_nacimiento ?? null, fecha_incorporacion ?? null,
        dias_vacaciones_curso ?? null, dias_vacaciones_anterior ?? null,
        foto_url ?? null,
        email || null,
        esAdmin,
        rolId ? rolId.toString() : null,
        departamento_id || null,
        req.params.id,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar horario si se proporcionaron datos
    if (tipo_jornada || hora_entrada || hora_salida) {
      await pool.query(
        `UPDATE horarios SET
           tipo_jornada = COALESCE($1, tipo_jornada),
           hora_entrada = COALESCE($2::time, hora_entrada),
           hora_salida  = COALESCE($3::time, hora_salida)
         WHERE usuario_id = $4`,
        [tipo_jornada || null, hora_entrada || null, hora_salida || null, req.params.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    console.error('Error en PUT /usuarios/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
