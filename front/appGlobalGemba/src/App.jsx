
import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Vacaciones from './components/Vacaciones';
import Perfiles from './components/Perfiles';
import Reporting from './components/Reporting';
import Empleados from './components/Empleados';

function App(){
    const location = useLocation();
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
    
    // Configuración base de enlaces
    const links = {
        home: "Home",
        vacaciones: "Vacaciones",
        perfil: "Perfil",
        reporting: "Reporting",
    }

    // Si el usuario es administrador, añadimos "Empleados"
    if (userRole === 'admin') {
        links.empleados = "Empleados";
    }

    const showNavbar = location.pathname !== '/';

    return(
        <>
            {showNavbar && <Navbar linksProp={links} />}
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
    )
}
export default App;