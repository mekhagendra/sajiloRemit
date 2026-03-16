import { useEffect, useState } from 'react';
import { getBanners } from '../../api';
import type { Banner } from '../../types';

const API_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5003/api').replace(/\/api$/, '');

function resolveUrl(url: string) {
  if (!url) return url;
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
}

// Module-level cache: all BannerAd instances share one request instead of firing 5+
// Each position used to trigger its own network call; now a single fetch is cached for 30s.
const CACHE_TTL = 30_000;
let _cache: { banners: Banner[]; ts: number } | null = null;
let _pending: Promise<Banner[]> | null = null;

function fetchAllBanners(): Promise<Banner[]> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return Promise.resolve(_cache.banners);
  }
  if (_pending) return _pending;
  _pending = getBanners()
    .then((res) => {
      _cache = { banners: res.data.banners, ts: Date.now() };
      _pending = null;
      return _cache.banners;
    })
    .catch((err) => {
      _pending = null;
      throw err;
    });
  return _pending;
}

export { fetchAllBanners };

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
