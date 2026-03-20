import React from 'react';

const GridBackground = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Base Grid */}
            <div 
                className="absolute inset-0 opacity-[0.15]" 
                style={{
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
                className="absolute inset-0 opacity-[0.2]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, var(--blue) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--blue) 1px, transparent 1px)
                    `,
                    backgroundSize: '200px 200px',
                    animation: 'gridPulse 8s ease-in-out infinite'
                }}
            />

            {/* Radial Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes gridPulse {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.05); }
                }
                body.light .fixed.inset-0.z-0 {
                    opacity: 0.4;
                }
            `}} />
        </div>
    );
};

export default GridBackground;
