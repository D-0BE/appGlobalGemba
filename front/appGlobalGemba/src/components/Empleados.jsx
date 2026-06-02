import React, { useEffect, useState } from 'react';
import { getUsuarios, updateUsuario } from '../api';
import './Empleados.css';

function Empleados() {
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [empleadoEditando, setEmpleadoEditando] = useState(null); // id del empleado
    const [formData, setFormData] = useState({ nombre: '', apellidos: '', foto_url: '' });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // ── Cargar empleados ──────────────────────────────
    useEffect(() => {
        getUsuarios()
            .then((data) => {
                setEmpleados(data || []);
                setLoading(false);
            })
            .catch((err) => {
                setLoadError(err.message || 'Error al cargar empleados.');
                setLoading(false);
            });
    }, []);

    // ── Formulario ────────────────────────────────────
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditar = (emp) => {
        setEmpleadoEditando(emp.id);
        setFormData({
            nombre:    emp.nombre,
            apellidos: emp.apellidos,
            foto_url:  emp.foto_url || '',
        });
        setMostrarFormulario(true);
        setSaveError('');
    };

    const handleCancelar = () => {
        setMostrarFormulario(false);
        setEmpleadoEditando(null);
        setFormData({ nombre: '', apellidos: '', foto_url: '' });
        setSaveError('');
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!empleadoEditando) return;

        setSaving(true);
        setSaveError('');

        try {
            const updated = await updateUsuario(empleadoEditando, {
                nombre:    formData.nombre,
                apellidos: formData.apellidos,
                foto_url:  formData.foto_url,
            });

            setEmpleados((prev) =>
                prev.map((emp) =>
                    emp.id === empleadoEditando
                        ? { ...emp, nombre: updated.nombre, apellidos: updated.apellidos, foto_url: updated.foto_url }
                        : emp
                )
            );

            handleCancelar();
        } catch (err) {
            setSaveError(err.message || 'Error al guardar los cambios.');
        } finally {
            setSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────
    if (loading) return <p style={{ padding: '24px' }}>Cargando empleados...</p>;
    if (loadError) return <p style={{ padding: '24px', color: 'red' }}>{loadError}</p>;

    return (
        <div className="empleados-container">
            <h2>Gestión de Empleados</h2>

            <div className="acciones-bar">
                <span style={{ color: '#666', fontSize: '14px' }}>
                    {empleados.length} empleado{empleados.length !== 1 ? 's' : ''} en total
                </span>
            </div>

            {mostrarFormulario && (
                <div className="formulario-empleado">
                    <h3>Editar Empleado</h3>
                    <form onSubmit={handleGuardar}>
                        <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="apellidos"
                            placeholder="Apellidos"
                            value={formData.apellidos}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="foto_url"
                            placeholder="URL de foto (opcional)"
                            value={formData.foto_url}
                            onChange={handleInputChange}
                        />
                        {saveError && <p style={{ color: 'red', margin: '6px 0' }}>{saveError}</p>}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-success" disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={handleCancelar} disabled={saving}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="lista-empleados">
                <h3>Lista de Empleados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellidos</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Departamento</th>
                            <th>Activo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {empleados.map((emp) => (
                            <tr key={emp.id}>
                                <td>{emp.nombre}</td>
                                <td>{emp.apellidos}</td>
                                <td>{emp.email}</td>
                                <td>{emp.rol}</td>
                                <td>{emp.departamento || '—'}</td>
                                <td>{emp.activo ? 'Si' : 'No'}</td>
                                <td>
                                    <button
                                        className="btn-sm btn-edit"
                                        onClick={() => handleEditar(emp)}
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Empleados;