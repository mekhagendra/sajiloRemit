import { getBanners } from '../../api';
import type { Banner } from '../../types';

const CACHE_TTL = 30_000;
let _cache: { banners: Banner[]; ts: number } | null = null;
let _pending: Promise<Banner[]> | null = null;

export function fetchAllBanners(): Promise<Banner[]> {
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
