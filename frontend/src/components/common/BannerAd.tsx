import { useEffect, useState } from 'react';
import type { Banner } from '../../types';
import { fetchAllBanners } from './bannerCache';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api').replace(/\/api$/, '');

function resolveUrl(url: string): string {
  if (!url) return url;
  const httpMatch = url.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/);
  if (httpMatch) return httpMatch[1];
  if (url.startsWith('/uploads/')) return url;
  const m = url.match(/\/gallery\/([^/?#]+)$/);
  if (m) return `/uploads/gallery/${m[1]}`;
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

interface Props {
  position: string;
  className?: string;
}

export default function BannerAd({ position, className = '' }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAllBanners()
      .then((all) => {
        if (!cancelled) setBanners(all.filter((b) => b.position === position));
      })
      .catch(() => {/* silently ignore */});
    return () => { cancelled = true; };
  }, [position]);

  if (banners.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      {banners.map((b) => (
        b.linkUrl ? (
          <a
            key={b._id}
            href={b.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
            aria-label={b.title}
          >
            <img
              src={resolveUrl(b.imageUrl)}
              alt={b.title}
              className="w-full h-auto object-cover"
              onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
            />
          </a>
        ) : (
          <div key={b._id} className="w-full">
            <img
              src={resolveUrl(b.imageUrl)}
              alt={b.title}
              className="w-full h-auto object-cover"
              onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
            />
          </div>
        )
      ))}
    </div>
  );
}
