import React from 'react';
import { LogOut, X, AlertCircle } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    // Debug log to help identify if the component is even being asked to render
    console.log("LogoutModal - isOpen:", isOpen);
    
    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0, left: 0, width: '100vw', height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999999, // Extremely high z-index
                padding: '20px',
                pointerEvents: 'auto'
            }}
        >
            {/* Backdrop */}
            <div 
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    transition: 'all 0.3s ease'
                }}
            />
            
            {/* Modal Body */}
            <div 
                className="logout-modal-content scale-in"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '420px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '32px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 10000000
                }}
            >
                {/* Top Gradient Accent */}
                <div style={{ height: '6px', background: 'linear-gradient(90deg, #f43f5e, #7c3aed, #3b82f6)' }} />

                <div style={{ padding: '3rem 2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        {/* High-Contrast Icon Container */}
                        <div 
                            style={{
                                width: '80px', height: '80px',
                                borderRadius: '24px',
                                background: 'rgba(244, 63, 94, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#f43f5e',
                                marginBottom: '1.5rem',
                                border: '2px solid rgba(244, 63, 94, 0.3)',
                                boxShadow: '0 8px 30px rgba(244, 63, 94, 0.2)'
                            }}
                        >
                            <AlertCircle size={40} strokeWidth={2.5} />
                        </div>

                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                            Wait, Don't Go!
                        </h2>
                        
                        <p style={{ color: 'var(--text-sub)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem', fontWeight: 500 }}>
                            Are you sure you want to sign out? Your session progress and live streak will be paused until you return.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <button 
                            className="btn btn-primary" 
                            style={{ 
                                padding: '1.25rem', 
                                borderRadius: '18px', 
                                fontWeight: 900,
                                fontSize: '1.05rem',
                                boxShadow: '0 12px 24px rgba(59, 130, 246, 0.4)',
                                border: 'none'
                            }}
                            onClick={onClose}
                        >
                            Stay Logged In
                        </button>
                        
                        <button 
                            className="btn" 
                            style={{ 
                                padding: '1rem', 
                                borderRadius: '18px', 
                                background: 'rgba(255,255,255,0.03)',
                                border: '2px solid var(--border)',
                                color: 'var(--text-main)', // High contrast text
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                transition: 'all 0.2s ease'
                            }} 
                            onClick={onConfirm}
                        >
                            <LogOut size={16} /> Yes, Sign Me Out
                        </button>
                    </div>
                </div>

                {/* Styled X Close Button */}
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        padding: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'rotate(90deg)';
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'rotate(0deg)';
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text-main)';
                    }}
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9) translateY(30px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                
                /* High contrast overrides for Light mode */
                body.light .logout-modal-content {
                    background-color: #ffffff !important;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.2) !important;
                }
                body.light .logout-modal-content .btn:last-child {
                    background-color: #f8fafc !important;
                    border-color: #e2e8f0 !important;
                    color: #0f172a !important;
                }
            `}} />
        </div>
    );
};

export default LogoutModal;
