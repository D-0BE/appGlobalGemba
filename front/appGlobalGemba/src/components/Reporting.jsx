import React from "react";
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
  return (
    <div className="reporting-container">
      <h2>Reporting de {userData.nombre}</h2>
      <div className="reporting-info">
        <p><strong>Puesto:</strong> {userData.puesto}</p>
        <p><strong>Días trabajados:</strong> {userData.diasTrabajados}</p>
        <p><strong>Vacaciones tomadas:</strong> {userData.diasVacacionesTomados}</p>
        <p><strong>Vacaciones restantes:</strong> {diasVacacionesRestantes}</p>
      </div>
      <div className="reporting-summary">
        <h3>Resumen</h3>
        <ul>
          <li>Días trabajados: {userData.diasTrabajados}</li>
          <li>Vacaciones tomadas: {userData.diasVacacionesTomados}</li>
          <li>Vacaciones restantes: {diasVacacionesRestantes}</li>
          <li>Puesto: {userData.puesto}</li>
        </ul>
      </div>
    </div>
  );
};

export default Reporting;
