import { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Vacaciones from './components/Vacaciones';
import Perfiles from './components/Perfiles';
import Reporting from './components/Reporting';
import Empleados from './components/Empleados';

function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setUserRole('');
        navigate('/');
    };

    // Configuración base de enlaces
    const links = {
        home: 'Home',
        vacaciones: 'Vacaciones',
        perfil: 'Perfil',
        reporting: 'Reporting',
    };

    // Si el usuario es administrador o jefe, añadimos "Empleados"
    if (userRole === 'admin' || userRole === 'jefe') {
        links.empleados = 'Empleados';
    }

    const showNavbar = location.pathname !== '/';

    return (
        <>
            {showNavbar && <Navbar linksProp={links} onLogout={handleLogout} />}
            <main>
                <Routes>
                    <Route path="/" element={<Login setUserRole={setUserRole} />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/vacaciones" element={<Vacaciones />} />
                    <Route path="/perfil" element={<Perfiles />} />
                    <Route path="/reporting" element={<Reporting />} />
                    <Route path="/empleados" element={<Empleados />} />
                </Routes>
            </main>
        </>
    );
}

export default App;