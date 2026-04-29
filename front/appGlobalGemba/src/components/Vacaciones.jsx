import { useMemo, useState } from 'react';
import './Vacaciones.css';

const getDateKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
};

const formatDateLong = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const formatMonthYear = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
    });
};

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

function Vacaciones() {
    const VACATION_ALLOWANCE = 22;

    const [monthDate, setMonthDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });

    const [assignedDays, setAssignedDays] = useState(() => new Set([
        getDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 10)),
        getDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 15))
    ]));

    const [showAssigned, setShowAssigned] = useState(false);

    const monthCalendar = useMemo(() => getMonthCalendar(monthDate), [monthDate]);

    const remainingDays = VACATION_ALLOWANCE - assignedDays.size;

    const toggleDay = (date) => {
        if (!date) return;
        const dayKey = getDateKey(date);
        setAssignedDays((prev) => {
            const next = new Set(prev);
            if (next.has(dayKey)) {
                next.delete(dayKey);
            } else {
                next.add(dayKey);
            }
            return next;
        });
    };

    const removeAssignedDay = (dayKey) => {
        setAssignedDays((prev) => {
            const next = new Set(prev);
            next.delete(dayKey);
            return next;
        });
    };

    const assignedList = useMemo(
        () => Array.from(assignedDays).sort(),
        [assignedDays]
    );

    const handleMonthChange = (offset) => {
        const next = new Date(monthDate);
        next.setMonth(next.getMonth() + offset);
        setMonthDate(next);
    };

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
                                const selected = dayKey ? assignedDays.has(dayKey) : false;
                                return (
                                    <button
                                        key={`${weekIndex}-${dayIndex}`}
                                        type="button"
                                        className={`vacaciones-day ${selected ? 'selected' : ''} ${!day ? 'empty' : ''}`}
                                        onClick={() => toggleDay(day)}
                                        disabled={!day}
                                    >
                                        {day ? day.getDate() : ''}
                                    </button>
                                );
                            })
                        )}
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
                            Vacaciones asignadas: {assignedList.length} día{assignedList.length === 1 ? '' : 's'}
                        </div>
                        <div className="assigned-list">
                            {assignedList.length === 0 ? (
                                <div className="assigned-empty">No tienes días de vacaciones asignados.</div>
                            ) : (
                                assignedList.map((dayKey) => (
                                    <div key={dayKey} className="assigned-item">
                                        <span>{formatDateLong(dayKey)}</span>
                                        <button
                                            type="button"
                                            className="assigned-remove"
                                            onClick={() => removeAssignedDay(dayKey)}
                                        >
                                            Eliminar
                                        </button>
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