import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFichajes, getMisVacaciones, getTareas, getMe } from '../api';
import './Reporting.css';

// ── Helpers ──────────────────────────────────────────────────

/** Calcula las horas trabajadas de un fichaje cerrado */
function calcularHoras(fichaje) {
    if (!fichaje.salida) return 0;
    const entrada = new Date(fichaje.entrada);
    const salida  = new Date(fichaje.salida);
    const minutos = (salida - entrada) / 60000 - (fichaje.pausa_minutos || 0);
    return Math.max(0, minutos / 60);
}

/** Formato "HH:mm" */
function formatHora(fechaStr) {
    return new Date(fechaStr).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Formato "dd/mm/yyyy" */
function formatFecha(fechaStr) {
    return new Date(fechaStr).toLocaleDateString('es-ES');
}

/** YYYY-MM del Date actual */
function getMesKey(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${mm}`;
}

/** Nombre largo del mes */
function nombreMes(mesKey) {
    const [y, m] = mesKey.split('-');
    return new Date(y, m - 1, 1).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
    });
}

const PRIORIDAD_COLOR = {
    alta:   '#ef4444',
    media:  '#f59e0b',
    baja:   '#22c55e',
};

const ESTADO_TAREA_COLOR = {
    pendiente:   '#94a3b8',
    en_progreso: '#3b82f6',
    completada:  '#22c55e',
    cancelada:   '#ef4444',
};

// ── Componente ───────────────────────────────────────────────

export default function Reporting() {
    const [usuario, setUsuario]   = useState(null);
    const [fichajes, setFichajes] = useState([]);
    const [vacaciones, setVacaciones] = useState([]);
    const [tareas, setTareas]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    // Mes seleccionado (YYYY-MM)
    const [mes, setMes] = useState(() => getMesKey(new Date()));

    // ── Carga de datos ──────────────────────────────────────
    const cargarDatos = useCallback(async (mesKey) => {
        setLoading(true);
        setError('');
        try {
            const [me, fichs, vacs, tars] = await Promise.all([
                getMe(),
                getFichajes(mesKey),
                getMisVacaciones(),   // siempre solo las del usuario actual
                getTareas(),
            ]);
            setUsuario(me);
            setFichajes(fichs || []);
            setVacaciones(vacs || []);
            setTareas(tars || []);
        } catch (err) {
            setError(err.message || 'Error al cargar los datos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { cargarDatos(mes); }, [mes, cargarDatos]);

    // ── Métricas calculadas ─────────────────────────────────
    const metricas = useMemo(() => {
        const cerrados = fichajes.filter((f) => f.estado === 'cerrado');
        const totalHoras = cerrados.reduce((acc, f) => acc + calcularHoras(f), 0);
        const diasTrabajados = cerrados.length;

        // Solo vacaciones del usuario actual (getMisVacaciones ya filtra, pero por seguridad)
        const misVacs     = usuario ? vacaciones.filter((v) => !v.usuario_id || v.usuario_id === usuario.id) : vacaciones;
        const vacAprobadas = misVacs.filter((v) => v.estado === 'aprobado');
        const diasVacaciones = vacAprobadas.reduce((acc, v) => {
            const ini = new Date(v.fecha_inicio);
            const fin = new Date(v.fecha_fin);
            const diff = Math.round((fin - ini) / 86400000) + 1;
            return acc + diff;
        }, 0);

        const vacPendientes = misVacs.filter((v) => v.estado === 'pendiente').length;
        const tareasCompletadas = tareas.filter((t) => t.estado === 'completada').length;
        const tareasPendientes  = tareas.filter((t) => t.estado === 'pendiente' || t.estado === 'en_progreso').length;

        // Usar dias_vacaciones_curso del perfil (o 22 por defecto)
        const diasAsignados = usuario?.dias_vacaciones_curso ?? 22;

        return {
            totalHoras: totalHoras.toFixed(1),
            diasTrabajados,
            diasVacaciones,
            diasDisponibles: diasAsignados - diasVacaciones,
            diasAsignados,
            vacPendientes,
            tareasCompletadas,
            tareasPendientes,
        };
    }, [fichajes, vacaciones, tareas, usuario]);

    // ── Navegación de mes ───────────────────────────────────
    const cambiarMes = (delta) => {
        const [y, m] = mes.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        setMes(getMesKey(d));
    };

    // ── Render ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="rep-container">
                <div className="rep-loading">
                    <div className="rep-spinner" />
                    <p>Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rep-container">
                <p className="rep-error">{error}</p>
            </div>
        );
    }

    return (
        <div className="rep-container">

            {/* ── Cabecera ── */}
            <div className="rep-header">
                <div>
                    <h2 className="rep-title">Reporting Personal</h2>
                    {usuario && (
                        <p className="rep-subtitle">
                            {usuario.nombre} {usuario.primer_apellido} {usuario.segundo_apellido || ''}
                            {usuario.departamento && <span className="rep-badge">{usuario.departamento}</span>}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Tarjetas de métricas ── */}
            <div className="rep-cards">
                <div className="rep-card rep-card--blue">
                    <div className="rep-card__value">{metricas.totalHoras}h</div>
                    <div className="rep-card__label">Horas trabajadas</div>
                    <div className="rep-card__sub">{nombreMes(mes)}</div>
                </div>
                <div className="rep-card rep-card--green">
                    <div className="rep-card__value">{metricas.diasTrabajados}</div>
                    <div className="rep-card__label">Días fichados</div>
                    <div className="rep-card__sub">{nombreMes(mes)}</div>
                </div>
                <div className="rep-card rep-card--purple">
                    <div className="rep-card__value">{metricas.diasDisponibles}</div>
                    <div className="rep-card__label">Vacaciones disponibles</div>
                    <div className="rep-card__sub">
                        {metricas.diasAsignados} asignados · {metricas.diasVacaciones} tomados · {metricas.vacPendientes} pendientes
                    </div>
                </div>
                <div className="rep-card rep-card--orange">
                    <div className="rep-card__value">{metricas.tareasCompletadas}</div>
                    <div className="rep-card__label">Tareas completadas</div>
                    <div className="rep-card__sub">{metricas.tareasPendientes} en curso / pendientes</div>
                </div>
            </div>

            {/* ── Sección fichajes ── */}
            <div className="rep-section">
                <div className="rep-section__header">
                    <h3 className="rep-section__title">Fichajes del mes</h3>
                    <div className="rep-month-nav">
                        <button type="button" onClick={() => cambiarMes(-1)}>&#8592;</button>
                        <span className="rep-month-label">{nombreMes(mes)}</span>
                        <button type="button" onClick={() => cambiarMes(1)}>&#8594;</button>
                    </div>
                </div>

                {fichajes.length === 0 ? (
                    <p className="rep-empty">No hay fichajes registrados en {nombreMes(mes)}.</p>
                ) : (
                    <div className="rep-table-wrap">
                        <table className="rep-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Entrada</th>
                                    <th>Salida</th>
                                    <th>Pausa</th>
                                    <th>Horas netas</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fichajes.map((f) => {
                                    const horas = calcularHoras(f);
                                    return (
                                        <tr key={f.id}>
                                            <td>{formatFecha(f.entrada)}</td>
                                            <td>{formatHora(f.entrada)}</td>
                                            <td>{f.salida ? formatHora(f.salida) : <span className="rep-open-badge">abierto</span>}</td>
                                            <td>{f.pausa_minutos || 0} min</td>
                                            <td><strong>{horas > 0 ? `${horas.toFixed(1)}h` : '—'}</strong></td>
                                            <td>
                                                <span className={`rep-tipo rep-tipo--${f.tipo}`}>
                                                    {f.tipo === 'teletrabajo' ? 'Teletrabajo'
                                                     : f.tipo === 'viaje' ? 'Viaje'
                                                     : 'Normal'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`rep-estado rep-estado--${f.estado}`}>
                                                    {f.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="4"><strong>Total</strong></td>
                                    <td colSpan="3"><strong>{metricas.totalHoras}h</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Sección tareas ── */}
            <div className="rep-section">
                <div className="rep-section__header">
                    <h3 className="rep-section__title">Mis tareas</h3>
                </div>

                {tareas.length === 0 ? (
                    <p className="rep-empty">No tienes tareas asignadas.</p>
                ) : (
                    <div className="rep-tareas-grid">
                        {tareas.map((t) => (
                            <div key={t.id} className="rep-tarea-card">
                                <div className="rep-tarea-card__top">
                                    <span
                                        className="rep-tarea-prioridad"
                                        style={{ background: PRIORIDAD_COLOR[t.prioridad] || '#94a3b8' }}
                                    >
                                        {t.prioridad}
                                    </span>
                                    <span
                                        className="rep-tarea-estado"
                                        style={{ color: ESTADO_TAREA_COLOR[t.estado] || '#94a3b8' }}
                                    >
                                        ● {t.estado.replace('_', ' ')}
                                    </span>
                                </div>
                                <h4 className="rep-tarea-titulo">{t.titulo}</h4>
                                {t.descripcion && (
                                    <p className="rep-tarea-desc">{t.descripcion}</p>
                                )}
                                <div className="rep-tarea-footer">
                                    {t.departamento && <span>{t.departamento}</span>}
                                    {t.fecha_limite && (
                                        <span>Límite: {formatFecha(t.fecha_limite)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Sección vacaciones ── */}
            <div className="rep-section">
                <div className="rep-section__header">
                    <h3 className="rep-section__title">Solicitudes de vacaciones</h3>
                </div>

                {vacaciones.length === 0 ? (
                    <p className="rep-empty">No tienes solicitudes de vacaciones.</p>
                ) : (
                    <div className="rep-table-wrap">
                        <table className="rep-table">
                            <thead>
                                <tr>
                                    <th>Desde</th>
                                    <th>Hasta</th>
                                    <th>Días</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vacaciones.map((v) => {
                                    const ini = new Date(v.fecha_inicio);
                                    const fin = new Date(v.fecha_fin);
                                    const dias = Math.round((fin - ini) / 86400000) + 1;
                                    return (
                                        <tr key={v.id}>
                                            <td>{formatFecha(v.fecha_inicio)}</td>
                                            <td>{formatFecha(v.fecha_fin)}</td>
                                            <td>{dias}</td>
                                            <td>
                                                <span className={`rep-estado rep-estado--${v.estado}`}>
                                                    {v.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
