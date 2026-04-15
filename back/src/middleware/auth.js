const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el JWT en la cabecera Authorization.
 * Si es válido, inyecta req.usuario con { id, rol }.
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, email, rol }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware de autorización por rol.
 * Uso: requireRol('admin', 'jefe')
 */
function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No autorizado para esta acción' });
    }
    next();
  };
}

module.exports = { verificarToken, requireRol };
