import { useEffect, useRef } from 'react';

const Aurora = ({ colors = ['#7c3aed', '#db2777', '#0ea5e9', '#10b981'], blendMode = 'screen', style = {} }) => {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const orbs = colors.map((color, i) => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: canvas.width * (0.25 + Math.random() * 0.3),
            color,
            phase: (i / colors.length) * Math.PI * 2,
        }));

        let time = 0;
        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.005;

            orbs.forEach(orb => {
                // Lissajous-like movement
                orb.x += Math.sin(time * 0.7 + orb.phase) * 0.8;
                orb.y += Math.cos(time * 0.5 + orb.phase * 1.3) * 0.6;

                // Bounce soft
                if (orb.x < 0 || orb.x > canvas.width) orb.vx *= -1;
                if (orb.y < 0 || orb.y > canvas.height) orb.vy *= -1;

                const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
                const isLight = document.body.classList.contains('light');
                const baseOpacity = isLight ? '33' : '1A'; // lower opacity
                const fadeOpacity = isLight ? '11' : '05';
                
                gradient.addColorStop(0, orb.color + baseOpacity);
                gradient.addColorStop(0.5, orb.color + fadeOpacity);
                gradient.addColorStop(1, 'transparent');

                ctx.save();
                ctx.globalCompositeOperation = blendMode;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            });
        };

        animate();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [colors, blendMode]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                filter: 'blur(40px)',
                ...style
            }}
        />
    );
};

export default Aurora;
