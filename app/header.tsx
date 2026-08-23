'use client';

import { CSSProperties, RefObject } from 'react';

export interface UserProfile {
  username?: string;
  email?: string;
  [key: string]: unknown;
}

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  userProfile: UserProfile | null;
  userName: string;
  activeModel?: string;
  remainingTokens: number | null;
  isMobile: boolean;
  handleAuthAction: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

// Ikon Dinamis HUD Sci-Fi (Hamburger -> X)
const IconMenu = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f97316"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transition: 'transform 0.3s ease' }}
  >
    {isOpen ? (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ) : (
      <>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="15" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    )}
  </svg>
);

// Frame Overlay HUD untuk Kotak Dropdown Utama
const HudDropdownFrameDecoration = () => (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1,
    }}
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
  >
    <path
      d="M 10,0 L 90,0 L 100,10 L 100,90 L 90,100 L 10,100 L 0,90 L 0,10 Z"
      fill="none"
      stroke="#f97316"
      strokeWidth="1.8"
      vectorEffect="non-scaling-stroke"
    />
    <line x1="20" y1="2" x2="40" y2="2" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    <line x1="60" y1="98" x2="80" y2="98" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    <rect x="2" y="45" width="3" height="10" fill="#f97316" />
    <rect x="95" y="45" width="3" height="10" fill="#f97316" />
  </svg>
);

// Hiasan Sudut Header Utama
const HudHeaderCorners = () => (
  <svg
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1,
    }}
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
  >
    <path
      d="M 2,0 L 98,0 L 100,6 L 100,94 L 98,100 L 2,100 L 0,94 L 0,6 Z"
      fill="none"
      stroke="#f97316"
      strokeWidth="1.2"
      vectorEffect="non-scaling-stroke"
    />
    <line x1="10" y1="1" x2="25" y2="1" stroke="#f97316" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    <line x1="75" y1="1" x2="90" y2="1" stroke="#f97316" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    <line x1="40" y1="99" x2="60" y2="99" stroke="#f97316" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
  </svg>
);

export default function Header({
  isMenuOpen,
  setIsMenuOpen,
  userProfile,
  userName,
  remainingTokens,
  isMobile,
  handleAuthAction,
  menuRef,
}: HeaderProps) {
  return (
    <header style={styles.header}>
      <HudHeaderCorners />

      <style>{`
        @keyframes waveMoveOne {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(0); }
        }
        @keyframes waveMoveTwo {
          0% { transform: translateX(0); }
          50% { transform: translateX(25%); }
          100% { transform: translateX(0); }
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(3deg); }
        }
        .chub-logo-anim {
          animation: floatLogo 3s ease-in-out infinite;
          transition: transform 0.2s ease;
        }
        .chub-logo-anim:hover {
          transform: scale(1.15) rotate(-5deg) !important;
        }
        .dropdown-hud-tail::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 14px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid #f97316;
          z-index: 101;
        }
        .dropdown-hud-tail::after {
          content: '';
          position: absolute;
          top: -5px;
          left: 15px;
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 7px solid #0d0d0f;
          z-index: 102;
        }
        .hud-menu-item {
          transition: all 0.2s ease;
        }
        .hud-menu-item:hover {
          background-color: rgba(249, 115, 22, 0.3) !important;
          border-color: #f97316 !important;
          color: #ffffff !important;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.6);
        }
      `}</style>

      {/* Gelombang Wave Dinamis Warna Orange Tipis */}
      <div style={styles.waveContainer}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={styles.waveSvgOne}>
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,0 L0,0 Z" fill="rgba(249, 115, 22, 0.12)"></path>
        </svg>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={styles.waveSvgTwo}>
          <path d="M0,0 C200,30 400,100 600,40 C800,-20 1000,80 1200,20 L1200,0 L0,0 Z" fill="rgba(249, 115, 22, 0.07)"></path>
        </svg>
      </div>

      <div style={styles.headerTitleGroup}>
        {/* Dropdown Roll Menu Futuristik */}
        <div style={{ position: 'relative', zIndex: 99999 }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.menuBtn}
            title="Buka Menu HUD"
          >
            <IconMenu isOpen={isMenuOpen} />
          </button>

          {isMenuOpen && (
            <div style={styles.dropdownGrid} className="dropdown-hud-tail">
              <HudDropdownFrameDecoration />

              <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="https://ipix.my.id" target="_blank" rel="noopener noreferrer" className="hud-menu-item" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipix.my.id</a>
                <a href="https://ipixchat.my.id" target="_blank" rel="noopener noreferrer" className="hud-menu-item" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipixchat.my.id</a>
                <a href="https://sukachub.my.id" target="_blank" rel="noopener noreferrer" className="hud-menu-item" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>sukachub.my.id</a>
                <a href="https://ipix.fun" target="_blank" rel="noopener noreferrer" className="hud-menu-item" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipix.fun</a>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleAuthAction();
                  }}
                  className="hud-menu-item"
                  style={{
                    ...styles.gridItem,
                    ...(userProfile ? styles.gridLogout : styles.gridLogin)
                  }}
                >
                  {userProfile ? 'LOGOUT' : 'LOGIN'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Title dan Badge User */}
        <div style={styles.titleWrapper}>
          <h1 style={styles.title}>
            SukaChub your virtual chat
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              ...styles.userBadge,
              backgroundColor: userProfile ? 'rgba(249, 115, 22, 0.25)' : 'rgba(239, 68, 68, 0.2)',
              color: userProfile ? '#f97316' : '#ef4444',
              borderColor: userProfile ? '#f97316' : '#ef4444'
            }}>
              {userName}
            </span>
          </div>
        </div>
      </div>

      {/* Bagian Kanan Header: Token & Logo Chub Dinamis */}
      <div style={styles.rightSection}>
        {userProfile && remainingTokens !== null && !isMobile && (
          <span style={styles.tokenBadge}>
            {Number(remainingTokens).toLocaleString('id-ID')} TKN
          </span>
        )}

        <div style={styles.logoWrapper}>
          <img
            src="/chub.webp"
            alt="Chub Logo"
            className="chub-logo-anim"
            style={styles.logoImg}
          />
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    position: 'relative',
    padding: '10px 16px',
    margin: '8px 10px 0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(10, 10, 12, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    zIndex: 100,
    flexShrink: 0,
    gap: '8px',
    overflow: 'visible', // Agar dropdown melayang tidak terpotong
    fontFamily: 'monospace, sans-serif',
    border: '1.5px solid rgba(249, 115, 22, 0.6)',
    borderRadius: '10px',
    boxShadow: '0 0 12px rgba(249, 115, 22, 0.25)',
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
    borderRadius: '10px',
  },
  waveSvgOne: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '200%',
    height: '100%',
    animation: 'waveMoveOne 12s ease-in-out infinite',
  },
  waveSvgTwo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '200%',
    height: '100%',
    animation: 'waveMoveTwo 16s ease-in-out infinite',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 2,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
  },
  dropdownGrid: {
    position: 'absolute',
    top: 'calc(100% + 14px)',
    left: '-4px',
    backgroundColor: '#0d0d0f',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 999999,
    boxShadow: '0 12px 32px rgba(0,0,0,0.95), 0 0 16px rgba(249, 115, 22, 0.4)',
    minWidth: '190px',
    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
  },
  gridItem: {
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    color: '#ffffff',
    padding: '10px 14px',
    fontSize: '0.78rem',
    fontWeight: '700',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    border: '1px solid rgba(249, 115, 22, 0.5)',
    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'monospace, sans-serif',
    letterSpacing: '0.8px',
    textTransform: 'lowercase',
  },
  gridLogout: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.8)',
    fontWeight: '800',
    marginTop: '4px',
    textTransform: 'uppercase',
  },
  gridLogin: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.8)',
    fontWeight: '800',
    marginTop: '4px',
    textTransform: 'uppercase',
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  title: {
    fontSize: 'clamp(0.75rem, 3vw, 0.88rem)',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    color: '#ffffff',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  userBadge: {
    fontSize: '0.62rem',
    padding: '2px 8px',
    fontWeight: '700',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    border: '1px solid',
    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
    textTransform: 'uppercase',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 2,
  },
  tokenBadge: {
    fontSize: '0.62rem',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    color: '#f97316',
    padding: '3px 10px',
    fontWeight: '700',
    border: '1px solid #f97316',
    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
    flexShrink: 0,
    letterSpacing: '0.5px',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  logoImg: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))',
  },
};