import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GraphNode, GraphConnection, NodeType, CustomComponentDefinition, SavedNodeGroup } from '../types';
import { Save, Plus, Box, Palette, Type, Droplet, Trash2, Component, Stamp, Calculator, Link, Hash, ToggleLeft, Split, ArrowLeft, Eye, EyeOff, BoxSelect, Maximize, Merge, Pencil, X, Minus, X as MultiplyIcon, Divide, Equal, Check, Layers, ArrowUpAz, GripHorizontal, MoveHorizontal, Unlink, Move, List } from 'lucide-react';
import { NodeContextMenu } from './NodeContextMenu';
import { ColorPicker } from './ColorPicker';

interface NodeEditorProps {
  savedGroups: SavedNodeGroup[];
  initialData?: CustomComponentDefinition | null;
  onSaveGroup: (group: SavedNodeGroup) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
  onSaveComponent: (component: CustomComponentDefinition) => void;
  onClose: () => void;
}

// Socket Configuration Definitions
const NODE_CONFIG: Record<NodeType, { 
    label: string; 
    icon: any; 
    color: string;
    inputs: { id: string; label: string; type: 'style' | 'string' | 'color' | 'number' | 'boolean' | 'any' }[];
    outputs: { id: string; label: string; type: 'style' | 'string' | 'color' | 'element' | 'number' | 'boolean' | 'any' }[];
}> = {
  [NodeType.OUTPUT]: {
    label: 'Результат',
    icon: Box,
    color: 'bg-gray-700',
    inputs: [
        { id: 'in-style', label: 'Стиль', type: 'style' },
        { id: 'in-content', label: 'Контент', type: 'string' }
    ],
    outputs: []
  },
  [NodeType.STYLE]: {
    label: 'Типографика',
    icon: Palette,
    color: 'bg-blue-900',
    inputs: [
        { id: 'in-bg', label: 'Фон', type: 'color' },
        { id: 'in-text', label: 'Цвет текста', type: 'color' },
        { id: 'in-size', label: 'Размер (px)', type: 'number' },
        { id: 'in-auto-size', label: 'Авторазмер', type: 'boolean' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.ARRAY]: {
    label: 'Массив',
    icon: List,
    color: 'bg-slate-600',
    inputs: [
        { id: 'in-0', label: 'Элемент 1', type: 'any' },
        { id: 'in-1', label: 'Элемент 2', type: 'any' },
        { id: 'in-2', label: 'Элемент 3', type: 'any' },
        { id: 'in-3', label: 'Элемент 4', type: 'any' }
    ],
    outputs: [
        { id: 'out-arr', label: 'Массив', type: 'any' }
    ]
  },
  [NodeType.GRADIENT]: {
    label: 'Градиент',
    icon: Palette,
    color: 'bg-indigo-900',
    inputs: [
        { id: 'in-colors', label: 'Массив цветов', type: 'any' },
        { id: 'in-deg', label: 'Угол (deg)', type: 'number' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.TRANSFORM]: {
    label: 'Трансформация',
    icon: Move,
    color: 'bg-orange-800',
    inputs: [
        { id: 'in-rot', label: 'Поворот (deg)', type: 'number' },
        { id: 'in-scale', label: 'Масштаб (1.0)', type: 'number' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.FONT]: {
    label: 'Шрифт',
    icon: Type,
    color: 'bg-slate-800',
    inputs: [
        { id: 'in-font', label: 'Название', type: 'string' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.BORDER]: {
    label: 'Граница',
    icon: BoxSelect,
    color: 'bg-indigo-800',
    inputs: [
        { id: 'in-width', label: 'Толщина', type: 'number' },
        { id: 'in-color', label: 'Цвет', type: 'color' },
        { id: 'in-radius', label: 'Скругление', type: 'number' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.SHADOW]: {
    label: 'Тень',
    icon: Layers,
    color: 'bg-gray-800',
    inputs: [
        { id: 'in-x', label: 'Сдвиг X', type: 'number' },
        { id: 'in-y', label: 'Сдвиг Y', type: 'number' },
        { id: 'in-blur', label: 'Размытие', type: 'number' },
        { id: 'in-color', label: 'Цвет', type: 'color' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.LAYOUT]: {
    label: 'Макет',
    icon: Maximize,
    color: 'bg-cyan-900',
    inputs: [
        { id: 'in-padding', label: 'Отступ (px)', type: 'number' },
        { id: 'in-opacity', label: 'Прозрачность', type: 'number' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.MERGE]: {
    label: 'Слияние Стилей',
    icon: Merge,
    color: 'bg-slate-700',
    inputs: [
        { id: 'in-style-a', label: 'Стиль A', type: 'style' },
        { id: 'in-style-b', label: 'Стиль B', type: 'style' }
    ],
    outputs: [
        { id: 'out-style', label: 'Стиль', type: 'style' }
    ]
  },
  [NodeType.TEXT]: {
    label: 'Текст',
    icon: Type,
    color: 'bg-green-900',
    inputs: [],
    outputs: [
        { id: 'out-text', label: 'Строка', type: 'string' }
    ]
  },
  [NodeType.UPPERCASE]: {
    label: 'Заглавные',
    icon: ArrowUpAz,
    color: 'bg-green-800',
    inputs: [
        { id: 'in-text', label: 'Текст', type: 'string' }
    ],
    outputs: [
        { id: 'out-text', label: 'Текст', type: 'string' }
    ]
  },
  [NodeType.COLOR]: {
    label: 'Цвет',
    icon: Droplet,
    color: 'bg-purple-900',
    inputs: [],
    outputs: [
        { id: 'out-color', label: 'Цвет', type: 'color' }
    ]
  },
  [NodeType.NUMBER]: {
    label: 'Число',
    icon: Hash,
    color: 'bg-yellow-800',
    inputs: [],
    outputs: [
        { id: 'out-num', label: 'Значение', type: 'number' }
    ]
  },
  [NodeType.TOGGLE]: {
    label: 'Переключатель',
    icon: ToggleLeft,
    color: 'bg-teal-800',
    inputs: [],
    outputs: [
        { id: 'out-bool', label: 'Да/Нет', type: 'boolean' }
    ]
  },
  [NodeType.IF_ELSE]: {
    label: 'Если / Иначе',
    icon: Split,
    color: 'bg-pink-900',
    inputs: [
        { id: 'in-condition', label: 'Условие', type: 'boolean' },
        { id: 'in-true', label: 'Если Да', type: 'any' },
        { id: 'in-false', label: 'Если Нет', type: 'any' }
    ],
    outputs: [
        { id: 'out-result', label: 'Итог', type: 'any' }
    ]
  },
  [NodeType.EQUAL]: {
    label: 'Равно (==)',
    icon: Equal,
    color: 'bg-pink-800',
    inputs: [
        { id: 'in-a', label: 'A', type: 'any' },
        { id: 'in-b', label: 'B', type: 'any' }
    ],
    outputs: [
        { id: 'out-bool', label: 'Да/Нет', type: 'boolean' }
    ]
  },
  [NodeType.GREATER]: {
    label: 'Больше (>)',
    icon: ArrowLeft, // Rotating arrow via transform if needed, or generic
    color: 'bg-pink-800',
    inputs: [
        { id: 'in-a', label: 'A', type: 'number' },
        { id: 'in-b', label: 'B', type: 'number' }
    ],
    outputs: [
        { id: 'out-bool', label: 'Да/Нет', type: 'boolean' }
    ]
  },
  [NodeType.AND]: {
    label: 'И (&&)',
    icon: Check, // Using Check as "AND" symbol metaphor
    color: 'bg-teal-900',
    inputs: [
        { id: 'in-a', label: 'A', type: 'boolean' },
        { id: 'in-b', label: 'B', type: 'boolean' }
    ],
    outputs: [
        { id: 'out-bool', label: 'Да/Нет', type: 'boolean' }
    ]
  },
  [NodeType.OR]: {
    label: 'ИЛИ (||)',
    icon: Split,
    color: 'bg-teal-900',
    inputs: [
        { id: 'in-a', label: 'A', type: 'boolean' },
        { id: 'in-b', label: 'B', type: 'boolean' }
    ],
    outputs: [
        { id: 'out-bool', label: 'Да/Нет', type: 'boolean' }
    ]
  },
  [NodeType.MATH]: {
    label: 'Сложение (+)',
    icon: Plus,
    color: 'bg-red-900',
    inputs: [
        { id: 'in-a', label: 'A', type: 'number' },
        { id: 'in-b', label: 'B', type: 'number' }
    ],
    outputs: [
        { id: 'out-res', label: 'Результат', type: 'number' }
    ]
  },
  [NodeType.SUBTRACT]: {
    label: 'Вычитание (-)',
    icon: Minus,
    color: 'bg-red-900',
    inputs: [
        { id: 'in-a', label: 'A', type: 'number' },
        { id: 'in-b', label: 'B', type: 'number' }
    ],
    outputs: [
        { id: 'out-res', label: 'Результат', type: 'number' }
    ]
  },
  [NodeType.MULTIPLY]: {
    label: 'Умножение (x)',
    icon: MultiplyIcon,
    color: 'bg-red-900',
    inputs: [
        { id: 'in-a', label: 'A', type: 'number' },
        { id: 'in-b', label: 'B', type: 'number' }
    ],
    outputs: [
        { id: 'out-res', label: 'Результат', type: 'number' }
    ]
  },
  [NodeType.DIVIDE]: {
    label: 'Деление (/)',
    icon: Divide,
    color: 'bg-red-900',
    inputs: [
        { id: 'in-a', label: 'A', type: 'number' },
        { id: 'in-b', label: 'B', type: 'number' }
    ],
    outputs: [
        { id: 'out-res', label: 'Результат', type: 'number' }
    ]
  },
  [NodeType.CONCAT]: {
    label: 'Объединить',
    icon: Link,
    color: 'bg-orange-800',
    inputs: [
        { id: 'in-str1', label: 'Текст 1', type: 'string' },
        { id: 'in-str2', label: 'Текст 2', type: 'string' }
    ],
    outputs: [
        { id: 'out-res', label: 'Результат', type: 'string' }
    ]
  }
};

// Math Helper for Line Segment Intersection
function linesIntersect(a1: {x:number, y:number}, a2: {x:number, y:number}, b1: {x:number, y:number}, b2: {x:number, y:number}) {
    const det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y);
    if (det === 0) return false;
    const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
    const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

// Check intersection with Bezier Curve by approximating with segments
function lineIntersectsBezier(
    lineStart: {x:number, y:number}, 
    lineEnd: {x:number, y:number},
    p0: {x:number, y:number}, // Source
    p1: {x:number, y:number}, // Control 1
    p2: {x:number, y:number}, // Control 2
    p3: {x:number, y:number}  // Target
) {
    const SEGMENTS = 10;
    let prevPoint = p0;
    
    for (let i = 1; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const it = 1 - t;
        // Bezier formula
        const x = it*it*it*p0.x + 3*it*it*t*p1.x + 3*it*t*t*p2.x + t*t*t*p3.x;
        const y = it*it*it*p0.y + 3*it*it*t*p1.y + 3*it*t*t*p2.y + t*t*t*p3.y;
        
        const currentPoint = { x, y };
        
        if (linesIntersect(lineStart, lineEnd, prevPoint, currentPoint)) {
            return true;
        }
        prevPoint = currentPoint;
    }
    return false;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ 
  savedGroups, 
  initialData, 
  onSaveGroup, 
  onRenameGroup,
  onDeleteGroup,
  onSaveComponent, 
  onClose 
}) => {
  const [componentName, setComponentName] = useState('My Custom Component');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [connections, setConnections] = useState<GraphConnection[]>([]);
  
  // Selection & Panning & Scaling State
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set<string>());
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);

  // Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  
  // Stamp Mode State
  const [stampNodeType, setStampNodeType] = useState<NodeType | null>(null);
  
  // Connection Creation State
  const [connecting, setConnecting] = useState<{ nodeId: string; socketId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Cut Tool (Knife) State
  const [cutLine, setCutLine] = useState<{ start: {x:number, y:number}, end: {x:number, y:number} } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number }>({ isOpen: false, x: 0, y: 0 });

  // Color Picker State
  const [activeColorPicker, setActiveColorPicker] = useState<{ nodeId: string; x: number; y: number; initialColor: string } | null>(null);

  // Renaming State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Save Group Modal State
  const [isSaveGroupModalOpen, setIsSaveGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('Новая Функция');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize Data
  useEffect(() => {
    if (initialData) {
      setComponentName(initialData.name);
      setNodes(initialData.nodes);
      setConnections(initialData.connections);
      if (initialData.nodes.length > 0) {
        setPan({ x: 0, y: 0 }); 
        setScale(1);
      }
    } else {
      setNodes([{ id: 'root', type: NodeType.OUTPUT, x: 500, y: 300, data: { label: 'Root Element' } }]);
      setConnections([]);
      setComponentName('My Custom Component');
      setPan({ x: 0, y: 0 });
      setScale(1);
    }
  }, [initialData]);

  // --- HELPERS ---

  const screenToWorld = (screenX: number, screenY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const rx = rect ? (screenX - rect.left) : 0;
      const ry = rect ? (screenY - rect.top) : 0;
      
      // Apply inverse transform: (screen - pan) / scale
      return {
          x: (rx - pan.x) / scale,
          y: (ry - pan.y) / scale
      };
  };

  // --- MOUSE HANDLERS (GLOBAL CANVAS) ---

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, scale + delta), 3);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
        // Zoom towards mouse pointer
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Mouse World Position before zoom
        const worldX = (mouseX - pan.x) / scale;
        const worldY = (mouseY - pan.y) / scale;

        // Calculate new pan to keep world position under mouse
        const newPanX = mouseX - worldX * newScale;
        const newPanY = mouseY - worldY * newScale;

        setPan({ x: newPanX, y: newPanY });
        setScale(newScale);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      // 1. Cut Tool (Ctrl + Click Drag on Canvas)
      if (e.ctrlKey && e.button === 0) {
          const worldPos = screenToWorld(e.clientX, e.clientY);
          setCutLine({ start: worldPos, end: worldPos });
          // Prevent standard selection behavior
          return;
      }

      // 2. Middle Click or Space+Click triggers Panning
      if (e.button === 1 || (e.button === 0 && e.nativeEvent.getModifierState('Space'))) {
          e.preventDefault();
          setIsPanning(true);
          return;
      }
      
      // 3. Selection Clearing (Left Click on background, no modifiers)
      // Check if target is canvas to avoid clearing when clicking nodes (handled by stopPropagation in nodes)
      if (e.button === 0 && e.target === canvasRef.current && !e.shiftKey && !e.altKey && !stampNodeType) {
           setSelectedNodeIds(new Set());
           setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update Mouse Pos for Connection Line (In World Coordinates)
    const worldMouse = screenToWorld(e.clientX, e.clientY);
    setMousePos(worldMouse);

    // Cut Tool Update
    if (cutLine) {
        setCutLine(prev => prev ? { ...prev, end: worldMouse } : null);
        return; // Don't do other drags while cutting
    }

    // Panning (Move canvas purely visually)
    if (isPanning) {
        setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
        return;
    }

    // Node Dragging (Adjust for scale)
    if (draggingNodeId) {
      const deltaX = e.movementX / scale;
      const deltaY = e.movementY / scale;

      if (isDraggingSelection) {
        const node = nodes.find(n => n.id === draggingNodeId);
        if(node) {
             setNodes(prev => prev.map(n => {
                 if (selectedNodeIds.has(n.id)) {
                     return { ...n, x: n.x + deltaX, y: n.y + deltaY };
                 }
                 return n;
             }));
        }
      } else {
        setNodes(prev => prev.map(n => {
            if (n.id === draggingNodeId) {
                 return { ...n, x: n.x + deltaX, y: n.y + deltaY };
            }
            return n;
        }));
      }
    }
  };

  const handleMouseUp = () => {
    // Handle Cut Tool Execution
    if (cutLine) {
        const { start, end } = cutLine;
        
        const newConnections = connections.filter(conn => {
            const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
            const targetNode = nodes.find(n => n.id === conn.targetNodeId);
            if (!sourceNode || !targetNode) return false; // Clean up bad connections

            const sourceX = sourceNode.x + 168; 
            const sourceY = getSocketPosition({ ...sourceNode }, conn.sourceSocketId, false);
            const targetX = targetNode.x + 2; 
            const targetY = getSocketPosition({ ...targetNode }, conn.targetSocketId, true);

            const controlDist = Math.abs(targetX - sourceX) * 0.5;
            // P0 (start), P1 (ctrl1), P2 (ctrl2), P3 (end)
            const p0 = { x: sourceX, y: sourceY };
            const p1 = { x: sourceX + controlDist, y: sourceY };
            const p2 = { x: targetX - controlDist, y: targetY };
            const p3 = { x: targetX, y: targetY };

            // Return FALSE if intersected (to filter it out)
            return !lineIntersectsBezier(start, end, p0, p1, p2, p3);
        });

        setConnections(newConnections);
        setCutLine(null);
    }

    setDraggingNodeId(null);
    setConnecting(null);
    setIsDraggingSelection(false);
    setIsPanning(false);
  };

  // --- SELECTION & DRAGGING (NODES) ---

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (stampNodeType) return;

    // Only select/drag on Left Click
    if (e.button !== 0) return;

    if (e.shiftKey) {
      const newSet = new Set(selectedNodeIds);
      if (newSet.has(nodeId)) newSet.delete(nodeId);
      else newSet.add(nodeId);
      setSelectedNodeIds(newSet);
    } else {
      if (!selectedNodeIds.has(nodeId)) {
        setSelectedNodeIds(new Set([nodeId]));
      }
    }

    setDraggingNodeId(nodeId);
    if (selectedNodeIds.has(nodeId) && selectedNodeIds.size > 1) {
        setIsDraggingSelection(true);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPanning) return; 

    // STAMP MODE Logic
    if (stampNodeType) {
        // Add node in World Coordinates
        const worldPos = screenToWorld(e.clientX, e.clientY);
        addNodeAt(stampNodeType, worldPos.x, worldPos.y);
        return;
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stampNodeType) {
        setStampNodeType(null); // Cancel stamp mode
        return;
    }
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  };

  // --- NODES MANAGEMENT ---

  const addNodeAt = (type: NodeType, x: number, y: number) => {
     let defaultValue: any = '';
     if (type === NodeType.COLOR) defaultValue = '#ffffff';
     else if (type === NodeType.NUMBER) defaultValue = 0;
     else if (type === NodeType.TEXT) defaultValue = 'Text';
     else if (type === NodeType.TOGGLE) defaultValue = true;

     const newNode: GraphNode = {
      id: uuidv4(),
      type,
      x,
      y,
      data: { 
          label: NODE_CONFIG[type].label,
          value: defaultValue,
          exposed: false,
          exposedLabel: NODE_CONFIG[type].label
      }
    };
    setNodes(prev => [...prev, newNode]);
    if (!stampNodeType) {
        setSelectedNodeIds(new Set([newNode.id]));
    }
  };

  const addNodeFromMenu = (type: NodeType) => {
    // Add Node at Context Menu position (mapped to world)
    const worldPos = screenToWorld(contextMenu.x, contextMenu.y);
    addNodeAt(type, worldPos.x, worldPos.y);
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const handleStampRequest = (type: NodeType) => {
      setStampNodeType(type);
      setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const deleteNode = (id: string) => {
      if (id === 'root') return;
      setNodes(prev => prev.filter(n => n.id !== id));
      setConnections(prev => prev.filter(c => c.sourceNodeId !== id && c.targetNodeId !== id));
      setSelectedNodeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
      });
  };

  // --- SOCKET INTERACTION ---

  const handleSocketMouseDown = (e: React.MouseEvent, nodeId: string, socketId: string) => {
    e.stopPropagation();
    e.preventDefault(); // Important: Prevent default browser drag behavior
    
    // Middle Click (Button 1) to Disconnect all lines from this socket
    if (e.button === 1) {
        setConnections(prev => prev.filter(c => 
            !((c.sourceNodeId === nodeId && c.sourceSocketId === socketId) ||
              (c.targetNodeId === nodeId && c.targetSocketId === socketId))
        ));
        return;
    }
    
    // Only allow drag connection on Left Click (Standard)
    if (e.button !== 0) return;

    // Get Mouse Pos in World Coords for the drag line start
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setConnecting({ nodeId, socketId, x: worldPos.x, y: worldPos.y });
  };

  const handleSocketMouseUp = (e: React.MouseEvent, targetNodeId: string, targetSocketId: string) => {
    e.stopPropagation();
    if (connecting) {
      if (connecting.nodeId === targetNodeId) {
          setConnecting(null);
          return;
      }

      const exists = connections.some(c => 
          (c.sourceNodeId === connecting.nodeId && c.targetNodeId === targetNodeId && c.targetSocketId === targetSocketId) ||
          (c.targetNodeId === connecting.nodeId && c.sourceNodeId === targetNodeId)
      );
      
      if (!exists) {
          setConnections(prev => [...prev, {
            id: uuidv4(),
            sourceNodeId: connecting.nodeId,
            sourceSocketId: connecting.socketId,
            targetNodeId: targetNodeId,
            targetSocketId: targetSocketId
          }]);
      }
    }
    setConnecting(null);
  };

  const handleNodeDataChange = (id: string, key: string, value: any) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, [key]: value }} : n));
  };

  // --- GROUPING / SAVING FUNCTIONS ---

  const openSaveGroupModal = () => {
      if (selectedNodeIds.size === 0) return;
      setNewGroupName('Новая Функция');
      setIsSaveGroupModalOpen(true);
  };

  const confirmSaveGroup = () => {
    if (!newGroupName.trim()) return;

    const groupNodes = nodes.filter(n => selectedNodeIds.has(n.id));
    const groupConnections = connections.filter(c => 
        selectedNodeIds.has(c.sourceNodeId) && selectedNodeIds.has(c.targetNodeId)
    );

    const minX = Math.min(...groupNodes.map(n => n.x));
    const minY = Math.min(...groupNodes.map(n => n.y));

    const normalizedNodes = groupNodes.map(n => ({
        ...n,
        x: n.x - minX,
        y: n.y - minY
    }));

    const newGroup: SavedNodeGroup = {
        id: uuidv4(),
        name: newGroupName,
        nodes: normalizedNodes,
        connections: groupConnections
    };

    onSaveGroup(newGroup);
    setSelectedNodeIds(new Set()); 
    setIsSaveGroupModalOpen(false);
  };

  const addGroupToCanvas = (group: SavedNodeGroup) => {
      // Add to center of view
      const rect = canvasRef.current?.getBoundingClientRect();
      const centerX = rect ? (rect.width / 2 - pan.x) / scale : 0;
      const centerY = rect ? (rect.height / 2 - pan.y) / scale : 0;
      
      const idMap: Record<string, string> = {};
      
      const newNodes = group.nodes.map(n => {
          const newId = uuidv4();
          idMap[n.id] = newId;
          return { ...n, id: newId, x: n.x + centerX, y: n.y + centerY };
      });

      const newConnections = group.connections.map(c => ({
          ...c,
          id: uuidv4(),
          sourceNodeId: idMap[c.sourceNodeId],
          targetNodeId: idMap[c.targetNodeId]
      }));

      setNodes(prev => [...prev, ...newNodes]);
      setConnections(prev => [...prev, ...newConnections]);
      setSelectedNodeIds(new Set(newNodes.map(n => n.id)));
  };

  const handleSaveComponent = () => {
      const component: CustomComponentDefinition = {
          id: initialData?.id || uuidv4(), // Use existing ID if editing, else new
          name: componentName,
          nodes,
          connections
      };
      onSaveComponent(component);
  };

  // --- RENAME HANDLERS ---
  
  const startEditingGroup = (group: SavedNodeGroup, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingGroupId(group.id);
      setEditName(group.name);
  };

  const saveEditingGroup = () => {
      if (editingGroupId && editName.trim()) {
          onRenameGroup(editingGroupId, editName.trim());
      }
      setEditingGroupId(null);
      setEditName('');
  };

  const cancelEditingGroup = () => {
      setEditingGroupId(null);
      setEditName('');
  };

  const handleKeyDownEditing = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveEditingGroup();
      if (e.key === 'Escape') cancelEditingGroup();
  };

  const openColorPicker = (nodeId: string, e: React.MouseEvent, currentColor: string) => {
      e.stopPropagation();
      setActiveColorPicker({ 
          nodeId, 
          x: e.clientX, 
          y: e.clientY,
          initialColor: currentColor || '#ffffff'
      });
  };


  // --- RENDER HELPERS ---

  const getSocketPosition = (node: GraphNode, socketId: string, isInput: boolean) => {
      const config = NODE_CONFIG[node.type];
      const HEADER_HEIGHT = 38; 
      const BODY_PADDING = 12;
      const ROW_HEIGHT = 20; 
      const ROW_GAP = 8;
      let customInputHeight = 0;
      
      const exposable = [NodeType.TEXT, NodeType.COLOR, NodeType.NUMBER, NodeType.TOGGLE].includes(node.type);
      const isExposed = node.data.exposed;

      if (node.type === NodeType.COLOR) customInputHeight = 44; 
      if (node.type === NodeType.TEXT) customInputHeight = 58;
      if (node.type === NodeType.NUMBER) customInputHeight = 44;
      if (node.type === NodeType.TOGGLE) customInputHeight = 44;
      
      if (isExposed && exposable) {
          customInputHeight += 36; // Extra height for the "Exposed Label" input
      }

      const startY = node.y + HEADER_HEIGHT + BODY_PADDING + customInputHeight;

      if (isInput) {
          const index = config.inputs.findIndex(i => i.id === socketId);
          if (index === -1) return node.y;
          return startY + (index * (ROW_HEIGHT + ROW_GAP)) + 8; 
      } else {
          const index = config.outputs.findIndex(o => o.id === socketId);
          if (index === -1) return node.y;
          return startY + (index * (ROW_HEIGHT + ROW_GAP)) - 1;
      }
  };

  const renderConnections = () => {
    return connections.map(conn => {
      const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
      const targetNode = nodes.find(n => n.id === conn.targetNodeId);
      if (!sourceNode || !targetNode) return null;

      // Draw relative to World 0,0 (Transform handles Pan/Zoom)
      const sourceX = sourceNode.x + 168; 
      const sourceY = getSocketPosition({ ...sourceNode }, conn.sourceSocketId, false);
      const targetX = targetNode.x + 2; 
      const targetY = getSocketPosition({ ...targetNode }, conn.targetSocketId, true);

      const controlDist = Math.abs(targetX - sourceX) * 0.5;
      const path = `M ${sourceX} ${sourceY} C ${sourceX + controlDist} ${sourceY}, ${targetX - controlDist} ${targetY}, ${targetX} ${targetY}`;

      return (
        <g key={conn.id}>
           <path d={path} stroke="#555" strokeWidth="4" fill="none" />
           <path d={path} stroke={selectedNodeIds.has(conn.sourceNodeId) && selectedNodeIds.has(conn.targetNodeId) ? "#fbbf24" : "#3b82f6"} strokeWidth="2" fill="none" />
        </g>
      );
    });
  };

  const renderDragLine = () => {
      if (!connecting) return null;
      // connecting.x/y and mousePos.x/y are already in World Coordinates
      const path = `M ${connecting.x} ${connecting.y} C ${connecting.x + 50} ${connecting.y}, ${mousePos.x - 50} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
      return <path d={path} stroke="#eab308" strokeWidth="2" strokeDasharray="5,5" fill="none" />;
  };

  const renderCutLine = () => {
      if (!cutLine) return null;
      return (
          <line 
            x1={cutLine.start.x} 
            y1={cutLine.start.y} 
            x2={cutLine.end.x} 
            y2={cutLine.end.y} 
            stroke="red" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col text-white animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-800 shrink-0 relative z-20">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Редактор Нод</span>
              <input 
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                className="bg-transparent text-lg font-bold focus:outline-none border-b border-transparent focus:border-blue-500 w-64"
                placeholder="Имя компонента"
              />
          </div>
        </div>
        
        {/* Actions */}
        {selectedNodeIds.size > 0 && !stampNodeType && (
            <div className="flex items-center bg-gray-700 rounded px-2 py-1 space-x-2 animate-in fade-in">
                <span className="text-xs text-gray-300 mr-2">{selectedNodeIds.size} выбрано</span>
                <button 
                    onClick={openSaveGroupModal}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs flex items-center shadow-lg transform hover:scale-105 transition-all"
                >
                    <Component size={12} className="mr-1" />
                    Сохранить функцию
                </button>
                 <button 
                    onClick={() => {
                        const toDelete = Array.from(selectedNodeIds);
                        toDelete.forEach((id: string) => deleteNode(id));
                    }}
                    className="px-2 py-1 bg-red-900/50 hover:bg-red-900 rounded text-xs text-red-300"
                >
                    Удалить
                </button>
            </div>
        )}

        {/* Scale Indicator */}
        <div className="text-xs text-gray-500 font-mono">
            Scale: {Math.round(scale * 100)}%
        </div>

        {/* Stamp Mode Indicator */}
        {stampNodeType && (
             <div className="flex items-center bg-orange-900/50 border border-orange-500/50 rounded px-3 py-1 animate-pulse">
                <Stamp size={14} className="mr-2 text-orange-400" />
                <span className="text-xs font-bold text-orange-200 uppercase">Режим Штампа: {NODE_CONFIG[stampNodeType].label}</span>
                <div className="ml-3 text-[10px] text-gray-400 border-l border-gray-600 pl-2">
                    ЛКМ - Поставить • ПКМ/ESC - Выйти
                </div>
            </div>
        )}
        
        {/* Instructions */}
        <div className="hidden md:flex text-[10px] text-gray-500 space-x-3 items-center">
            <span title="Click + Drag on Socket"><span className="bg-gray-700 text-gray-300 px-1 rounded">LMB</span> Connect</span>
            <span title="Middle Click on Socket"><span className="bg-gray-700 text-gray-300 px-1 rounded">MMB</span> Disconnect</span>
            <span title="Ctrl + Drag on Background"><span className="bg-gray-700 text-gray-300 px-1 rounded">Ctrl+Drag</span> Cut Links</span>
        </div>

        <div className="flex items-center space-x-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Закрыть</button>
            <button onClick={handleSaveComponent} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium flex items-center shadow-lg">
                <Save size={16} className="mr-2" />
                {initialData ? 'Обновить' : 'Сохранить'}
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Saved Functions */}
        <div className="w-60 bg-gray-800 border-r border-gray-700 p-4 flex flex-col space-y-2 shrink-0 z-10">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                <Component size={12} className="mr-1" />
                Библиотека Функций
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
                {savedGroups.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-4 border border-dashed border-gray-700 rounded">
                        Нет сохраненных функций.
                    </div>
                ) : (
                    savedGroups.map(group => (
                        <div 
                            key={group.id}
                            onClick={() => { if (!editingGroupId) addGroupToCanvas(group); }}
                            className={`p-3 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer group border border-transparent hover:border-indigo-500 transition-all ${editingGroupId === group.id ? 'ring-1 ring-blue-500 bg-gray-800' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                {editingGroupId === group.id ? (
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={saveEditingGroup}
                                        onKeyDown={handleKeyDownEditing}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-gray-900 text-sm text-white px-1 py-0.5 rounded border border-blue-500 focus:outline-none"
                                    />
                                ) : (
                                    <span className="text-sm font-medium truncate pr-2" title={group.name}>{group.name}</span>
                                )}
                                
                                {!editingGroupId && (
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700/50 rounded backdrop-blur-sm">
                                         <button
                                            onClick={(e) => startEditingGroup(group, e)}
                                            className="text-gray-400 hover:text-white p-0.5"
                                            title="Переименовать"
                                         >
                                            <Pencil size={12} />
                                         </button>
                                         <button
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 onDeleteGroup(group.id);
                                             }}
                                             className="text-gray-400 hover:text-red-400 p-0.5"
                                             title="Удалить"
                                         >
                                            <Trash2 size={12} />
                                         </button>
                                         <div className="h-3 w-px bg-gray-600 mx-1"></div>
                                         <button title="Добавить на холст" className="text-indigo-400 hover:text-indigo-300">
                                            <Plus size={14} />
                                         </button>
                                    </div>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400">
                                {group.nodes.length} нод
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Canvas */}
        <div 
            ref={canvasRef}
            className={`flex-1 relative bg-gray-900 overflow-hidden ${isPanning ? 'cursor-grabbing' : (stampNodeType ? 'cursor-crosshair' : 'cursor-default')}`}
            style={{ 
                // Grid moves with pan/scale
                backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)', 
                backgroundSize: `${20 * scale}px ${20 * scale}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px` 
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
        >
             {/* TRANSFORMED CONTENT CONTAINER */}
             <div 
                style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, 
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none' // Important: Allow clicks to pass through to children, but mostly handled by global listener
                }}
             >
                 <svg className="absolute overflow-visible top-0 left-0 w-full h-full pointer-events-none z-0">
                    {renderConnections()}
                    {renderDragLine()}
                    {renderCutLine()}
                 </svg>

                 {nodes.map(node => {
                     const config = NODE_CONFIG[node.type];
                     const isSelected = selectedNodeIds.has(node.id);
                     const exposable = [NodeType.TEXT, NodeType.COLOR, NodeType.NUMBER, NodeType.TOGGLE].includes(node.type);

                     return (
                        <div 
                            key={node.id}
                            className={`absolute w-48 rounded-lg shadow-xl border flex flex-col z-10 overflow-hidden pointer-events-auto ${config.color} ${isSelected ? 'ring-2 ring-yellow-400 border-transparent' : 'border-gray-600'}`}
                            style={{ left: node.x, top: node.y }}
                            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        >
                            <div className="px-3 py-2 bg-black/20 flex items-center justify-between cursor-grab active:cursor-grabbing h-[38px]">
                                <div className="flex items-center text-sm font-semibold">
                                    <config.icon size={14} className="mr-2 opacity-75" />
                                    {config.label}
                                </div>
                                 <div className="flex items-center">
                                    {exposable && (
                                        <button 
                                            onMouseDown={(e) => { 
                                                e.stopPropagation(); 
                                                handleNodeDataChange(node.id, 'exposed', !node.data.exposed); 
                                            }} 
                                            className={`mr-2 transition-colors ${node.data.exposed ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-300'}`}
                                            title={node.data.exposed ? "Exposed to Properties" : "Expose Property"}
                                        >
                                            {node.data.exposed ? <Eye size={12} /> : <EyeOff size={12} />}
                                        </button>
                                    )}
                                    
                                    {/* Removed Unlink Button as per request */}

                                    {node.type !== NodeType.OUTPUT && (
                                        <button onMouseDown={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="text-red-400 hover:text-red-300">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                 </div>
                            </div>

                            <div className="p-3">
                                 {/* EXPOSED LABEL INPUT */}
                                 {node.data.exposed && exposable && (
                                     <div className="mb-3">
                                        <label className="text-[9px] text-yellow-500 uppercase font-bold mb-1 block">Название свойства</label>
                                        <input 
                                            type="text"
                                            value={node.data.exposedLabel || ''}
                                            onChange={(e) => handleNodeDataChange(node.id, 'exposedLabel', e.target.value)}
                                            className="w-full bg-black/40 text-xs p-1 rounded border border-yellow-500/30 focus:border-yellow-500 outline-none text-yellow-100"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            placeholder="Label in Inspector"
                                        />
                                     </div>
                                 )}

                                {node.type === NodeType.COLOR && (
                                    <div className="mb-3">
                                         <div 
                                            onClick={(e) => openColorPicker(node.id, e, node.data.value)}
                                            className="w-full h-8 cursor-pointer rounded bg-gray-800 border border-gray-600 flex items-center px-2"
                                            style={{ backgroundColor: node.data.value }}
                                         >
                                         </div>
                                    </div>
                                )}
                                {(node.type === NodeType.TEXT || node.type === NodeType.CONCAT) && node.type !== NodeType.CONCAT && (
                                    <div className="mb-3">
                                        <textarea 
                                            value={node.data.value}
                                            onChange={(e) => handleNodeDataChange(node.id, 'value', e.target.value)}
                                            className="w-full bg-black/30 text-xs p-1 rounded border-none focus:ring-1 focus:ring-blue-500 resize-y"
                                            rows={2}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}
                                 {node.type === NodeType.NUMBER && (
                                    <div className="mb-3">
                                        <input 
                                            type="number"
                                            value={node.data.value}
                                            onChange={(e) => handleNodeDataChange(node.id, 'value', parseInt(e.target.value) || 0)}
                                            className="w-full bg-black/30 text-xs p-1 rounded border-none focus:ring-1 focus:ring-blue-500"
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}
                                {node.type === NodeType.TOGGLE && (
                                    <div className="mb-3 flex items-center">
                                        <input 
                                            type="checkbox"
                                            checked={node.data.value}
                                            onChange={(e) => handleNodeDataChange(node.id, 'value', e.target.checked)}
                                            className="w-5 h-5 cursor-pointer rounded bg-black/30 text-teal-500 border-none focus:ring-0"
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                        <span className="ml-2 text-xs text-gray-300">{node.data.value ? 'True' : 'False'}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between space-x-2">
                                    <div className="space-y-2 w-1/2">
                                        {config.inputs.map(input => (
                                            <div key={input.id} className="flex items-center -ml-4 h-5 group/socket">
                                                <div 
                                                    className="w-3 h-3 rounded-full bg-blue-400 border border-white hover:scale-125 transition-transform cursor-crosshair ml-1.5 shrink-0"
                                                    onMouseUp={(e) => handleSocketMouseUp(e, node.id, input.id)}
                                                    onMouseDown={(e) => handleSocketMouseDown(e, node.id, input.id)}
                                                    title="ЛКМ: Тянуть | MMB: Отсоединить"
                                                />
                                                <span className="text-[10px] ml-2 text-gray-300 truncate group-hover/socket:text-white transition-colors">{input.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2 text-right w-1/2">
                                        {config.outputs.map(output => (
                                            <div key={output.id} className="flex items-center justify-end -mr-4 h-5 group/socket">
                                                <span className="text-[10px] mr-2 text-gray-300 truncate group-hover/socket:text-white transition-colors">{output.label}</span>
                                                <div 
                                                    className="w-3 h-3 rounded-full bg-green-400 border border-white hover:scale-125 transition-transform cursor-crosshair mr-1.5 shrink-0"
                                                    onMouseDown={(e) => handleSocketMouseDown(e, node.id, output.id)}
                                                    title="ЛКМ: Тянуть | MMB: Отсоединить"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                     );
                 })}
             </div>
        
             {/* Color Picker Portal Overlay */}
             {activeColorPicker && (
                 <ColorPicker 
                    initialColor={activeColorPicker.initialColor}
                    x={activeColorPicker.x}
                    y={activeColorPicker.y}
                    onClose={() => setActiveColorPicker(null)}
                    onChange={(color) => handleNodeDataChange(activeColorPicker.nodeId, 'value', color)}
                 />
             )}

             {/* Save Group Modal */}
             {isSaveGroupModalOpen && (
                 <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                     <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-2xl w-80">
                         <h3 className="text-sm font-bold text-gray-200 uppercase mb-4">Сохранить Функцию</h3>
                         <input 
                            type="text" 
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Название функции"
                            autoFocus
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-blue-500 focus:outline-none mb-4"
                            onKeyDown={(e) => { if (e.key === 'Enter') confirmSaveGroup(); }}
                         />
                         <div className="flex justify-end space-x-2">
                             <button 
                                onClick={() => setIsSaveGroupModalOpen(false)}
                                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                             >
                                 Отмена
                             </button>
                             <button 
                                onClick={confirmSaveGroup}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium"
                             >
                                 Сохранить
                             </button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
      </div>

      <NodeContextMenu 
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onAddNode={addNodeFromMenu}
        onStampRequest={handleStampRequest}
      />

    </div>
  );
};