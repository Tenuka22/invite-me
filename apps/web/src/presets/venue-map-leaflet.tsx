import "leaflet/dist/leaflet.css";

import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

const PIN = divIcon({
  className: "stage-pin",
  html: '<span class="stage-pin-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/**
 * Loaded only in the browser (see `venue-map.tsx`). Dragging is off on touch screens so a
 * guest scrolling the page never gets caught in the map; the map opens in Google Maps instead.
 */
export default function VenueMapLeaflet({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      dragging={!touch}
      zoomControl={!touch}
      attributionControl
      className="stage-map-canvas"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={PIN} title={label} />
    </MapContainer>
  );
}
