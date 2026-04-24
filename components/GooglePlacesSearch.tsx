"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export interface PlaceResult {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  google_rating: number | null;
  lat: number | null;
  lng: number | null;
}

interface Props {
  onPlaceSelected: (place: PlaceResult) => void;
}

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  short = false
): string {
  const c = components.find((c) => c.types.includes(type));
  return c ? (short ? c.short_name : c.long_name) : "";
}

export default function GooglePlacesSearch({ onPlaceSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment"],
      fields: ["name", "formatted_phone_number", "rating", "address_components", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const streetNumber = getComponent(place.address_components, "street_number");
      const route = getComponent(place.address_components, "route");
      const city =
        getComponent(place.address_components, "locality") ||
        getComponent(place.address_components, "sublocality");
      const state = getComponent(place.address_components, "administrative_area_level_1", true);
      const zip = getComponent(place.address_components, "postal_code");

      const result: PlaceResult = {
        name: place.name ?? "",
        address: [streetNumber, route].filter(Boolean).join(" "),
        city,
        state,
        zip,
        phone: place.formatted_phone_number ?? "",
        google_rating: place.rating ?? null,
        lat: place.geometry?.location?.lat() ?? null,
        lng: place.geometry?.location?.lng() ?? null,
      };

      setSelected(result.name);
      onPlaceSelected(result);
    });
  }, [loaded, onPlaceSelected]);

  if (error) {
    return <p className="text-xs text-red-500">{error}</p>;
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setLoaded(true)}
        onError={() => setError("Failed to load Google Places. Check your API key.")}
      />
      <div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={loaded ? "Search Google Maps for a shop…" : "Loading Google Places…"}
            disabled={!loaded}
            onChange={() => setSelected(null)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
        {selected && (
          <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Fields filled from &ldquo;{selected}&rdquo; — review and adjust below
          </p>
        )}
      </div>
    </>
  );
}
