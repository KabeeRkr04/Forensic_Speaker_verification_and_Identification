import React, { useEffect, useRef } from 'react';

interface VoiceWaveBackgroundProps {
  intensity?: number;
  simulating?: boolean;
  activeProcess?: string;
}

const CHARS = "01#@$%&*<>?/\\|";

export const VoiceWaveBackground: React.FC<VoiceWaveBackgroundProps> = ({ 
  intensity = 5, 
  simulating = false,
  activeProcess = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    const particles: { x: number; y: number; char: string; speed: number; opacity: number }[] = [];
    // Dynamic particle count based on intensity
    const numParticles = 100 + (intensity * 20);

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        speed: 0.5 + Math.random() * 2,
        opacity: Math.random()
      });
    }

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      const centerY = height / 2;
      const waveHeight = height * (simulating ? 0.35 : 0.2);
      
      // Draw the wave
      ctx.beginPath();
      ctx.strokeStyle = simulating ? '#00ff41' : 'rgba(0, 255, 65, 0.4)';
      ctx.lineWidth = 1;

      // Character density increases during simulation (smaller step)
      const step = simulating ? 8 : 12;

      for (let x = 0; x < width; x += step) {
        const freqMul = simulating ? 2 : 1;
        const amplitude = waveHeight * Math.sin(x * 0.005 * freqMul + time);
        const noise = (Math.random() - 0.5) * intensity * (simulating ? 5 : 1);
        const y = centerY + amplitude + noise;

        ctx.fillStyle = simulating && Math.random() > 0.8 ? '#00ff41' : 'rgba(0, 255, 65, 0.3)';
        ctx.font = '10px "Courier New"';
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, x, y);

        if (x % 50 === 0 && simulating) {
          ctx.save();
          ctx.globalAlpha = 0.1;
          ctx.fillText(char, x, y + 20);
          ctx.fillText(char, x, y - 20);
          ctx.restore();
        }
      }

      // Render floating particles
      particles.forEach(p => {
        ctx.fillStyle = `rgba(0, 255, 65, ${p.opacity * 0.15})`;
        ctx.font = '12px "Courier New"';
        ctx.fillText(p.char, p.x, p.y);

        p.y += p.speed;
        if (p.y > height) p.y = -20;
        
        if (Math.random() > 0.98) {
          p.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      });

      // Show active process label in background if simulating
      if (simulating && activeProcess) {
        ctx.save();
        // Subtle pulsing effect for the labels
        const pulse = 0.03 + Math.sin(time * 5) * 0.01;
        ctx.font = 'bold 80px "Courier New"';
        ctx.fillStyle = `rgba(0, 255, 65, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.fillText(activeProcess.toUpperCase(), width / 2, height / 2 + 150);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, simulating, activeProcess]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 bg-black"
      style={{ filter: 'contrast(1.2) brightness(0.8)' }}
    />
  );
};
