import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Award, Code2, Clock, Flame, Play, ArrowRight, BarChart3, BrainCircuit,
    Swords, Radar, Briefcase, TrendingUp, Zap, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import AttemptModal from '../components/AttemptModal';
import { calculateLevel, getLevelProgress, getXPToNextLevel } from '../utils/leveling.js';



const QUICK_LINKS = [
    { to: '/duel', icon: <Swords size={20} />, label: 'Code Duel', desc: '1v1 battle', color: '#db2777', bg: 'rgba(219,39,119,0.1)' },
    { to: '/talent', icon: <Radar size={20} />, label: 'Analytics', desc: 'Talent DNA', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { to: '/jobs', icon: <Briefcase size={20} />, label: 'Job Match', desc: 'Find roles', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { to: '/forge', icon: <Zap size={20} />, label: 'The Forge', desc: 'Career coach', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
];

const Dashboard = () => {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

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


    return (
        <>
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

                {/* Header */}
                <div className="flex-between slide-up" style={{ marginBottom: '2rem' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', fontWeight: 600 }}>
                            Welcome back
                        </p>
                        <h2 style={{ margin: 0 }}>
                            {user?.username || 'Engineer'} <span className="text-gradient" style={{ fontSize: '1.75rem' }}>👋</span>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Track your progress and start a new session</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', height: 'fit-content' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Level</div>
                                <div style={{ fontWeight: 800, color: 'var(--violet-light)' }}>Lvl {user?.level || 1}</div>
                            </div>
                            <div style={{ width: '120px' }}>
                                <div className="progress-bar" style={{ height: '8px' }}>
                                    <div className="progress-fill" style={{ width: `${getLevelProgress(user?.xp || 0)}%` }} />
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {getXPToNextLevel(user?.xp || 0)} XP to next
                                </div>
                            </div>
                        </div>
                        {user?.currentStreak > 0 && (
                            <div className="badge badge-warning">
                                <Flame size={13} /> {user.currentStreak} day streak
                            </div>
                        )}
                        <button onClick={() => navigate('/setup')} className="btn btn-primary" style={{ gap: '0.5rem' }}>
                            <Play size={16} /> Start Practice
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }} className="stagger">
                    {[
                         { icon: <Zap size={20} />, label: 'Total XP', value: user?.xp || 0, iconBg: 'rgba(245,158,11,0.12)', iconColor: 'var(--warning)' },
                        { icon: <Award size={20} />, label: 'Avg Score', value: averageScore > 0 ? `${averageScore}/100` : '—', iconBg: 'rgba(124,58,237,0.15)', iconColor: 'var(--violet-light)' },
                        { icon: <Code2 size={20} />, label: 'Problems Solved', value: trends.length, iconBg: 'rgba(16,185,129,0.12)', iconColor: 'var(--success)' },
                        { icon: <Clock size={20} />, label: 'Time Practiced', value: `${hours > 0 ? `${hours}h ` : ''}${minutes}m`, iconBg: 'rgba(16,185,129,0.12)', iconColor: 'var(--success)' },

                    ].map(({ icon, label, value, iconBg, iconColor }) => (
                        <div key={label} className="glass-panel slide-up">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
                                <div>
                                    <div className="stat-label">{label}</div>
                                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{value}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick links to new features */}
                <div style={{ marginBottom: '2rem' }}>
                    <div className="section-label">Platform Features</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                        {QUICK_LINKS.map(({ to, icon, label, desc, color, bg }) => (
                            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                                <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}
                                >
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                                    </div>
                                    <ChevronRight size={15} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>


            </div>
        </>
    );
};

export default Dashboard;
