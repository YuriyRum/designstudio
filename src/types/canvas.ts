export type ElementType = 'text' | 'shape' | 'image' | 'qrcode' | 'icon';

export type ShapeType =
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'arrow'
  | 'badge'
  | 'diamond'
  | 'speech-bubble';

export interface GradientFill {
  type: 'linear' | 'radial';
  from: string;
  to: string;
  angle: number; // degrees
}

export interface ShadowEffect {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface ImageFilters {
  brightness: number; // 0 - 200, default 100
  contrast: number;   // 0 - 200, default 100
  saturation: number; // 0 - 200, default 100
  grayscale: number;  // 0 - 100, default 0
  blur: number;       // 0 - 20, default 0
  sepia: number;      // 0 - 100, default 0
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  name: string;
  shadow?: ShadowEffect;

  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;

  // Shape specific
  shapeType?: ShapeType;
  fillColor?: string;
  fillGradient?: GradientFill;
  borderRadius?: number;

  // Image specific
  src?: string;
  alt?: string;
  filters?: ImageFilters;
  flipX?: boolean;
  flipY?: boolean;
  aspectRatioLocked?: boolean;

  // QR Code specific
  qrText?: string;
  fgColor?: string;
  bgColor?: string;

  // Icon specific
  iconName?: string;
}

export interface CanvasPage {
  id: string;
  name: string;
  backgroundColor: string;
  backgroundGradient?: GradientFill;
  backgroundImage?: string;
  elements: CanvasElement[];
}

export interface CanvasProject {
  id: string;
  title: string;
  width: number;
  height: number;
  unit: 'px' | 'in' | 'mm';
  pages: CanvasPage[];
  currentPageIndex: number;
}

export interface DimensionPreset {
  id: string;
  name: string;
  category: 'social' | 'print' | 'presentation' | 'marketing';
  width: number;
  height: number;
  icon: string;
  description: string;
}

export interface GuideLine {
  type: 'horizontal' | 'vertical';
  position: number;
}
