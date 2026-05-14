import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ setUserRole }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        
        if (username === 'Admin' && password === 'admin') {
            localStorage.setItem('role', 'admin');
            setUserRole('admin');
            navigate('/dashboard');
        } else if (username === 'User' && password === 'user') {
            localStorage.setItem('role', 'user');
            setUserRole('user');
            navigate('/dashboard');
        } else {
            setError('Credenciales incorrectas. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Iniciar Sesión</h2>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label className="input-label">Usuario:</label>
                        <input 
                            type="text" 
                            placeholder="Usuario" 
                            required 
                            className="input-field" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                        />
                    </div>
                    {error && <p className="error-message" style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
                    <button type="submit" className="login-button">Ingresar</button>
                </form>
            </div>
        </div>
    );
}

export default Login;