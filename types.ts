
import { LucideIcon } from 'lucide-react';

export interface Page {
  id: string;
  name: string;
}

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
  LOWERCASE = 'LOWERCASE', // String to lowercase
  CAPITALIZE = 'CAPITALIZE', // First char uppercase
  REPLACE = 'REPLACE', // Replace substring
  STRING_LENGTH = 'STRING_LENGTH', // Length of string
  COLOR = 'COLOR',   // Color value
  HSL = 'HSL',       // Color from Hue, Saturation, Lightness
  ARRAY = 'ARRAY',   // Array of values (e.g. colors)
  ARRAY_GET = 'ARRAY_GET', // Get index
  ARRAY_LENGTH = 'ARRAY_LENGTH', // Length of array
  ARRAY_JOIN = 'ARRAY_JOIN', // Join to string
  NUMBER = 'NUMBER', // Numeric value
  RANDOM = 'RANDOM', // Random number min/max
  ROUND = 'ROUND',   // Round to integer
  MATH = 'MATH',     // Basic Math (Add)
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  SIN = 'SIN',       // Sinus
  COS = 'COS',       // Cosinus
  CONCAT = 'CONCAT',  // String Concatenation
  TOGGLE = 'TOGGLE', // Boolean true/false
  IF_ELSE = 'IF_ELSE', // Conditional logic
  EQUAL = 'EQUAL',     // a == b
  GREATER = 'GREATER', // a > b
  AND = 'AND',         // a && b
  OR = 'OR',           // a || b
  NOT = 'NOT',         // !a
  
  // --- ANIMATION ---
  ANIMATION = 'ANIMATION', // CSS Keyframe Animation
  TRANSITION = 'TRANSITION', // CSS Transition property

  // --- INTERACTION / SCRIPTS ---
  INTERACTION_HOVER = 'INTERACTION_HOVER', // True when mouse over
  INTERACTION_CLICK = 'INTERACTION_CLICK', // Toggles True/False on click
  TIMER = 'TIMER',      // Continuous time value for animations
  NAVIGATE = 'NAVIGATE', // Change active page
  LINK = 'LINK',        // Open external URL
  ALERT = 'ALERT'       // Browser Alert
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
  inputCount?: number; // For dynamic nodes like ARRAY
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
  borderBottomWidth?: number; // Added for specific border control
  borderTopWidth?: number; // Added for footer border control
  borderColor?: string;
  padding?: number;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  display?: string;
  flexDirection?: string; // Added for flex column layouts
  alignItems?: string;
  justifyContent?: string;
  gap?: number; // Added for flex gap
  boxShadow?: string;
  textShadow?: string; // Added for text highlighting
  transform?: string; // Rotate/Scale
  animation?: string; // CSS Animation string
  transition?: string; // CSS Transition string
  lineHeight?: number | string; // Added for text control
  letterSpacing?: string; // Added for text control
  marginTop?: number; // Added for spacing
  marginLeft?: number; // Added for spacing
  objectFit?: 'cover' | 'contain' | 'fill'; // For images
}

export interface VideoOptions {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
}

export interface CanvasElement {
  id: string;
  parentId?: string;
  pageId: string; // Belongs to a specific page
  type: ElementType;
  name?: string; // User-defined name for the element instance
  
  // Custom Component Logic
  customComponentId?: string; // Reference to the master definition
  isDetached?: boolean; // If true, it uses customNodeGroup instead of master definition (Auto-update OFF)
  customNodeGroup?: CustomComponentDefinition | null; // Local copy of nodes for this specific instance
  
  // Unity-style Scripts (Components)
  scripts?: string[]; // Array of CustomComponentDefinition IDs attached to this element
  
  propOverrides?: Record<string, any>; // Key: Node ID, Value: Overridden value
  x: number;
  y: number;
  content?: string;
  
  // Media Properties
  src?: string;
  alt?: string;
  videoOptions?: VideoOptions;

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
