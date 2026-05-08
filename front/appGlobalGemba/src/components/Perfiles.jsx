import { useEffect, useState } from "react";
import "./Perfiles.css";

function Perfiles() {
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser({
                nombre: "",
                apellidos: "",
                fechaNacimiento: "",
                fotoUrl: "",
                email: "",
                departamento: "",
                rol: "",
                turno: "",
                horario: ""
            });
        }
    }, []);

    const handleChange = (e) => {
        setUser((prevUser) => ({
            ...prevUser,
            [e.target.name]: e.target.value
        }));
    };

    const validate = () => {
        let newErrors = {};

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

    const handleSave = () => {
        if (!validate()) return;

        localStorage.setItem("user", JSON.stringify(user));
        setEditMode(false);
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
                                onChange={handleChange}
                            />
                            {errors.email && <p style={{ color: "red" }}>{errors.email}</p>}
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

                        <div className="input-group">
                            <label className="input-label">Turno</label>
                            <input className="input-field" value={user.turno} disabled />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Horario</label>
                            <input className="input-field" value={user.horario} disabled />
                        </div>

                        <button className="login-button" onClick={handleSave}>
                            Guardar
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
                                <p>{user.departamento}</p>
                            </div>
                            <div className="perfil-card">
                                <p><strong>Rol</strong></p>
                                <p>{user.rol}</p>
                            </div>
                        </div>

                        <div className="perfil-card" style={{ marginBottom: "18px" }}>
                            <p><strong>Fecha de nacimiento</strong></p>
                            <p>{user.fechaNacimiento}</p>
                        </div>

                        <div className="perfil-row">
                            <div className="perfil-card">
                                <p><strong>Turno</strong></p>
                                <p>{user.turno}</p>
                            </div>
                            <div className="perfil-card">
                                <p><strong>Horario</strong></p>
                                <p>{user.horario}</p>
                            </div>
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