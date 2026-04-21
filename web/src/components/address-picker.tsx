"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

export type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  addressValue: string;
  onAddressChange: (v: string) => void;
  addressError?: string;
};

const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// SF city hall — arbitrary but bounded default.
const DEFAULT_CENTER: LatLng = { lat: 37.7793, lng: -122.4193 };

export function AddressPicker({
  value,
  onChange,
  addressValue,
  onAddressChange,
  addressError,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  // Keep the latest onChange in a ref so the map-click handler stays stable
  // across renders without re-registering.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initial = value ?? DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [TILE_URL],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [initial.lng, initial.lat],
      zoom: 12,
    });
    map.addControl(new maplibregl.NavigationControl({}), "top-right");

    const marker = new maplibregl.Marker({ draggable: true })
      .setLngLat([initial.lng, initial.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      onChangeRef.current({ lat, lng });
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Init once; subsequent value changes are handled by the effect below.
    // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only
  }, []);

  // Keep the marker in sync if `value` is set externally (e.g. form reset
  // or initial server-loaded coords arriving after first paint).
  useEffect(() => {
    if (!markerRef.current || !mapRef.current || !value) return;
    const current = markerRef.current.getLngLat();
    if (
      Math.abs(current.lat - value.lat) < 1e-7 &&
      Math.abs(current.lng - value.lng) < 1e-7
    ) {
      return;
    }
    markerRef.current.setLngLat([value.lng, value.lat]);
    mapRef.current.easeTo({ center: [value.lng, value.lat] });
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Base address</span>
        <input
          className="input"
          autoComplete="street-address"
          placeholder="123 Market St, San Francisco, CA"
          value={addressValue}
          onChange={(e) => onAddressChange(e.target.value)}
        />
        {addressError && (
          <span className="text-xs text-red-600 dark:text-red-400">
            {addressError}
          </span>
        )}
      </label>
      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700"
      />
      <p className="text-xs text-zinc-500">
        Click or drag the pin to set your base location.{" "}
        {value ? (
          <span className="tabular-nums">
            ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})
          </span>
        ) : (
          <span>No location set yet.</span>
        )}
      </p>
    </div>
  );
}
