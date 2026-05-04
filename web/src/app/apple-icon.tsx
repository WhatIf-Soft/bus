import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Apple touch icon — 180×180 PNG rendered at request time.
 *
 * At this size we have room for the full illustrated scene: minibus + dashed
 * road + mountain + rising sun. This matches what users see in the header
 * logo, scaled up for the iOS home-screen bookmark.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#F7F3E8',
          borderRadius: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 56 40"
          width="140"
          height="100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Rising sun */}
          <circle cx="37" cy="19" r="7.5" fill="#E5C170" />
          <circle
            cx="37"
            cy="19"
            r="7.5"
            fill="none"
            stroke="#C9904F"
            strokeWidth="0.6"
            opacity="0.6"
          />

          {/* Short rays peeking above the mountain */}
          <g stroke="#E5C170" strokeWidth="1" strokeLinecap="round" opacity="0.55">
            <line x1="37" y1="6" x2="37" y2="9" />
            <line x1="47.5" y1="9" x2="45.8" y2="10.8" />
          </g>

          {/* Mountain eclipsing the sun */}
          <path d="M 27 28 L 42 14 L 56 28 Z" fill="#1F2A68" />

          {/* Horizon road */}
          <line
            x1="2"
            y1="28"
            x2="54"
            y2="28"
            stroke="#1F2A68"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Golden dashed centerline */}
          <line
            x1="4"
            y1="30"
            x2="24"
            y2="30"
            stroke="#E5C170"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="1.5 2.5"
            opacity="0.85"
          />

          {/* Tro-tro minibus */}
          <g transform="translate(5, 19)">
            {/* Roof luggage rack */}
            <rect x="1.5" y="0" width="11" height="1.3" fill="#1F2A68" rx="0.3" />
            <rect x="3" y="0.1" width="1.2" height="1.1" fill="#E5C170" rx="0.2" />
            <rect x="7" y="0.1" width="1.5" height="1.1" fill="#E5C170" rx="0.2" />
            {/* Body */}
            <path
              d="M 0.8 1.4 L 12.6 1.4 L 13.4 3.2 L 13.4 7.8 Q 13.4 8.6, 12.6 8.6 L 1.2 8.6 Q 0.4 8.6, 0.4 7.8 L 0.4 2 Q 0.4 1.4, 0.8 1.4 Z"
              fill="#1F2A68"
            />
            {/* Windows */}
            <rect x="2" y="2.5" width="1.8" height="2.1" rx="0.25" fill="#E5C170" opacity="0.9" />
            <rect x="4.4" y="2.5" width="1.8" height="2.1" rx="0.25" fill="#E5C170" opacity="0.9" />
            <rect x="6.8" y="2.5" width="1.8" height="2.1" rx="0.25" fill="#E5C170" opacity="0.9" />
            <rect x="9.2" y="2.5" width="1.8" height="2.1" rx="0.25" fill="#E5C170" opacity="0.9" />
            {/* Windshield */}
            <path d="M 11.6 2.5 L 12.9 2.5 L 13 4.6 L 11.6 4.6 Z" fill="#E5C170" />
            {/* Wheels */}
            <circle cx="3.3" cy="9.2" r="1.55" fill="#1F2A68" />
            <circle cx="10.7" cy="9.2" r="1.55" fill="#1F2A68" />
            <circle cx="3.3" cy="9.2" r="0.55" fill="#E5C170" />
            <circle cx="10.7" cy="9.2" r="0.55" fill="#E5C170" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
