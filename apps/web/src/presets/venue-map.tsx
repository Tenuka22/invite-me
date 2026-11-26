import { type ComponentType, useEffect, useState } from "react";

type MapProps = { lat: number; lng: number; label: string };

/** Leaflet touches `window` at import, so the map module loads after mount, never during SSR. */
export function VenueMap(props: MapProps) {
  const [Map, setMap] = useState<ComponentType<MapProps> | null>(null);
  useEffect(() => {
    let alive = true;
    void import("./venue-map-leaflet").then((m) => {
      if (alive) setMap(() => m.default);
    });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="stage-map" role="img" aria-label={`Map showing ${props.label}`}>
      {Map ? <Map {...props} /> : null}
    </div>
  );
}
