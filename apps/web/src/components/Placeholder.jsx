import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Wireframe-style striped placeholder. Used directly, and as the fallback
// for <Media> when no real media has been uploaded for a section yet.
export function Ph({ tag, label, style, className = '' }) {
  return (
    <div className={'ph ' + className} style={style} role="img" aria-label={label}>
      {tag && <span className="ph-tag">{tag}</span>}
      <span className="ph-mid" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

// Renders the first uploaded image/video for a site section (via
// GET /api/media?section=...), falling back to <Ph> while empty. This is how
// the admin dashboard's "image/video changes in all sections" reaches the
// public site.
// `src` is the photo shipped with the site for this slot. An admin upload still
// wins when one exists, so the dashboard keeps working; the local frame stands
// in for it instead of the striped placeholder, which is what the pages show now
// that real photography exists.
export function Media({ section, roomTypeId, tag, label, src, className = '', style }) {
  const [item, setItem] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    api
      .getMedia(section, roomTypeId, controller.signal)
      .then((res) => {
        if (active) setItem(res?.media?.[0] || null);
      })
      .catch(() => {
        /* fall back to placeholder */
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [section, roomTypeId]);

  if (!item && src) {
    return (
      <div className={'ph shot ' + className} style={style}>
        <img className="media-img" src={src} alt={label} loading="lazy" decoding="async" />
      </div>
    );
  }
  if (!item) return <Ph tag={tag} label={label} className={className} style={style} />;

  return (
    <div className={'ph ' + className} style={style}>
      {item.type === 'VIDEO' ? (
        <video className="media-img" src={item.url} muted loop autoPlay playsInline />
      ) : (
        <img className="media-img" src={item.url} alt={item.altText || label} />
      )}
    </div>
  );
}
