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

// Ikon Dinamis (Hamburger -> X)
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
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    )}
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
      {/* Dynamic Keyframes Styling */}
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
        .dropdown-tail::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 12px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid #3f3f46;
        }
        .dropdown-tail::after {
          content: '';
          position: absolute;
          top: -6px;
          left: 13px;
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 7px solid #18181b;
        }
      `}</style>

      {/* 2 Gelombang Wave Dinamis Warna Orange Tipis */}
      <div style={styles.waveContainer}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={styles.waveSvgOne}>
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,0 L0,0 Z" fill="rgba(249, 115, 22, 0.12)"></path>
        </svg>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={styles.waveSvgTwo}>
          <path d="M0,0 C200,30 400,100 600,40 C800,-20 1000,80 1200,20 L1200,0 L0,0 Z" fill="rgba(249, 115, 22, 0.07)"></path>
        </svg>
      </div>

      <div style={styles.headerTitleGroup}>
        {/* Dropdown Roll Menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.menuBtn}
            title="Buka Menu"
          >
            <IconMenu isOpen={isMenuOpen} />
          </button>

          {isMenuOpen && (
            <div style={styles.dropdownGrid} className="dropdown-tail">
              <a href="https://ipix.my.id" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipix.my.id</a>
              <a href="https://ipixchat.my.id" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipixchat.my.id</a>
              <a href="https://sukachub.my.id" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>sukachub.my.id</a>
              <a href="https://ipix.fun" target="_blank" rel="noopener noreferrer" style={styles.gridItem} onClick={() => setIsMenuOpen(false)}>ipix.fun</a>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleAuthAction();
                }}
                style={{
                  ...styles.gridItem,
                  ...(userProfile ? styles.gridLogout : styles.gridLogin)
                }}
              >
                {userProfile ? 'Logout' : 'Login'}
              </button>
            </div>
          )}
        </div>

        {/* Title dan Badge User */}
        <div style={styles.titleWrapper}>
          <h1 style={{ ...styles.title, fontStyle: 'italic', fontWeight: '700' }}>
            SukaChub your virtual chat
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              ...styles.userBadge,
              backgroundColor: userProfile ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.2)',
              color: userProfile ? '#f97316' : '#ef4444'
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
            {Number(remainingTokens).toLocaleString('id-ID')} Tkn
          </span>
        )}

        {/* Logo chub.webp dengan animasi mengapung */}
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
    padding: '10px 14px',
    margin: '8px 10px 0 10px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(24, 24, 27, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(63, 63, 70, 0.4)',
    zIndex: 20,
    flexShrink: 0,
    gap: '8px',
    overflow: 'visible',
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: '16px',
    pointerEvents: 'none',
    zIndex: 0,
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
    zIndex: 1,
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
    top: 'calc(100% + 18px)',
    left: '-4px',
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '16px',
    padding: '10px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
    zIndex: 100,
    boxShadow: '0 12px 32px rgba(0,0,0,0.85)',
    minWidth: '180px',
  },
  gridItem: {
    backgroundColor: '#27272a',
    color: '#f4f4f5',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '500',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    border: '1px solid #3f3f46',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLogout: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    fontWeight: '600',
    marginTop: '2px',
  },
  gridLogin: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    fontWeight: '600',
    marginTop: '2px',
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  title: {
    fontSize: 'clamp(0.75rem, 3vw, 0.88rem)',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    color: '#ffffff',
  },
  userBadge: {
    fontSize: '0.65rem',
    padding: '1px 8px',
    borderRadius: '10px',
    fontWeight: '600',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 1,
  },
  tokenBadge: {
    fontSize: '0.6rem',
    backgroundColor: 'rgba(39, 39, 42, 0.9)',
    color: '#f97316',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: '600',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    flexShrink: 0,
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
    filter: 'drop-shadow(0 2px 6px rgba(249, 115, 22, 0.3))',
  },
};