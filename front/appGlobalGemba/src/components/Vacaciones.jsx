import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    getVacaciones, solicitarVacaciones, cancelarVacaciones,
    aprobarVacaciones, rechazarVacaciones,
} from '../api';
import './Vacaciones.css';

const VACATION_ALLOWANCE = 22;

const getDateKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
};

const formatDateShort = (date) =>
    new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
    });

const formatDateLong = (date) =>
    new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

const formatMonthYear = (date) =>
    new Date(date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

const getMonthCalendar = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let week = Array(7).fill(null);
    const startIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let index = 0; index < startIndex; index += 1) week[index] = null;

    for (let day = 1; day <= daysInMonth; day += 1) {
        const position = (startIndex + day - 1) % 7;
        week[position] = new Date(year, month, day);
        if (position === 6 || day === daysInMonth) {
            weeks.push(week);
            week = Array(7).fill(null);
        }
    }
    return weeks;
};

function expandirRango(fechaInicio, fechaFin) {
    const dias = [];
    const start = new Date(fechaInicio);
    const end   = new Date(fechaFin);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const cur = new Date(start);
    while (cur <= end) {
        dias.push(getDateKey(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return dias;
}

function Vacaciones() {
    // Rol del usuario actual
    const userRol = localStorage.getItem('role') || '';
    const esAdmin = userRol === 'admin' || userRol === 'jefe';

    const [monthDate, setMonthDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });

    const [solicitudes, setSolicitudes]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [actionError, setActionError]   = useState('');
    const [actionOk, setActionOk]         = useState('');
    const [showAssigned, setShowAssigned] = useState(false);

    // Estado para el rechazo con motivo
    const [rechazandoId, setRechazandoId] = useState(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const monthCalendar = useMemo(() => getMonthCalendar(monthDate), [monthDate]);

    // ── Cargar solicitudes ────────────────────────────
    const cargarSolicitudes = useCallback(async () => {
        try {
            const data = await getVacaciones();
            setSolicitudes(data || []);
        } catch {
            // silencioso
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { cargarSolicitudes(); }, [cargarSolicitudes]);

    // ── Mapas de días (solo para las solicitudes propias del empleado) ──
    const userEmail = (() => {
        try { return JSON.parse(localStorage.getItem('user'))?.email; } catch { return null; }
    })();

    const misSolicitudes = useMemo(() =>
        esAdmin ? solicitudes : solicitudes,
    [solicitudes, esAdmin]);

    // Para el calendario mostramos solo las solicitudes del usuario actual
    const misSolicitudesCalendario = useMemo(() => {
        if (!esAdmin) return solicitudes;
        // Admin: mostrar sus propias en el calendario
        try {
            const yo = JSON.parse(localStorage.getItem('user'));
            if (!yo) return [];
            return solicitudes.filter((s) => s.empleado === `${yo.nombre} ${yo.apellidos}`);
        } catch { return []; }
    }, [solicitudes, esAdmin]);

    const { diasAprobados, diasPendientes } = useMemo(() => {
        const aprobados  = new Set();
        const pendientes = new Set();
        misSolicitudesCalendario.forEach((s) => {
            const dias = expandirRango(s.fecha_inicio, s.fecha_fin);
            if (s.estado === 'aprobado')  dias.forEach((d) => aprobados.add(d));
            else if (s.estado === 'pendiente') dias.forEach((d) => pendientes.add(d));
        });
        return { diasAprobados: aprobados, diasPendientes: pendientes };
    }, [misSolicitudesCalendario]);

    const diasAsignados = useMemo(() => new Set([...diasAprobados, ...diasPendientes]), [diasAprobados, diasPendientes]);
    const remainingDays = VACATION_ALLOWANCE - diasAsignados.size;

    // ── Alternar día del calendario (empleados) ───────
    const toggleDay = async (date) => {
        if (!date) return;
        const dayKey = getDateKey(date);
        setActionError('');
        setActionOk('');

        const solicitudExistente = misSolicitudesCalendario.find((s) => {
            const dias = expandirRango(s.fecha_inicio, s.fecha_fin);
            return dias.includes(dayKey) && s.estado === 'pendiente';
        });

        if (solicitudExistente) {
            try {
                await cancelarVacaciones(solicitudExistente.id);
                await cargarSolicitudes();
            } catch (err) {
                setActionError(err.message || 'Error al cancelar la solicitud.');
            }
        } else if (!diasAprobados.has(dayKey)) {
            try {
                await solicitarVacaciones(dayKey, dayKey);
                await cargarSolicitudes();
            } catch (err) {
                setActionError(err.message || 'Error al solicitar el día de vacaciones.');
            }
        }
    };

    const cancelarSolicitud = async (id) => {
        setActionError('');
        try {
            await cancelarVacaciones(id);
            await cargarSolicitudes();
        } catch (err) {
            setActionError(err.message || 'Error al cancelar la solicitud.');
        }
    };

    // ── Aprobar / Rechazar (admin/jefe) ───────────────
    const handleAprobar = async (id) => {
        setActionError('');
        setActionOk('');
        try {
            await aprobarVacaciones(id);
            setActionOk('Solicitud aprobada.');
            await cargarSolicitudes();
        } catch (err) {
            setActionError(err.message || 'Error al aprobar.');
        }
    };

    const handleRechazarClick = (id) => {
        setRechazandoId(id);
        setMotivoRechazo('');
        setActionError('');
        setActionOk('');
    };

    const handleRechazarConfirm = async () => {
        try {
            await rechazarVacaciones(rechazandoId, motivoRechazo);
            setActionOk('Solicitud rechazada.');
            setRechazandoId(null);
            setMotivoRechazo('');
            await cargarSolicitudes();
        } catch (err) {
            setActionError(err.message || 'Error al rechazar.');
        }
    };

    const handleMonthChange = (offset) => {
        const next = new Date(monthDate);
        next.setMonth(next.getMonth() + offset);
        setMonthDate(next);
    };

    if (loading) return <p style={{ padding: '24px' }}>Cargando vacaciones...</p>;

    // Solicitudes pendientes para el panel de admin
    const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');

    return (
        <div className="vacaciones-container">

            {/* ── Panel de gestión (solo admin/jefe) ── */}
            {esAdmin && (
                <div className="admin-panel">
                    <h3 className="admin-panel-title">
                        Solicitudes pendientes
                        {pendientes.length > 0 && (
                            <span className="admin-badge">{pendientes.length}</span>
                        )}
                    </h3>

                    {actionError && <p className="admin-error">{actionError}</p>}
                    {actionOk    && <p className="admin-ok">{actionOk}</p>}

                    {pendientes.length === 0 ? (
                        <p className="admin-empty">No hay solicitudes pendientes.</p>
                    ) : (
                        <div className="admin-lista">
                            {pendientes.map((s) => (
                                <div key={s.id} className="admin-item">
                                    <div className="admin-item-info">
                                        <span className="admin-empleado">{s.empleado}</span>
                                        <span className="admin-fechas">
                                            {formatDateShort(s.fecha_inicio)}
                                            {s.fecha_inicio !== s.fecha_fin.slice(0, 10) &&
                                                ` → ${formatDateShort(s.fecha_fin)}`}
                                        </span>
                                    </div>
                                    <div className="admin-item-acciones">
                                        <button
                                            className="btn-accion aprobar"
                                            onClick={() => handleAprobar(s.id)}
                                        >
                                            Aprobar
                                        </button>
                                        <button
                                            className="btn-accion rechazar"
                                            onClick={() => handleRechazarClick(s.id)}
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modal de rechazo con motivo */}
                    {rechazandoId && (
                        <div className="rechazo-modal">
                            <p>Motivo del rechazo (opcional):</p>
                            <textarea
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                placeholder="Ej: Período de alta actividad..."
                                rows={3}
                            />
                            <div className="rechazo-acciones">
                                <button className="btn-accion rechazar" onClick={handleRechazarConfirm}>
                                    Confirmar rechazo
                                </button>
                                <button className="btn-accion cancelar" onClick={() => setRechazandoId(null)}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Historial de todas las solicitudes */}
                    <details className="admin-historial">
                        <summary>Ver historial completo ({solicitudes.length})</summary>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Desde</th>
                                    <th>Hasta</th>
                                    <th>Estado</th>
                                    <th>Aprobado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudes.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.empleado}</td>
                                        <td>{formatDateShort(s.fecha_inicio)}</td>
                                        <td>{formatDateShort(s.fecha_fin)}</td>
                                        <td>
                                            <span className={`estado-badge ${s.estado}`}>
                                                {s.estado}
                                            </span>
                                        </td>
                                        <td>{s.aprobado_por_nombre || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </details>
                </div>
            )}

            {/* ── Vista empleado: contador de días ── */}
            <div className="vacaciones-top-row">
                <div className="vacaciones-available-card">
                    <div className="vacaciones-note">TUS DÍAS DISPONIBLES DE VACACIONES SON:</div>
                    <div className={`vacaciones-available ${remainingDays < 0 ? 'negative' : ''}`}>
                        {remainingDays}
                    </div>
                </div>
            </div>

            {!esAdmin && actionError && (
                <p style={{ color: 'red', padding: '8px 0', textAlign: 'center' }}>{actionError}</p>
            )}

            {/* ── Calendario ── */}
            <div className="vacaciones-calendar-wrapper">
                <div className="vacaciones-calendar">
                    <div className="vacaciones-calendar-header">
                        <button type="button" className="month-nav" onClick={() => handleMonthChange(-1)}>&#8592;</button>
                        <div className="month-title">{formatMonthYear(monthDate)}</div>
                        <button type="button" className="month-nav" onClick={() => handleMonthChange(1)}>&#8594;</button>
                    </div>

                    <div className="vacaciones-weekdays">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((w) => (
                            <div key={w} className="weekday-cell">{w}</div>
                        ))}
                    </div>

                    <div className="vacaciones-days-grid">
                        {monthCalendar.map((week, weekIndex) =>
                            week.map((day, dayIndex) => {
                                const dayKey     = day ? getDateKey(day) : null;
                                const isAprobado = dayKey ? diasAprobados.has(dayKey) : false;
                                const isPendiente = dayKey ? diasPendientes.has(dayKey) : false;
                                const selected   = isAprobado || isPendiente;
                                let extraClass   = '';
                                if (isAprobado) extraClass = 'aprobado';
                                else if (isPendiente) extraClass = 'pendiente';

                                return (
                                    <button
                                        key={`${weekIndex}-${dayIndex}`}
                                        type="button"
                                        className={`vacaciones-day ${selected ? 'selected' : ''} ${extraClass} ${!day ? 'empty' : ''}`}
                                        onClick={() => toggleDay(day)}
                                        disabled={!day || isAprobado}
                                        title={isAprobado ? 'Aprobado' : isPendiente ? 'Pendiente' : ''}
                                    >
                                        {day ? day.getDate() : ''}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', justifyContent: 'center' }}>
                        <span><span className="legend-dot aprobado"></span> Aprobado</span>
                        <span><span className="legend-dot pendiente"></span> Pendiente</span>
                    </div>
                </div>
            </div>

            {/* ── Mis solicitudes (todos los roles) ── */}
            <div className="vacaciones-actions">
                <button type="button" className="assigned-toggle" onClick={() => setShowAssigned((p) => !p)}>
                    Mis vacaciones {showAssigned ? '▲' : '▼'}
                </button>

                {showAssigned && (
                    <div className="assigned-panel">
                        <div className="assigned-summary">
                            {esAdmin
                                ? `Mostrando tus propias solicitudes`
                                : `Solicitudes: ${misSolicitudes.length}`}
                        </div>
                        <div className="assigned-list">
                            {misSolicitudesCalendario.length === 0 ? (
                                <div className="assigned-empty">No tienes solicitudes de vacaciones.</div>
                            ) : (
                                misSolicitudesCalendario.map((s) => (
                                    <div key={s.id} className="assigned-item">
                                        <span>
                                            {formatDateLong(s.fecha_inicio)}
                                            {s.fecha_inicio !== s.fecha_fin.slice(0, 10) &&
                                                ` → ${formatDateLong(s.fecha_fin)}`}
                                            {' '}
                                            <em style={{ color: s.estado === 'aprobado' ? 'green' : s.estado === 'rechazado' ? 'red' : '#b8860b' }}>
                                                ({s.estado})
                                            </em>
                                            {s.motivo_rechazo && (
                                                <small style={{ color: '#888', display: 'block' }}>
                                                    Motivo: {s.motivo_rechazo}
                                                </small>
                                            )}
                                        </span>
                                        {s.estado === 'pendiente' && (
                                            <button
                                                type="button"
                                                className="assigned-remove"
                                                onClick={() => cancelarSolicitud(s.id)}
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Vacaciones;