'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [gHovered, setGHovered] = useState(false);

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#a78bfa', '#818cf8', '#6366f1', '#7c3aed', '#4f46e5'];

    // Init particles
    particlesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Mouse glow
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
      grad.addColorStop(0, 'rgba(124, 58, 237, 0.08)');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      for (const p of particles) {
        // Mouse attraction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          p.vx += (dx / dist) * 0.015;
          p.vy += (dy / dist) * 0.015;
        }

        // Speed limit
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) {
          p.vx = (p.vx / speed) * 1.5;
          p.vy = (p.vy / speed) * 1.5;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleGoogle = async () => {
    setGLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
  };

  const handleEmail = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/' },
    });
    setLoading(false);
    if (!error) setSent(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(79,46,180,0.2) 0%, transparent 60%), #060410',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Grid lines */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '420px',
        margin: '0 24px',
      }}>

        {/* Glow behind card */}
        <div style={{
          position: 'absolute', inset: '-40px',
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(20px)',
        }} />

        <div style={{
          background: 'rgba(12, 8, 28, 0.85)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '24px',
          padding: '40px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 60px rgba(79,46,180,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Top gradient line */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)',
          }} />

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 800, color: '#fff',
              boxShadow: '0 0 24px rgba(124,58,237,0.5)',
            }}>α</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: '#f0eaff', letterSpacing: '-0.02em' }}>
              Bags Alpha
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
              Early Signal Radar for Bags.fm
            </p>
          </div>

          {sent ? (
            <div style={{
              padding: '24px', borderRadius: '14px', textAlign: 'center',
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>✉</div>
              <p style={{ color: '#34d399', fontWeight: 600, margin: '0 0 6px', fontSize: '14px' }}>Check your email</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>
                We sent a magic link to <strong style={{ color: '#f0eaff' }}>{email}</strong>
              </p>
            </div>
          ) : (
            <>
              {/* Google button */}
              <button
                onClick={handleGoogle}
                disabled={gLoading}
                onMouseEnter={() => setGHovered(true)}
                onMouseLeave={() => setGHovered(false)}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px',
                  background: gHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                  border: gHovered ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.1)',
                  color: '#f0eaff', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', marginBottom: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s ease',
                  transform: gHovered ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: gHovered ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {gLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.1em' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Email input */}
              <div style={{ marginBottom: '12px', position: 'relative' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onKeyDown={e => e.key === 'Enter' && handleEmail()}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '12px',
                    background: emailFocused ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.04)',
                    border: emailFocused ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: '#f0eaff', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    boxShadow: emailFocused ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                  }}
                />
              </div>

              {/* Email button */}
              <button
                onClick={handleEmail}
                disabled={loading || !email.trim()}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px',
                  background: btnHovered
                    ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                    : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  border: 'none',
                  color: '#fff', fontSize: '14px', fontWeight: 700,
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  opacity: !email.trim() ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  transform: btnHovered && email.trim() ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: btnHovered && email.trim()
                    ? '0 6px 24px rgba(124,58,237,0.5)'
                    : '0 2px 12px rgba(124,58,237,0.3)',
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>

              <p style={{ margin: '20px 0 0', color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', lineHeight: 1.6 }}>
                By signing in you agree to receive signal alerts.<br />No spam, unsubscribe anytime.
              </p>
            </>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', textDecoration: 'none' }}>
            ← Back to Radar
          </a>
        </div>
      </div>
    </div>
  );
}
