import React, { useEffect, useState } from 'react';
import { getUsuarios, crearUsuario, updateUsuario, toggleActivoUsuario, getDepartamentos } from '../api';
import './Empleados.css';

const ROLES = ['empleado', 'jefe', 'admin'];
const TIPOS_JORNADA = ['TOTAL', 'MEDIA'];

const FORM_INICIAL = {
  nombre: '', primer_apellido: '', segundo_apellido: '',
  dni: '', nacionalidad: '', telefono: '',
  email: '', email_personal: '', password: '',
  rol: 'empleado', departamento_id: '', foto_url: '',
  fecha_nacimiento: '', fecha_incorporacion: '',
  dias_vacaciones_curso: 22, dias_vacaciones_anterior: 0,
  tipo_jornada: 'TOTAL', hora_entrada: '09:00', hora_salida: '19:00',
};

function Empleados() {
  const [empleados, setEmpleados]         = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState('');

  // Modo: null | 'crear' | 'editar'
  const [modo, setModo]                             = useState(null);
  const [empleadoEditandoId, setEmpleadoEditandoId] = useState(null);
  const [formData, setFormData]                     = useState(FORM_INICIAL);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk]     = useState('');

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
    setFormData(FORM_INICIAL);
    setSaveError('');
    setSaveOk('');
    setEmpleadoEditandoId(null);
    setModo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNuevo = () => {
    resetForm();
    setModo('crear');
  };

  const handleEditar = (emp) => {
    setModo('editar');
    setEmpleadoEditandoId(emp.id);
    setFormData({
      nombre:                   emp.nombre || '',
      primer_apellido:          emp.primer_apellido || '',
      segundo_apellido:         emp.segundo_apellido || '',
      dni:                      emp.dni || '',
      nacionalidad:             emp.nacionalidad || '',
      telefono:                 emp.telefono || '',
      email:                    emp.email || '',
      email_personal:           emp.email_personal || '',
      password:                 '',
      rol:                      emp.rol || 'empleado',
      departamento_id:          emp.departamento_id || '',
      foto_url:                 emp.foto_url || '',
      fecha_nacimiento:         emp.fecha_nacimiento ? emp.fecha_nacimiento.slice(0, 10) : '',
      fecha_incorporacion:      emp.fecha_incorporacion ? emp.fecha_incorporacion.slice(0, 10) : '',
      dias_vacaciones_curso:    emp.dias_vacaciones_curso ?? 22,
      dias_vacaciones_anterior: emp.dias_vacaciones_anterior ?? 0,
      tipo_jornada:             emp.tipo_jornada || 'TOTAL',
      hora_entrada:             emp.hora_entrada ? emp.hora_entrada.slice(0, 5) : '09:00',
      hora_salida:              emp.hora_salida  ? emp.hora_salida.slice(0, 5)  : '19:00',
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
          nombre:                   formData.nombre,
          primer_apellido:          formData.primer_apellido,
          segundo_apellido:         formData.segundo_apellido || null,
          dni:                      formData.dni || null,
          nacionalidad:             formData.nacionalidad || null,
          telefono:                 formData.telefono || null,
          email:                    formData.email,
          email_personal:           formData.email_personal || null,
          password:                 formData.password,
          rol:                      formData.rol,
          departamento_id:          formData.departamento_id || null,
          foto_url:                 formData.foto_url || null,
          fecha_nacimiento:         formData.fecha_nacimiento || null,
          fecha_incorporacion:      formData.fecha_incorporacion || null,
          dias_vacaciones_curso:    Number(formData.dias_vacaciones_curso),
          dias_vacaciones_anterior: Number(formData.dias_vacaciones_anterior),
          tipo_jornada:             formData.tipo_jornada,
          hora_entrada:             formData.hora_entrada,
          hora_salida:              formData.hora_salida,
        });
        setSaveOk('Empleado creado correctamente.');
      } else {
        await updateUsuario(empleadoEditandoId, {
          nombre:                   formData.nombre,
          primer_apellido:          formData.primer_apellido,
          segundo_apellido:         formData.segundo_apellido || null,
          dni:                      formData.dni || null,
          nacionalidad:             formData.nacionalidad || null,
          telefono:                 formData.telefono || null,
          email:                    formData.email,
          email_personal:           formData.email_personal || null,
          rol:                      formData.rol,
          departamento_id:          formData.departamento_id || null,
          foto_url:                 formData.foto_url || null,
          fecha_nacimiento:         formData.fecha_nacimiento || null,
          fecha_incorporacion:      formData.fecha_incorporacion || null,
          dias_vacaciones_curso:    Number(formData.dias_vacaciones_curso),
          dias_vacaciones_anterior: Number(formData.dias_vacaciones_anterior),
          tipo_jornada:             formData.tipo_jornada,
          hora_entrada:             formData.hora_entrada,
          hora_salida:              formData.hora_salida,
        });
        setSaveOk('Empleado actualizado correctamente.');
      }
      cargarTodo();
      setTimeout(resetForm, 1500);
    } catch (err) {
      setSaveError(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Bloquear / Activar ────────────────────────────
  const handleToggleActivo = async (emp) => {
    const accion = emp.activo ? 'bloquear' : 'activar';
    if (!window.confirm(`¿Seguro que quieres ${accion} a ${emp.nombre} ${emp.primer_apellido}?`)) return;

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
          <h3>{modo === 'crear' ? 'Nuevo Empleado' : 'Editar Empleado'}</h3>
          <form onSubmit={handleGuardar}>

            {/* ── Sección: Datos personales ── */}
            <div className="form-section-title">Datos personales</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre}
                  onChange={handleInputChange} required placeholder="Nombre" />
              </div>
              <div className="form-group">
                <label>Primer apellido *</label>
                <input type="text" name="primer_apellido" value={formData.primer_apellido}
                  onChange={handleInputChange} required placeholder="Primer apellido" />
              </div>
              <div className="form-group">
                <label>Segundo apellido</label>
                <input type="text" name="segundo_apellido" value={formData.segundo_apellido}
                  onChange={handleInputChange} placeholder="Segundo apellido" />
              </div>
              <div className="form-group">
                <label>DNI</label>
                <input type="text" name="dni" value={formData.dni}
                  onChange={handleInputChange} placeholder="12345678A" />
              </div>
              <div className="form-group">
                <label>Nacionalidad</label>
                <input type="text" name="nacionalidad" value={formData.nacionalidad}
                  onChange={handleInputChange} placeholder="Española" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" name="telefono" value={formData.telefono}
                  onChange={handleInputChange} placeholder="+34 600 000 000" />
              </div>
              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento}
                  onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Fecha de incorporación</label>
                <input type="date" name="fecha_incorporacion" value={formData.fecha_incorporacion}
                  onChange={handleInputChange} />
              </div>
            </div>

            {/* ── Sección: Contacto ── */}
            <div className="form-section-title">Contacto y acceso</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Email personal</label>
                <input type="email" name="email_personal" value={formData.email_personal}
                  onChange={handleInputChange} placeholder="personal@correo.com" />
              </div>
              <div className="form-group">
                <label>Email corporativo *</label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleInputChange} required placeholder="nombre@globalgemba.com" />
              </div>
              {modo === 'crear' && (
                <div className="form-group">
                  <label>Contraseña inicial *</label>
                  <input type="password" name="password" value={formData.password}
                    onChange={handleInputChange} required placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>
              )}
              <div className="form-group form-group-full">
                <label>URL Foto (opcional)</label>
                <input type="text" name="foto_url" value={formData.foto_url}
                  onChange={handleInputChange} placeholder="https://..." />
              </div>
            </div>

            {/* ── Sección: Organización ── */}
            <div className="form-section-title">Organización</div>
            <div className="form-grid">
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
            </div>

            {/* ── Sección: Jornada ── */}
            <div className="form-section-title">Jornada laboral</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Tipo de jornada</label>
                <select name="tipo_jornada" value={formData.tipo_jornada} onChange={handleInputChange}>
                  {TIPOS_JORNADA.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hora entrada</label>
                <input type="time" name="hora_entrada" value={formData.hora_entrada}
                  onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Hora salida</label>
                <input type="time" name="hora_salida" value={formData.hora_salida}
                  onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Días vacaciones año curso</label>
                <input type="number" name="dias_vacaciones_curso" value={formData.dias_vacaciones_curso}
                  onChange={handleInputChange} min={0} max={365} />
              </div>
              <div className="form-group">
                <label>Días vacaciones año anterior</label>
                <input type="number" name="dias_vacaciones_anterior" value={formData.dias_vacaciones_anterior}
                  onChange={handleInputChange} min={0} max={365} />
              </div>
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
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Primer apellido</th>
                <th>Segundo apellido</th>
                <th>DNI</th>
                <th>Nacionalidad</th>
                <th>Teléfono</th>
                <th>Email personal</th>
                <th>Email corporativo</th>
                <th>Incorporación</th>
                <th>Jornada</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Vac. curso</th>
                <th>Vac. anterior</th>
                <th>Rol</th>
                <th>Departamento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.nombre}</td>
                  <td>{emp.primer_apellido}</td>
                  <td>{emp.segundo_apellido || '—'}</td>
                  <td>{emp.dni || '—'}</td>
                  <td>{emp.nacionalidad || '—'}</td>
                  <td>{emp.telefono || '—'}</td>
                  <td>{emp.email_personal || '—'}</td>
                  <td>{emp.email}</td>
                  <td>{emp.fecha_incorporacion ? emp.fecha_incorporacion.slice(0, 10) : '—'}</td>
                  <td><span className={`badge-jornada ${(emp.tipo_jornada || 'TOTAL').toLowerCase()}`}>{emp.tipo_jornada || 'TOTAL'}</span></td>
                  <td>{emp.hora_entrada ? emp.hora_entrada.slice(0, 5) : '—'}</td>
                  <td>{emp.hora_salida  ? emp.hora_salida.slice(0, 5)  : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{emp.dias_vacaciones_curso ?? 22}</td>
                  <td style={{ textAlign: 'center' }}>{emp.dias_vacaciones_anterior ?? 0}</td>
                  <td><span className={`badge badge-${emp.rol}`}>{emp.rol}</span></td>
                  <td>{emp.departamento || '—'}</td>
                  <td className="acciones-col">
                    <button className="btn-sm btn-edit" onClick={() => handleEditar(emp)}>Editar</button>
                    <button className="btn-sm btn-danger" onClick={() => handleToggleActivo(emp)}>Bloquear</button>
                  </td>
                </tr>
              ))}
              {activos.length === 0 && (
                <tr><td colSpan={17} style={{ textAlign: 'center', color: '#999', padding: '16px' }}>No hay empleados activos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tabla de empleados bloqueados ── */}
      {inactivos.length > 0 && (
        <div className="lista-empleados inactivos">
          <h3>Empleados bloqueados ({inactivos.length})</h3>
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Primer apellido</th>
                  <th>Segundo apellido</th>
                  <th>DNI</th>
                  <th>Email corporativo</th>
                  <th>Rol</th>
                  <th>Departamento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map((emp) => (
                  <tr key={emp.id} className="fila-inactiva">
                    <td>{emp.nombre}</td>
                    <td>{emp.primer_apellido}</td>
                    <td>{emp.segundo_apellido || '—'}</td>
                    <td>{emp.dni || '—'}</td>
                    <td>{emp.email}</td>
                    <td><span className={`badge badge-${emp.rol}`}>{emp.rol}</span></td>
                    <td>{emp.departamento || '—'}</td>
                    <td className="acciones-col">
                      <button className="btn-sm btn-success" onClick={() => handleToggleActivo(emp)}>Activar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Empleados;