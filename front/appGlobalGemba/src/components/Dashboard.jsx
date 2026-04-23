import { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAbsent, setIsAbsent] = useState(false);
    const [schedule, setSchedule] = useState({
        manana: { inicio: "", fin: "" },
        tarde: { inicio: "", fin: "" }
    });

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
                </div>
                <div className="absent-checkbox">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={isAbsent} 
                            onChange={(e) => setIsAbsent(e.target.checked)} 
                        />
                        Ausente
                    </label>
                </div>
            </div>

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
                        <td>Mañana</td>
                        <td>
                            <input 
                                type="time" 
                                value={schedule.manana.inicio} 
                                onChange={(e) => handleScheduleChange("manana", "inicio", e.target.value)}
                                disabled={isAbsent}
                            />
                        </td>
                        <td>
                            <input 
                                type="time" 
                                value={schedule.manana.fin} 
                                onChange={(e) => handleScheduleChange("manana", "fin", e.target.value)}
                                disabled={isAbsent}
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
                                disabled={isAbsent}
                            />
                        </td>
                        <td>
                            <input 
                                type="time" 
                                value={schedule.tarde.fin} 
                                onChange={(e) => handleScheduleChange("tarde", "fin", e.target.value)}
                                disabled={isAbsent}
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
                <button className="submit-btn" onClick={handleSubmit}>Enviar</button>
            </div>
        </div>
    );
}

export default Dashboard;