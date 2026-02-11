import { LucideIcon } from 'lucide-react';

export enum ElementType {
  BUTTON = 'BUTTON',
  HEADING = 'HEADING',
  PARAGRAPH = 'PARAGRAPH',
  CARD = 'CARD',
  INPUT = 'INPUT',
  IMAGE_PLACEHOLDER = 'IMAGE_PLACEHOLDER',
  VIDEO_PLACEHOLDER = 'VIDEO_PLACEHOLDER',
  AVATAR = 'AVATAR',
  BADGE = 'BADGE',
  DIVIDER = 'DIVIDER',
  CONTAINER = 'CONTAINER',
  CUSTOM = 'CUSTOM' // New type for user-created components
}

// --- NODE SYSTEM TYPES ---

export enum NodeType {
  OUTPUT = 'OUTPUT', // The final result node
  STYLE = 'STYLE',   // CSS properties (Text & Bg)
  BORDER = 'BORDER', // Border properties
  SHADOW = 'SHADOW', // Box Shadow
  GRADIENT = 'GRADIENT', // Linear Gradient
  TRANSFORM = 'TRANSFORM', // Rotate, Scale
  FONT = 'FONT',     // Font Family
  LAYOUT = 'LAYOUT', // Padding, Opacity
  MERGE = 'MERGE',   // Merge two style objects
  TEXT = 'TEXT',     // Static text content
  UPPERCASE = 'UPPERCASE', // String transform
  COLOR = 'COLOR',   // Color value
  ARRAY = 'ARRAY',   // Array of values (e.g. colors)
  NUMBER = 'NUMBER', // Numeric value
  MATH = 'MATH',     // Basic Math (Add)
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  CONCAT = 'CONCAT',  // String Concatenation
  TOGGLE = 'TOGGLE', // Boolean true/false
  IF_ELSE = 'IF_ELSE', // Conditional logic
  EQUAL = 'EQUAL',     // a == b
  GREATER = 'GREATER', // a > b
  AND = 'AND',         // a && b
  OR = 'OR'            // a || b
}

export interface NodeSocket {
  id: string;
  label: string;
  type: 'source' | 'target'; // Source = right side, Target = left side
  dataType: 'style' | 'string' | 'color' | 'element' | 'number' | 'boolean' | 'any';
}

export interface NodeData {
  label: string;
  value?: any; // Base value
  exposed?: boolean; // Is this property exposed to the properties panel?
  exposedLabel?: string; // The label shown in the properties panel
  [key: string]: any; 
}

export interface GraphNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: NodeData;
}

export interface GraphConnection {
  id: string;
  sourceNodeId: string;
  sourceSocketId: string;
  targetNodeId: string;
  targetSocketId: string;
}

export interface CustomComponentDefinition {
  id: string;
  name: string;
  nodes: GraphNode[];
  connections: GraphConnection[];
}

export interface SavedNodeGroup {
  id: string;
  name: string;
  nodes: GraphNode[];
  connections: GraphConnection[];
}

// --- EXISTING TYPES ---

export interface ElementStyle {
  backgroundColor?: string;
  backgroundImage?: string; // Gradient support
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  autoFontSize?: boolean;
  fontWeight?: 'normal' | 'bold';
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  padding?: number;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  display?: string;
  alignItems?: string;
  justifyContent?: string;
  boxShadow?: string;
  transform?: string; // Rotate/Scale
}

export interface CanvasElement {
  id: string;
  parentId?: string;
  type: ElementType;
  name?: string; // User-defined name for the element instance
  
  // Custom Component Logic
  customComponentId?: string; // Reference to the master definition
  isDetached?: boolean; // If true, it uses customNodeGroup instead of master definition (Auto-update OFF)
  customNodeGroup?: CustomComponentDefinition | null; // Local copy of nodes for this specific instance
  
  propOverrides?: Record<string, any>; // Key: Node ID, Value: Overridden value
  x: number;
  y: number;
  content?: string;
  width: number;
  height: number;
  style: ElementStyle;
}

export interface ToolDefinition {
  type: ElementType;
  label: string;
  icon: LucideIcon;
  defaultWidth: number;
  defaultHeight: number;
  defaultContent?: string;
  defaultStyle: ElementStyle;
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
}

export type AppMode = 'SELECT' | 'STAMP';

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ResizeState {
  isResizing: boolean;
  activeHandle: ResizeHandle | null;
  elementId: string | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
}

export interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}