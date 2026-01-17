import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#1a1a1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 주사위 외곽 */}
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="3"
            fill="#f5f5f5"
          />
          {/* 주사위 점 - 6면 */}
          <circle cx="7" cy="7" r="1.8" fill="#1a1a1a" />
          <circle cx="12" cy="7" r="1.8" fill="#1a1a1a" />
          <circle cx="17" cy="7" r="1.8" fill="#1a1a1a" />
          <circle cx="7" cy="17" r="1.8" fill="#1a1a1a" />
          <circle cx="12" cy="17" r="1.8" fill="#1a1a1a" />
          <circle cx="17" cy="17" r="1.8" fill="#1a1a1a" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
