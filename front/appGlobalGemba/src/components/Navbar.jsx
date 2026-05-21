import React from 'react';
import { Link } from 'react-router-dom';
import "./Dashboard.css"; // Usa los estilos del header anterior

function Navbar({ linksProp, onLogout }) {
    return (
        <header className="header">
            <h1 className="title">Bienvenidos al portal de GlobalGemba</h1>
            <nav>
                <ul className="header-list">
                    <li>
                        <Link className="link" to="/dashboard">{linksProp.home}</Link>
                    </li>
                    <li>
                        <Link className="link" to="/vacaciones">{linksProp.vacaciones}</Link>
                    </li>
                    <li>
                        <Link className="link" to="/perfil">{linksProp.perfil}</Link>
                    </li>
                    <li>
                        <Link className="link" to="/reporting">{linksProp.reporting}</Link>
                    </li>
                    {linksProp.empleados && (
                        <li>
                            <Link className="link" to="/empleados">{linksProp.empleados}</Link>
                        </li>
                    )}
                    <li>
                        <button className="link logout-btn" onClick={onLogout} type="button">
                            Cerrar sesión
                        </button>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;
