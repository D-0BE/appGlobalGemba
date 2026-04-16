import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Aquí puedes agregar la lógica de verificación más adelante
        navigate('/dashboard'); // Te lleva al Dashboard
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Iniciar Sesión</h2>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label className="input-label">Usuario:</label>
                        <input type="text" placeholder="Usuario" required className="input-field" />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Contraseña:</label>
                        <input type="password" placeholder="Contraseña" required className="input-field" />
                    </div>
                    <button type="submit" className="login-button">Ingresar</button>
                </form>
            </div>
        </div>
    );
}

export default Login;