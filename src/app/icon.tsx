import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <svg
          width="24"
          height="24"
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
          {/* 주사위 점 - 6면 (대각선 2줄) */}
          <circle cx="7" cy="7" r="2" fill="#1a1a1a" />
          <circle cx="12" cy="7" r="2" fill="#1a1a1a" />
          <circle cx="17" cy="7" r="2" fill="#1a1a1a" />
          <circle cx="7" cy="17" r="2" fill="#1a1a1a" />
          <circle cx="12" cy="17" r="2" fill="#1a1a1a" />
          <circle cx="17" cy="17" r="2" fill="#1a1a1a" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
