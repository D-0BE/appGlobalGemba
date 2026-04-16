import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Aquí puedes agregar la lógica de verificación más adelante
        navigate('/dashboard'); // Te lleva al Dashboard
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Usuario: </label><br />
                    <input type="text" placeholder="Usuario" required />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Contraseña: </label><br />
                    <input type="password" placeholder="Contraseña" required />
                </div>
                <button type="submit">Ingresar</button>
            </form>
        </div>
    );
}

export default Login;