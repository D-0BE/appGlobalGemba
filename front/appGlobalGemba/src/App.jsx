
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Vacaciones from './components/Vacaciones';
import Perfiles from './components/Perfiles';
import Reporting from './components/Reporting';

function App(){
    const location = useLocation();
    
    const links = {
        home: "Home",
        vacaciones: "Vacaciones",
        perfil: "Perfil",
    }

    const showNavbar = location.pathname !== '/';

    return(
        <>
            {showNavbar && <Navbar linksProp={links} />}
            <main>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/vacaciones" element={<Vacaciones />} />
                    <Route path="/perfil" element={<Perfiles />} />
                    <Route path="/reporting" element={<Reporting />} />
                </Routes>
            </main>
        </>
    )
}
export default App;