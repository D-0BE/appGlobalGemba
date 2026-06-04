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
      `SELECT u.id, u.nombre, u.apellidos, u.email, u.fecha_nacimiento,
              u.foto_url, u.activo, u.created_at,
              r.nombre  AS rol,
              d.nombre  AS departamento,
              u.departamento_id,
              h.hora_entrada,
              h.hora_salida,
              h.dias_semana
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
// Lista todos los usuarios
// ─────────────────────────────────────────────
router.get('/', requireRol('admin', 'jefe'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.apellidos, u.email, u.activo, u.created_at,
              r.nombre AS rol,
              d.nombre AS departamento,
              u.departamento_id,
              u.rol_id
       FROM usuarios u
       JOIN roles        r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       ORDER BY u.activo DESC, u.apellidos, u.nombre`
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
      `SELECT u.id, u.nombre, u.apellidos, u.email, u.fecha_nacimiento,
              u.foto_url, u.activo, u.created_at,
              r.nombre  AS rol,
              d.nombre  AS departamento,
              u.departamento_id
       FROM usuarios u
       JOIN roles        r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
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
// Body: { nombre, apellidos, email, password, rol, departamento_id? }
// ─────────────────────────────────────────────
router.post('/', requireRol('admin'), async (req, res) => {
  const { nombre, apellidos, email, password, rol, departamento_id } = req.body;

  if (!nombre || !apellidos || !email || !password || !rol) {
    return res.status(400).json({ error: 'nombre, apellidos, email, password y rol son obligatorios' });
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
      `INSERT INTO usuarios (nombre, apellidos, email, password_hash, departamento_id, rol_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, apellidos, email, activo, created_at`,
      [nombre, apellidos, email, passwordHash, departamento_id || null, rolResult.rows[0].id]
    );

    // Crear horario por defecto (lun-vie, 09:00-18:00)
    await pool.query(
      `INSERT INTO horarios (usuario_id, hora_entrada, hora_salida, dias_semana)
       VALUES ($1, '09:00', '18:00', ARRAY[1,2,3,4,5])`,
      [result.rows[0].id]
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
       RETURNING id, nombre, apellidos, email, activo`,
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
// Admin: puede cambiar nombre, apellidos, email, rol, departamento, foto
// Empleado: solo puede cambiar sus propios datos básicos
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const esPropio = req.usuario.id === req.params.id;
  const esAdmin  = req.usuario.rol === 'admin';

  if (!esPropio && !esAdmin) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const { nombre, apellidos, fecha_nacimiento, foto_url, email, rol, departamento_id } = req.body;

  try {
    let rolId = undefined;

    // Si el admin quiere cambiar el rol, buscar el id por nombre
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
      `UPDATE usuarios
       SET nombre           = COALESCE($1, nombre),
           apellidos        = COALESCE($2, apellidos),
           fecha_nacimiento = COALESCE($3, fecha_nacimiento),
           foto_url         = COALESCE($4, foto_url),
           email            = CASE WHEN $5::text IS NOT NULL AND $6 THEN $5::text ELSE email END,
           rol_id           = CASE WHEN $7::text IS NOT NULL AND $6 THEN $7::uuid ELSE rol_id END,
           departamento_id  = CASE WHEN $8::text IS NOT NULL AND $6 THEN $8::uuid ELSE departamento_id END
       WHERE id = $9
       RETURNING id, nombre, apellidos, email, fecha_nacimiento, foto_url, activo`,
      [
        nombre,
        apellidos,
        fecha_nacimiento,
        foto_url,
        email || null,
        esAdmin,
        rolId ? rolId.toString() : null,
        departamento_id || null,
        req.params.id
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
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
