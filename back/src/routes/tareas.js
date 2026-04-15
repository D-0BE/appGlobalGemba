const express = require('express');
const pool    = require('../config/db');
const { verificarToken, requireRol } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

// ─────────────────────────────────────────────
// GET /api/tareas
// Empleado: tareas asignadas a él
// Jefe/admin: todas las tareas de su departamento (o todas)
// Query params: ?estado=pendiente|en_progreso|completada|cancelada
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { estado } = req.query;
  const esJefeOAdmin = ['jefe', 'admin'].includes(req.usuario.rol);

  try {
    let query;
    const params = [];

    if (esJefeOAdmin) {
      query = `
        SELECT t.id, t.titulo, t.descripcion, t.estado, t.prioridad,
               t.fecha_limite, t.created_at,
               d.nombre AS departamento,
               u.nombre || ' ' || u.apellidos AS creado_por,
               ARRAY_AGG(DISTINCT emp.nombre || ' ' || emp.apellidos) AS asignados
        FROM tareas t
        LEFT JOIN departamentos  d ON d.id = t.departamento_id
        LEFT JOIN usuarios       u ON u.id = t.creado_por
        LEFT JOIN tareas_usuarios tu ON tu.tarea_id = t.id
        LEFT JOIN usuarios       emp ON emp.id = tu.usuario_id
      `;
      if (estado) {
        params.push(estado);
        query += ` WHERE t.estado = $${params.length}`;
      }
      query += ` GROUP BY t.id, d.nombre, u.nombre, u.apellidos ORDER BY t.created_at DESC`;
    } else {
      params.push(req.usuario.id);
      query = `
        SELECT t.id, t.titulo, t.descripcion, t.estado, t.prioridad,
               t.fecha_limite, t.created_at,
               d.nombre AS departamento,
               u.nombre || ' ' || u.apellidos AS creado_por
        FROM tareas t
        JOIN tareas_usuarios tu ON tu.tarea_id = t.id AND tu.usuario_id = $1
        LEFT JOIN departamentos d ON d.id = t.departamento_id
        LEFT JOIN usuarios      u ON u.id = t.creado_por
      `;
      if (estado) {
        params.push(estado);
        query += ` WHERE t.estado = $${params.length}`;
      }
      query += ` ORDER BY t.fecha_limite ASC NULLS LAST`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /tareas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// GET /api/tareas/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.titulo, t.descripcion, t.estado, t.prioridad,
              t.fecha_limite, t.created_at,
              d.nombre AS departamento,
              u.nombre || ' ' || u.apellidos AS creado_por,
              ARRAY_AGG(DISTINCT emp.nombre || ' ' || emp.apellidos) AS asignados
       FROM tareas t
       LEFT JOIN departamentos  d ON d.id = t.departamento_id
       LEFT JOIN usuarios       u ON u.id = t.creado_por
       LEFT JOIN tareas_usuarios tu ON tu.tarea_id = t.id
       LEFT JOIN usuarios       emp ON emp.id = tu.usuario_id
       WHERE t.id = $1
       GROUP BY t.id, d.nombre, u.nombre, u.apellidos`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en GET /tareas/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// POST /api/tareas  (jefe / admin)
// Body: { titulo, descripcion?, prioridad?, fecha_limite?, departamento_id?, usuario_ids? }
// ─────────────────────────────────────────────
router.post('/', requireRol('jefe', 'admin'), async (req, res) => {
  const { titulo, descripcion, prioridad = 'media', fecha_limite, departamento_id, usuario_ids = [] } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: 'El título es obligatorio' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tareaResult = await client.query(
      `INSERT INTO tareas (titulo, descripcion, prioridad, fecha_limite, creado_por, departamento_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [titulo, descripcion || null, prioridad, fecha_limite || null, req.usuario.id, departamento_id || null]
    );

    const tarea = tareaResult.rows[0];

    // Asignar usuarios si se proporcionan
    for (const uid of usuario_ids) {
      await client.query(
        `INSERT INTO tareas_usuarios (tarea_id, usuario_id) VALUES ($1, $2)`,
        [tarea.id, uid]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(tarea);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /tareas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/tareas/:id
// Empleado: solo puede cambiar el estado de sus tareas
// Jefe/admin: puede cambiar cualquier campo
// Body: { estado?, titulo?, descripcion?, prioridad?, fecha_limite? }
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { estado, titulo, descripcion, prioridad, fecha_limite } = req.body;
  const esJefeOAdmin = ['jefe', 'admin'].includes(req.usuario.rol);

  try {
    // Verificar acceso: empleado solo puede editar sus tareas
    if (!esJefeOAdmin) {
      const asignado = await pool.query(
        `SELECT 1 FROM tareas_usuarios WHERE tarea_id = $1 AND usuario_id = $2`,
        [req.params.id, req.usuario.id]
      );
      if (!asignado.rows[0]) {
        return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
      }
    }

    const result = await pool.query(
      `UPDATE tareas
       SET estado       = COALESCE($1, estado),
           titulo       = COALESCE($2, titulo),
           descripcion  = COALESCE($3, descripcion),
           prioridad    = COALESCE($4, prioridad),
           fecha_limite = COALESCE($5, fecha_limite)
       WHERE id = $6
       RETURNING *`,
      [estado, esJefeOAdmin ? titulo : null, esJefeOAdmin ? descripcion : null,
       esJefeOAdmin ? prioridad : null, esJefeOAdmin ? fecha_limite : null, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /tareas/:id:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
