import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import {
    Clock, CheckCircle2, BookOpen, Target, Loader2, AlertCircle, BarChart3, Briefcase,
    BrainCircuit, ArrowRight
} from 'lucide-react';
import AttemptModal from '../components/AttemptModal';

const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const DOMAINS = {
    'DSA': ['Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Dynamic Programming', 'Sliding Window', 'Two Pointers'],
    'Web Development': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'REST APIs', 'Authentication', 'State Management'],
    'Databases': ['SQL queries', 'MongoDB', 'Database design', 'Indexing', 'Transactions'],
    'Blockchain': ['Blockchain fundamentals', 'Smart contracts', 'Solidity basics', 'Token contracts', 'Web3 interaction'],
    'System Design': ['Scalability concepts', 'Load balancing', 'Microservices', 'Database scaling', 'Caching strategies', 'API architecture'],
    'DevOps': ['Docker basics', 'CI/CD pipelines', 'Deployment strategies']
};

const mapTopicToDomain = (topic = '') => {
    const t = topic.toLowerCase();
    for (const [domain, keywords] of Object.entries(DOMAINS)) {
        if (keywords.some(k => t.includes(k.toLowerCase()))) return domain;
    }
    return 'Other';
};

// --- Heatmap Helpers ---
const getDayKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const buildCalendar = (attempts) => {
    const counts = {};
    attempts.forEach(a => { const k = getDayKey(a.createdAt); counts[k] = (counts[k] || 0) + 1; });
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7);
    start.setDate(start.getDate() - start.getDay());
    const weeks = [];
    let current = new Date(start);
    let week = [];
    while (current <= today) {
        if (week.length === 7) { weeks.push(week); week = []; }
        const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
        week.push({ date: new Date(current), count: counts[key] || 0 });
        current.setDate(current.getDate() + 1);
    }
    while (week.length < 7) week.push({ date: null, count: -1 });
    if (week.length) weeks.push(week);
    return weeks;
};

const cellColor = count => {
    if (count <= 0) return 'rgba(255,255,255,0.05)';
    if (count === 1) return 'rgba(124,58,237,0.35)';
    if (count === 2) return 'rgba(124,58,237,0.6)';
    return 'rgba(124,58,237,0.9)';
};

const TrendTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
        <div style={{ background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(124,58,237,0.4)', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.8rem' }}>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color: 'var(--violet-light)', margin: 0, fontWeight: 700 }}>Score: {payload[0].value}/100</p>
        </div>
    );
    return null;
};

const TalentAnalytics = () => {
    const { user } = useContext(AuthContext);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttempt, setSelectedAttempt] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/performance/trends`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSessions(data || []);
            } catch (err) {
                console.error("Failed to load analytics data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '1rem' }}>
                <Loader2 className="animate-spin" size={40} color="var(--violet-light)" />
                <p className="text-muted">Loading Analytics Dashboard...</p>
            </div>
        );
    }

    const hasData = sessions.length > 0;
    
    // --- BASIC METRICS ---
    const totalSeconds = sessions.reduce((sum, s) => sum + (Number(s.timeSpent) || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const displayTime = totalMinutes > 60 ? `${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m` : `${totalMinutes} minutes`;
    const problemsSolved = sessions.length;
    const uniqueSkills = [...new Set(sessions.map(s => s.topic).filter(Boolean))];
    const skillsPracticedCount = uniqueSkills.length;

    // --- INSIGHTS COMPUTATION ---
    const topicStats = {};
    sessions.forEach(a => {
        if (!a.topic) return;
        if (!topicStats[a.topic]) topicStats[a.topic] = { total: 0, count: 0 };
        topicStats[a.topic].total += a.score;
        topicStats[a.topic].count++;
    });
    const topicAverages = Object.entries(topicStats)
        .map(([topic, { total, count }]) => ({ topic, avg: Math.round(total / count), count }))
        .sort((a, b) => a.avg - b.avg);
    const weakest = topicAverages[0] || null;
    const strongest = topicAverages[topicAverages.length - 1] || null;
    const passRate = hasData ? Math.round((sessions.filter(a => a.score >= 70).length / sessions.length) * 100) : null;

    // --- SCORE TREND ---
    const chartData = [...sessions].reverse().slice(-10).map(a => ({
        name: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: a.score,
    }));

    // --- HEATMAP CALENDAR ---
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const calendarWeeks = buildCalendar(sessions);
    const monthLabels = [];
    calendarWeeks.forEach((week, wi) => {
        // Place label on the week that contains the 1st of the month
        const firstDayOfMonth = week.find(d => d.date && d.date.getDate() === 1);
        if (firstDayOfMonth) {
            monthLabels.push({ index: wi, label: MONTHS[firstDayOfMonth.date.getMonth()] });
        }
    });

    // Ensure the very first visible month has a label if not caught by the 1st
    if (calendarWeeks.length > 0 && monthLabels.length === 0 || (monthLabels[0]?.index > 2)) {
        const firstDate = calendarWeeks[0].find(d => d.date)?.date;
        if (firstDate) {
            monthLabels.push({ index: 0, label: MONTHS[firstDate.getMonth()] });
        }
    }

    return (
        <>
            <AttemptModal attempt={selectedAttempt} onClose={() => setSelectedAttempt(null)} />
            <div className="container slide-up" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1100px' }}>
                
                {/* Header */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.8rem', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '12px', color: 'var(--violet-light)', marginBottom: '1rem' }}>
                        <BarChart3 size={28} />
                    </div>
                    <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.2rem' }}>Practice <span style={{ color: 'var(--violet-light)' }}>Analytics</span></h1>
                    <p className="text-muted" style={{ fontSize: '1.05rem', margin: 0 }}>Deep dive into your mock interview performance, skill coverage, and activity trends.</p>
                </div>

                {!hasData ? (
                    /* No Data Empty State */
                    <div className="glass-panel flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                        <AlertCircle size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                        <h3 style={{ margin: 0 }}>No Analytics Data Available</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>
                            You currently have <strong>0 minutes practiced</strong> and <strong>0 problems solved</strong>. <br/> Start a mock interview session to unlock your analytics!
                        </p>
                        <a href="/setup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Start Practice</a>
                    </div>
                ) : (
                    <>
                        {/* Top Metrics Row */}
                        <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                            <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid var(--violet-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(124, 58, 237, 0.15)', borderRadius: '12px', color: 'var(--violet-light)' }}>
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.25rem', fontWeight: 600 }}>Total Practice Time</p>
                                    <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>{displayTime}</h3>
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid var(--success)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: 'var(--success)' }}>
                                    <CheckCircle2 size={28} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.25rem', fontWeight: 600 }}>Problems Solved</p>
                                    <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>{problemsSolved}</h3>
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid var(--cyan)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '12px', color: 'var(--cyan)' }}>
                                    <BookOpen size={28} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.25rem', fontWeight: 600 }}>Skills Practiced</p>
                                    <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>{skillsPracticedCount}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Moved: Your Insights */}
                        {sessions.length >= 3 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div className="section-label">Your Insights</div>
                                <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    {weakest && weakest.avg < 80 && (
                                        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--danger)' }}>
                                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', margin: '0 0 0.4rem', fontWeight: 700 }}>Needs Attention</p>
                                            <h4 style={{ margin: '0 0 0.35rem' }}>{weakest.topic}</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Avg: <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{weakest.avg}/100</span> over {weakest.count} attempts</p>
                                        </div>
                                    )}
                                    {strongest && topicAverages.length > 1 && (
                                        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--success)' }}>
                                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', margin: '0 0 0.4rem', fontWeight: 700 }}>Your Best Topic</p>
                                            <h4 style={{ margin: '0 0 0.35rem' }}>{strongest.topic}</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Avg: <span style={{ color: 'var(--success)', fontWeight: 700 }}>{strongest.avg}/100</span> over {strongest.count} attempts</p>
                                        </div>
                                    )}
                                    {passRate !== null && (
                                        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--violet-light)' }}>
                                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--violet-light)', margin: '0 0 0.4rem', fontWeight: 700 }}>Pass Rate (≥70)</p>
                                            <h2 style={{ margin: '0 0 0.35rem', color: passRate >= 70 ? 'var(--success)' : passRate >= 50 ? 'var(--warning)' : 'var(--danger)', fontSize: '2rem' }}>{passRate}%</h2>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{passRate >= 70 ? '🎉 Excellent consistency!' : passRate >= 50 ? '💪 Getting there!' : '📚 Focus on fundamentals'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Moved: Score Trend */}
                        {chartData.length >= 2 && (
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                                <div className="section-label">Performance Trend</div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Outfit' }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip content={<TrendTooltip />} />
                                        <defs>
                                            <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#7c3aed" />
                                                <stop offset="100%" stopColor="#db2777" />
                                            </linearGradient>
                                        </defs>
                                        <Line type="monotone" dataKey="score" stroke="url(#scoreGrad)" strokeWidth={3} dot={{ fill: '#7c3aed', r: 5, strokeWidth: 0 }} activeDot={{ r: 8, fill: '#a78bfa' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Moved: Activity Heatmap */}
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <div className="section-label">Practice Activity Graph</div>
                            <div style={{ position: 'relative', minWidth: '750px' }}>
                                <div style={{ display: 'flex', marginBottom: '4px', paddingLeft: '22px', position: 'relative', height: '15px' }}>
                                    {monthLabels.map((lbl, i) => (
                                        <div key={i} style={{ position: 'absolute', left: `${22 + (lbl.index * 15)}px`, fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {lbl.label}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
                                        {['','Mon','','Wed','','Fri',''].map((d, i) => (
                                            <div key={i} style={{ height: '13px', fontSize: '9px', color: 'var(--text-muted)', lineHeight: '13px', textAlign: 'right', paddingRight: '4px', width: '18px' }}>{d}</div>
                                        ))}
                                    </div>
                                    {calendarWeeks.map((week, wi) => (
                                        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {week.map((day, di) => {
                                                if (!day.date) return <div key={di} style={{ width: '13px', height: '13px', borderRadius: '2px' }} />;
                                                return (
                                                    <div key={di} className="heatmap-cell"
                                                        title={`${day.date.toDateString()}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                                                        style={{ backgroundColor: cellColor(day.count), cursor: day.count > 0 ? 'pointer' : 'default', width: '13px', height: '13px', borderRadius: '2px', transition: 'transform 0.1s' }}
                                                        onMouseEnter={e => e.currentTarget.style.transform = day.count > 0 ? 'scale(1.2)' : 'none'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--text-muted)' }}>
                                    <span>Less</span>
                                    {[0,1,2,3].map(n => <div key={n} style={{ width: '13px', height: '13px', borderRadius: '2px', backgroundColor: cellColor(n) }} />)}
                                    <span>More</span>
                                </div>
                            </div>
                        </div>

                        {/* Moved: Recent Interviews Table */}
                        <div className="section-label" style={{ marginBottom: '0.75rem' }}>Recent Interviews log</div>
                        <div className="glass-panel" style={{ overflow: 'hidden' }}>
                            {sessions.length === 0 ? (
                                <div className="flex-center" style={{ padding: '4rem', flexDirection: 'column', textAlign: 'center' }}>
                                    <BrainCircuit size={48} color="var(--violet-light)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                                    <h4 style={{ marginBottom: '0.5rem' }}>No interviews yet</h4>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Your past attempts will appear here</p>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead><tr>
                                        <th>Topic</th><th>Difficulty</th><th>Score</th><th>Date</th><th />
                                    </tr></thead>
                                    <tbody>
                                        {[...sessions].reverse().slice(0, 15).map(attempt => (
                                            <tr key={attempt._id}>
                                                <td style={{ fontWeight: 600 }}>{attempt.topic}</td>
                                                <td>
                                                    <span className={`diff-${attempt.difficulty?.toLowerCase() || 'easy'}`}>{attempt.difficulty}</span>
                                                </td>
                                                <td style={{ color: attempt.score >= 80 ? 'var(--success)' : attempt.score >= 60 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>
                                                    {attempt.score}/100
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{new Date(attempt.createdAt).toLocaleDateString()}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedAttempt(attempt)} title="View details">
                                                        <ArrowRight size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                    </>
                )}
            </div>
        </>
    );
};

export default TalentAnalytics;
