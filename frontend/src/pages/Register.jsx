import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Loader2, ShieldCheck, Eye, EyeOff, ArrowRight, CheckCircle2, Lock, User, Mail } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captchaQuestion, setCaptchaQuestion] = useState('');
    const [captchaKey, setCaptchaKey] = useState({ n1: 0, n2: 0 });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useContext(AuthContext);

    const generateCaptcha = () => {
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        setCaptchaKey({ n1, n2 });
        setCaptchaQuestion(`${n1} + ${n2}`);
    };

    useEffect(() => { generateCaptcha(); }, []);

    const strength = password.length === 0 ? 0
        : password.length < 6 ? 1
        : password.length < 10 ? 2 : 3;
    const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];
    const strengthColors = ['', 'var(--danger)', 'var(--warning)', '#34d399'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(username, email, password, captchaQuestion, captchaAnswer);
            navigate('/app');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register');
            generateCaptcha();
            setCaptchaAnswer('');
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
            {/* Orbs */}
            <div className="orb orb-violet" style={{ width: '450px', height: '450px', top: '-100px', right: '-100px', opacity: 0.4 }} />
            <div className="orb orb-cyan" style={{ width: '300px', height: '300px', bottom: '-50px', left: '-50px', opacity: 0.3 }} />

            <div className="slide-up" style={{ width: '100%', maxWidth: '500px', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
                        <span className="text-gradient" style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.04em' }}>AlgoPrep AI</span>
                    </Link>
                    <div style={{
                        display: 'inline-flex', padding: '0.9rem',
                        background: 'rgba(16,185,129,0.08)', borderRadius: '16px',
                        color: '#34d399', margin: '0 auto 1.25rem',
                        border: '1px solid rgba(16,185,129,0.2)',
                        boxShadow: '0 0 30px rgba(16,185,129,0.1)'
                    }}>
                        <UserPlus size={24} />
                    </div>
                    <h2 style={{ marginBottom: '0.4rem' }}>Create your account</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join the career-ready coding platform</p>
                </div>

                <div className="glass-panel" style={{ padding: '2.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {error && (
                        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Username</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="text" className="form-control" placeholder="johndev" value={username} onChange={e => setUsername(e.target.value)} required style={{ paddingLeft: '2.4rem' }} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="email" className="form-control" placeholder="john@dev.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '2.4rem' }} />
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                {password.length > 0 && (
                                    <span style={{ fontSize: '0.68rem', color: strengthColors[strength], fontWeight: 700 }}>
                                        {strengthLabels[strength]}
                                    </span>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    className="form-control" placeholder="min. 6 characters"
                                    value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                                    style={{ paddingLeft: '2.4rem', paddingRight: '3rem' }}
                                />
                                <button type="button" onClick={() => setShowPwd(p => !p)}
                                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '7px' }}>
                                    {[1, 2, 3].map(level => (
                                        <div key={level} style={{
                                            flex: 1, height: '3px', borderRadius: '99px',
                                            background: strength >= level ? strengthColors[strength] : 'rgba(255,255,255,0.07)',
                                            transition: 'var(--t-base)',
                                            boxShadow: strength >= level ? `0 0 8px ${strengthColors[strength]}60` : 'none'
                                        }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Captcha */}
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <ShieldCheck size={13} /> Human Verification
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '3px', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--r-sm)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    {captchaQuestion}
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '1.3rem' }}>=</span>
                                <input
                                    type="number" className="form-control" placeholder="?"
                                    style={{ textAlign: 'center', width: '80px', padding: '0.5rem' }}
                                    value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }} disabled={loading}>
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <>Create Account <ArrowRight size={17} /></>}
                        </button>
                    </form>

                    <div className="glow-divider" style={{ margin: '1.75rem 0 1.5rem' }} />

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--violet-light)', textDecoration: 'none', fontWeight: 700 }}>Sign in →</Link>
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {['Free forever', 'No credit card', 'AI-powered'].map(text => (
                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <CheckCircle2 size={12} color="#34d399" /> {text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Register;
