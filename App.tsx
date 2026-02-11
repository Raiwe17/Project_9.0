import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ContextMenu } from './components/ContextMenu';
import { RenderedElement } from './components/RenderedElement';
import { StatusBar } from './components/StatusBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { HierarchyPanel } from './components/HierarchyPanel';
import { NodeEditor } from './components/NodeEditor';
import { AppMode, CanvasElement, ContextMenuState, ElementType, ResizeState, ResizeHandle, DragState, CustomComponentDefinition, ElementStyle, SavedNodeGroup, NodeType } from './types';
import { TOOLS } from './constants';
import { generateHTML } from './utils/generator';
import { Download, Play, GripHorizontal, GripVertical, Workflow } from 'lucide-react';

const SIDEBAR_WIDTH = 240;
const CANVAS_WIDTH_DEFAULT = 1280; 
const CANVAS_HEIGHT_DEFAULT = 800;

// Example function group for Logic
const DEFAULT_SAVED_GROUPS: SavedNodeGroup[] = [
    {
        id: 'logic-demo-group',
        name: 'Кнопка с Логикой',
        nodes: [
            { id: 'n1', type: NodeType.TOGGLE, x: 0, y: 0, data: { label: 'Переключатель', value: true } },
            { id: 'n2', type: NodeType.TEXT, x: 200, y: -50, data: { label: 'Текст ВКЛ', value: 'Активно' } },
            { id: 'n3', type: NodeType.TEXT, x: 200, y: 50, data: { label: 'Текст ВЫКЛ', value: 'Неактивно' } },
            { id: 'n4', type: NodeType.IF_ELSE, x: 450, y: 0, data: { label: 'Если/Иначе', value: '' } },
            { id: 'n5', type: NodeType.COLOR, x: 200, y: 150, data: { label: 'Цвет Фона', value: '#3b82f6' } },
            { id: 'n6', type: NodeType.STYLE, x: 650, y: 100, data: { label: 'Стиль', value: '' } },
        ],
        connections: [
            { id: 'c1', sourceNodeId: 'n1', sourceSocketId: 'out-bool', targetNodeId: 'n4', targetSocketId: 'in-condition' },
            { id: 'c2', sourceNodeId: 'n2', sourceSocketId: 'out-text', targetNodeId: 'n4', targetSocketId: 'in-true' },
            { id: 'c3', sourceNodeId: 'n3', sourceSocketId: 'out-text', targetNodeId: 'n4', targetSocketId: 'in-false' },
            { id: 'c4', sourceNodeId: 'n5', sourceSocketId: 'out-color', targetNodeId: 'n6', targetSocketId: 'in-bg' },
        ]
    },
    {
        id: 'test-features-group',
        name: 'Тест Новых Функций',
        nodes: [
            { id: 't1', type: NodeType.STYLE, x: 0, y: 0, data: { label: 'Базовый Стиль', value: '', exposed: false } },
            { id: 't2', type: NodeType.BORDER, x: 0, y: 300, data: { label: 'Граница', value: '', exposed: true, exposedLabel: 'Settings Border' } },
            { id: 't3', type: NodeType.LAYOUT, x: 250, y: 300, data: { label: 'Отступы', value: '', exposed: false } },
            { id: 't4', type: NodeType.MERGE, x: 500, y: 150, data: { label: 'Слияние', value: '' } },
            { id: 't5', type: NodeType.COLOR, x: -250, y: 0, data: { label: 'Белый Текст', value: '#ffffff' } },
            { id: 't6', type: NodeType.COLOR, x: -250, y: 100, data: { label: 'Синий Фон', value: '#3b82f6' } },
            { id: 't7', type: NodeType.NUMBER, x: -250, y: 300, data: { label: 'Толщина (5)', value: 5 } },
            { id: 't8', type: NodeType.TOGGLE, x: -250, y: 200, data: { label: 'Авторазмер ВКЛ', value: true } },
        ],
        connections: [
            { id: 'tc1', sourceNodeId: 't5', sourceSocketId: 'out-color', targetNodeId: 't1', targetSocketId: 'in-text' },
            { id: 'tc2', sourceNodeId: 't6', sourceSocketId: 'out-color', targetNodeId: 't1', targetSocketId: 'in-bg' },
            { id: 'tc3', sourceNodeId: 't8', sourceSocketId: 'out-bool', targetNodeId: 't1', targetSocketId: 'in-auto-size' },
            { id: 'tc4', sourceNodeId: 't7', sourceSocketId: 'out-num', targetNodeId: 't2', targetSocketId: 'in-width' },
            { id: 'tc6', sourceNodeId: 't1', sourceSocketId: 'out-style', targetNodeId: 't4', targetSocketId: 'in-style-a' },
            { id: 'tc7', sourceNodeId: 't2', sourceSocketId: 'out-style', targetNodeId: 't4', targetSocketId: 'in-style-b' },
        ]
    }
];

const App: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [mode, setMode] = useState<AppMode>('SELECT');
  const [stampType, setStampType] = useState<ElementType | null>(null);
  const [stampCustomId, setStampCustomId] = useState<string | undefined>(undefined);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH_DEFAULT, height: CANVAS_HEIGHT_DEFAULT });
  
  // Custom Component Registry & Saved Groups
  const [customComponents, setCustomComponents] = useState<CustomComponentDefinition[]>([]);
  const [savedNodeGroups, setSavedNodeGroups] = useState<SavedNodeGroup[]>(DEFAULT_SAVED_GROUPS);
  
  // Logic Editor State
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  // editingTarget: We can edit a Master Component (from library) OR a Local Instance (detached)
  const [editingTarget, setEditingTarget] = useState<{ type: 'MASTER' | 'LOCAL', id: string } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasMouseDownRef = useRef(false);
  
  const [menu, setMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    activeHandle: null,
    elementId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialWidth: 0,
    initialHeight: 0
  });

  const [isResizingCanvas, setIsResizingCanvas] = useState<'w' | 'h' | null>(null);
  const [canvasResizeStart, setCanvasResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  // Calculate coordinates relative to the Canvas
  const getRelativeCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const addElement = useCallback((type: ElementType, clientX: number, clientY: number, customId?: string) => {
    // If clientX/Y are 0 (e.g. from Sidebar click without drag), default to center of viewport
    let x, y;
    if (clientX === 0 && clientY === 0 && canvasRef.current) {
         const rect = canvasRef.current.getBoundingClientRect();
         // Just a safe default position in the visible area
         x = Math.abs(rect.left) + 100;
         y = Math.abs(rect.top) + 100;
    } else {
        const coords = getRelativeCoordinates(clientX, clientY);
        x = coords.x;
        y = coords.y;
    }
    
    // Default or Custom Tool Props
    let width = 200;
    let height = 200;
    let style: ElementStyle = { backgroundColor: '#ddd', opacity: 1 };
    let content = '';

    if (type !== ElementType.CUSTOM) {
        const tool = TOOLS[type];
        width = tool.defaultWidth;
        height = tool.defaultHeight;
        style = { ...tool.defaultStyle };
        content = tool.defaultContent || '';
    } else {
        // Custom component defaults
        width = 200;
        height = 100;
        style = { backgroundColor: 'transparent', opacity: 1 };
    }

    const newElement: CanvasElement = {
      id: uuidv4(),
      type,
      customComponentId: customId,
      x, 
      y, 
      width,
      height,
      content,
      style,
      propOverrides: {}
    };
    
    setElements(prev => [...prev, newElement]);
    
    if (mode === 'SELECT') {
      setSelectedId(newElement.id);
    }
  }, [mode]);

  const handleUpdateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    const deleteRecursive = (idsToDelete: string[], currentElements: CanvasElement[]): CanvasElement[] => {
        const directChildren = currentElements.filter(el => el.parentId && idsToDelete.includes(el.parentId));
        const childIds = directChildren.map(el => el.id);
        if (childIds.length === 0) return currentElements.filter(el => !idsToDelete.includes(el.id));
        const newIdsToDelete = [...idsToDelete, ...childIds];
        return deleteRecursive(newIdsToDelete, currentElements);
    };

    setElements(prev => deleteRecursive([id], prev));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleExitStamp = useCallback(() => {
    setMode('SELECT');
    setStampType(null);
    setStampCustomId(undefined);
  }, []);

  // Export & Preview
  const handleExport = () => {
    const html = generateHTML(elements, canvasSize.width, canvasSize.height, customComponents);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    const html = generateHTML(elements, canvasSize.width, canvasSize.height, customComponents);
    const win = window.open();
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // Reparent Logic
  const getAbsolutePosition = (element: CanvasElement, allElements: CanvasElement[]): { x: number, y: number } => {
    let x = element.x;
    let y = element.y;
    let currentParentId = element.parentId;
    while (currentParentId) {
      const parent = allElements.find(el => el.id === currentParentId);
      if (parent) {
        x += parent.x;
        y += parent.y;
        currentParentId = parent.parentId;
      } else break;
    }
    return { x, y };
  };

  const handleReparent = (draggedId: string, targetParentId: string | undefined) => {
    setElements(prev => {
      const draggedElement = prev.find(el => el.id === draggedId);
      if (!draggedElement || draggedElement.parentId === targetParentId) return prev;
      
      let checkId = targetParentId;
      while (checkId) {
        if (checkId === draggedId) return prev; 
        const parent = prev.find(p => p.id === checkId);
        checkId = parent?.parentId;
      }

      const oldAbs = getAbsolutePosition(draggedElement, prev);
      let parentAbsX = 0;
      let parentAbsY = 0;
      
      if (targetParentId) {
        const targetParent = prev.find(el => el.id === targetParentId);
        if (targetParent) {
          const pAbs = getAbsolutePosition(targetParent, prev);
          parentAbsX = pAbs.x;
          parentAbsY = pAbs.y;
        }
      }

      const newLocalX = oldAbs.x - parentAbsX;
      const newLocalY = oldAbs.y - parentAbsY;

      return prev.map(el => {
        if (el.id === draggedId) {
          return { ...el, parentId: targetParentId, x: newLocalX, y: newLocalY };
        }
        return el;
      });
    });
  };

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNodeEditor) return; // Disable hotkeys when in Node Editor

      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        if (e.key === 'Escape') target.blur();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) handleDeleteElement(selectedId);
      }
      if (e.key === 'Escape') {
        if (menu.isOpen) setMenu(prev => ({ ...prev, isOpen: false }));
        else if (mode === 'STAMP') handleExitStamp();
        else if (selectedId) setSelectedId(null);
      }
      if (selectedId) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          setElements(prev => prev.map(el => {
            if (el.id !== selectedId) return el;
            let { x, y } = el;
            if (e.key === 'ArrowUp') y -= step;
            if (e.key === 'ArrowDown') y += step;
            if (e.key === 'ArrowLeft') x -= step;
            if (e.key === 'ArrowRight') x += step;
            return { ...el, x, y };
          }));
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          const newId = uuidv4();
          setElements(prev => {
            const original = prev.find(el => el.id === selectedId);
            if (!original) return prev;
            // Deep clone needed? Yes for properties, but propOverrides are usually minimal.
            const copy: CanvasElement = { 
                ...original, 
                id: newId, 
                x: original.x + 20, 
                y: original.y + 20,
                propOverrides: { ...original.propOverrides }
            };
            return [...prev, copy];
          });
          setSelectedId(newId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, mode, menu.isOpen, handleDeleteElement, handleExitStamp, showNodeEditor]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === 'STAMP') {
      setMode('SELECT');
      setStampType(null);
      setStampCustomId(undefined);
      return;
    }
    setMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  }, [mode]);

  const handleCanvasMouseDown = useCallback(() => {
    canvasMouseDownRef.current = true;
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (menu.isOpen) {
      setMenu(prev => ({ ...prev, isOpen: false }));
      return;
    }
    if (mode === 'STAMP' && stampType) {
      addElement(stampType, e.clientX, e.clientY, stampCustomId);
    } else {
      if (canvasMouseDownRef.current) setSelectedId(null);
    }
    canvasMouseDownRef.current = false;
  }, [mode, stampType, stampCustomId, menu.isOpen, addElement]);

  const handleElementSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    canvasMouseDownRef.current = false;
    
    if (mode === 'SELECT') {
      setSelectedId(id);
      const el = elements.find(item => item.id === id);
      if (el) {
        setDragState({
            isDragging: true,
            elementId: id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: el.x,
            initialY: el.y
        });
      }
    } else if (mode === 'STAMP' && stampType) {
      addElement(stampType, e.clientX, e.clientY, stampCustomId);
    }
  };

  const handleResizeStart = (id: string, handle: ResizeHandle, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    canvasMouseDownRef.current = false;
    const el = elements.find(item => item.id === id);
    if (!el) return;

    setResizeState({
      isResizing: true,
      activeHandle: handle,
      elementId: id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x,
      initialY: el.y,
      initialWidth: el.width,
      initialHeight: el.height
    });
  };

  const handleCanvasResizeStart = (type: 'w' | 'h', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingCanvas(type);
    setCanvasResizeStart({ x: e.clientX, y: e.clientY, w: canvasSize.width, h: canvasSize.height });
  };

  // Move & Resize Effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Canvas Resize
      if (isResizingCanvas) {
        if (isResizingCanvas === 'h') {
            const deltaY = e.clientY - canvasResizeStart.y;
            setCanvasSize(prev => ({
                ...prev,
                height: Math.max(400, canvasResizeStart.h + deltaY)
            }));
        } else if (isResizingCanvas === 'w') {
            const deltaX = e.clientX - canvasResizeStart.x;
            setCanvasSize(prev => ({
                ...prev,
                width: Math.max(320, canvasResizeStart.w + deltaX)
            }));
        }
        return;
      }

      // Element Drag
      if (dragState.isDragging && dragState.elementId) {
          const deltaX = e.clientX - dragState.startX;
          const deltaY = e.clientY - dragState.startY;
          setElements(prev => prev.map(el => {
              if (el.id !== dragState.elementId) return el;
              return { ...el, x: dragState.initialX + deltaX, y: dragState.initialY + deltaY };
          }));
          return;
      }

      // Element Resize
      if (resizeState.isResizing && resizeState.elementId) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;
        const { activeHandle, initialX, initialY, initialWidth, initialHeight } = resizeState;

        setElements(prev => prev.map(el => {
          if (el.id !== resizeState.elementId) return el;
          let newX = initialX;
          let newY = initialY;
          let newWidth = initialWidth;
          let newHeight = initialHeight;

          if (activeHandle?.includes('e')) newWidth = Math.max(20, initialWidth + deltaX);
          else if (activeHandle?.includes('w')) {
            const maxDelta = initialWidth - 20;
            const constrainedDelta = Math.min(deltaX, maxDelta);
            newX = initialX + constrainedDelta;
            newWidth = initialWidth - constrainedDelta;
          }

          if (activeHandle?.includes('s')) newHeight = Math.max(20, initialHeight + deltaY);
          else if (activeHandle?.includes('n')) {
            const maxDelta = initialHeight - 20;
            const constrainedDelta = Math.min(deltaY, maxDelta);
            newY = initialY + constrainedDelta;
            newHeight = initialHeight - constrainedDelta;
          }

          if (e.shiftKey && activeHandle && activeHandle.length === 2) {
             const ratio = initialWidth / initialHeight;
             const constrainedHeight = newWidth / ratio;
             if (activeHandle.includes('n')) newY = initialY + (initialHeight - constrainedHeight);
             newHeight = constrainedHeight;
          }

          return { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
        }));
      }
    };

    const handleMouseUp = () => {
      if (resizeState.isResizing) setResizeState(prev => ({ ...prev, isResizing: false, elementId: null }));
      if (dragState.isDragging) setDragState(prev => ({ ...prev, isDragging: false, elementId: null }));
      if (isResizingCanvas) setIsResizingCanvas(null);
    };

    if (resizeState.isResizing || dragState.isDragging || isResizingCanvas) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, dragState, isResizingCanvas, canvasResizeStart]);

  const handleMenuSelect = (type: ElementType, customId?: string) => {
    addElement(type, menu.x, menu.y, customId);
    setMenu(prev => ({ ...prev, isOpen: false }));
  };

  const handleMenuStampRequest = (type: ElementType, customId?: string) => {
    setStampType(type);
    setStampCustomId(customId);
    setMode('STAMP');
    setMenu(prev => ({ ...prev, isOpen: false }));
  };

  // --- Node Editor Logic ---
  
  const handleEditCustomComponent = (id: string) => {
      setEditingTarget({ type: 'MASTER', id });
      setShowNodeEditor(true);
  };

  // Logic to edit a specific element instance's local graph
  const handleEditElementGraph = (elementId: string) => {
      setEditingTarget({ type: 'LOCAL', id: elementId });
      setShowNodeEditor(true);
  };
  
  const handleCreateNewComponent = () => {
      setEditingTarget(null);
      setShowNodeEditor(true);
  };

  const handleSaveCustomComponent = (component: CustomComponentDefinition) => {
      if (editingTarget?.type === 'LOCAL') {
          // Saving to a local element instance
          setElements(prev => prev.map(el => {
              if (el.id === editingTarget.id) {
                  return {
                      ...el,
                      isDetached: true, // Ensure it stays detached
                      customNodeGroup: component
                  };
              }
              return el;
          }));
      } else {
          // Saving to global library
          setCustomComponents(prev => {
              const exists = prev.some(c => c.id === component.id);
              if (exists) {
                  return prev.map(c => c.id === component.id ? component : c);
              }
              return [...prev, component];
          });
      }
      setShowNodeEditor(false);
      setEditingTarget(null);
  };
  
  const handleSaveNodeGroup = (group: SavedNodeGroup) => {
      setSavedNodeGroups(prev => [...prev, group]);
  };

  const handleRenameNodeGroup = (id: string, newName: string) => {
      setSavedNodeGroups(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
  };

  const handleDeleteNodeGroup = (id: string) => {
      setSavedNodeGroups(prev => prev.filter(g => g.id !== id));
  };
  
  const handleRenameComponent = (id: string, newName: string) => {
      setCustomComponents(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };
  
  const handleAddComponentFromSidebar = (type: ElementType, customId?: string) => {
      // Add to center of screen roughly
      addElement(type, 0, 0, customId); 
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  const renderElementRecursive = (elementId: string) => {
    const el = elements.find(e => e.id === elementId);
    if (!el) return null;

    const children = elements
        .filter(child => child.parentId === elementId)
        .map(child => renderElementRecursive(child.id));

    return (
      <RenderedElement 
        key={el.id} 
        element={el} 
        isSelected={selectedId === el.id}
        onSelect={handleElementSelect}
        onResizeStart={handleResizeStart}
        customDefinitions={customComponents}
      >
        {children}
      </RenderedElement>
    );
  };

  // Determine initial data for NodeEditor
  let nodeEditorInitialData: CustomComponentDefinition | null = null;
  if (editingTarget) {
      if (editingTarget.type === 'MASTER') {
          nodeEditorInitialData = customComponents.find(c => c.id === editingTarget.id) || null;
      } else if (editingTarget.type === 'LOCAL') {
          const el = elements.find(e => e.id === editingTarget.id);
          // If element has local data, use it. If not (first time detached), clone master.
          if (el?.customNodeGroup) {
              nodeEditorInitialData = el.customNodeGroup;
          } else if (el?.customComponentId) {
               const master = customComponents.find(c => c.id === el.customComponentId);
               if (master) {
                   nodeEditorInitialData = { ...master, id: uuidv4(), name: `Local ${master.name}` };
               }
          }
      }
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      
      {/* Node Editor Overlay */}
      {showNodeEditor && (
          <NodeEditor 
            savedGroups={savedNodeGroups}
            initialData={nodeEditorInitialData}
            onSaveGroup={handleSaveNodeGroup}
            onRenameGroup={handleRenameNodeGroup}
            onDeleteGroup={handleDeleteNodeGroup}
            onSaveComponent={handleSaveCustomComponent}
            onClose={() => {
                setShowNodeEditor(false);
                setEditingTarget(null);
            }}
          />
      )}
      
      {!showNodeEditor && (
        <HierarchyPanel 
          elements={elements}
          selectedId={selectedId}
          customComponents={customComponents}
          onSelect={setSelectedId}
          onReparent={handleReparent}
          onEditComponent={handleEditCustomComponent}
          onAddComponent={handleAddComponentFromSidebar}
        />
      )}

      {/* Main Workspace */}
      <div 
        className={`flex-1 flex flex-col h-full bg-gray-100 relative ${!showNodeEditor ? 'ml-64' : ''}`}
        onContextMenu={handleContextMenu}
      >
        {/* Top Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-40">
           <div className="flex items-center text-sm font-semibold text-gray-700">
              FlowBuilder
           </div>
           <div className="flex items-center space-x-2">
             <div className="flex items-center mr-4 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
               <span className="font-mono">{Math.round(canvasSize.width)} x {Math.round(canvasSize.height)}</span>
             </div>
             
             {/* Node Editor Create Button */}
             <button 
                onClick={handleCreateNewComponent}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors shadow-sm mr-2"
             >
                <Workflow size={14} className="mr-1.5" />
                Создать Ноду
             </button>

             <button 
               onClick={handlePreview}
               className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
             >
               <Play size={14} className="mr-1.5" />
               Предпросмотр
             </button>
             <button 
               onClick={handleExport}
               className="flex items-center px-3 py-1.5 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
             >
               <Download size={14} className="mr-1.5" />
               Экспорт
             </button>
           </div>
        </div>

        {/* Scrollable Canvas Area */}
        <div 
          className="flex-1 overflow-auto p-8 relative flex flex-col items-center"
          onMouseDown={handleCanvasMouseDown}
        >
          {/* The Actual Canvas Artboard */}
          <div 
            ref={canvasRef}
            className={`bg-white shadow-lg relative transition-shadow ${mode === 'STAMP' ? 'cursor-crosshair ring-2 ring-blue-400 ring-offset-4' : 'cursor-default'}`}
            style={{ 
              width: canvasSize.width, 
              height: canvasSize.height,
              minHeight: canvasSize.height // ensure it keeps height
            }}
            onClick={handleCanvasClick}
          >
            {/* Render Root Elements */}
            {elements.filter(el => !el.parentId).map(el => renderElementRecursive(el.id))}
            
            {/* Bottom Height Resize Handle */}
            <div 
               className="absolute bottom-0 left-0 right-0 h-4 bg-transparent hover:bg-blue-500/10 group cursor-s-resize flex items-center justify-center transition-colors z-20"
               onMouseDown={(e) => handleCanvasResizeStart('h', e)}
            >
               <div className="w-12 h-1 bg-gray-300 rounded-full group-hover:bg-blue-400 transition-colors flex items-center justify-center">
                  <GripHorizontal size={12} className="text-gray-400 opacity-0 group-hover:opacity-100" />
               </div>
            </div>

             {/* Right Width Resize Handle */}
             <div 
               className="absolute top-0 bottom-0 right-0 w-4 bg-transparent hover:bg-blue-500/10 group cursor-e-resize flex items-center justify-center transition-colors z-20"
               onMouseDown={(e) => handleCanvasResizeStart('w', e)}
            >
               <div className="h-12 w-1 bg-gray-300 rounded-full group-hover:bg-blue-400 transition-colors flex items-center justify-center">
                  <GripVertical size={12} className="text-gray-400 opacity-0 group-hover:opacity-100" />
               </div>
            </div>
          </div>
          
          {/* Bottom spacer for comfortable scrolling */}
          <div className="h-20 shrink-0" />
        </div>

        {selectedElement && !showNodeEditor && (
          <PropertiesPanel 
            element={selectedElement}
            onUpdate={handleUpdateElement}
            onClose={() => setSelectedId(null)}
            onDelete={handleDeleteElement}
            onEditGraph={handleEditElementGraph}
            customDefinitions={customComponents}
            onRenameComponent={handleRenameComponent}
          />
        )}

        <ContextMenu 
          isOpen={menu.isOpen}
          x={menu.x} 
          y={menu.y}
          onClose={() => setMenu(prev => ({ ...prev, isOpen: false }))}
          onSelect={handleMenuSelect}
          onStampRequest={handleMenuStampRequest}
          customComponents={customComponents}
        />

        <StatusBar 
          mode={mode}
          stampType={stampType}
          elementCount={elements.length}
          onExitStampMode={handleExitStamp}
        />
      </div>
    </div>
  );
};

export default App;