"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

type MapPoint = {
  lat: number;
  lon: number;
};

interface MgrsPickerMapProps {
  point: MapPoint | null;
  onPick: (lat: number, lon: number) => void;
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

export function MgrsPickerMap({ point, onPick }: MgrsPickerMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (!point) return DEFAULT_CENTER;
    return [point.lat, point.lon];
  }, [point]);

  return (
    <MapContainer
      center={center}
      zoom={point ? 13 : 6}
      scrollWheelZoom
      className="h-64 w-full rounded-md border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPick={onPick} />
      <MapViewSync point={point} />
      {point && <Marker position={[point.lat, point.lon]} icon={markerIcon} />}
    </MapContainer>
  );
}
