require('dotenv').config();
const express    = require('express');
const cors       = require('cors');

// ── Rutas ──────────────────────────────────────
const authRoutes      = require('./routes/auth');
const usuariosRoutes  = require('./routes/usuarios');
const fichajesRoutes  = require('./routes/fichajes');
const vacacionesRoutes = require('./routes/vacaciones');
const tareasRoutes    = require('./routes/tareas');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware global ──────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Permitir: sin origin (Postman, curl), localhost y cualquier IP de red local
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.match(/^http:\/\/192\.168\.\d+\.\d+/)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ── Health check ───────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rutas de la API ────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/usuarios',   usuariosRoutes);
app.use('/api/fichajes',   fichajesRoutes);
app.use('/api/vacaciones', vacacionesRoutes);
app.use('/api/tareas',     tareasRoutes);

// ── 404 ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Error handler global ───────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Arrancar servidor ──────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API GlobalGemba corriendo en http://localhost:${PORT}`);
});
