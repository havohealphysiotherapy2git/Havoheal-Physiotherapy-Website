import { ImageResponse } from 'next/og';

/** Apple touch icon, generated from the brand mark so no binary asset is needed. */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2dbfb5 0%, #1d62f1 55%, #7337ea 100%)',
          color: '#ffffff',
          fontSize: 104,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        H
      </div>
    ),
    size,
  );
}
