import React, { useEffect, useRef } from 'react';

export const ForensicProcessingBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = "0123456789ABCDEF@#$%&*+=-_";
    const fontSize = 14;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    const columns = Math.floor(width / fontSize);
    const drops: number[] = Array(columns).fill(1).map(() => Math.random() * -height / fontSize);

    const render = () => {
      // Dark trail effect with more transparency for better trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Varying green intensities for the data stream
        const intensity = Math.random();
        if (intensity > 0.98) {
          ctx.fillStyle = '#fff'; // Occasional spark
        } else if (intensity > 0.5) {
          ctx.fillStyle = '#00FF41';
        } else {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
        }
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.95) {
          drops[i] = 0;
        }

        drops[i] += 1.2;
      }

      // Add a horizontal "scan line"
      const scanY = (Date.now() % 5000) / 5000 * height;
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-[-1] opacity-40"
      style={{ filter: 'blur(1px)' }}
    />
  );
};
