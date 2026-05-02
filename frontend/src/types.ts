import { ComponentType, ReactNode } from 'react';

interface GeographyProps {
  geography: any;
  onMouseEnter?: (e: any) => void;
  onMouseLeave?: (e: any) => void;
  onClick?: (e: any) => void;
  style?: {
    default?: any;
    hover?: any;
    pressed?: any;
  };
}

export interface ReactSimpleMaps {
  ComposableMap: ComponentType<any>;
  Geographies: ComponentType<any>;
  Geography: ComponentType<GeographyProps>;
  ZoomableGroup: ComponentType<any>;
  Marker: ComponentType<any>;
  Line: ComponentType<any>;
  Annotation: ComponentType<any>;
  Graticule: ComponentType<any>;
  Sphere: ComponentType<any>;
}
