import { useCallback, useEffect, useMemo, useState } from 'react';
import { getVacaciones, solicitarVacaciones, cancelarVacaciones } from '../api';
import './Vacaciones.css';

const VACATION_ALLOWANCE = 22;

const getDateKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
};

const formatDateLong = (date) =>
    new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

const formatMonthYear = (date) =>
    new Date(date).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
    });

const getMonthCalendar = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let week = Array(7).fill(null);
    const startIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let index = 0; index < startIndex; index += 1) {
        week[index] = null;
    }

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

/** Expande un rango fecha_inicio→fecha_fin en días individuales (YYYY-MM-DD) */
function expandirRango(fechaInicio, fechaFin) {
    const dias = [];
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
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
    const [monthDate, setMonthDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });

    // solicitudes: [{ id, fecha_inicio, fecha_fin, estado, ... }]
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState('');
    const [showAssigned, setShowAssigned] = useState(false);

    const monthCalendar = useMemo(() => getMonthCalendar(monthDate), [monthDate]);

    // ── Cargar solicitudes ────────────────────────────
    const cargarSolicitudes = useCallback(async () => {
        try {
            const data = await getVacaciones();
            setSolicitudes(data || []);
        } catch {
            // silencioso, mantenemos el estado anterior
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarSolicitudes();
    }, [cargarSolicitudes]);

    // ── Mapas de días por estado ──────────────────────
    const { diasAprobados, diasPendientes } = useMemo(() => {
        const aprobados = new Set();
        const pendientes = new Set();

        solicitudes.forEach((s) => {
            const dias = expandirRango(s.fecha_inicio, s.fecha_fin);
            if (s.estado === 'aprobado') dias.forEach((d) => aprobados.add(d));
            else if (s.estado === 'pendiente') dias.forEach((d) => pendientes.add(d));
        });

        return { diasAprobados: aprobados, diasPendientes: pendientes };
    }, [solicitudes]);

    // Días asignados (aprobados + pendientes)
    const diasAsignados = useMemo(() => new Set([...diasAprobados, ...diasPendientes]), [diasAprobados, diasPendientes]);

    const remainingDays = VACATION_ALLOWANCE - diasAsignados.size;

    // ── Alternar día del calendario ───────────────────
    const toggleDay = async (date) => {
        if (!date) return;
        const dayKey = getDateKey(date);
        setActionError('');

        // Buscar si ya hay solicitud que cubra ese día
        const solicitudExistente = solicitudes.find((s) => {
            const dias = expandirRango(s.fecha_inicio, s.fecha_fin);
            return dias.includes(dayKey) && s.estado === 'pendiente';
        });

        if (solicitudExistente) {
            // Cancelar la solicitud
            try {
                await cancelarVacaciones(solicitudExistente.id);
                await cargarSolicitudes();
            } catch (err) {
                setActionError(err.message || 'Error al cancelar la solicitud.');
            }
        } else if (!diasAprobados.has(dayKey)) {
            // Crear nueva solicitud de un solo día
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

    const handleMonthChange = (offset) => {
        const next = new Date(monthDate);
        next.setMonth(next.getMonth() + offset);
        setMonthDate(next);
    };

    if (loading) return <p style={{ padding: '24px' }}>Cargando vacaciones...</p>;

    return (
        <div className="vacaciones-container">
            <div className="vacaciones-top-row">
                <div className="vacaciones-available-card">
                    <div className="vacaciones-note">TUS DÍAS DISPONIBLES DE VACACIONES SON:</div>
                    <div className={`vacaciones-available ${remainingDays < 0 ? 'negative' : ''}`}>
                        {remainingDays}
                    </div>
                </div>
            </div>

            {actionError && (
                <p style={{ color: 'red', padding: '8px 0', textAlign: 'center' }}>{actionError}</p>
            )}

            <div className="vacaciones-calendar-wrapper">
                <div className="vacaciones-calendar">
                    <div className="vacaciones-calendar-header">
                        <button
                            type="button"
                            className="month-nav"
                            onClick={() => handleMonthChange(-1)}
                        >
                            &#8592;
                        </button>
                        <div className="month-title">{formatMonthYear(monthDate)}</div>
                        <button
                            type="button"
                            className="month-nav"
                            onClick={() => handleMonthChange(1)}
                        >
                            &#8594;
                        </button>
                    </div>

                    <div className="vacaciones-weekdays">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((weekday) => (
                            <div key={weekday} className="weekday-cell">
                                {weekday}
                            </div>
                        ))}
                    </div>

                    <div className="vacaciones-days-grid">
                        {monthCalendar.map((week, weekIndex) =>
                            week.map((day, dayIndex) => {
                                const dayKey = day ? getDateKey(day) : null;
                                const isAprobado = dayKey ? diasAprobados.has(dayKey) : false;
                                const isPendiente = dayKey ? diasPendientes.has(dayKey) : false;
                                const selected = isAprobado || isPendiente;

                                let extraClass = '';
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

                    {/* Leyenda */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', justifyContent: 'center' }}>
                        <span>🟢 Aprobado</span>
                        <span>🟡 Pendiente</span>
                    </div>
                </div>
            </div>

            <div className="vacaciones-actions">
                <button
                    type="button"
                    className="assigned-toggle"
                    onClick={() => setShowAssigned((prev) => !prev)}
                >
                    Tus vacaciones {showAssigned ? '▲' : '▼'}
                </button>

                {showAssigned && (
                    <div className="assigned-panel">
                        <div className="assigned-summary">
                            Solicitudes: {solicitudes.length}
                        </div>
                        <div className="assigned-list">
                            {solicitudes.length === 0 ? (
                                <div className="assigned-empty">No tienes solicitudes de vacaciones.</div>
                            ) : (
                                solicitudes.map((s) => (
                                    <div key={s.id} className="assigned-item">
                                        <span>
                                            {formatDateLong(s.fecha_inicio)}
                                            {s.fecha_inicio !== s.fecha_fin.slice(0, 10) && ` → ${formatDateLong(s.fecha_fin)}`}
                                            {' '}
                                            <em style={{ color: s.estado === 'aprobado' ? 'green' : s.estado === 'rechazado' ? 'red' : '#b8860b' }}>
                                                ({s.estado})
                                            </em>
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