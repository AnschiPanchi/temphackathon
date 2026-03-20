import { useEffect, useRef } from 'react';

/** Animated flowing waves — for Dashboard */
const WaveBackground = ({ style = {} }) => {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let t = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const WAVES = [
            { freq: 0.008, amp: 60, speed: 0.008, color: 'rgba(59,130,246,0.07)', yOffset: 0.55 },
            { freq: 0.006, amp: 80, speed: 0.006, color: 'rgba(139,92,246,0.06)', yOffset: 0.6 },
            { freq: 0.01, amp: 45, speed: 0.012, color: 'rgba(16,185,129,0.05)', yOffset: 0.65 },
            { freq: 0.007, amp: 70, speed: 0.009, color: 'rgba(245,158,11,0.04)', yOffset: 0.72 },
        ];

        const draw = () => {
            animRef.current = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            WAVES.forEach(wave => {
                ctx.beginPath();
                ctx.moveTo(0, canvas.height);
                for (let x = 0; x <= canvas.width; x += 4) {
                    const y = canvas.height * wave.yOffset
                        + Math.sin(x * wave.freq + t * wave.speed * 100) * wave.amp
                        + Math.sin(x * wave.freq * 1.7 + t * wave.speed * 80) * wave.amp * 0.4;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(canvas.width, canvas.height);
                ctx.closePath();
                ctx.fillStyle = wave.color;
                ctx.fill();
            });
            t++;
        };

        draw();
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
    }, []);

    return (
        <canvas ref={canvasRef} style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 0, pointerEvents: 'none', ...style
        }} />
    );
};

export default WaveBackground;
