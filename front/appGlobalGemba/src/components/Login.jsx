import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import './Login.css';

function Login({ setUserRole }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(email, password);

            // Guardar token y datos del usuario en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.usuario));
            localStorage.setItem('role', data.usuario.rol);

            // Actualizar estado global de rol
            setUserRole(data.usuario.rol);

            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Credenciales incorrectas. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Iniciar Sesión</h2>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label className="input-label">Email:</label>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            required
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Contraseña:</label>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            required
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    {error && (
                        <p className="error-message" style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>
                            {error}
                        </p>
                    )}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Entrando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;