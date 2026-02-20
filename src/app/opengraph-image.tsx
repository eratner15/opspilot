import { ImageResponse } from 'next/og';

export const alt = 'OpsPilot — AI Operations for Trades';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            marginBottom: 32,
            boxShadow: '0 0 60px rgba(99,102,241,0.5)',
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          Ops
          <span style={{ color: '#818cf8' }}>Pilot</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 48,
          }}
        >
          AI-powered operations for trades businesses
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['AI Answers Calls', 'Auto-Dispatch', 'Invoicing', 'Analytics'].map((label) => (
            <div
              key={label}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: '1px solid rgba(99,102,241,0.4)',
                background: 'rgba(99,102,241,0.1)',
                color: '#a5b4fc',
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            color: '#475569',
            fontSize: 20,
            letterSpacing: '0.05em',
          }}
        >
          smb.cafecito-ai.com
        </div>
      </div>
    ),
    { ...size }
  );
}
