export interface Coords {
  lat: number;
  lng: number;
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<Coords> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { lat: 0, lng: 0 };

  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}, USA`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch (err) {
    console.error("[geocode] failed:", err);
  }

  return { lat: 0, lng: 0 };
}
