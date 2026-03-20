import React, { useState, useEffect, useContext } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Sun, Moon, LayoutDashboard, Sparkles, Brain, ChevronDown,
    Flame, Swords, Trophy, Briefcase, Radar, User, Settings as SettingsIcon, LogOut
} from 'lucide-react';

const Navigation = ({ theme, toggleTheme, onLogoutClick, isMobileOpen, onCloseMobile }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const isInterviewActive = location.pathname === '/interview';

    const handleLogoClick = (e) => {
        if (isInterviewActive) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('request-interview-exit'));
        }
        if (onCloseMobile) onCloseMobile();
    };

    const handleLinkClick = () => {
        if (onCloseMobile) onCloseMobile();
    };

    return (
        <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-inner" style={{ paddingTop: '1rem' }}>
                
                {/* Repositioned Logout Button - Top Left */}
                {user && (
                    <div style={{ padding: '0 0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                            onClick={onLogoutClick}
                            className="btn btn-ghost"
                            title="Logout"
                            style={{ 
                                color: 'var(--danger)', 
                                opacity: 0.8, 
                                padding: '0.6rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(239, 68, 68, 0.1)',
                                background: 'rgba(239, 68, 68, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8rem',
                                fontWeight: 700
                            }}
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}

                {/* Brand */}
                <Link to="/" onClick={handleLogoClick} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }} className="nav-brand">
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '1.45rem', margin: 0, fontWeight: 900, letterSpacing: '-0.04em' }}>AlgoPrep AI</h1>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Career-Ready Platform</p>
                    </div>
                </Link>

                {/* User Status */}
                {user && (
                    <div className="sidebar-user-card" style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(59,130,246,0.05)', borderRadius: '14px', border: '1px solid rgba(59,130,246,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div className="avatar-circle" style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}>
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>{user?.username}</h3>
                                <p style={{ fontSize: '0.65rem', margin: 0, color: 'var(--violet-light)', fontWeight: 800, letterSpacing: '0.05em' }}>STATUS: LEVEL 1</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Nav links */}
                <nav className="sidebar-nav">
                    {user && (
                        <>
                            <div className="sidebar-nav-section">
                                <span className="sidebar-nav-label">Overview</span>
                                <NavLink to="/app" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <LayoutDashboard size={18} /> Dashboard
                                </NavLink>
                                <NavLink to="/ai-mentor-pro" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ color: 'var(--violet-light)', fontWeight: 700 }}>
                                    <Sparkles size={18} /> AI Mentor <span className="badge badge-violet" style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem', marginLeft: 'auto' }}>PRO</span>
                                </NavLink>
                            </div>

                            <div className="sidebar-nav-section">
                                <span className="sidebar-nav-label">Practice & Compete</span>
                                <NavLink to="/community" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Sparkles size={18} /> System Quests
                                </NavLink>
                                <NavLink to="/practice" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Brain size={18} /> Practice Hub
                                </NavLink>
                                <NavLink to="/duel" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Swords size={18} /> Code Duel
                                </NavLink>
                                <NavLink to="/battle" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Flame size={18} /> Quiz Battle
                                </NavLink>
                                <NavLink to="/leaderboard" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Trophy size={18} /> Rankings
                                </NavLink>
                            </div>

                            <div className="sidebar-nav-section">
                                <span className="sidebar-nav-label">Career Hub</span>
                                <NavLink to="/jobs" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Briefcase size={18} /> Job Match
                                </NavLink>
                                <NavLink to="/talent" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Radar size={18} /> Talent Analytics
                                </NavLink>
                                <NavLink to="/achievements" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <Trophy size={18} /> Achievements
                                </NavLink>
                                <NavLink to="/profile" onClick={handleLinkClick} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                    <User size={18} /> Profile
                                </NavLink>
                            </div>
                        </>
                    )}
                </nav>

                {/* Bottom Actions */}
                <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {user && (
                        <Link to="/setup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.4)', padding: '0.75rem' }}>
                            New Interview
                        </Link>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={toggleTheme}
                            className="btn btn-ghost btn-icon"
                            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            style={{ 
                                flex: '0 1 auto', 
                                whiteSpace: 'nowrap', 
                                padding: '0.5rem 0.75rem', 
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            {theme === 'dark' ? <><Sun size={15} /> Light</> : <><Moon size={15} /> Dark</>}
                        </button>
                        
                        {user && (
                            <NavLink to="/settings" onClick={handleLinkClick} className={({ isActive }) => `btn btn-ghost btn-icon ${isActive ? 'active' : ''}`} style={{ padding: '0.5rem' }}>
                                <SettingsIcon size={17} />
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Navigation;
