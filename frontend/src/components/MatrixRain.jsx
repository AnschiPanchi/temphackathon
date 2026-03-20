import { useEffect, useRef } from 'react';

/** Matrix-style falling code rain — for Practice / Interview */
const MatrixRain = ({ color = '#00ff9d', style = {} }) => {
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

        const fontSize = 14;
        const chars = '01アイウエオカキクケコ{}[];()<>ABCDEFXYZ#@!&^%$'.split('');
        let cols = Math.floor(canvas.width / fontSize);
        let drops = Array(cols).fill(1).map(() => Math.random() * -100);

        const draw = () => {
            animRef.current = requestAnimationFrame(draw);
            ctx.fillStyle = 'rgba(3,7,18,0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

            drops.forEach((y, i) => {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;

                // Head (bright)
                ctx.fillStyle = '#e0fff0';
                ctx.fillText(char, x, y * fontSize);

                // Trail
                ctx.fillStyle = color + '55';
                ctx.fillText(char, x, (y - 1) * fontSize);

                if (y * fontSize > canvas.height && Math.random() > 0.975)
                    drops[i] = 0;
                drops[i] += 0.5;
            });
        };

        draw();
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
    }, [color]);

    return (
        <canvas ref={canvasRef} style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 0, pointerEvents: 'none', opacity: 0.35, ...style
        }} />
    );
};

export default MatrixRain;
