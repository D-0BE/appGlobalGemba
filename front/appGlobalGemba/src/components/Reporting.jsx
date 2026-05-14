import React, { useState } from "react";
import "./Reporting.css";

// Datos de ejemplo, reemplazar por datos reales de la API o props
const userData = {
  nombre: "Juan Pérez",
  puesto: "Empleado",
  diasTrabajados: 120,
  diasVacacionesTomados: 8,
  diasVacacionesTotales: 22,
};

const diasVacacionesRestantes =
  userData.diasVacacionesTotales - userData.diasVacacionesTomados;

const Reporting = () => {
  const [mostrarReporting, setMostrarReporting] = useState(false);

  return (
    <div className="reporting-container">
      <h2>Reporting de {userData.nombre}</h2>
      
      {!mostrarReporting ? (
        <button 
          className="solicitar-btn" 
          onClick={() => setMostrarReporting(true)}
        >
          Solicitar reporting
        </button>
      ) : (
        <div className="reporting-info">
          <p><strong>Puesto:</strong> {userData.puesto}</p>
          <p><strong>Días trabajados:</strong> {userData.diasTrabajados}</p>
          <p><strong>Vacaciones tomadas:</strong> {userData.diasVacacionesTomados}</p>
          <p><strong>Vacaciones restantes:</strong> {diasVacacionesRestantes}</p>
        </div>
      )}
    </div>
  );
};

export default Reporting;
