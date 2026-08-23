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

const SciFiHudFrame = ({
  children,
  isLogout = false,
  isLogin = false,
  onClick,
  href,
}: {
  children: React.ReactNode;
  isLogout?: boolean;
  isLogin?: boolean;
  onClick?: () => void;
  href?: string;
}) => {
  const content = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        padding: '6px 8px', // Padding dipraktiskan agar lebih ringkas
        backgroundColor: isLogout
          ? 'rgba(239, 68, 68, 0.2)'
          : isLogin
          ? 'rgba(34, 197, 94, 0.2)'
          : 'rgba(20, 20, 26, 0.85)',
        backdropFilter: 'blur(10px)',
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
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
          d="M 0,0 L 90,0 L 100,10 L 100,100 L 10,100 L 0,90 Z"
          fill="none"
          stroke={isLogout ? '#ef4444' : isLogin ? '#22c55e' : '#f97316'}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="65"
          y1="2"
          x2="85"
          y2="2"
          stroke={isLogout ? '#ef4444' : isLogin ? '#22c55e' : '#f97316'}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          color: isLogout ? '#ef4444' : isLogin ? '#22c55e' : '#ffffff',
          fontWeight: 800,
          fontSize: 'clamp(0.62rem, 1.8vw, 0.72rem)', // Font responsif kecil di mobile
          fontFamily: 'monospace, sans-serif',
          letterSpacing: '0.5px',
          textTransform: isLogout || isLogin ? 'uppercase' : 'lowercase',
          textAlign: 'center',
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hud-menu-item"
        onClick={onClick}
        style={{ textDecoration: 'none', width: '100%', display: 'block' }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="hud-menu-item"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        width: '100%',
        textAlign: 'center',
      }}
    >
      {content}
    </button>
  );
};

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
      <div style={styles.headerSurface} />

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
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .chub-logo-anim {
          animation: floatLogo 3s ease-in-out infinite;
          transition: transform 0.2s ease;
        }
        .chub-logo-anim:hover {
          transform: scale(1.15) rotate(-5deg) !important;
        }
        .header-scanline {
          position: absolute;
          inset: 0;
          height: 45%;
          pointer-events: none;
          background: linear-gradient(180deg, transparent, rgba(249, 115, 22, 0.08), transparent);
          animation: scanline 5s linear infinite;
          z-index: 1;
        }
        .header-kicker {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #71717a;
          font-size: 0.54rem;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }
        .header-kicker::before {
          content: '';
          width: 5px;
          height: 5px;
          background: #22c55e;
          box-shadow: 0 0 7px rgba(34, 197, 94, 0.8);
        }
        .dropdown-kicker {
          padding: 0 2px 4px;
          color: #71717a;
          border-bottom: 1px solid rgba(249, 115, 22, 0.3);
          font-size: clamp(0.5rem, 1.5vw, 0.56rem);
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 2px;
          text-align: center;
        }
        .hud-menu-button:hover svg {
          filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.8));
        }
        .hud-menu-item {
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .hud-menu-item:hover {
          transform: translateY(-2px);
          filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.5));
        }
      `}</style>

      <div style={styles.waveContainer}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={styles.waveSvgOne}>
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,0 L0,0 Z" fill="rgba(249, 115, 22, 0.12)"></path>
        </svg>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={styles.waveSvgTwo}>
          <path d="M0,0 C200,30 400,100 600,40 C800,-20 1000,80 1200,20 L1200,0 L0,0 Z" fill="rgba(249, 115, 22, 0.07)"></path>
        </svg>
      </div>
      <div className="header-scanline" />

      <div style={styles.headerTitleGroup}>
        <div style={{ position: 'relative', zIndex: 99999 }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.menuBtn}
            className="hud-menu-button"
            title="Buka Menu HUD"
          >
            <IconMenu isOpen={isMenuOpen} />
          </button>

          {isMenuOpen && (
            <div style={styles.dropdownGrid}>
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
                  d="M 0,0 L 86,0 L 100,14 L 100,100 L 14,100 L 0,86 Z"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <line x1="65" y1="3" x2="85" y2="3" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                <line x1="40" y1="97" x2="60" y2="97" stroke="#f97316" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                <rect x="95" y="30" width="3" height="12" fill="#f97316" />
              </svg>

              <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div className="dropdown-kicker">External network</div>

                <SciFiHudFrame href="https://ipix.my.id" onClick={() => setIsMenuOpen(false)}>
                  ipix.my.id
                </SciFiHudFrame>
                <SciFiHudFrame href="https://ipixchat.my.id" onClick={() => setIsMenuOpen(false)}>
                  ipixchat.my.id
                </SciFiHudFrame>
                <SciFiHudFrame href="https://sukachub.my.id" onClick={() => setIsMenuOpen(false)}>
                  sukachub.my.id
                </SciFiHudFrame>
                <SciFiHudFrame href="https://ipix.fun" onClick={() => setIsMenuOpen(false)}>
                  ipix.fun
                </SciFiHudFrame>

                <SciFiHudFrame
                  isLogout={!!userProfile}
                  isLogin={!userProfile}
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleAuthAction();
                  }}
                >
                  {userProfile ? 'LOGOUT' : 'LOGIN'}
                </SciFiHudFrame>
              </div>
            </div>
          )}
        </div>

        <div style={styles.titleWrapper}>
          <h1 style={styles.title}>
            <span style={styles.titleAccent}>SUKACHUB</span>
            <span style={styles.titleDivider}>//</span>
            <span style={styles.titleSub}>VIRTUAL CHAT</span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span
              style={{
                ...styles.userBadge,
                backgroundColor: userProfile ? 'rgba(249, 115, 22, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                color: userProfile ? '#f97316' : '#ef4444',
                borderColor: userProfile ? '#f97316' : '#ef4444',
              }}
            >
              {userName}
            </span>
          </div>
          <div className="header-kicker">System online</div>
        </div>
      </div>

      <div style={styles.rightSection}>
        {userProfile && remainingTokens !== null && !isMobile && (
          <span style={styles.tokenBadge}>
            {Number(remainingTokens).toLocaleString('id-ID')} TKN
          </span>
        )}

        <div style={styles.logoWrapper}>
          <img src="/chub.webp" alt="Chub Logo" className="chub-logo-anim" style={styles.logoImg} />
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'transparent',
    zIndex: 100,
    flexShrink: 0,
    gap: '12px',
    overflow: 'visible',
    fontFamily: 'monospace, sans-serif',
  },
  headerSurface: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    backgroundColor: 'rgba(14, 14, 18, 0.90)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1.5px solid #f97316',
    clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
    boxShadow: '0 0 14px rgba(249, 115, 22, 0.35)',
  },
  waveContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
    clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
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
    gap: '11px',
    minWidth: 0,
    zIndex: 2,
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '34px',
    height: '34px',
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
    top: 'calc(100% + 28px)',
    left: '0px',
    backgroundColor: 'rgba(14, 14, 18, 0.95)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    padding: '8px 10px 10px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    zIndex: 999999,
    boxShadow: '0 0 18px rgba(249, 115, 22, 0.35)',
    width: 'min(170px, 48vw)', // Maksimal 48vw (~setengah layar) agar seukuran kolom chat
    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    minWidth: 0,
    maxWidth: 'calc(100vw - 112px)',
  },
  title: {
    fontSize: 'clamp(0.75rem, 3vw, 0.88rem)',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '1.6px',
    whiteSpace: 'nowrap',
    color: '#ffffff',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'baseline',
    gap: '5px',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  titleAccent: {
    color: '#fb923c',
    textShadow: '0 0 10px rgba(249, 115, 22, 0.7)',
  },
  titleDivider: {
    color: '#f97316',
    fontSize: '0.7em',
    opacity: 0.8,
  },
  titleSub: {
    color: '#a1a1aa',
    fontSize: '0.68em',
    letterSpacing: '0.8px',
    fontStyle: 'normal',
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