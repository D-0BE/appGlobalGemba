import React, { useEffect, useState } from 'react';
import { getUsuarios, crearUsuario, updateUsuario, toggleActivoUsuario, getDepartamentos } from '../api';
import './Empleados.css';

const ROLES = ['empleado', 'jefe', 'admin'];

function Empleados() {
    const [empleados, setEmpleados]       = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [loadError, setLoadError]       = useState('');

    // Modo: null | 'crear' | 'editar'
    const [modo, setModo]                       = useState(null);
    const [empleadoEditandoId, setEmpleadoEditandoId] = useState(null);
    const [formData, setFormData]               = useState({
        nombre: '', apellidos: '', email: '', password: '',
        rol: 'empleado', departamento_id: '', foto_url: '',
    });
    const [saving, setSaving]   = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveOk, setSaveOk]   = useState('');

    // ── Cargar empleados y departamentos ─────────────
    const cargarTodo = () => {
        Promise.all([getUsuarios(), getDepartamentos()])
            .then(([emps, deps]) => {
                setEmpleados(emps || []);
                setDepartamentos(deps || []);
                setLoading(false);
            })
            .catch((err) => {
                setLoadError(err.message || 'Error al cargar datos.');
                setLoading(false);
            });
    };

    useEffect(() => { cargarTodo(); }, []);

    // ── Formulario ────────────────────────────────────
    const resetForm = () => {
        setFormData({ nombre: '', apellidos: '', email: '', password: '', rol: 'empleado', departamento_id: '', foto_url: '' });
        setSaveError('');
        setSaveOk('');
        setEmpleadoEditandoId(null);
        setModo(null);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNuevo = () => {
        resetForm();
        setModo('crear');
    };

    const handleEditar = (emp) => {
        setModo('editar');
        setEmpleadoEditandoId(emp.id);
        setFormData({
            nombre:         emp.nombre,
            apellidos:      emp.apellidos,
            email:          emp.email,
            password:       '',
            rol:            emp.rol,
            departamento_id: emp.departamento_id || '',
            foto_url:       emp.foto_url || '',
        });
        setSaveError('');
        setSaveOk('');
    };

    // ── Guardar: crear o editar ───────────────────────
    const handleGuardar = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        setSaveOk('');

        try {
            if (modo === 'crear') {
                await crearUsuario({
                    nombre:         formData.nombre,
                    apellidos:      formData.apellidos,
                    email:          formData.email,
                    password:       formData.password,
                    rol:            formData.rol,
                    departamento_id: formData.departamento_id || null,
                });
                setSaveOk('Empleado creado correctamente.');
                cargarTodo();
                setTimeout(resetForm, 1500);
            } else {
                await updateUsuario(empleadoEditandoId, {
                    nombre:         formData.nombre,
                    apellidos:      formData.apellidos,
                    email:          formData.email,
                    rol:            formData.rol,
                    departamento_id: formData.departamento_id || null,
                    foto_url:       formData.foto_url,
                });
                setSaveOk('Empleado actualizado correctamente.');
                cargarTodo();
                setTimeout(resetForm, 1500);
            }
        } catch (err) {
            setSaveError(err.message || 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    // ── Bloquear / Activar ────────────────────────────
    const handleToggleActivo = async (emp) => {
        const accion = emp.activo ? 'bloquear' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} a ${emp.nombre} ${emp.apellidos}?`)) return;

        try {
            await toggleActivoUsuario(emp.id);
            cargarTodo();
        } catch (err) {
            alert(err.message || `Error al ${accion} el empleado.`);
        }
    };

    // ── Render ────────────────────────────────────────
    if (loading) return <p style={{ padding: '24px' }}>Cargando empleados...</p>;
    if (loadError) return <p style={{ padding: '24px', color: 'red' }}>{loadError}</p>;

    const activos   = empleados.filter((e) => e.activo);
    const inactivos = empleados.filter((e) => !e.activo);

    return (
        <div className="empleados-container">
            <div className="empleados-header">
                <h2>Gestión de Empleados</h2>
                <button className="btn btn-primary" onClick={handleNuevo}>
                    + Nuevo Empleado
                </button>
            </div>

            {/* ── Formulario crear / editar ── */}
            {modo && (
                <div className="formulario-empleado">
                    <h3>{modo === 'crear' ? '➕ Nuevo Empleado' : '✏️ Editar Empleado'}</h3>
                    <form onSubmit={handleGuardar}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text" name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    required placeholder="Nombre"
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellidos *</label>
                                <input
                                    type="text" name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleInputChange}
                                    required placeholder="Apellidos"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email" name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required placeholder="email@empresa.com"
                                />
                            </div>
                            {modo === 'crear' && (
                                <div className="form-group">
                                    <label>Contraseña inicial *</label>
                                    <input
                                        type="password" name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Rol *</label>
                                <select name="rol" value={formData.rol} onChange={handleInputChange} required>
                                    {ROLES.map((r) => (
                                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Departamento</label>
                                <select name="departamento_id" value={formData.departamento_id} onChange={handleInputChange}>
                                    <option value="">— Sin departamento —</option>
                                    {departamentos.map((d) => (
                                        <option key={d.id} value={d.id}>{d.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            {modo === 'editar' && (
                                <div className="form-group form-group-full">
                                    <label>URL Foto (opcional)</label>
                                    <input
                                        type="text" name="foto_url"
                                        value={formData.foto_url}
                                        onChange={handleInputChange}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                        </div>

                        {saveError && <p className="form-error">{saveError}</p>}
                        {saveOk    && <p className="form-success">{saveOk}</p>}

                        <div className="form-actions">
                            <button type="submit" className="btn btn-success" disabled={saving}>
                                {saving ? 'Guardando...' : modo === 'crear' ? 'Crear Empleado' : 'Guardar Cambios'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Tabla de empleados activos ── */}
            <div className="lista-empleados">
                <h3>Empleados activos ({activos.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Departamento</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activos.map((emp) => (
                            <tr key={emp.id}>
                                <td>{emp.nombre} {emp.apellidos}</td>
                                <td>{emp.email}</td>
                                <td><span className={`badge badge-${emp.rol}`}>{emp.rol}</span></td>
                                <td>{emp.departamento || '—'}</td>
                                <td className="acciones-col">
                                    <button className="btn-sm btn-edit" onClick={() => handleEditar(emp)}>
                                        ✏️ Editar
                                    </button>
                                    <button className="btn-sm btn-danger" onClick={() => handleToggleActivo(emp)}>
                                        🔒 Bloquear
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {activos.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999', padding: '16px' }}>No hay empleados activos</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Tabla de empleados bloqueados (histórico) ── */}
            {inactivos.length > 0 && (
                <div className="lista-empleados inactivos">
                    <h3>Empleados bloqueados ({inactivos.length})</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Departamento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inactivos.map((emp) => (
                                <tr key={emp.id} className="fila-inactiva">
                                    <td>{emp.nombre} {emp.apellidos}</td>
                                    <td>{emp.email}</td>
                                    <td><span className={`badge badge-${emp.rol}`}>{emp.rol}</span></td>
                                    <td>{emp.departamento || '—'}</td>
                                    <td className="acciones-col">
                                        <button className="btn-sm btn-success" onClick={() => handleToggleActivo(emp)}>
                                            🔓 Activar
                                        </button>
                                    </td>
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