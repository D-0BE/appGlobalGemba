const express = require('express');
const pool    = require('../config/db');
const { verificarToken, requireRol } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren token
router.use(verificarToken);

// ─────────────────────────────────────────────
// GET /api/usuarios/me
// Datos del usuario autenticado
// ─────────────────────────────────────────────
router.get('/me', async (req, res) => {
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
// PUT /api/usuarios/:id
// Solo el propio usuario o un admin puede actualizar
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const esPropio = req.usuario.id === req.params.id;
  const esAdmin  = req.usuario.rol === 'admin';

  if (!esPropio && !esAdmin) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const { nombre, apellidos, fecha_nacimiento, foto_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre           = COALESCE($1, nombre),
           apellidos        = COALESCE($2, apellidos),
           fecha_nacimiento = COALESCE($3, fecha_nacimiento),
           foto_url         = COALESCE($4, foto_url)
       WHERE id = $5
       RETURNING id, nombre, apellidos, email, fecha_nacimiento, foto_url`,
      [nombre, apellidos, fecha_nacimiento, foto_url, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /usuarios/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// GET /api/usuarios  (solo admin/jefe)
// Lista todos los usuarios
// ─────────────────────────────────────────────
router.get('/', requireRol('admin', 'jefe'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.apellidos, u.email, u.activo, u.created_at,
              r.nombre AS rol,
              d.nombre AS departamento
       FROM usuarios u
       JOIN roles        r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       ORDER BY u.apellidos, u.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /usuarios:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
