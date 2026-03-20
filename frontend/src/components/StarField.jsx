import { useEffect, useRef } from 'react';

const StarField = ({ starCount = 200, speed = 0.3, depth = 3, style = {} }) => {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const starsRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            starsRef.current = Array.from({ length: starCount }, () => ({
                x: Math.random() * canvas.width - canvas.width / 2,
                y: Math.random() * canvas.height - canvas.height / 2,
                z: Math.random() * canvas.width,
                size: Math.random() * 1.5,
                pulsate: Math.random() * Math.PI * 2,
            }));
        };

        const drawStar = (x, y, radius, opacity) => {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${180 + Math.random() * 75}, ${180 + Math.random() * 75}, 255, ${opacity})`;
            ctx.fill();
        };

        let frame = 0;
        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            const isLight = document.body.classList.contains('light');
            ctx.fillStyle = isLight ? 'rgba(248, 250, 252, 0.25)' : 'rgba(3, 4, 8, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            frame++;

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            starsRef.current.forEach(star => {
                star.z -= speed * depth;
                star.pulsate += 0.02;
                if (star.z <= 0) {
                    star.z = canvas.width;
                    star.x = Math.random() * canvas.width - cx;
                    star.y = Math.random() * canvas.height - cy;
                }

                const k = 128 / star.z;
                const px = star.x * k + cx;
                const py = star.y * k + cy;

                if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
                    const size = (1 - star.z / canvas.width) * 3;
                    const opacity = (1 - star.z / canvas.width) * (0.6 + 0.4 * Math.sin(star.pulsate));

                    // Draw glow
                    const gradient = ctx.createRadialGradient(px, py, 0, px, py, size * 3);
                    gradient.addColorStop(0, isLight ? `rgba(100,140,250,${opacity * 0.8})` : `rgba(180,160,255,${opacity})`);
                    gradient.addColorStop(1, 'transparent');
                    ctx.beginPath();
                    ctx.arc(px, py, size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // Draw core
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(0.3, size * 0.6), 0, Math.PI * 2);
                    ctx.fillStyle = isLight ? `rgba(50,80,180,${opacity})` : `rgba(220,210,255,${opacity})`;
                    ctx.fill();
                }
            });
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [starCount, speed, depth]);

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
                ...style
            }}
        />
    );
};

export default StarField;
