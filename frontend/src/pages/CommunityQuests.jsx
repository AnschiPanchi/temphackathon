import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
    Flame, Trophy, Clock, Calendar, CheckCircle2, Zap,
    Code2, Loader2, ChevronDown, ChevronUp, Send, Shield,
    Star, RefreshCw, AlertCircle, Lock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ── Countdown timer hook ──────────────────────────────────────────
const useCountdown = (targetDate) => {
    const calc = () => {
        const diff = Math.max(0, new Date(targetDate) - new Date());
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return { h, m, s, total: diff };
    };
    const [time, setTime] = useState(calc);
    useEffect(() => {
        const id = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(id);
    }, [targetDate]);
    return time;
};

// ── Timer Display ──────────────────────────────────────────────────
const CountdownTimer = ({ validUntil, type }) => {
    const { h, m, s, total } = useCountdown(validUntil);
    const pad = n => String(n).padStart(2, '0');
    const isUrgent = total < 3 * 3600000; // < 3 hours
    const color = isUrgent ? 'var(--danger)' : type === 'weekly' ? 'var(--pink-light)' : 'var(--cyan-light)';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={13} color={color} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
                {pad(h)}:{pad(m)}:{pad(s)}
            </span>
        </div>
    );
};

// ── Single Quest Card ──────────────────────────────────────────────
const QuestCard = ({ quest, onComplete }) => {
    const [expanded, setExpanded] = useState(false);
    const [lang, setLang] = useState('javascript');
    const [code, setCode] = useState('');
    const [approach, setApproach] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const { token, addXP } = useContext(AuthContext);
    const textareaRef = useRef(null);

    const isWeekly = quest.type === 'weekly';
    const accentColor = isWeekly ? 'var(--pink)' : 'var(--cyan)';
    const accentLight = isWeekly ? 'var(--pink-light)' : 'var(--cyan-light)';
    const accentDim = isWeekly ? 'rgba(236,72,153,0.10)' : 'rgba(6,182,212,0.10)';

    // Set starter code when language or quest changes
    useEffect(() => {
        if (quest.starterCode?.[lang]) {
            setCode(quest.starterCode[lang]);
        }
    }, [lang, quest._id]);

    const handleTabKey = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const ta = textareaRef.current;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const newVal = code.substring(0, start) + '  ' + code.substring(end);
            setCode(newVal);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + 2;
            });
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        setResult(null);
        try {
            const res = await axios.post(`${API_URL}/api/quests/${quest._id}/submit`, {
                code, approach, language: lang
            }, { headers: { Authorization: `Bearer ${token}` } });
            setResult(res.data);
            onComplete(quest._id, res.data);
            // Update XP/level in nav bar immediately
            if (res.data.xpAwarded > 0 && res.data.totalXp !== undefined) {
                addXP(res.data.xpAwarded, res.data.level);
            }
        } catch (err) {
            setResult({ error: err.response?.data?.error || 'Submission failed.' });
        } finally {
            setSubmitting(false);
        }
    };

    const diffColor = {
        Easy: 'var(--emerald)', Medium: 'var(--gold)', Hard: 'var(--danger)'
    }[quest.difficulty] || 'var(--text-muted)';

    const validUntilDate = new Date(quest.validUntil);

    return (
        <div className="glass-panel" style={{
            border: `1px solid ${quest.isCompleted ? 'rgba(16,185,129,0.3)' : `rgba(${isWeekly ? '236,72,153' : '6,182,212'},0.2)`}`,
            background: quest.isCompleted ? 'rgba(16,185,129,0.03)' : accentDim,
            transition: 'all 0.3s ease',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 1.75rem', cursor: 'pointer' }} onClick={() => !quest.isCompleted && setExpanded(e => !e)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        {/* Badges row */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.2rem 0.65rem', borderRadius: 999,
                                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                                background: accentDim, color: accentLight, border: `1px solid ${accentColor}40`
                            }}>
                                {isWeekly ? <Calendar size={11} /> : <Flame size={11} />}
                                {isWeekly ? 'Weekly Challenge' : 'Daily Quest'}
                            </span>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.2rem 0.65rem', borderRadius: 999,
                                fontSize: '0.65rem', fontWeight: 700, color: diffColor,
                                background: `${diffColor}15`, border: `1px solid ${diffColor}35`
                            }}>
                                {quest.difficulty}
                            </span>
                            <span style={{
                                fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)',
                                padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.04)',
                                borderRadius: 999, border: '1px solid var(--border)'
                            }}>
                                {quest.topic}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                            {quest.isCompleted && <CheckCircle2 size={16} color="var(--success)" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />}
                            {quest.title}
                        </h3>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 0 }}>
                            {quest.description}
                        </p>
                    </div>

                    {/* Right column: XP + timer + toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            color: 'var(--gold)', fontWeight: 900, fontSize: '1.1rem'
                        }}>
                            <Zap size={16} fill="currentColor" />
                            +{quest.xpReward} XP
                        </div>
                        <CountdownTimer validUntil={validUntilDate} type={quest.type} />
                        {!quest.isCompleted && (
                            <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        )}
                        {quest.isCompleted && quest.score !== null && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700
                            }}>
                                <Star size={13} fill="currentColor" /> Score: {quest.score}/100
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded problem + editor */}
            {!quest.isCompleted && expanded && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Examples & constraints */}
                    <div style={{ padding: '1.25rem 1.75rem', background: 'rgba(0,0,0,0.15)' }}>
                        {quest.examples?.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div className="section-label" style={{ marginBottom: '0.75rem' }}>Examples</div>
                                {quest.examples.map((ex, i) => (
                                    <div key={i} style={{
                                        background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                                        padding: '0.75rem 1rem', marginBottom: '0.5rem',
                                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: 1.7
                                    }}>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Input: </span><span style={{ color: 'var(--cyan-light)' }}>{ex.input}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Output: </span><span style={{ color: 'var(--emerald)' }}>{ex.output}</span></div>
                                        {ex.explanation && <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif', fontSize: '0.78rem' }}>
                                            {ex.explanation}
                                        </div>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {quest.constraints?.length > 0 && (
                            <div>
                                <div className="section-label" style={{ marginBottom: '0.5rem' }}>Constraints</div>
                                <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                    {quest.constraints.map((c, i) => (
                                        <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.2rem' }}>{c}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Code editor area */}
                    <div style={{ padding: '1.25rem 1.75rem' }}>
                        {/* Language selector */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {['javascript', 'python', 'java', 'cpp'].map(l => (
                                <button key={l} onClick={() => setLang(l)} style={{
                                    padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.72rem',
                                    fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                                    background: lang === l ? accentColor : 'rgba(255,255,255,0.05)',
                                    color: lang === l ? '#fff' : 'var(--text-muted)',
                                }}>
                                    {l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Monaco-style textarea */}
                        <div style={{
                            background: '#0d1117', borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.08)',
                            overflow: 'hidden', marginBottom: '1rem'
                        }}>
                            <div style={{
                                padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <Code2 size={13} color="var(--text-muted)" />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                    solution.{lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang === 'java' ? 'java' : 'cpp'}
                                </span>
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                onKeyDown={handleTabKey}
                                rows={14}
                                spellCheck={false}
                                style={{
                                    width: '100%', padding: '1rem 1.25rem',
                                    background: 'transparent', border: 'none', outline: 'none',
                                    color: '#e6edf3', fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '0.85rem', lineHeight: 1.65, resize: 'vertical',
                                    minHeight: '220px'
                                }}
                            />
                        </div>

                        {/* Approach textarea */}
                        <textarea
                            value={approach}
                            onChange={e => setApproach(e.target.value)}
                            placeholder="Briefly describe your approach (optional, helps with grading)..."
                            rows={3}
                            style={{
                                width: '100%', padding: '0.75rem 1rem',
                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                borderRadius: 8, color: 'var(--text-main)', outline: 'none', resize: 'vertical',
                                fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.6,
                                marginBottom: '1rem'
                            }}
                        />

                        {/* Result */}
                        {result && (
                            <div style={{
                                padding: '1rem 1.25rem', borderRadius: 10, marginBottom: '1rem',
                                background: result.error ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)',
                                border: `1px solid ${result.error ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
                            }}>
                                {result.error ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                        {result.error}
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</span>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: result.score >= 60 ? 'var(--success)' : result.score >= 30 ? 'var(--gold)' : 'var(--danger)' }}>
                                                    {result.score}/100
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>XP Earned</span>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>+{result.xpAwarded}</div>
                                            </div>
                                        </div>
                                        {result.feedback && <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', margin: 0 }}>{result.feedback}</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                width: '100%', padding: '0.85rem', borderRadius: 10, border: 'none',
                                background: submitting ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${accentColor}, ${accentLight})`,
                                color: submitting ? 'var(--text-muted)' : '#fff',
                                fontWeight: 800, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            {submitting ? <><Loader2 size={16} className="animate-spin" /> Grading...</> : <><Send size={16} /> Submit Solution</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Completed state */}
            {quest.isCompleted && (
                <div style={{
                    padding: '1rem 1.75rem', borderTop: '1px solid rgba(16,185,129,0.15)',
                    background: 'rgba(16,185,129,0.05)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                    <CheckCircle2 size={18} color="var(--success)" />
                    <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.875rem' }}>
                        Completed! {quest.score !== null ? `Score: ${quest.score}/100 · ` : ''} +{Math.round(quest.xpReward * (quest.score || 100) / 100)} XP earned
                    </span>
                    <Lock size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                </div>
            )}
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────────────
const CommunityQuests = () => {
    const { token } = useContext(AuthContext);
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);

    const fetchQuests = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/api/quests/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuests(res.data);
        } catch (err) {
            if (err.response?.status === 503 || err.message?.includes('generating')) {
                setGenerating(true);
            } else {
                setError(err.response?.data?.error || 'Failed to load quests.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchQuests();
    }, [token]);

    const handleComplete = (questId, result) => {
        setQuests(prev => prev.map(q =>
            q._id === questId
                ? { ...q, isCompleted: true, score: result.score }
                : q
        ));
    };

    const daily = quests.find(q => q.type === 'daily');
    const weekly = quests.find(q => q.type === 'weekly');

    return (
        <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>

                {/* Page header */}
                <div className="slide-up" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div className="badge badge-warning" style={{ marginBottom: '1rem', padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}>
                        <Shield size={14} /> Global Quest Board
                    </div>
                    <h1 style={{ fontSize: '2.6rem', marginBottom: '0.75rem' }}>
                        Community <span className="text-gradient">Quests</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto' }}>
                        AI-generated challenges — same for every player. New daily quest resets at midnight IST, weekly on Monday.
                    </p>
                </div>

                {/* Stat strip */}
                {quests.length > 0 && (
                    <div className="slide-up" style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem',
                        marginBottom: '2.5rem'
                    }}>
                        {[
                            { label: 'Daily XP', value: `+${daily?.xpReward || 100}`, icon: <Flame size={16} color="var(--cyan)" />, color: 'var(--cyan-light)' },
                            { label: 'Weekly XP', value: `+${weekly?.xpReward || 350}`, icon: <Trophy size={16} color="var(--gold)" />, color: 'var(--gold-light)' },
                            { label: 'Completed', value: quests.filter(q => q.isCompleted).length + '/' + quests.length, icon: <CheckCircle2 size={16} color="var(--success)" />, color: 'var(--success)' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                                <div style={{ marginBottom: '0.25rem' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1.25rem', minHeight: '350px', color: 'var(--text-muted)' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Loader2 size={28} className="animate-spin" color="var(--cyan)" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 700, color: 'var(--text-sub)', marginBottom: '0.35rem' }}>
                                {generating ? '✨ Generating today\'s AI challenges...' : 'Loading quests...'}
                            </p>
                            <p style={{ fontSize: '0.8rem' }}>This may take a moment if quests are being generated fresh</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
                        <AlertCircle size={32} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>{error}</p>
                        <button onClick={fetchQuests} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                            <RefreshCw size={15} /> Try Again
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {daily && <QuestCard quest={daily} onComplete={handleComplete} />}
                        {weekly && <QuestCard quest={weekly} onComplete={handleComplete} />}
                    </div>
                )}

                {/* Info bar */}
                <div className="glass-panel" style={{
                    marginTop: '2.5rem', padding: '1.25rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    background: 'rgba(124,58,237,0.04)', border: '1px dashed rgba(124,58,237,0.25)'
                }}>
                    <div style={{ padding: '0.6rem', background: 'rgba(124,58,237,0.12)', borderRadius: '50%', color: 'var(--violet-light)', flexShrink: 0 }}>
                        <Star size={20} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', marginBottom: '0.2rem' }}>How scoring works</h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            XP reward is proportional to your score. Score 100% → full XP. Score below 40% → no XP, but it counts toward quest completion streaks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityQuests;
