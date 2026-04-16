import React from 'react';
import { Link } from 'react-router-dom';
import "./Dashboard.css"; // Usa los estilos del header anterior

function Navbar({ linksProp }) {
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
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;
