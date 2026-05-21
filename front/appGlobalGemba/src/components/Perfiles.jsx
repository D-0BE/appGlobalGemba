import { useEffect, useState } from "react";
import { getMe, updateUsuario } from "../api";
import "./Perfiles.css";

function Perfiles() {
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        getMe()
            .then((data) => {
                setUser({
                    id:              data.id,
                    nombre:          data.nombre || '',
                    apellidos:       data.apellidos || '',
                    fechaNacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.slice(0, 10) : '',
                    fotoUrl:         data.foto_url || '',
                    email:           data.email || '',
                    departamento:    data.departamento || '',
                    rol:             data.rol || '',
                });
            })
            .catch(() => {
                // Fallback: leer del localStorage si la API falla
                const stored = localStorage.getItem('user');
                if (stored) {
                    const u = JSON.parse(stored);
                    setUser({
                        id:              u.id || '',
                        nombre:          u.nombre || '',
                        apellidos:       u.apellidos || '',
                        fechaNacimiento: '',
                        fotoUrl:         u.foto_url || '',
                        email:           u.email || '',
                        departamento:    '',
                        rol:             u.rol || '',
                    });
                }
            });
    }, []);

    const handleChange = (e) => {
        setUser((prevUser) => ({
            ...prevUser,
            [e.target.name]: e.target.value,
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!user.nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio";
        }

        if (!user.apellidos.trim()) {
            newErrors.apellidos = "Los apellidos son obligatorios";
        }

        if (!user.email.includes("@")) {
            newErrors.email = "Email no válido";
        }

        if (!user.fechaNacimiento) {
            newErrors.fechaNacimiento = "La fecha es obligatoria";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        setSaveError('');

        try {
            const updated = await updateUsuario(user.id, {
                nombre:          user.nombre,
                apellidos:       user.apellidos,
                fecha_nacimiento: user.fechaNacimiento,
                foto_url:        user.fotoUrl,
            });

            // Sincronizar datos actualizados
            setUser((prev) => ({
                ...prev,
                nombre:          updated.nombre,
                apellidos:       updated.apellidos,
                fechaNacimiento: updated.fecha_nacimiento ? updated.fecha_nacimiento.slice(0, 10) : prev.fechaNacimiento,
                fotoUrl:         updated.foto_url || prev.fotoUrl,
                email:           updated.email || prev.email,
            }));

            // Actualizar también el localStorage
            const stored = localStorage.getItem('user');
            if (stored) {
                const u = JSON.parse(stored);
                localStorage.setItem('user', JSON.stringify({
                    ...u,
                    nombre:    updated.nombre,
                    apellidos: updated.apellidos,
                    foto_url:  updated.foto_url,
                }));
            }

            setEditMode(false);
        } catch (err) {
            setSaveError(err.message || 'Error al guardar los cambios.');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <p>Cargando perfil...</p>;

    const fotoUrl =
        user.fotoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            `${user.nombre} ${user.apellidos}`
        )}&background=007bff&color=fff&rounded=true`;

    return (
        <div className="perfil-page">
            <div className="perfil-container">
                <h2 className="perfil-title">Mi Perfil</h2>

                {/* FOTO */}
                <div className="perfil-foto">
                    <img src={fotoUrl} alt="foto perfil" />
                </div>

                {editMode ? (
                    <>
                        <div className="input-group">
                            <label className="input-label">Nombre</label>
                            <input
                                className="input-field"
                                name="nombre"
                                value={user.nombre}
                                onChange={handleChange}
                            />
                            {errors.nombre && <p style={{ color: "red" }}>{errors.nombre}</p>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Apellidos</label>
                            <input
                                className="input-field"
                                name="apellidos"
                                value={user.apellidos}
                                onChange={handleChange}
                            />
                            {errors.apellidos && <p style={{ color: "red" }}>{errors.apellidos}</p>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <input
                                className="input-field"
                                name="email"
                                type="email"
                                value={user.email}
                                disabled
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Fecha de nacimiento</label>
                            <input
                                type="date"
                                className="input-field"
                                name="fechaNacimiento"
                                value={user.fechaNacimiento}
                                onChange={handleChange}
                            />
                            {errors.fechaNacimiento && (
                                <p style={{ color: "red" }}>{errors.fechaNacimiento}</p>
                            )}
                        </div>

                        <div className="input-group">
                            <label className="input-label">URL de foto</label>
                            <input
                                className="input-field"
                                name="fotoUrl"
                                value={user.fotoUrl}
                                onChange={handleChange}
                            />
                        </div>

                        {/* 🔒 BLOQUEADOS */}
                        <div className="input-group">
                            <label className="input-label">Departamento</label>
                            <input className="input-field" value={user.departamento} disabled />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Rol</label>
                            <input className="input-field" value={user.rol} disabled />
                        </div>

                        {saveError && <p style={{ color: 'red', marginBottom: '10px' }}>{saveError}</p>}

                        <button className="login-button" onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                            className="login-button"
                            style={{ marginTop: '8px', background: '#888' }}
                            onClick={() => { setEditMode(false); setSaveError(''); }}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </>
                ) : (
                    <>
                        <div className="perfil-row">
                            <div className="perfil-card">
                                <p><strong>Nombre</strong></p>
                                <p>{user.nombre} {user.apellidos}</p>
                            </div>
                            <div className="perfil-card">
                                <p><strong>Email</strong></p>
                                <p>{user.email}</p>
                            </div>
                        </div>

                        <div className="perfil-row">
                            <div className="perfil-card">
                                <p><strong>Departamento</strong></p>
                                <p>{user.departamento || '—'}</p>
                            </div>
                            <div className="perfil-card">
                                <p><strong>Rol</strong></p>
                                <p>{user.rol}</p>
                            </div>
                        </div>

                        <div className="perfil-card" style={{ marginBottom: "18px" }}>
                            <p><strong>Fecha de nacimiento</strong></p>
                            <p>{user.fechaNacimiento || '—'}</p>
                        </div>

                        <div className="perfil-actions">
                            <button
                                className="login-button"
                                onClick={() => setEditMode(true)}
                            >
                                Editar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Perfiles;