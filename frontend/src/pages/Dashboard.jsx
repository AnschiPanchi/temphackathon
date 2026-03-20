import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Award, Code2, Clock, Flame, Play, Swords, Radar, Briefcase, Zap, ChevronRight,
    Sparkles, BookOpen, ArrowUpRight, Brain, BarChart3, TrendingUp
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getLevelProgress, getXPToNextLevel } from '../utils/leveling.js';

const QUICK_LINKS = [
    { to: '/duel', icon: <Swords size={20} />, label: 'Code Duel', desc: '1v1 live battle', accent: '#ec4899' },
    { to: '/talent', icon: <Radar size={20} />, label: 'Talent DNA', desc: 'Skill analytics', accent: '#22d3ee' },
    { to: '/jobs', icon: <Briefcase size={20} />, label: 'Job Match', desc: 'AI-matched roles', accent: '#a78bfa' },
    { to: '/forge', icon: <Zap size={20} />, label: 'The Forge', desc: 'Career goals', accent: '#fbbf24' },
    { to: '/practice', icon: <BookOpen size={20} />, label: 'Practice Hub', desc: 'Curated problems', accent: '#34d399' },
    { to: '/ai-mentor-pro', icon: <Sparkles size={20} />, label: 'AI Mentor', desc: 'Get coached', accent: '#a78bfa' },
];

/* Spotlight mouse-following effect on cards */
function useSpotlight(ref) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handler = (e) => {
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        };
        el.addEventListener('mousemove', handler);
        return () => el.removeEventListener('mousemove', handler);
    }, []);
}

const StatCard = ({ icon, label, value, accent, delay }) => (
    <div
        className="bento-card"
        style={{
            padding: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '1.1rem',
            animationDelay: `${delay}ms`,
            animation: `fadeUp 0.6s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms both`,
        }}
    >
        <div style={{
            width: '50px', height: '50px', borderRadius: '14px',
            background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: `1px solid ${accent}30`,
            boxShadow: `0 0 24px ${accent}20`
        }}>
            {icon}
        </div>
        <div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color: 'var(--text-main)' }}>{value}</div>
        </div>
        {/* vertical glow accent line */}
        <div style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: '3px', borderRadius: '99px',
            background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
            opacity: 0.7
        }} />
    </div>
);

const Dashboard = () => {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const gridRef = React.useRef(null);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/performance/trends`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTrends(data);
            } catch (e) { console.error('Failed to fetch trends', e); }
            finally { setLoading(false); }
        };
        fetchTrends();
    }, []);

    const averageScore = trends.length ? Math.round(trends.reduce((a, c) => a + c.score, 0) / trends.length) : 0;
    const totalTime = trends.reduce((a, c) => a + (Number(c.timeSpent) || 0), 0);
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    const lvlProgress = getLevelProgress(user?.xp || 0);

    return (
        <>
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2.5rem', paddingBottom: '5rem' }}>

            {/* ─── HEADER ─── */}
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div className="slide-up">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399aa', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                            Welcome back
                        </span>
                    </div>
                    <h2 style={{ fontSize: '2.2rem', margin: 0 }}>
                        {user?.username || 'Engineer'}
                        {' '}<span className="text-gradient">👋</span>
                    </h2>
                    <p style={{ marginTop: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {user?.targetJob ? `Targeting ${user.targetJob} — Keep grinding.` : 'Set your career goals in The Forge →'}
                    </p>
                </div>

                {/* Right: Level + streak + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }} className="fade-in">
                    {/* Level pill */}
                    <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', minWidth: '175px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Level</span>
                            <span style={{ fontWeight: 800, color: 'var(--violet-light)', fontSize: '0.9rem' }}>Lvl {user?.level || 1}</span>
                        </div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${lvlProgress}%` }} /></div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{getXPToNextLevel(user?.xp || 0)} XP to next</div>
                    </div>

                    {user?.currentStreak > 0 && (
                        <div className="badge badge-warning" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', boxShadow: '0 0 15px rgba(245,158,11,0.2)' }}>
                            <Flame size={13} /> {user.currentStreak}d streak
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/setup')}
                        className="btn btn-primary btn-lg"
                        style={{ gap: '0.5rem' }}
                    >
                        <Play size={16} fill="white" /> Start Session
                    </button>
                </div>
            </div>

            {/* ─── STAT CARDS ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem', marginBottom: '2rem' }}>
                <StatCard delay={0}   icon={<Zap size={20}    />} label="Total XP"        value={(user?.xp || 0).toLocaleString()} accent="#fbbf24" />
                <StatCard delay={80}  icon={<Award size={20}  />} label="Avg Score"        value={averageScore > 0 ? `${averageScore}/100` : '—'}    accent="#a78bfa" />
                <StatCard delay={160} icon={<Code2 size={20}  />} label="Problems Solved"  value={trends.length}                                     accent="#34d399" />
                <StatCard delay={240} icon={<Clock size={20}  />} label="Time Practiced"   value={`${hours > 0 ? `${hours}h ` : ''}${minutes}m`}    accent="#22d3ee" />
            </div>

            {/* ─── PLATFORM FEATURES ─── */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div className="section-label">Platform Features</div>
                <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '0.85rem' }}>
                    {QUICK_LINKS.map(({ to, icon, label, desc, accent }, i) => (
                        <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                            <div
                                className="glass-panel"
                                style={{
                                    padding: '1.1rem 1.3rem',
                                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                                    cursor: 'pointer',
                                    animation: `fadeUp 0.5s var(--ease) ${i * 60}ms both`
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = `${accent}50`;
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 25px ${accent}20`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '';
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                                onMouseDown={e => {
                                    e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
                                }}
                                onMouseUp={e => {
                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1)';
                                }}
                            >
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '11px',
                                    background: `${accent}14`, color: accent,
                                    border: `1px solid ${accent}25`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    boxShadow: `0 0 18px ${accent}18`
                                }}>
                                    {icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{label}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{desc}</div>
                                </div>
                                <ArrowUpRight size={14} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.4 }} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ─── QUICK ACTIONS ─── */}
            <div>
                <div className="section-label">Quick Actions</div>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'New AI Interview', icon: <Brain size={14} />, to: '/setup', cls: 'btn-outline' },
                        { label: 'Find a Duel', icon: <Swords size={14} />, to: '/duel', cls: 'btn-ghost' },
                        { label: 'Practice', icon: <BookOpen size={14} />, to: '/practice', cls: 'btn-ghost' },
                        { label: 'Analytics', icon: <BarChart3 size={14} />, to: '/talent', cls: 'btn-ghost' },
                        { label: 'Leaderboard', icon: <TrendingUp size={14} />, to: '/leaderboard', cls: 'btn-ghost' },
                    ].map(({ label, icon, to, cls }) => (
                        <button key={to} onClick={() => navigate(to)} className={`btn ${cls}`} style={{ gap: '0.45rem' }}>
                            {icon} {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        </>
    );
};

export default Dashboard;
