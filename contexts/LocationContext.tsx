"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface Coords { lat: number; lng: number }
export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

interface LocationContextValue {
  coords: Coords | null;
  status: LocationStatus;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextValue>({
  coords: null,
  status: "idle",
  requestLocation: () => {},
});

const CACHE_KEY = "tirehub_coords";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [bannerVisible, setBannerVisible] = useState(false);

  const saveCoords = useCallback((c: Coords) => {
    setCoords(c);
    setStatus("granted");
    setBannerVisible(false);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...c, ts: Date.now() }));
    } catch { /* storage unavailable */ }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => saveCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setStatus("denied");
        setBannerVisible(true);
      },
      { timeout: 10000, maximumAge: CACHE_TTL }
    );
  }, [saveCoords]);

  useEffect(() => {
    // Try reading cached coords first
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { lat, lng, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) {
          setCoords({ lat, lng });
          setStatus("granted");
          return;
        }
      }
    } catch { /* ignore */ }

    // Auto-request on first visit
    requestLocation();
  }, [requestLocation]);

  return (
    <LocationContext.Provider value={{ coords, status, requestLocation }}>
      {children}

      {/* Subtle banner when denied — only show once */}
      {bannerVisible && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1d1d1f] text-white text-sm px-5 py-3.5 rounded-2xl shadow-xl max-w-sm w-[calc(100%-2rem)]">
          <svg className="w-5 h-5 shrink-0 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="flex-1">Enable location for faster shop searches</span>
          <button
            onClick={() => { setBannerVisible(false); requestLocation(); }}
            className="shrink-0 text-[#f97316] font-semibold hover:text-[#fbb07a] transition-colors"
          >
            Allow
          </button>
          <button
            onClick={() => setBannerVisible(false)}
            className="shrink-0 text-[#6e6e73] hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
