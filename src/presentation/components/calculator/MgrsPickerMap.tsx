"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents, LayersControl } from "react-leaflet";
import L from "leaflet";

import { cn } from "@/presentation/lib/utils";

type MapPoint = {
  lat: number;
  lon: number;
};

interface MgrsPickerMapProps {
  point: MapPoint | null;
  onPick: (lat: number, lon: number) => void;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [13.736717, 100.523186];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapViewSync({ point }: { point: MapPoint | null }) {
  const map = useMap();

  useEffect(() => {
    if (!point) return;
    map.setView([point.lat, point.lon], Math.max(map.getZoom(), 13), { animate: true });
  }, [map, point]);

  return null;
}

function InvalidateSizeEffect() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function MgrsPickerMap({ point, onPick, className }: MgrsPickerMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (!point) return DEFAULT_CENTER;
    return [point.lat, point.lon];
  }, [point]);

  return (
    <div className={cn("relative isolate overflow-visible rounded-md border", className || "h-64 w-full")}>
      <style>{`
        .leaflet-control-layers {
          z-index: 1000 !important;
        }
        .leaflet-control-layers-expanded {
          padding: 6px 10px 6px 6px;
          background: rgba(255,255,255,0.95);
          border-radius: 5px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
        }
        .leaflet-control-layers label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          padding: 2px 0;
          cursor: pointer;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={point ? 13 : 6}
        scrollWheelZoom
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <LayersControl position="topright">
          {/* Standard OpenStreetMap */}
          <LayersControl.BaseLayer checked name="🗺️ แผนที่ปกติ">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* Satellite - Esri World Imagery (free, no API key required) */}
          <LayersControl.BaseLayer name="🛰️ ดาวเทียม">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* Topographic Map */}
          <LayersControl.BaseLayer name="🏔️ ภูมิประเทศ">
            <TileLayer
              attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapClickHandler onPick={onPick} />
        <MapViewSync point={point} />
        <InvalidateSizeEffect />
        {point && <Marker position={[point.lat, point.lon]} icon={markerIcon} />}
      </MapContainer>
    </div>
  );
}
