// ─────────────────────────────────────────────────────
// api.js — Capa de servicio centralizada
// Todas las llamadas al backend pasan por aquí
// ─────────────────────────────────────────────────────

const BASE_URL = '/api'; // usa el proxy de Vite → http://localhost:3001

/** Devuelve las cabeceras comunes con el token JWT si existe */
function getHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

/** Helper genérico para todas las peticiones */
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ─────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────

/** POST /api/auth/login — devuelve { token, usuario } */
export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** POST /api/auth/logout */
export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

// ─────────────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────────────

/** GET /api/usuarios/me — datos del usuario autenticado + horario */
export function getMe() {
  return request('/usuarios/me');
}

/** GET /api/usuarios — lista todos (admin/jefe) */
export function getUsuarios() {
  return request('/usuarios');
}

/** GET /api/usuarios/departamentos — lista de departamentos */
export function getDepartamentos() {
  return request('/usuarios/departamentos');
}

/** POST /api/usuarios — crear nuevo empleado (admin) */
export function crearUsuario(data) {
  return request('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** PUT /api/usuarios/:id — actualizar datos */
export function updateUsuario(id, data) {
  return request(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** PATCH /api/usuarios/:id/toggle-activo — bloquear/activar (admin) */
export function toggleActivoUsuario(id) {
  return request(`/usuarios/${id}/toggle-activo`, { method: 'PATCH' });
}

// ─────────────────────────────────────────────────────
// FICHAJES
// ─────────────────────────────────────────────────────

/** GET /api/fichajes?mes=YYYY-MM — fichajes del usuario autenticado */
export function getFichajes(mes) {
  const query = mes ? `?mes=${mes}` : '';
  return request(`/fichajes${query}`);
}

/** GET /api/fichajes/activo — fichaje abierto (o null) */
export function getFichajeActivo() {
  return request('/fichajes/activo');
}

/** POST /api/fichajes/entrada — body: { tipo } */
export function registrarEntrada(tipo = 'normal') {
  return request('/fichajes/entrada', {
    method: 'POST',
    body: JSON.stringify({ tipo }),
  });
}

/** PUT /api/fichajes/:id/salida — body: { pausa_minutos } */
export function registrarSalida(id, pausa_minutos = 0) {
  return request(`/fichajes/${id}/salida`, {
    method: 'PUT',
    body: JSON.stringify({ pausa_minutos }),
  });
}

// ─────────────────────────────────────────────────────
// VACACIONES
// ─────────────────────────────────────────────────────

/** GET /api/vacaciones?estado=X */
export function getVacaciones(estado) {
  const query = estado ? `?estado=${estado}` : '';
  return request(`/vacaciones${query}`);
}

/** POST /api/vacaciones — body: { fecha_inicio, fecha_fin } */
export function solicitarVacaciones(fecha_inicio, fecha_fin) {
  return request('/vacaciones', {
    method: 'POST',
    body: JSON.stringify({ fecha_inicio, fecha_fin }),
  });
}

/** DELETE /api/vacaciones/:id */
export function cancelarVacaciones(id) {
  return request(`/vacaciones/${id}`, { method: 'DELETE' });
}

/** PUT /api/vacaciones/:id/aprobar — (admin/jefe) */
export function aprobarVacaciones(id) {
  return request(`/vacaciones/${id}/aprobar`, { method: 'PUT' });
}

/** PUT /api/vacaciones/:id/rechazar — body: { motivo_rechazo? } (admin/jefe) */
export function rechazarVacaciones(id, motivo_rechazo = '') {
  return request(`/vacaciones/${id}/rechazar`, {
    method: 'PUT',
    body: JSON.stringify({ motivo_rechazo }),
  });
}

// ─────────────────────────────────────────────────────
// TAREAS
// ─────────────────────────────────────────────────────

/** GET /api/tareas?estado=X */
export function getTareas(estado) {
  const query = estado ? `?estado=${estado}` : '';
  return request(`/tareas${query}`);
}
