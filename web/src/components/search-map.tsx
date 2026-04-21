"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

export type LatLng = { lat: number; lng: number };
export type ChefPin = { id: string; lat: number; lng: number; label: string };

type Props = {
  customer: LatLng;
  onCustomerChange: (v: LatLng) => void;
  chefs: ChefPin[];
  onChefClick?: (chefId: string) => void;
};

const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function SearchMap({
  customer,
  onCustomerChange,
  chefs,
  onChefClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const customerMarkerRef = useRef<maplibregl.Marker | null>(null);
  const chefMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onCustomerChangeRef = useRef(onCustomerChange);
  const onChefClickRef = useRef(onChefClick);
  onCustomerChangeRef.current = onCustomerChange;
  onChefClickRef.current = onChefClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

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
      center: [customer.lng, customer.lat],
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({}), "top-right");

    // Customer pin — draggable, accent-colored so it reads distinct from
    // the chef pins.
    const marker = new maplibregl.Marker({ color: "#059669", draggable: true })
      .setLngLat([customer.lng, customer.lat])
      .addTo(map);
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      onCustomerChangeRef.current({ lat, lng });
    });

    mapRef.current = map;
    customerMarkerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      customerMarkerRef.current = null;
      chefMarkersRef.current.clear();
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only
  }, []);

  // Keep customer marker in sync (address-input typing / RHF reset).
  useEffect(() => {
    const marker = customerMarkerRef.current;
    if (!marker) return;
    const current = marker.getLngLat();
    if (
      Math.abs(current.lat - customer.lat) < 1e-7 &&
      Math.abs(current.lng - customer.lng) < 1e-7
    ) {
      return;
    }
    marker.setLngLat([customer.lng, customer.lat]);
  }, [customer]);

  // Reconcile chef pins against the current result set. Cheap enough to
  // rebuild fully on each change since N is small for MVP.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const incomingIds = new Set(chefs.map((c) => c.id));

    for (const [id, marker] of chefMarkersRef.current) {
      if (!incomingIds.has(id)) {
        marker.remove();
        chefMarkersRef.current.delete(id);
      }
    }

    for (const c of chefs) {
      const existing = chefMarkersRef.current.get(c.id);
      if (existing) {
        existing.setLngLat([c.lng, c.lat]);
        continue;
      }
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `Chef ${c.label}`);
      el.className = "chef-pin";
      el.textContent = "🍣";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onChefClickRef.current?.(c.id);
      });
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([c.lng, c.lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(c.label))
        .addTo(map);
      chefMarkersRef.current.set(c.id, marker);
    }

    // Fit bounds to show customer + all chefs, on result-set changes.
    if (chefs.length > 0) {
      const b = new maplibregl.LngLatBounds(
        [customer.lng, customer.lat],
        [customer.lng, customer.lat],
      );
      for (const c of chefs) b.extend([c.lng, c.lat]);
      map.fitBounds(b, { padding: 48, maxZoom: 13, duration: 400 });
    }
  }, [chefs, customer]);

  return (
    <>
      <div
        ref={containerRef}
        className="h-80 w-full overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700"
      />
      <style>{`
        .chef-pin {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: white;
          border: 2px solid rgb(24 24 27);
          font-size: 16px;
          line-height: 28px;
          text-align: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,.2);
          padding: 0;
        }
        .chef-pin:hover { transform: scale(1.08); }
      `}</style>
    </>
  );
}
