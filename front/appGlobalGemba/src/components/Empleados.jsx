import React, { useState } from 'react';
import './Empleados.css';

function Empleados() {
    const [empleados, setEmpleados] = useState([
        { id: 1, nombre: 'Juan', apellidos: 'Pérez', correo: 'juan.perez@example.com', puesto: 'Desarrollador', horario: '9:00 - 18:00' },
        { id: 2, nombre: 'María', apellidos: 'García', correo: 'maria.garcia@example.com', puesto: 'Diseñadora', horario: '8:00 - 17:00' }
    ]);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [empleadoEditando, setEmpleadoEditando] = useState(null);
    const [nuevoEmpleado, setNuevoEmpleado] = useState({ nombre: '', apellidos: '', correo: '', puesto: '', horario: '' });
    
    const [mostrarReporte, setMostrarReporte] = useState(false);

    // Mock data for the report
    const reporteMock = [
        { id: 1, nombre: 'Juan Pérez', horas: 80, vacaciones: 0, proyecto: 'App GlobalGemba (2 semanas)' },
        { id: 2, nombre: 'María García', horas: 75, vacaciones: 5, proyecto: 'Rediseño Web (2 semanas)' }
    ];

    const handleInputChange = (e) => {
        setNuevoEmpleado({ ...nuevoEmpleado, [e.target.name]: e.target.value });
    };

    const handleGuardarEmpleado = (e) => {
        e.preventDefault();
        if (empleadoEditando !== null) {
            // Editar existente
            const empleadosActualizados = empleados.map(emp => 
                emp.id === empleadoEditando ? { ...nuevoEmpleado, id: empleadoEditando } : emp
            );
            setEmpleados(empleadosActualizados);
        } else {
            // Añadir nuevo
            setEmpleados([...empleados, { ...nuevoEmpleado, id: Date.now() }]);
        }
        setMostrarFormulario(false);
        setEmpleadoEditando(null);
        setNuevoEmpleado({ nombre: '', apellidos: '', correo: '', puesto: '', horario: '' });
    };

    const handleEditar = (empleado) => {
        setNuevoEmpleado(empleado);
        setEmpleadoEditando(empleado.id);
        setMostrarFormulario(true);
    };

    return (
        <div className="empleados-container">
            <h2>Gestión de Empleados</h2>
            
            <div className="acciones-bar">
                <button 
                    className="btn btn-primary" 
                    onClick={() => {
                        setMostrarFormulario(!mostrarFormulario);
                        setEmpleadoEditando(null);
                        setNuevoEmpleado({ nombre: '', apellidos: '', correo: '', puesto: '', horario: '' });
                    }}
                >
                    {mostrarFormulario ? 'Cancelar' : 'Añadir Empleado'}
                </button>
                <button 
                    className="btn btn-secondary"
                    onClick={() => setMostrarReporte(!mostrarReporte)}
                >
                    Solicitar Reporte de Empleados
                </button>
            </div>

            {mostrarFormulario && (
                <div className="formulario-empleado">
                    <h3>{empleadoEditando ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
                    <form onSubmit={handleGuardarEmpleado}>
                        <input type="text" name="nombre" placeholder="Nombre" value={nuevoEmpleado.nombre} onChange={handleInputChange} required />
                        <input type="text" name="apellidos" placeholder="Apellidos" value={nuevoEmpleado.apellidos} onChange={handleInputChange} required />
                        <input type="email" name="correo" placeholder="Correo" value={nuevoEmpleado.correo} onChange={handleInputChange} required />
                        <input type="text" name="puesto" placeholder="Puesto" value={nuevoEmpleado.puesto} onChange={handleInputChange} required />
                        <input type="text" name="horario" placeholder="Horario" value={nuevoEmpleado.horario} onChange={handleInputChange} required />
                        <button type="submit" className="btn btn-success">Guardar</button>
                    </form>
                </div>
            )}

            {!mostrarReporte ? (
                <div className="lista-empleados">
                    <h3>Lista de Empleados</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Apellidos</th>
                                <th>Correo</th>
                                <th>Puesto</th>
                                <th>Horario</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empleados.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.nombre}</td>
                                    <td>{emp.apellidos}</td>
                                    <td>{emp.correo}</td>
                                    <td>{emp.puesto}</td>
                                    <td>{emp.horario}</td>
                                    <td>
                                        <button className="btn-sm btn-edit" onClick={() => handleEditar(emp)}>Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="reporte-empleados">
                    <h3>Reporte de Empleados (Últimas 2 semanas)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Horas Trabajadas</th>
                                <th>Días Vacaciones</th>
                                <th>Proyecto / Puesto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reporteMock.map(rep => (
                                <tr key={rep.id}>
                                    <td>{rep.nombre}</td>
                                    <td>{rep.horas}h</td>
                                    <td>{rep.vacaciones}</td>
                                    <td>{rep.proyecto}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Empleados;