import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';
import { bookingConfig, priceLabel } from '@/config/booking';

/**
 * Default social sharing image, generated at build time from brand values.
 * Inherited by every route that does not define its own, so no page can end up
 * with a missing or stale Open Graph image.
 */
export const alt = `${siteConfig.name} — ${bookingConfig.slotDurationMinutes}-minute physiotherapy appointments for ${priceLabel}, serving Birmingham and surrounding areas`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  // Satori treats each interpolation as a separate child node, and a div with
  // more than one child must declare display. Building one string keeps the
  // markup single-child and unambiguous.
  const strapline = `${bookingConfig.slotDurationMinutes}-minute appointments · ${priceLabel} fixed price · Book online, call or WhatsApp`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #022a2b 0%, #0a6866 45%, #164cdd 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #5cd8cd 0%, #8459f5 100%)',
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            H
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>Havoheal</div>
            <div style={{ fontSize: 19, color: '#96eae1', letterSpacing: 3 }}>HEALTHCARE</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>
            Physiotherapy in Birmingham
          </div>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>
            and surrounding areas
          </div>
          <div style={{ fontSize: 30, color: '#c9f5ef', marginTop: 26 }}>{strapline}</div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: '#96eae1',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: 26,
          }}
        >
          <div>{siteConfig.domain}</div>
          <div>{siteConfig.contact.phoneDisplay}</div>
        </div>
      </div>
    ),
    size,
  );
}
