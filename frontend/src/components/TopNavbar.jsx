import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const TopNavbar = ({ theme, toggleTheme }) => {
    const { user } = useContext(AuthContext);

    return (
        <nav className="glass-panel" style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '94%',
            maxWidth: '1200px',
            height: '64px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900, letterSpacing: '-0.04em' }}>AlgoPrep</h1>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.4rem 0.6rem' }}>Log In</Link>
                <Link to="/register" className="btn btn-primary" style={{ 
                    padding: '0.45rem 0.85rem', 
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
                }}>Sign Up</Link>
            </div>
        </nav>
    );
};

export default TopNavbar;
