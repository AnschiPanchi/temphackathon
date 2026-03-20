import React from 'react';

const GridBackground = () => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden'
        }}>
            {/* Base Grid */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.15,
                    backgroundImage: `
                        linear-gradient(to right, var(--text-muted) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--text-muted) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                }}
            />

            {/* Glowing Accent Lines */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.2,
                    backgroundImage: `
                        linear-gradient(to right, var(--blue) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--blue) 1px, transparent 1px)
                    `,
                    backgroundSize: '200px 200px',
                    animation: 'gridPulse 8s ease-in-out infinite'
                }}
            />

            {/* Radial Glows */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '40%',
                height: '40%',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '50%',
                filter: 'blur(120px)',
                animation: 'pulse 4s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '40%',
                height: '40%',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '50%',
                filter: 'blur(120px)',
                animation: 'pulse 4s ease-in-out infinite',
                animationDelay: '2s'
            }} />

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes gridPulse {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.05); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                body.light .grid-background {
                    opacity: 0.4;
                }
            `}} />
        </div>
    );
};

export default GridBackground;
