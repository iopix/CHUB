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
  activeModel: string;
  remainingTokens: number | null;
  isMobile: boolean;
  handleAuthAction: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export default function Header({
  isMenuOpen,
  setIsMenuOpen,
  userProfile,
  userName,
  activeModel,
  remainingTokens,
  isMobile,
  handleAuthAction,
  menuRef,
}: HeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.headerTitleGroup}>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.menuBtn}
            title="Buka Menu"
          >
            <IconMenu />
          </button>

          {isMenuOpen && (
            <div style={styles.dropdownGrid}>
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
            <span style={styles.modelSubtitle}>
              Model Aktif: {activeModel}
            </span>
          </div>
        </div>

        {userProfile && remainingTokens !== null && !isMobile && (
          <span style={styles.tokenBadge}>
            {Number(remainingTokens).toLocaleString('id-ID')} Tkn
          </span>
        )}
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    padding: '10px 12px',
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
    gap: '6px',
    flexWrap: 'wrap',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: '120px',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
  },
  dropdownGrid: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    left: 0,
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '16px',
    padding: '10px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
    zIndex: 100,
    boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
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
    fontWeight: '600',
    margin: 0,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
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
  modelSubtitle: {
    fontSize: '0.65rem',
    color: '#a1a1aa',
    fontWeight: '400',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px',
  },
  tokenBadge: {
    fontSize: '0.6rem',
    backgroundColor: 'rgba(39, 39, 42, 0.9)',
    color: '#f97316',
    padding: '2px 7px',
    borderRadius: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
};