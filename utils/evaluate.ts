
import { CustomComponentDefinition, NodeType } from '../types';

export interface RuntimeContext {
    isHovered: boolean;
    isClicked: boolean; // Acts as a toggle
    time: number; // Seconds elapsed
}

export const evaluateNodeGraph = (
  def: CustomComponentDefinition, 
  overrides: Record<string, any> = {},
  context: RuntimeContext = { isHovered: false, isClicked: false, time: 0 }
): { style: any, content: string } => {
  
  const outputNode = def.nodes.find(n => n.type === NodeType.OUTPUT);
  // Also look for Side-Effect nodes (like NAVIGATE) that don't output to OUTPUT but exist in graph
  // In the current architecture, evaluateNodeGraph is pure. Side effects like Navigation 
  // are handled by the runtime script in the exported HTML by walking the graph itself.
  // Here in the editor, we just return style/content.
  
  if (!outputNode) return { style: {}, content: '' };

  const memo = new Map<string, any>();
  const visited = new Set<string>(); // Simple cycle detection

  const evaluateNode = (nodeId: string): any => {
      if (memo.has(nodeId)) return memo.get(nodeId);
      if (visited.has(nodeId)) return null; // Break cycles
      visited.add(nodeId);

      // 1. Check for Instance Overrides (Properties Panel)
      if (overrides[nodeId] !== undefined) {
          const val = overrides[nodeId];
          memo.set(nodeId, val);
          visited.delete(nodeId);
          return val;
      }

      const node = def.nodes.find(n => n.id === nodeId);
      if (!node) {
          visited.delete(nodeId);
          return null;
      }

      // Helper to get input from connection
      const getInputValue = (inputSocketId: string) => {
         const conn = def.connections.find(c => c.targetNodeId === nodeId && c.targetSocketId === inputSocketId);
         if (conn) {
             return evaluateNode(conn.sourceNodeId);
         }
         return null;
      };

      let result: any = null;

      switch (node.type) {
          // --- INTERACTION ---
          case NodeType.INTERACTION_HOVER:
              result = context.isHovered;
              break;
          case NodeType.INTERACTION_CLICK:
              result = context.isClicked;
              break;
          case NodeType.TIMER:
              // Multiplier input
              const speed = Number(getInputValue('in-speed') ?? 1);
              result = context.time * speed;
              break;

          // --- STATIC ---
          case NodeType.TEXT:
          case NodeType.COLOR:
          case NodeType.NUMBER:
          case NodeType.TOGGLE:
          case NodeType.NAVIGATE: 
          case NodeType.LINK:
          case NodeType.ALERT:
          case NodeType.ANIMATION: // Store animation type in value
              result = node.data.value;
              break;
          
          // --- MATH ---
          case NodeType.MATH: {
              const a = Number(getInputValue('in-a') || 0);
              const b = Number(getInputValue('in-b') || 0);
              result = a + b;
              break;
          }
          case NodeType.SUBTRACT: {
              const a = Number(getInputValue('in-a') || 0);
              const b = Number(getInputValue('in-b') || 0);
              result = a - b;
              break;
          }
          case NodeType.MULTIPLY: {
              const a = Number(getInputValue('in-a') || 0);
              const b = Number(getInputValue('in-b') || 0);
              result = a * b;
              break;
          }
          case NodeType.DIVIDE: {
              const a = Number(getInputValue('in-a') || 0);
              const b = Number(getInputValue('in-b') || 1);
              result = b === 0 ? 0 : a / b;
              break;
          }
          case NodeType.SIN: {
              const val = Number(getInputValue('in-val') || 0);
              result = Math.sin(val);
              break;
          }
          case NodeType.COS: {
              const val = Number(getInputValue('in-val') || 0);
              result = Math.cos(val);
              break;
          }
          case NodeType.ROUND: {
              const val = Number(getInputValue('in-val') || 0);
              result = Math.round(val);
              break;
          }
          case NodeType.RANDOM: {
              const min = Number(getInputValue('in-min') || 0);
              const max = Number(getInputValue('in-max') || 100);
              result = Math.random() * (max - min) + min;
              break;
          }
          
          // --- LOGIC ---
          case NodeType.EQUAL: {
              const a = getInputValue('in-a');
              const b = getInputValue('in-b');
              result = a == b;
              break;
          }
          case NodeType.GREATER: {
              const a = Number(getInputValue('in-a') || 0);
              const b = Number(getInputValue('in-b') || 0);
              result = a > b;
              break;
          }
          case NodeType.AND: {
              const a = !!getInputValue('in-a');
              const b = !!getInputValue('in-b');
              result = a && b;
              break;
          }
          case NodeType.OR: {
              const a = !!getInputValue('in-a');
              const b = !!getInputValue('in-b');
              result = a || b;
              break;
          }
          case NodeType.NOT: {
              const a = !!getInputValue('in-a');
              result = !a;
              break;
          }
          case NodeType.IF_ELSE: {
              const condition = getInputValue('in-condition');
              const trueVal = getInputValue('in-true');
              const falseVal = getInputValue('in-false');
              result = condition ? trueVal : falseVal;
              break;
          }

          // --- STRINGS ---
          case NodeType.CONCAT: {
              const s1 = String(getInputValue('in-str1') || '');
              const s2 = String(getInputValue('in-str2') || '');
              result = s1 + s2;
              break;
          }
          case NodeType.UPPERCASE: {
              const val = getInputValue('in-text');
              const text = val === null || val === undefined ? '' : String(val);
              result = text.toUpperCase();
              break;
          }
          case NodeType.LOWERCASE: {
              const val = getInputValue('in-text');
              const text = val === null || val === undefined ? '' : String(val);
              result = text.toLowerCase();
              break;
          }
          case NodeType.CAPITALIZE: {
              const val = getInputValue('in-text');
              const text = val === null || val === undefined ? '' : String(val);
              if (text.length > 0) {
                  result = text.charAt(0).toUpperCase() + text.slice(1);
              } else {
                  result = text;
              }
              break;
          }
          case NodeType.REPLACE: {
              const val = getInputValue('in-text');
              const text = val === null || val === undefined ? '' : String(val);
              const find = String(getInputValue('in-find') || '');
              const replace = String(getInputValue('in-replace') || '');
              
              if (!find) {
                  result = text;
              } else {
                  result = text.split(find).join(replace);
              }
              break;
          }
          case NodeType.STRING_LENGTH: {
              const text = String(getInputValue('in-text') || '');
              result = text.length;
              break;
          }

          // --- ARRAYS ---
          case NodeType.ARRAY: {
              const items = [];
              const count = node.data.inputCount || 0;
              for (let i = 0; i < count; i++) {
                  const val = getInputValue(`in-${i}`);
                  if (val !== null && val !== undefined) {
                      items.push(val);
                  }
              }
              result = items;
              break;
          }
          case NodeType.ARRAY_GET: {
              const arr = getInputValue('in-arr');
              let index = getInputValue('in-index');
              if (index === null) index = node.data.value || 0;
              
              if (Array.isArray(arr) && typeof index === 'number') {
                  result = arr[index];
              } else {
                  result = null;
              }
              break;
          }
          case NodeType.ARRAY_LENGTH: {
              const arr = getInputValue('in-arr');
              result = Array.isArray(arr) ? arr.length : 0;
              break;
          }
          case NodeType.ARRAY_JOIN: {
              const arr = getInputValue('in-arr');
              let sep = getInputValue('in-sep');
              if (sep === null) sep = node.data.value || ', '; // Default separator
              result = Array.isArray(arr) ? arr.join(sep) : '';
              break;
          }

          // --- STYLING / COLOR ---
          case NodeType.HSL: {
              const h = Number(getInputValue('in-h') || 0);
              const s = Number(getInputValue('in-s') || 100);
              const l = Number(getInputValue('in-l') || 50);
              result = `hsl(${h}, ${s}%, ${l}%)`;
              break;
          }
          case NodeType.STYLE: {
              const bg = getInputValue('in-bg');
              const text = getInputValue('in-text');
              const size = getInputValue('in-size');
              const autoSize = getInputValue('in-auto-size');
              
              result = {
                  backgroundColor: bg,
                  color: text,
                  fontSize: size, // Keeping as number here, renderer adds 'px'
                  autoFontSize: !!autoSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              };
              break;
          }
          case NodeType.GRADIENT: {
              const colorsInput = getInputValue('in-colors');
              const deg = getInputValue('in-deg') || 90;
              
              let gradientString = '';

              if (Array.isArray(colorsInput) && colorsInput.length > 0) {
                  gradientString = colorsInput.join(', ');
              } else {
                  const c1 = getInputValue('in-c1') || '#ffffff';
                  const c2 = getInputValue('in-c2') || '#000000';
                  gradientString = `${c1}, ${c2}`;
              }

              result = {
                  backgroundImage: `linear-gradient(${deg}deg, ${gradientString})`
              };
              break;
          }
          case NodeType.TRANSFORM: {
              const rot = getInputValue('in-rot') || 0;
              const scale = getInputValue('in-scale') ?? 1;
              result = {
                  transform: `rotate(${rot}deg) scale(${scale})`
              };
              break;
          }
          case NodeType.FONT: {
              const font = getInputValue('in-font') || 'sans-serif';
              result = {
                  fontFamily: font
              };
              break;
          }
          case NodeType.BORDER: {
              const width = getInputValue('in-width');
              const color = getInputValue('in-color');
              const radius = getInputValue('in-radius');
              result = {
                  borderWidth: width,
                  borderColor: color,
                  borderRadius: radius
              };
              break;
          }
          case NodeType.SHADOW: {
              const x = getInputValue('in-x') || 0;
              const y = getInputValue('in-y') || 0;
              const blur = getInputValue('in-blur') || 0;
              const color = getInputValue('in-color') || '#000000';
              result = {
                  boxShadow: `${x}px ${y}px ${blur}px ${color}`
              };
              break;
          }
          case NodeType.LAYOUT: {
              const padding = getInputValue('in-padding');
              const opacity = getInputValue('in-opacity');
              result = {
                  padding: padding,
                  opacity: opacity
              };
              break;
          }
          case NodeType.MERGE: {
              const styleA = getInputValue('in-style-a') || {};
              const styleB = getInputValue('in-style-b') || {};
              result = { ...styleA, ...styleB };
              break;
          }
          
          // --- ANIMATIONS ---
          case NodeType.ANIMATION: {
              const triggerConn = def.connections.find(c => c.targetNodeId === nodeId && c.targetSocketId === 'in-trigger');
              let shouldRun = true;
              
              if (triggerConn) {
                  shouldRun = !!getInputValue('in-trigger');
              }

              if (!shouldRun) {
                  result = { animation: 'none' };
              } else {
                  const type = node.data.value || 'fadeIn';
                  const dur = Number(getInputValue('in-duration') || 1);
                  const delay = Number(getInputValue('in-delay') || 0);
                  
                  // For infinite loop types: spin, pulse, shake
                  let iter = '1';
                  if (type === 'spin' || type === 'pulse' || type === 'shake') iter = 'infinite';
                  else iter = '1';

                  // Using 'both' or 'forwards' ensures entry animations persist
                  result = {
                      animation: `${type} ${dur}s ease-in-out ${delay}s ${iter} both`
                  };
              }
              break;
          }
          case NodeType.TRANSITION: {
              const dur = Number(getInputValue('in-duration') || 0.3);
              const delay = Number(getInputValue('in-delay') || 0);
              
              result = {
                  transition: `all ${dur}s ease-in-out ${delay}s`
              };
              break;
          }

          case NodeType.OUTPUT:
              result = null; 
              break;

          default: 
              result = null;
      }

      visited.delete(nodeId);
      memo.set(nodeId, result);
      return result;
  };

  // 2. Evaluate Final Outputs
  // Style
  const styleConn = def.connections.find(c => c.targetNodeId === outputNode.id && c.targetSocketId === 'in-style');
  let finalStyle: any = {};
  if (styleConn) {
      const s = evaluateNode(styleConn.sourceNodeId);
      if (s) finalStyle = s;
  }

  // Content
  const contentConn = def.connections.find(c => c.targetNodeId === outputNode.id && c.targetSocketId === 'in-content');
  let finalContent = '';
  if (contentConn) {
      const c = evaluateNode(contentConn.sourceNodeId);
      if (c !== null) finalContent = String(c);
  }

  return { style: finalStyle, content: finalContent };
};
