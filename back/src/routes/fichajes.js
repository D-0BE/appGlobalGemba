const express = require('express');
const pool    = require('../config/db');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.use(verificarToken);

// ─────────────────────────────────────────────
// GET /api/fichajes
// Devuelve los fichajes del usuario autenticado
// Query params opcionales: ?mes=2024-05
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { mes } = req.query; // formato: YYYY-MM

  try {
    let query = `
      SELECT id, entrada, salida, pausa_minutos, tipo, estado, created_at
      FROM fichajes
      WHERE usuario_id = $1
    `;
    const params = [req.usuario.id];

    if (mes) {
      query += ` AND TO_CHAR(entrada, 'YYYY-MM') = $2`;
      params.push(mes);
    }

    query += ` ORDER BY entrada DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /fichajes:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// POST /api/fichajes/entrada
// Registra la entrada. Solo si no hay fichaje abierto.
// Body: { tipo? }  → 'normal' | 'teletrabajo' | 'viaje'
// ─────────────────────────────────────────────
router.post('/entrada', async (req, res) => {
  const { tipo = 'normal' } = req.body;
  const tiposValidos = ['normal', 'teletrabajo', 'viaje'];

  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `Tipo inválido. Debe ser: ${tiposValidos.join(', ')}` });
  }

  try {
    // Comprobar si ya hay fichaje abierto
    const abierto = await pool.query(
      `SELECT id FROM fichajes WHERE usuario_id = $1 AND estado = 'abierto'`,
      [req.usuario.id]
    );

    if (abierto.rows.length > 0) {
      return res.status(409).json({ error: 'Ya tienes un fichaje abierto. Ciérralo antes de fichar entrada.' });
    }

    const result = await pool.query(
      `INSERT INTO fichajes (usuario_id, tipo, estado)
       VALUES ($1, $2, 'abierto')
       RETURNING *`,
      [req.usuario.id, tipo]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error en POST /fichajes/entrada:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/fichajes/:id/salida
// Registra la salida del fichaje indicado
// Body: { pausa_minutos? }
// ─────────────────────────────────────────────
router.put('/:id/salida', async (req, res) => {
  const { pausa_minutos = 0 } = req.body;

  try {
    // Verificar que el fichaje pertenece al usuario
    const fichaje = await pool.query(
      `SELECT * FROM fichajes WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );

    if (!fichaje.rows[0]) {
      return res.status(404).json({ error: 'Fichaje no encontrado' });
    }

    if (fichaje.rows[0].estado === 'cerrado') {
      return res.status(409).json({ error: 'Este fichaje ya está cerrado' });
    }

    const result = await pool.query(
      `UPDATE fichajes
       SET salida         = NOW(),
           pausa_minutos  = $1,
           estado         = 'cerrado'
       WHERE id = $2
       RETURNING *`,
      [pausa_minutos, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /fichajes/:id/salida:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// GET /api/fichajes/activo
// Devuelve el fichaje abierto del usuario (si existe)
// ─────────────────────────────────────────────
router.get('/activo', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM fichajes WHERE usuario_id = $1 AND estado = 'abierto' LIMIT 1`,
      [req.usuario.id]
    );

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error('Error en GET /fichajes/activo:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
