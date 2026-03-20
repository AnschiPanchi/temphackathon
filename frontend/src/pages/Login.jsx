import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Loader2, Eye, EyeOff, ArrowRight, Sparkles, Swords, Radar, Briefcase, Zap, Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/app');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh',
            width: '100%',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '2rem 1.25rem',
            background: 'var(--bg-base)',
            position: 'relative',
            zIndex: 50
        }}>
            <div className="slide-up" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

                {/* Form header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
                        <span className="text-gradient" style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.04em' }}>AlgoPrep AI</span>
                    </Link>
                    <div style={{
                        display: 'inline-flex', padding: '0.85rem',
                        background: 'rgba(124,58,237,0.1)', borderRadius: '14px',
                        color: 'var(--violet-light)', margin: '0 auto 1.35rem',
                        border: '1px solid rgba(124,58,237,0.2)',
                        boxShadow: '0 0 30px rgba(124,58,237,0.15)'
                    }}>
                        <Lock size={22} />
                    </div>
                    <h2 style={{ marginBottom: '0.4rem', fontSize: '1.85rem', color: 'var(--text-main)' }}>Welcome back</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to continue your preparation</p>
                </div>

                <div className="glass-panel" style={{ padding: '2.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {error && (
                        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Email or Username</label>
                            <div style={{ position: 'relative' }}>
                                <User size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text" className="form-control"
                                    placeholder="your@email.com"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                <Link to="/forgot-password" style={{ color: 'var(--violet-light)', textDecoration: 'none', fontSize: '0.76rem', fontWeight: 600 }}>Forgot password?</Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                                />
                                <button type="button" onClick={() => setShowPwd(p => !p)}
                                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem', fontSize: '0.95rem' }} disabled={loading}>
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <>Sign In <ArrowRight size={17} /></>}
                        </button>
                    </form>

                    <div className="glow-divider" style={{ margin: '2rem 0' }} />

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--violet-light)', textDecoration: 'none', fontWeight: 700 }}>Create one free →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
