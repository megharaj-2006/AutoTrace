'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

export function InteractiveDotMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, dotMatrixEnabled } = useTheme();

  useEffect(() => {
    if (!dotMatrixEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with smooth interpolation
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const dotSpacing = 28;
    const hoverRadius = 140;

    const render = () => {
      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';

      // Colors matching primary cyan & subtle background
      // Light Mode: Subtle slate-cyan base dots, vibrant cyan highlight
      // Dark Mode: Deep cyan-zinc base dots, electric cyan glowing highlight
      const baseColor = isDark 
        ? { r: 56, g: 189, b: 248, a: 0.12 }   // subtle sky/cyan in dark mode
        : { r: 100, g: 116, b: 139, a: 0.18 }; // slate-cyan tint in light mode

      const activeColor = isDark
        ? { r: 56, g: 189, b: 248 }             // vibrant sky-400
        : { r: 2, g: 132, b: 199 };             // deep cyan-600

      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * dotSpacing;
          const y = j * dotSpacing;

          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let radius = 1.0;
          let r = baseColor.r;
          let g = baseColor.g;
          let b = baseColor.b;
          let a = baseColor.a;

          if (dist < hoverRadius) {
            const factor = 1 - dist / hoverRadius; // 0 to 1
            radius = 1.0 + factor * 2.2;           // expands smoothly
            
            // Interpolate color toward active cyan
            r = Math.round(baseColor.r + (activeColor.r - baseColor.r) * factor);
            g = Math.round(baseColor.g + (activeColor.g - baseColor.g) * factor);
            b = Math.round(baseColor.b + (activeColor.b - baseColor.b) * factor);
            a = baseColor.a + factor * (isDark ? 0.75 : 0.65);
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, dotMatrixEnabled]);

  if (!dotMatrixEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
      aria-hidden="true"
    />
  );
}
