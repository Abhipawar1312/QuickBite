export const MapContainer = ({ children }: any) => children;
export const TileLayer = () => null;
export const Marker = ({ children }: any) => children;
export const Popup = ({ children }: any) => children;
export const Polyline = () => null;
export const useMap = () => ({
  flyTo: jest.fn(),
  setView: jest.fn(),
  fitBounds: jest.fn(),
  getZoom: () => 15,
});
export const useMapEvents = jest.fn();
