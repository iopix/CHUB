'use client';
import { motion } from 'framer-motion';

interface BearMascotProps {
  /** -1 (kiri) sampai 1 (kanan), posisi pupil mata mengikuti ketikan */
  eyeX?: number;
  /** true kalau field yang aktif adalah PIN tersembunyi -> tangan nutup mata */
  isCovering?: boolean;
  /** true kalau sedang mengetik username/email -> mulut senyum lebar */
  isLove?: boolean;
  /** true kalau sedang mengetik (kolom aktif) -> tangan gerak ngetik */
  isTyping?: boolean;
  /** ukuran render (px), default 140 */
  size?: number;
  className?: string;
}

export default function BearMascot({
  eyeX = 0,
  isCovering = false,
  isLove = false,
  isTyping = false,
  size = 140,
  className = '',
}: BearMascotProps) {
  const clampedX = Math.max(-1, Math.min(1, eyeX));
  const pupilOffset = clampedX * 3.5;

  return (
    <div className={className} style={{ width: size, height: size, overflow: 'visible' }}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="shade" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
        </defs>

        {/* --- TELINGA KIRI (Soft Idle - Simetris Cermin) --- */}
        <motion.g
          animate={
            !isCovering && !isTyping
              ? { rotate: [0, -2.5, 0, 1.5, 0] }
              : { rotate: 0 }
          }
          transition={{
            repeat: Infinity,
            duration: 4.5,
            ease: 'easeInOut',
          }}
          style={{ originX: '62px', originY: '70px' }}
        >
          <circle cx="62" cy="52" r="22" fill="#8a5a34" />
          <circle cx="62" cy="52" r="12" fill="#c99a6b" />
        </motion.g>

        {/* --- TELINGA KANAN (Soft Idle - Simetris Cermin) --- */}
        <motion.g
          animate={
            !isCovering && !isTyping
              ? { rotate: [0, 2.5, 0, -1.5, 0] }
              : { rotate: 0 }
          }
          transition={{
            repeat: Infinity,
            duration: 4.5,
            ease: 'easeInOut',
          }}
          style={{ originX: '138px', originY: '70px' }}
        >
          <circle cx="138" cy="52" r="22" fill="#8a5a34" />
          <circle cx="138" cy="52" r="12" fill="#c99a6b" />
        </motion.g>

        {/* --- KEPALA --- */}
        <ellipse cx="100" cy="105" rx="72" ry="66" fill="#a5713f" />
        <ellipse cx="100" cy="105" rx="72" ry="66" fill="url(#shade)" opacity="0.25" />

        {/* --- PIPI / MONCONG --- */}
        <ellipse cx="100" cy="128" rx="34" ry="26" fill="#d9ac78" />

        {/* --- HIDUNG & MULUT DINAMIS --- */}
        <motion.g
          animate={{ x: pupilOffset * 1.2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <ellipse cx="100" cy="116" rx="11" ry="8" fill="#3b2416" />
          <motion.path
            stroke="#3b2416"
            strokeLinecap="round"
            fill="none"
            animate={{ 
              d: isLove ? "M82 126 Q100 142 118 126" : "M92 126 Q100 132 108 126",
              strokeWidth: isLove ? 3.5 : 2.5
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          />
        </motion.g>

        {/* --- MATA & PUPIL --- */}
        <g>
          <circle cx="76" cy="98" r="9" fill="#fff" />
          <circle cx="124" cy="98" r="9" fill="#fff" />
          
          {/* Pupil Kiri */}
          <motion.circle
            cx={76} cy={98} r="5" fill="#2a1a10"
            animate={{ cx: 76 + pupilOffset }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          />
          {/* Pupil Kanan */}
          <motion.circle
            cx={124} cy={98} r="5" fill="#2a1a10"
            animate={{ cx: 124 + pupilOffset }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          />

          {/* Alis Simetris */}
          <motion.path 
            d="M66 83 Q76 77 86 83" stroke="#3b2416" strokeWidth="2.5" fill="none" strokeLinecap="round" 
            animate={{ y: isLove ? -3 : 0 }} 
          />
          <motion.path 
            d="M114 83 Q124 77 134 83" stroke="#3b2416" strokeWidth="2.5" fill="none" strokeLinecap="round" 
            animate={{ y: isLove ? -3 : 0 }} 
          />
        </g>

        {/* --- TANGAN KIRI (Simetris) --- */}
        <motion.g
          initial={false}
          animate={{
            x: isCovering ? 22 : 0,
            y: isCovering ? -37 : isTyping ? [0, -6, 0] : 0,
          }}
          transition={{
            x: { type: 'spring', stiffness: 220, damping: 20 },
            y: isCovering 
                 ? { type: 'spring', stiffness: 220, damping: 20 } 
                 : isTyping 
                     ? { repeat: Infinity, duration: 0.35, ease: "easeInOut" } 
                     : { type: 'spring', stiffness: 220, damping: 20 },
          }}
        >
          {/* Lengan */}
          <path
            d="M 38 165 C 38 145, 46 138, 54 135 C 62 138, 68 150, 66 165 Z"
            fill="#a5713f"
            stroke="#8a5a34"
            strokeWidth="1.5"
          />
          {/* Paw */}
          <ellipse cx="54" cy="135" rx="16" ry="13" fill="#a5713f" stroke="#8a5a34" strokeWidth="1.5" />
          <ellipse cx="54" cy="137" rx="6.5" ry="5" fill="#d9ac78" />
          <circle cx="45" cy="131" r="2.3" fill="#6e4527" />
          <circle cx="54" cy="127" r="2.3" fill="#6e4527" />
          <circle cx="63" cy="131" r="2.3" fill="#6e4527" />
        </motion.g>

        {/* --- TANGAN KANAN (Simetris) --- */}
        <motion.g
          initial={false}
          animate={{
            x: isCovering ? -22 : 0,
            y: isCovering ? -37 : isTyping ? [0, -6, 0] : 0,
          }}
          transition={{
            x: { type: 'spring', stiffness: 220, damping: 20 },
            y: isCovering 
                 ? { type: 'spring', stiffness: 220, damping: 20 } 
                 : isTyping 
                     ? { repeat: Infinity, duration: 0.35, ease: "easeInOut", delay: 0.17 } 
                     : { type: 'spring', stiffness: 220, damping: 20 },
          }}
        >
          {/* Lengan */}
          <path
            d="M 134 165 C 132 150, 138 138, 146 135 C 154 138, 162 145, 162 165 Z"
            fill="#a5713f"
            stroke="#8a5a34"
            strokeWidth="1.5"
          />
          {/* Paw */}
          <ellipse cx="146" cy="135" rx="16" ry="13" fill="#a5713f" stroke="#8a5a34" strokeWidth="1.5" />
          <ellipse cx="146" cy="137" rx="6.5" ry="5" fill="#d9ac78" />
          <circle cx="137" cy="131" r="2.3" fill="#6e4527" />
          <circle cx="146" cy="127" r="2.3" fill="#6e4527" />
          <circle cx="155" cy="131" r="2.3" fill="#6e4527" />
        </motion.g>
      </svg>
    </div>
  );
}