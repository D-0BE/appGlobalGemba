const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    // Buscar usuario con su rol
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.apellidos, u.email, u.password_hash,
              u.foto_url, u.departamento_id, u.activo,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id:             user.id,
        nombre:         user.nombre,
        apellidos:      user.apellidos,
        email:          user.email,
        rol:            user.rol,
        foto_url:       user.foto_url,
        departamento_id: user.departamento_id,
      },
    });
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/logout
// (el cliente simplemente elimina el token)
// ─────────────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.json({ message: 'Sesión cerrada correctamente' });
});

module.exports = router;
