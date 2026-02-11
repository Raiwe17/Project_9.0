import { CustomComponentDefinition, NodeType } from '../types';

export const evaluateNodeGraph = (
  def: CustomComponentDefinition, 
  overrides: Record<string, any> = {}
): { style: any, content: string } => {
  
  const outputNode = def.nodes.find(n => n.type === NodeType.OUTPUT);
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
          // Static Values
          case NodeType.TEXT:
          case NodeType.COLOR:
          case NodeType.NUMBER:
          case NodeType.TOGGLE:
              result = node.data.value;
              break;
          
          // Logic & Math
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
          case NodeType.CONCAT: {
              const s1 = String(getInputValue('in-str1') || '');
              const s2 = String(getInputValue('in-str2') || '');
              result = s1 + s2;
              break;
          }
          case NodeType.UPPERCASE: {
              const text = String(getInputValue('in-text') || '');
              result = text.toUpperCase();
              break;
          }
          case NodeType.IF_ELSE: {
              const condition = getInputValue('in-condition');
              const trueVal = getInputValue('in-true');
              const falseVal = getInputValue('in-false');
              result = condition ? trueVal : falseVal;
              break;
          }
          case NodeType.ARRAY: {
              const items = [];
              const v0 = getInputValue('in-0'); if(v0 !== null) items.push(v0);
              const v1 = getInputValue('in-1'); if(v1 !== null) items.push(v1);
              const v2 = getInputValue('in-2'); if(v2 !== null) items.push(v2);
              const v3 = getInputValue('in-3'); if(v3 !== null) items.push(v3);
              result = items;
              break;
          }

          // Styling
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
              // Deep merge logic could go here, but shallow merge is usually sufficient for CSS props
              result = { ...styleA, ...styleB };
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