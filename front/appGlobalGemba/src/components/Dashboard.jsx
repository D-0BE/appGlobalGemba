import { useCallback, useEffect, useMemo, useState } from "react";
import { getMe, getFichajes, getFichajeActivo, registrarEntrada, registrarSalida } from "../api";
import "./Dashboard.css";

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function Dashboard() {
    const today = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }, []);

    const [currentDate, setCurrentDate] = useState(new Date(today));
    const [isAbsent, setIsAbsent] = useState(false);

    // Datos del usuario y su turno real desde la BD
    const [usuario, setUsuario] = useState(null);

    // Estado de fichajes desde la BD
    const [fichajeActivo, setFichajeActivo] = useState(null);
    const [fichajesDelMes, setFichajesDelMes] = useState([]);
    const [loadingFichaje, setLoadingFichaje] = useState(false);
    const [fichajeError, setFichajeError] = useState('');
    const [fichajeSuccess, setFichajeSuccess] = useState('');

    // ── Cargar datos del usuario (incluye horario) ─────
    useEffect(() => {
        getMe()
            .then((data) => setUsuario(data))
            .catch(() => {});
    }, []);

    // ── Helpers de fecha ──────────────────────────────
    const getDateKey = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().slice(0, 10);
    };

    const getMondayOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const isSameDay = (a, b) => {
        const da = new Date(a);
        const db = new Date(b);
        return da.getFullYear() === db.getFullYear() &&
               da.getMonth() === db.getMonth() &&
               da.getDate() === db.getDate();
    };

    const isSameWeek = (a, b) =>
        getMondayOfWeek(a).getTime() === getMondayOfWeek(b).getTime();

    const isEditableDate = (date) => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate <= today && isSameWeek(checkDate, today);
    };

    // ── Cargar fichajes del mes y fichaje activo ──────
    const getMesKey = useCallback((date) => {
        const d = new Date(date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${d.getFullYear()}-${mm}`;
    }, []);

    const cargarFichajes = useCallback(async () => {
        try {
            const mes = getMesKey(currentDate);
            const [activo, todos] = await Promise.all([
                getFichajeActivo(),
                getFichajes(mes),
            ]);
            setFichajeActivo(activo);
            setFichajesDelMes(todos || []);
        } catch {
            // Si falla la carga, no bloqueamos la UI
        }
    }, [currentDate, getMesKey]);

    useEffect(() => {
        cargarFichajes();
    }, [cargarFichajes]);

    // ── Días con fichaje cerrado (para el calendario) ─
    const fichadosKeys = useMemo(() => {
        return new Set(
            fichajesDelMes
                .filter((f) => f.estado === 'cerrado')
                .map((f) => getDateKey(new Date(f.entrada)))
        );
    }, [fichajesDelMes]);

    // ── Turno real del usuario ─────────────────────────
    const horario = usuario?.hora_entrada
        ? {
              entrada: usuario.hora_entrada.slice(0, 5),   // "09:00"
              salida:  usuario.hora_salida.slice(0, 5),    // "18:00"
              diasLaborables: usuario.dias_semana || [1, 2, 3, 4, 5],
          }
        : null;

    // ¿Hoy es día laborable según el horario?
    const hoyDiaJS = today.getDay(); // 0=Dom, 1=Lun...
    // La BD guarda 1=Lun...7=Dom (ISO), JS: 0=Dom,1=Lun..6=Sáb
    const hoyISO = hoyDiaJS === 0 ? 7 : hoyDiaJS;
    const esHoyLaborable = horario?.diasLaborables.includes(hoyISO) ?? true;

    // ── Calendario ────────────────────────────────────
    const getMonthCalendar = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weeks = [];
        let week = Array(7).fill(null);
        const startIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        for (let i = 0; i < startIndex; i += 1) week[i] = null;

        for (let day = 1; day <= daysInMonth; day += 1) {
            const index = (startIndex + day - 1) % 7;
            week[index] = new Date(year, month, day);
            if (index === 6 || day === daysInMonth) {
                weeks.push(week);
                week = Array(7).fill(null);
            }
        }
        return weeks;
    };

    const monthCalendar = useMemo(() => getMonthCalendar(currentDate), [currentDate]);

    const getCellStatus = (date) => {
        const key = getDateKey(date);
        if (fichadosKeys.has(key)) return "fichado";
        return "";
    };

    const handleDateClick = (date) => {
        if (!date || !isEditableDate(date)) return;
        setCurrentDate(new Date(date));
        setIsAbsent(false);
        setFichajeError('');
        setFichajeSuccess('');
    };

    const formatDate = (date) =>
        date.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    const formatMonthYear = (date) =>
        date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

    const selectedDateLocked = !isEditableDate(currentDate);

    // ── Registrar entrada o salida ────────────────────
    const handleSubmit = async () => {
        setFichajeError('');
        setFichajeSuccess('');
        setLoadingFichaje(true);

        try {
            if (!fichajeActivo) {
                const nuevo = await registrarEntrada('normal');
                setFichajeActivo(nuevo);
                setFichajeSuccess('Entrada registrada correctamente.');
            } else {
                await registrarSalida(fichajeActivo.id, 0);
                setFichajeActivo(null);
                setFichajeSuccess('Salida registrada correctamente.');
                await cargarFichajes();
            }
        } catch (err) {
            setFichajeError(err.message || 'Error al registrar fichaje.');
        } finally {
            setLoadingFichaje(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="date-display">
                    {formatMonthYear(currentDate)}
                    {selectedDateLocked && (
                        <span className="locked-badge">No editable</span>
                    )}
                </div>
                <div className="absent-checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={isAbsent}
                            onChange={(e) => setIsAbsent(e.target.checked)}
                            disabled={selectedDateLocked}
                        />
                        Ausente
                    </label>
                </div>
            </div>

            {/* Turno del usuario desde la BD */}
            {horario && (
                <div className="turno-card">
                    <div className="turno-titulo">Tu turno</div>
                    <div className="turno-horas">
                        🕘 {horario.entrada} – {horario.salida}
                    </div>
                    <div className="turno-dias">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <span
                                key={d}
                                className={`turno-dia ${horario.diasLaborables.includes(d) ? 'activo' : ''}`}
                            >
                                {DIAS_SEMANA[d === 7 ? 0 : d]}
                            </span>
                        ))}
                    </div>
                    {!esHoyLaborable && (
                        <div className="turno-aviso">🔴 Hoy no es día laborable según tu horario</div>
                    )}
                </div>
            )}

            {/* Estado del fichaje activo */}
            {fichajeActivo && (
                <div style={{ background: '#e8f5e9', padding: '10px 16px', borderRadius: '8px', marginBottom: '12px', color: '#2e7d32' }}>
                    ✅ Fichaje abierto desde{' '}
                    {new Date(fichajeActivo.entrada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
            )}

            <div className="calendar-container">
                <div className="calendar-grid">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((weekday) => (
                        <div key={weekday} className="calendar-weekday">
                            {weekday}
                        </div>
                    ))}
                    {monthCalendar.map((week, weekIndex) =>
                        week.map((day, dayIndex) => {
                            const isToday = day && isSameDay(day, today);
                            const isSelected = day && isSameDay(day, currentDate);
                            const status = day ? getCellStatus(day) : "";
                            const editable = day ? isEditableDate(day) : false;
                            const classes = [
                                "calendar-day",
                                status,
                                isToday ? "today" : "",
                                isSelected ? "selected" : "",
                                !editable && day ? "disabled-day" : "",
                                !day ? "empty" : "",
                            ]
                                .filter(Boolean)
                                .join(" ");

                            return (
                                <button
                                    key={`${weekIndex}-${dayIndex}`}
                                    type="button"
                                    className={classes}
                                    onClick={() => handleDateClick(day)}
                                    disabled={!editable || !day}
                                >
                                    {day ? day.getDate() : ""}
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="calendar-legend">
                    <span className="legend-item today">Hoy</span>
                    <span className="legend-item fichado">Fichado</span>
                    <span className="legend-item disabled">No fichable</span>
                </div>
            </div>

            <div className="date-summary">
                <div className="date-summary-label">Fecha seleccionada:</div>
                <div>{formatDate(currentDate)}</div>
                {selectedDateLocked && <div className="locked-badge">No editable</div>}
            </div>

            {/* Tabla de turno real (read-only) */}
            <table className="schedule-table">
                <thead>
                    <tr>
                        <th>Turno</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Entrada</td>
                        <td colSpan={2} style={{ textAlign: 'center', fontWeight: 600 }}>
                            {horario ? horario.entrada : '—'}
                        </td>
                    </tr>
                    <tr>
                        <td>Salida</td>
                        <td colSpan={2} style={{ textAlign: 'center', fontWeight: 600 }}>
                            {horario ? horario.salida : '—'}
                        </td>
                    </tr>
                </tbody>
            </table>

            {fichajeError && (
                <p style={{ color: 'red', margin: '8px 0' }}>{fichajeError}</p>
            )}
            {fichajeSuccess && (
                <p style={{ color: 'green', margin: '8px 0' }}>{fichajeSuccess}</p>
            )}

            <div className="dashboard-footer">
                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={selectedDateLocked || loadingFichaje || isAbsent}
                >
                    {loadingFichaje
                        ? 'Procesando...'
                        : fichajeActivo
                        ? '🔴 Registrar Salida'
                        : '🟢 Registrar Entrada'}
                </button>
            </div>
        </div>
    );
}

export default Dashboard;