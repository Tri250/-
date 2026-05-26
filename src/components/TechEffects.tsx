import React, { useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

const ParticleCanvas = memo(function ParticleCanvas({
  className = '',
  particleCount = 30,
  connectionDistance = 80,
  enabled = true,
  colors = ['249, 115, 22', '6, 182, 212', '168, 85, 247'],
  particleSpeed = 0.25,
  showConnections = true,
}: {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  enabled?: boolean;
  colors?: string[];
  particleSpeed?: number;
  showConnections?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * particleSpeed,
        vy: (Math.random() - 0.5) * particleSpeed,
        radius: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.5 + 0.15,
        color,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.015,
      });
    }
    particlesRef.current = particles;
  }, [particleCount, colors, particleSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      canvas.width = width;
      canvas.height = height;
      containerSizeRef.current = { width, height };
      initParticles();
    });
    
    resizeObserver.observe(canvas);
    
    return () => resizeObserver.disconnect();
  }, [initParticles]);

  useAnimationFrame(
    (deltaTime) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        const pulseOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        gradient.addColorStop(0, `rgba(${p.color}, ${pulseOpacity})`);
        gradient.addColorStop(0.4, `rgba(${p.color}, ${pulseOpacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${pulseOpacity + 0.25})`;
        ctx.fill();
      });

      if (showConnections) {
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
              const opacity = (1 - distance / connectionDistance) * 0.35;
              const lineGradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
              lineGradient.addColorStop(0, `rgba(${p1.color}, ${opacity})`);
              lineGradient.addColorStop(1, `rgba(${p2.color}, ${opacity})`);
              
              ctx.beginPath();
              ctx.strokeStyle = lineGradient;
              ctx.lineWidth = 1;
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }
    },
    enabled
  );

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
});

export const TechParticles = memo(function TechParticles({
  className = '',
}: {
  className?: string;
}) {
  return (
    <ParticleCanvas
      className={className}
      particleCount={30}
      connectionDistance={80}
      showConnections
    />
  );
});

export const AnalysisParticles = memo(function AnalysisParticles({
  className = '',
}: {
  className?: string;
}) {
  return (
    <ParticleCanvas
      className={className}
      particleCount={40}
      connectionDistance={100}
      colors={['249, 115, 22', '6, 182, 212', '168, 85, 247', '236, 72, 153']}
      particleSpeed={0.35}
      showConnections
    />
  );
});

export const NeuralNetwork = memo(function NeuralNetwork({
  className = '',
}: {
  className?: string;
}) {
  return (
    <ParticleCanvas
      className={className}
      particleCount={20}
      connectionDistance={120}
      colors={['249, 115, 22', '6, 182, 212']}
      particleSpeed={0.15}
      showConnections
    />
  );
});

export const TechDivider = memo(function TechDivider({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent ${className}`}
    />
  );
});
