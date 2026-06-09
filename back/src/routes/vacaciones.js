const express = require('express');
const pool    = require('../config/db');
const { verificarToken, requireRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

// ─────────────────────────────────────────────
// GET /api/vacaciones
// Empleado: sus propias solicitudes
// Jefe/admin: todas las solicitudes
// ?propio=true  → forzar filtro por usuario actual (cualquier rol)
// ?estado=X     → filtrar por estado
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { estado, propio } = req.query;
  const esJefeOAdmin = ['jefe', 'admin'].includes(req.usuario.rol);
  const filtrarPorPropio = !esJefeOAdmin || propio === 'true';

  try {
    let query = `
      SELECT v.id, v.usuario_id, v.fecha_inicio, v.fecha_fin, v.estado,
             v.motivo_rechazo, v.created_at,
             u.nombre || ' ' || u.primer_apellido AS empleado,
             ap.nombre || ' ' || ap.primer_apellido AS aprobado_por_nombre
      FROM vacaciones v
      JOIN usuarios u ON u.id = v.usuario_id
      LEFT JOIN usuarios ap ON ap.id = v.aprobado_por
    `;
    const params = [];

    if (filtrarPorPropio) {
      params.push(req.usuario.id);
      query += ` WHERE v.usuario_id = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      query += ` ${params.length === 1 ? 'WHERE' : 'AND'} v.estado = $${params.length}`;
    }

    query += ` ORDER BY v.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /vacaciones:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// POST /api/vacaciones
// Solicitar vacaciones
// Body: { fecha_inicio, fecha_fin }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.body;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'fecha_inicio y fecha_fin son obligatorios' });
  }

  if (new Date(fecha_fin) < new Date(fecha_inicio)) {
    return res.status(400).json({ error: 'fecha_fin no puede ser anterior a fecha_inicio' });
  }

  try {
    const solapamiento = await pool.query(
      `SELECT id FROM vacaciones
       WHERE usuario_id = $1
         AND estado IN ('pendiente', 'aprobado', 'cancelacion_pendiente')
         AND (fecha_inicio, fecha_fin) OVERLAPS ($2::date, $3::date)`,
      [req.usuario.id, fecha_inicio, fecha_fin]
    );

    if (solapamiento.rows.length > 0) {
      return res.status(409).json({ error: 'Ya tienes una solicitud que se solapa con esas fechas' });
    }

    const result = await pool.query(
      `INSERT INTO vacaciones (usuario_id, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.usuario.id, fecha_inicio, fecha_fin]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error en POST /vacaciones:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/vacaciones/:id/aprobar   (jefe / admin)
// Aprobar una solicitud pendiente
// ─────────────────────────────────────────────
router.put('/:id/aprobar', requireRol('jefe', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE vacaciones
       SET estado = 'aprobado', aprobado_por = $1, motivo_rechazo = NULL
       WHERE id = $2 AND estado = 'pendiente'
       RETURNING *`,
      [req.usuario.id, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /vacaciones/:id/aprobar:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/vacaciones/:id/rechazar   (jefe / admin)
// Rechazar una solicitud pendiente
// Body: { motivo_rechazo? }
// ─────────────────────────────────────────────
router.put('/:id/rechazar', requireRol('jefe', 'admin'), async (req, res) => {
  const { motivo_rechazo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE vacaciones
       SET estado = 'rechazado', aprobado_por = $1, motivo_rechazo = $2
       WHERE id = $3 AND estado = 'pendiente'
       RETURNING *`,
      [req.usuario.id, motivo_rechazo || null, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /vacaciones/:id/rechazar:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/vacaciones/:id/solicitar-cancelacion
// Empleado solicita cancelar una vacación aprobada
// → pasa a estado 'cancelacion_pendiente'
// ─────────────────────────────────────────────
router.put('/:id/solicitar-cancelacion', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE vacaciones
       SET estado = 'cancelacion_pendiente'
       WHERE id = $1 AND usuario_id = $2 AND estado = 'aprobado'
       RETURNING *`,
      [req.params.id, req.usuario.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no está aprobada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /vacaciones/:id/solicitar-cancelacion:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/vacaciones/:id/aprobar-cancelacion   (jefe / admin)
// Admin aprueba la cancelación → elimina el registro
// ─────────────────────────────────────────────
router.put('/:id/aprobar-cancelacion', requireRol('jefe', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM vacaciones
       WHERE id = $1 AND estado = 'cancelacion_pendiente'
       RETURNING id`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no está pendiente de cancelación' });
    }

    res.json({ message: 'Cancelación aprobada y vacaciones eliminadas.' });
  } catch (err) {
    console.error('Error en PUT /vacaciones/:id/aprobar-cancelacion:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/vacaciones/:id/rechazar-cancelacion   (jefe / admin)
// Admin rechaza la cancelación → vuelve a 'aprobado'
// Body: { motivo_rechazo? }
// ─────────────────────────────────────────────
router.put('/:id/rechazar-cancelacion', requireRol('jefe', 'admin'), async (req, res) => {
  const { motivo_rechazo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vacaciones
       SET estado = 'aprobado', motivo_rechazo = $1
       WHERE id = $2 AND estado = 'cancelacion_pendiente'
       RETURNING *`,
      [motivo_rechazo || null, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no está pendiente de cancelación' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /vacaciones/:id/rechazar-cancelacion:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/vacaciones/:id
// Solo para cancelar solicitudes en estado 'pendiente' directamente
// (sin aprobación — las aprobadas deben usar solicitar-cancelacion)
// Admin puede cancelar cualquiera directamente
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const esJefeOAdmin = ['jefe', 'admin'].includes(req.usuario.rol);
  try {
    let result;
    if (esJefeOAdmin) {
      result = await pool.query(
        `DELETE FROM vacaciones
         WHERE id = $1 AND estado IN ('pendiente', 'aprobado', 'cancelacion_pendiente')
         RETURNING id`,
        [req.params.id]
      );
    } else {
      // Empleado solo cancela directamente las 'pendiente'
      result = await pool.query(
        `DELETE FROM vacaciones
         WHERE id = $1 AND usuario_id = $2 AND estado = 'pendiente'
         RETURNING id`,
        [req.params.id, req.usuario.id]
      );
    }

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no cancelable directamente' });
    }

    res.json({ message: 'Solicitud cancelada correctamente' });
  } catch (err) {
    console.error('Error en DELETE /vacaciones/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
