import { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAbsent, setIsAbsent] = useState(false);
    const [schedule, setSchedule] = useState({
        manana: { inicio: "", fin: "" },
        tarde: { inicio: "", fin: "" }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener el lunes de la semana actual
    const getMondayOfCurrentWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando sea domingo
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    // Obtener el viernes de la semana actual
    const getFridayOfCurrentWeek = (date) => {
        const monday = getMondayOfCurrentWeek(date);
        const friday = new Date(monday);
        friday.setDate(friday.getDate() + 4); // Lunes + 4 = Viernes
        friday.setHours(23, 59, 59, 999);
        return friday;
    };

    // Verificar si la fecha está bloqueada
    const isDateLocked = (date) => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Si es en el pasado (antes de hoy), está bloqueado
        if (checkDate < today) {
            return true;
        }

        // Si es después del viernes de esta semana, está bloqueado
        const fridayOfCurrentWeek = getFridayOfCurrentWeek(today);
        if (checkDate > fridayOfCurrentWeek) {
            return true;
        }

        return false;
    };

    const handleDateChange = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const handleScheduleChange = (period, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [period]: {
                ...prev[period],
                [field]: value
            }
        }));
    };

    const handleSubmit = () => {
        console.log("horario enviado correctamente");
    };

    const formatDate = (date) => {
        return date.toLocaleDateString("es-ES", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
        });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="date-display">
                    {formatDate(currentDate)}
                    {isDateLocked(currentDate) && (
                        <span className="locked-badge">🔒 BLOQUEADO</span>
                    )}
                </div>
                <div className="absent-checkbox">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={isAbsent} 
                            onChange={(e) => setIsAbsent(e.target.checked)}
                            disabled={isDateLocked(currentDate)}
                        />
                        Ausente
                    </label>
                </div>
            </div>

            <table className={`schedule-table ${isDateLocked(currentDate) ? 'locked' : ''}`}>
                <thead>
                    <tr>
                        <th>Turno</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Mañana</td>
                        <td>
                            <input 
                                type="time" 
                                value={schedule.manana.inicio} 
                                onChange={(e) => handleScheduleChange("manana", "inicio", e.target.value)}
                                disabled={isAbsent || isDateLocked(currentDate)}
                                className={isDateLocked(currentDate) ? 'disabled-input' : ''}
                            />
                        </td>
                        <td>
                            <input 
                                type="time" 
                                value={schedule.manana.fin} 
                                onChange={(e) => handleScheduleChange("manana", "fin", e.target.value)}
                                disabled={isAbsent || isDateLocked(currentDate)}
                                className={isDateLocked(currentDate) ? 'disabled-input' : ''}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Tarde</td>
                        <td>
                            <input 
                                type="time" 
                                value={schedule.tarde.inicio} 
                                onChange={(e) => handleScheduleChange("tarde", "inicio", e.target.value)}
                                disabled={isAbsent || isDateLocked(currentDate)}
                                className={isDateLocked(currentDate) ? 'disabled-input' : ''}
                            />
                        </td>
                        <td>
                            <input 
                                type="time" 
                                value={schedule.tarde.fin} 
                                onChange={(e) => handleScheduleChange("tarde", "fin", e.target.value)}
                                disabled={isAbsent || isDateLocked(currentDate)}
                                className={isDateLocked(currentDate) ? 'disabled-input' : ''}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="dashboard-footer">
                <div className="date-navigation">
                    <button onClick={() => handleDateChange(-1)}>&#8592;</button>
                    <button onClick={() => handleDateChange(1)}>&#8594;</button>
                </div>
                <button 
                    className="submit-btn" 
                    onClick={handleSubmit}
                    disabled={isDateLocked(currentDate)}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}

export default Dashboard;