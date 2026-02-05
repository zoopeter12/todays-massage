declare namespace naver.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    getBounds(): LatLngBounds;
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    setZoom(level: number): void;
    getZoom(): number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    getSW(): LatLng;
    getNE(): LatLng;
    getMin(): LatLng;
    getMax(): LatLng;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
    getPosition(): LatLng;
  }

  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    zoomControl?: boolean;
    zoomControlOptions?: {
      position?: number;
    };
    minZoom?: number;
    maxZoom?: number;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    title?: string;
    icon?: string | MarkerIcon;
  }

  interface MarkerIcon {
    content: string;
    anchor?: Point;
    size?: { width: number; height: number };
  }

  namespace Event {
    function addListener(
      target: object,
      type: string,
      listener: (...args: unknown[]) => void
    ): void;
    function removeListener(listener: unknown): void;
  }

  namespace Position {
    const TOP_LEFT: number;
    const TOP_CENTER: number;
    const TOP_RIGHT: number;
    const LEFT_CENTER: number;
    const CENTER: number;
    const RIGHT_CENTER: number;
    const BOTTOM_LEFT: number;
    const BOTTOM_CENTER: number;
    const BOTTOM_RIGHT: number;
  }
}

interface Window {
  naver: typeof naver;
}
