import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import {
    Swords, Timer, Trophy, Send, Users, Zap, Crown, Copy,
    CheckCircle2, Bot, Wifi, WifiOff, Hash, Play, ArrowRight, ChevronLeft,
    Loader2, MessageSquare, AlertTriangle, XCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const DuelRoom = () => {
    const { user, token } = useContext(AuthContext);
    const { roomId: urlRoomId } = useParams();
    const navigate = useNavigate();

    const [phase, setPhase] = useState('lobby'); // lobby | waiting | duel | judging | result
    const [roomId, setRoomId] = useState(urlRoomId || '');
    const [players, setPlayers] = useState([]);
    const [code, setCode] = useState('// Solve the problem here...\nfunction solve(nums, target) {\n\n}');
    const [problem, setProblem] = useState({
        title: 'Two Sum',
        difficulty: 'Easy',
        desc: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample: nums = [2,7,11,15], target = 9 → Output: [0,1]',
        tags: ['Array', 'Hash Table'],
    });
    const [elapsed, setElapsed] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [duelResult, setDuelResult] = useState(null);
    const [opponentSubmitted, setOpponentSubmitted] = useState(false);
    const [language, setLanguage] = useState('javascript');
    const [socketReady, setSocketReady] = useState(false);
    const [error, setError] = useState('');
    const [disconnectedPlayer, setDisconnectedPlayer] = useState(null);

    const timerRef = useRef(null);
    const socketRef = useRef(null);
    const pendingJoin = useRef(null); // stores join data until socket is ready

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeTab, setActiveTab] = useState('problem');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Socket setup ─────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;

        const s = io(API_URL, { auth: { token } });
        socketRef.current = s;

        s.on('connect', () => {
            console.log('[DUEL] Socket connected:', s.id);
            setSocketReady(true);
            // If there was a pending join (e.g. user clicked Join before socket connected), emit now
            if (pendingJoin.current) {
                s.emit('join_room', pendingJoin.current);
                pendingJoin.current = null;
            }
        });

        s.on('room_update', (room) => {
            console.log('[DUEL] room_update:', room);
            setPlayers(room.players || []);
            if (room.language) setLanguage(room.language);
            if (room.problem) setProblem(room.problem);

            if ((room.players || []).length === 2) {
                setPhase('duel');
            }
        });

        s.on('player_submitted', ({ username }) => {
            if (username !== user?.username) {
                setOpponentSubmitted(true);
            }
        });

        s.on('player_disconnected', ({ username }) => {
            setDisconnectedPlayer(username);
            setPhase('waiting'); // drop back to waiting if opponent leaves mid-duel
        });

        s.on('room_full', () => {
            setError('This room is already full. Please try a different room code.');
            setPhase('lobby');
        });

        s.on('duel_finished', (result) => {
            setDuelResult(result);
            setPhase('result');
            clearInterval(timerRef.current);
        });

        s.on('duel_error', ({ message }) => {
            setError(message);
        });

        s.on('disconnect', () => {
            console.log('[DUEL] Socket disconnected');
            setSocketReady(false);
        });

        return () => {
            s.disconnect();
            clearInterval(timerRef.current);
        };
    }, [token]);

    // ── Timer ─────────────────────────────────────────────────────
    useEffect(() => {
        if (phase === 'duel') {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

    useEffect(() => {
        if (duelResult) setActiveTab('problem');
    }, [duelResult]);

    // ── Actions ───────────────────────────────────────────────────
    const doJoin = (id) => {
        const payload = { roomId: id, username: user?.username };
        if (socketRef.current?.connected) {
            socketRef.current.emit('join_room', payload);
        } else {
            // Socket not connected yet — queue it
            pendingJoin.current = payload;
        }
        setPhase('waiting');
    };

    const handleCreate = () => {
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(id);
        setDisconnectedPlayer(null);
        doJoin(id);
    };

    const handleJoin = () => {
        if (!roomId.trim()) return;
        setDisconnectedPlayer(null);
        doJoin(roomId.trim().toUpperCase());
    };

    const handleSubmit = () => {
        if (!socketRef.current || isSubmitted) return;
        setIsSubmitted(true);
        socketRef.current.emit('submit_code', { roomId, username: user?.username, code, language });
        if (opponentSubmitted) setPhase('judging');
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (socketRef.current) {
            socketRef.current.emit('change_language', { roomId, language: newLang });
        }
    };

    // ── LOBBY ─────────────────────────────────────────────────────
    if (phase === 'lobby') return (
        <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div className="slide-up" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '1.25rem', background: 'rgba(219,39,119,0.1)', borderRadius: '24px', marginBottom: '1.5rem', color: 'var(--pink-light)', border: '1px solid rgba(219,39,119,0.2)' }}>
                    <Swords size={40} />
                </div>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Code <span className="text-gradient">Duel</span></h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
                    Challenge a friend in a real-time DSA battle. Both submit, AI judges the winner.
                </p>

                {error && (
                    <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center', maxWidth: 480, margin: '0 auto 1.5rem' }}>
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}

                <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}>Host a Battle</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create a room and share the code with your opponent.</p>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate}>
                            Create Room
                        </button>
                    </div>

                    <div className="glass-panel" style={{ padding: '2.5rem' }}>
                        <h3 style={{ marginBottom: '0.75rem' }}>Join Battle</h3>
                        <input
                            className="form-control"
                            placeholder="Enter Room Code"
                            value={roomId}
                            onChange={e => setRoomId(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && roomId && handleJoin()}
                            style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '1rem' }}
                        />
                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleJoin} disabled={!roomId.trim()}>
                            Join Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── WAITING ───────────────────────────────────────────────────
    if (phase === 'waiting') return (
        <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
                {disconnectedPlayer && (
                    <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                        ⚠️ {disconnectedPlayer} disconnected. Waiting for someone to join...
                    </div>
                )}
                <div className="spinner" style={{ width: 50, height: 50, margin: '0 auto 2rem' }}></div>
                <h2 style={{ marginBottom: '0.75rem' }}>Waiting for Opponent</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Share this code with your rival:</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.3em', color: 'var(--violet-light)', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                    {roomId}
                </div>

                {/* Player slots */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    {[0, 1].map(i => (
                        <div key={i} style={{
                            flex: 1, padding: '0.75rem', borderRadius: 8, textAlign: 'center',
                            background: players[i] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${players[i] ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`
                        }}>
                            {players[i] ? (
                                <>
                                    <CheckCircle2 size={16} color="var(--success)" style={{ marginBottom: '0.25rem' }} />
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {players[i].username === user?.username ? 'YOU' : players[i].username}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Loader2 size={16} className="animate-spin" color="var(--text-muted)" style={{ marginBottom: '0.25rem' }} />
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Waiting...</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Users size={14} /> {players.length} / 2 connected
                </div>
            </div>
        </div>
    );

    // ── DUEL / JUDGING ────────────────────────────────────────────
    if (phase === 'duel' || phase === 'judging') return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
            {/* Top bar */}
            <div style={{ minHeight: 60, background: 'rgba(13,17,23,0.98)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="pulse-dot" style={{ background: 'var(--success)' }}></div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>LIVE BATTLE</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ROOM: <span style={{ color: 'var(--text-main)' }}>{roomId}</span></div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem', fontWeight: 900, fontFamily: 'JetBrains Mono' }}>
                    <select
                        value={language}
                        onChange={e => handleLanguageChange(e.target.value)}
                        disabled={isSubmitted}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.3rem 0.6rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', outline: 'none' }}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                    <Timer size={20} color="var(--violet-light)" />
                    {fmt(elapsed)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Player badges */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {players.map(p => (
                            <div key={p.id} className="badge" style={{
                                background: p.username === user?.username ? 'var(--violet-dim)' : 'rgba(255,255,255,0.05)',
                                borderColor: p.username === user?.username ? 'var(--violet-light)' : 'var(--border)'
                            }}>
                                {p.username === user?.username ? 'YOU' : p.username.toUpperCase()}
                            </div>
                        ))}
                    </div>
                    {opponentSubmitted && <span className="badge badge-warning">OPPONENT FINISHED</span>}
                    <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={isSubmitted}>
                        {isSubmitted ? 'SUBMITTED ✓' : <><Send size={14} /> SUBMIT</>}
                    </button>
                </div>
            </div>

            {/* Mobile tabs */}
            <div className="show-mobile" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.5rem', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                <button className={`btn ${activeTab === 'problem' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('problem')} style={{ flex: 1, margin: 0 }}>Problem</button>
                <button className={`btn ${activeTab === 'code' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('code')} style={{ flex: 1, margin: 0 }}>Editor</button>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '380px 1fr', overflow: isMobile ? 'visible' : 'hidden' }}>
                {/* Problem panel */}
                <div style={{ display: (isMobile && activeTab !== 'problem') ? 'none' : 'block', padding: '2rem', borderRight: isMobile ? 'none' : '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', overflowY: 'auto' }}>
                    <div className="badge badge-success" style={{ marginBottom: '1rem' }}>{problem.difficulty}</div>
                    <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{problem.title}</h2>
                    <p style={{ color: 'var(--text-sub)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '2rem', whiteSpace: 'pre-line' }}>{problem.desc}</p>

                    <div className="section-label">AI Judging Criteria</div>
                    <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        {[['Correctness', 'Logic / Edge cases'], ['Efficiency', 'O(n) preferred'], ['Readability', 'Clear naming / structure']].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>{k}</span><span style={{ color: 'var(--text-muted)' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor panel */}
                <div style={{ display: (isMobile && activeTab !== 'code') ? 'none' : 'flex', flexDirection: 'column', minHeight: isMobile ? 600 : 0 }}>
                    {phase === 'judging' ? (
                        <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.4)' }}>
                            <Loader2 size={48} className="animate-spin" color="var(--violet-light)" />
                            <h3 style={{ margin: 0 }}>AI Judging...</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Analyzing both submissions for correctness, efficiency, and readability.</p>
                        </div>
                    ) : (
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={language}
                            value={code}
                            onChange={v => setCode(v)}
                            options={{ fontSize: 16, minimap: { enabled: false }, padding: { top: 20 }, fontFamily: 'JetBrains Mono, monospace' }}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    // ── RESULT ────────────────────────────────────────────────────
    if (phase === 'result' && duelResult) return (
        <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div className="slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
                        {duelResult.winner === user?.username ? '🏆' : duelResult.winner === 'Draw' ? '🤝' : '💪'}
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                        {duelResult.winner === user?.username ? 'VICTORY!' : duelResult.winner === 'Draw' ? "IT'S A DRAW" : 'GOOD EFFORT'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>AI evaluation complete · Room {roomId}</p>
                </div>

                <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                    {[
                        { name: players[0]?.username, score: duelResult.p1, isYou: players[0]?.username === user?.username },
                        { name: players[1]?.username, score: duelResult.p2, isYou: players[1]?.username === user?.username }
                    ].map(p => (
                        <div key={p.name} className={`glass-panel ${duelResult.winner === p.name ? 'card-glow' : ''}`} style={{ padding: '2.5rem', border: duelResult.winner === p.name ? '2px solid var(--success)' : '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0 }}>{p.name} {p.isYou && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>(YOU)</span>}</h3>
                                {duelResult.winner === p.name && <Crown color="var(--warning)" size={24} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {[['Correctness', p.score?.correctness, 'var(--success)'], ['Efficiency', p.score?.efficiency, 'var(--warning)'], ['Readability', p.score?.readability, 'var(--cyan)']].map(([label, val, color]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                        <span style={{ fontWeight: 800, color }}>{val}/10</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-sub)', fontStyle: 'italic' }}>
                                    "{p.score?.feedback}"
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', background: 'rgba(124,58,237,0.05)', border: '1px dashed rgba(124,58,237,0.3)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                        <Bot size={24} color="var(--violet-light)" />
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem' }}>AI Judge's Verdict</h4>
                            <p style={{ margin: 0, color: 'var(--text-sub)', lineHeight: 1.6 }}>{duelResult.explanation}</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>New Duel</button>
                    <button className="btn btn-ghost" onClick={() => navigate('/app')}>Back to Dashboard</button>
                </div>
            </div>
        </div>
    );

    return null;
};

export default DuelRoom;
