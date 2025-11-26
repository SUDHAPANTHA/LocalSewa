import L from "leaflet";

// Fix default icon paths for leaflet when bundling with Vite/React
const iconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url)
  .toString();
const iconRetinaUrl = new URL(
  "leaflet/dist/images/marker-icon-2x.png",
  import.meta.url
).toString();
const shadowUrl = new URL(
  "leaflet/dist/images/marker-shadow.png",
  import.meta.url
).toString();

export const defaultLeafletIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultLeafletIcon;

