
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ContextMenu } from './components/ContextMenu';
import { RenderedElement } from './components/RenderedElement';
import { StatusBar } from './components/StatusBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { HierarchyPanel } from './components/HierarchyPanel';
import { NodeEditor } from './components/NodeEditor';
import { AppMode, CanvasElement, ContextMenuState, ElementType, ResizeState, ResizeHandle, DragState, CustomComponentDefinition, ElementStyle, SavedNodeGroup, NodeType, Page } from './types';
import { TOOLS, GOOGLE_FONTS } from './constants';
import { generateHTML } from './utils/generator';
import { Download, Play, GripHorizontal, GripVertical, Workflow, RotateCcw, Save, Menu, Upload, FileJson, Info, X, Check, Box } from 'lucide-react';

const SIDEBAR_WIDTH = 240;
const CANVAS_WIDTH_DEFAULT = 1280; 
const CANVAS_HEIGHT_DEFAULT = 1400;

// --- PRE-MADE SCRIPTS ---

const HOVER_SCALE_SCRIPT: SavedNodeGroup = {
    id: 'script-hover-scale',
    name: 'Эффект: Увеличение (Hover)',
    nodes: [
        { id: 'n1', type: NodeType.INTERACTION_HOVER, x: 50, y: 50, data: { label: 'Hover' } },
        { id: 'n2', type: NodeType.IF_ELSE, x: 300, y: 50, data: { label: 'Condition' } },
        { id: 'n3', type: NodeType.NUMBER, x: 50, y: 150, data: { label: 'Scale Up', value: 1.05 } },
        { id: 'n4', type: NodeType.NUMBER, x: 50, y: 250, data: { label: 'Normal', value: 1 } },
        { id: 'n5', type: NodeType.TRANSFORM, x: 550, y: 50, data: { label: 'Transform' } },
        { id: 'out', type: NodeType.OUTPUT, x: 800, y: 50, data: { label: 'Output' } }
    ],
    connections: [
        { id: 'c1', sourceNodeId: 'n1', sourceSocketId: 'out-bool', targetNodeId: 'n2', targetSocketId: 'in-condition' },
        { id: 'c2', sourceNodeId: 'n3', sourceSocketId: 'out-num', targetNodeId: 'n2', targetSocketId: 'in-true' },
        { id: 'c3', sourceNodeId: 'n4', sourceSocketId: 'out-num', targetNodeId: 'n2', targetSocketId: 'in-false' },
        { id: 'c4', sourceNodeId: 'n2', sourceSocketId: 'out-result', targetNodeId: 'n5', targetSocketId: 'in-scale' },
        { id: 'c5', sourceNodeId: 'n5', sourceSocketId: 'out-style', targetNodeId: 'out', targetSocketId: 'in-style' }
    ]
};

const CLICK_TOGGLE_SCRIPT: SavedNodeGroup = {
    id: 'script-click-toggle',
    name: 'Интерактив: Клик (Цвет)',
    nodes: [
        { id: 'n1', type: NodeType.INTERACTION_CLICK, x: 50, y: 50, data: { label: 'Click Toggle' } },
        { id: 'n2', type: NodeType.IF_ELSE, x: 300, y: 50, data: { label: 'Condition' } },
        { id: 'n3', type: NodeType.COLOR, x: 50, y: 150, data: { label: 'Active Color', value: '#1d4ed8' } }, // Darker Blue
        { id: 'n4', type: NodeType.COLOR, x: 50, y: 250, data: { label: 'Default Color', value: '#1e3a8a' } }, // Dark Blue
        { id: 'n5', type: NodeType.STYLE, x: 550, y: 50, data: { label: 'Style Bg' } },
        { id: 'out', type: NodeType.OUTPUT, x: 800, y: 50, data: { label: 'Output' } }
    ],
    connections: [
        { id: 'c1', sourceNodeId: 'n1', sourceSocketId: 'out-bool', targetNodeId: 'n2', targetSocketId: 'in-condition' },
        { id: 'c2', sourceNodeId: 'n3', sourceSocketId: 'out-color', targetNodeId: 'n2', targetSocketId: 'in-true' },
        { id: 'c3', sourceNodeId: 'n4', sourceSocketId: 'out-color', targetNodeId: 'n2', targetSocketId: 'in-false' },
        { id: 'c4', sourceNodeId: 'n2', sourceSocketId: 'out-result', targetNodeId: 'n5', targetSocketId: 'in-bg' },
        { id: 'c5', sourceNodeId: 'n5', sourceSocketId: 'out-style', targetNodeId: 'out', targetSocketId: 'in-style' }
    ]
};

const FADE_IN_UP_SCRIPT: SavedNodeGroup = {
    id: 'script-fade-in-up',
    name: 'Анимация: Появление',
    nodes: [
        { id: 'n1', type: NodeType.ANIMATION, x: 50, y: 50, data: { label: 'Anim', value: 'slideInUp' } },
        { id: 'n2', type: NodeType.NUMBER, x: 50, y: 150, data: { label: 'Duration', value: 0.8 } },
        { id: 'n3', type: NodeType.NUMBER, x: 50, y: 250, data: { label: 'Delay', value: 0.2 } },
        { id: 'out', type: NodeType.OUTPUT, x: 300, y: 50, data: { label: 'Output' } }
    ],
    connections: [
        { id: 'c1', sourceNodeId: 'n1', sourceSocketId: 'out-style', targetNodeId: 'out', targetSocketId: 'in-style' },
        { id: 'c2', sourceNodeId: 'n2', sourceSocketId: 'out-num', targetNodeId: 'n1', targetSocketId: 'in-duration' },
        { id: 'c3', sourceNodeId: 'n3', sourceSocketId: 'out-num', targetNodeId: 'n1', targetSocketId: 'in-delay' }
    ]
};

const DEFAULT_SAVED_GROUPS: SavedNodeGroup[] = [HOVER_SCALE_SCRIPT, CLICK_TOGGLE_SCRIPT, FADE_IN_UP_SCRIPT];
const DEFAULT_PAGES: Page[] = [{ id: 'home', name: 'Главная' }];

const App: React.FC = () => {
  // --- STATE INITIALIZATION WITH LOCAL STORAGE ---
  const [pages, setPages] = useState<Page[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return parsed.pages || DEFAULT_PAGES;
          } catch(e) { console.error('Failed to load pages', e); }
      }
      return DEFAULT_PAGES;
  });

  const [activePageId, setActivePageId] = useState<string>(() => {
       // Ideally we could persist active page too, but default to first is fine
       return pages[0]?.id || 'home';
  });

  const [elements, setElements] = useState<CanvasElement[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              let loadedElements: CanvasElement[] = parsed.elements || [];
              
              // Migration: Assign existing elements to the first page if they have no pageId
              const firstPageId = parsed.pages?.[0]?.id || 'home';
              loadedElements = loadedElements.map(el => ({
                  ...el,
                  pageId: el.pageId || firstPageId
              }));

              return loadedElements;
          } catch(e) { console.error('Failed to load elements', e); }
      }
      return [];
  });

  const [customComponents, setCustomComponents] = useState<CustomComponentDefinition[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return parsed.customComponents || [];
          } catch(e) { console.error('Failed to load components', e); }
      }
      return [];
  });

  const [savedNodeGroups, setSavedNodeGroups] = useState<SavedNodeGroup[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return parsed.savedNodeGroups || DEFAULT_SAVED_GROUPS;
          } catch(e) { console.error('Failed to load scripts', e); }
      }
      return DEFAULT_SAVED_GROUPS;
  });

  const [canvasSize, setCanvasSize] = useState(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (parsed.canvasSize) return parsed.canvasSize;
          } catch(e) { console.error('Failed to load canvas size', e); }
      }
      return { width: CANVAS_WIDTH_DEFAULT, height: CANVAS_HEIGHT_DEFAULT };
  });

  const [mode, setMode] = useState<AppMode>('SELECT');
  const [stampType, setStampType] = useState<ElementType | null>(null);
  const [stampCustomId, setStampCustomId] = useState<string | undefined>(undefined);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  
  // Logic Editor State
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ type: 'MASTER' | 'LOCAL' | 'SCRIPT' | 'NEW_SCRIPT', id: string } | null>(null);

  // Main Menu State
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Derived State: Active Elements
  const activePageElements = elements.filter(el => el.pageId === activePageId);

  // --- AUTO SAVE EFFECT ---
  useEffect(() => {
      const saveData = {
          pages,
          elements,
          customComponents,
          savedNodeGroups,
          canvasSize,
          version: 1
      };
      
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
          setIsSaved(true);
          // Briefly indicate save
          const timeout = setTimeout(() => setIsSaved(true), 1000);
          return () => clearTimeout(timeout);
      } catch (e) {
          console.error("Failed to save project", e);
          setIsSaved(false);
      }
  }, [pages, elements, customComponents, savedNodeGroups, canvasSize]);

  // --- FONT LOADING EFFECT ---
  useEffect(() => {
      const fontsToLoad = new Set<string>();
      elements.forEach(el => {
          if (el.style.fontFamily && GOOGLE_FONTS.includes(el.style.fontFamily)) {
              fontsToLoad.add(el.style.fontFamily);
          }
      });
      
      const fontArray = Array.from(fontsToLoad);
      if (fontArray.length === 0) return;

      const query = fontArray.map(font => `family=${font.replace(/ /g, '+')}:wght@400;700`).join('&');
      const href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
      
      let link = document.getElementById('dynamic-google-fonts') as HTMLLinkElement;
      if (!link) {
          link = document.createElement('link');
          link.id = 'dynamic-google-fonts';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
      }
      link.href = href;

  }, [elements]);

  // --- PAGE OPERATIONS ---
  const handleAddPage = () => {
      const newPage: Page = {
          id: uuidv4(),
          name: `Страница ${pages.length + 1}`
      };
      setPages(prev => [...prev, newPage]);
      setActivePageId(newPage.id);
  };

  const handleDeletePage = (id: string) => {
      if (pages.length <= 1) {
          alert("Нельзя удалить единственную страницу.");
          return;
      }
      if (window.confirm("Удалить страницу и все её элементы?")) {
          setPages(prev => prev.filter(p => p.id !== id));
          setElements(prev => prev.filter(el => el.pageId !== id));
          if (activePageId === id) {
              setActivePageId(pages[0].id);
          }
      }
  };

  const handleRenamePage = (id: string, newName: string) => {
      setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  // --- FILE OPERATIONS ---

  const handleResetProject = () => {
      if (window.confirm("Вы уверены? Это действие очистит весь проект.")) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
      }
  };

  const handleSaveProjectJSON = () => {
      const projectData = {
          pages,
          elements,
          customComponents,
          savedNodeGroups,
          canvasSize,
          timestamp: Date.now(),
          version: 1
      };
      const json = JSON.stringify(projectData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowbuilder-project-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); 
      a.click();
      document.body.removeChild(a); 
      URL.revokeObjectURL(url);
      setIsMainMenuOpen(false);
  };

  const handleLoadProjectClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset value before clicking to ensure onChange triggers even for same file
          fileInputRef.current.click();
      }
      setIsMainMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = event.target?.result as string;
              if (!json) throw new Error("Empty file content");
              
              const data = JSON.parse(json);
              
              if (window.confirm("Загрузка проекта заменит текущий холст. Продолжить?")) {
                  // Fallback to empty/default if keys are missing
                  setPages(Array.isArray(data.pages) ? data.pages : DEFAULT_PAGES);
                  
                  // Ensure elements have pageId
                  const loadedElements = Array.isArray(data.elements) ? data.elements : [];
                  const defaultPageId = data.pages?.[0]?.id || DEFAULT_PAGES[0].id;
                  
                  setElements(loadedElements.map((el: any) => ({
                      ...el,
                      pageId: el.pageId || defaultPageId
                  })));

                  setCustomComponents(Array.isArray(data.customComponents) ? data.customComponents : []);
                  setSavedNodeGroups(Array.isArray(data.savedNodeGroups) ? data.savedNodeGroups : DEFAULT_SAVED_GROUPS);
                  if (data.canvasSize) {
                      setCanvasSize(data.canvasSize);
                  } else {
                      setCanvasSize({ width: CANVAS_WIDTH_DEFAULT, height: CANVAS_HEIGHT_DEFAULT });
                  }
                  
                  // Reset UI state
                  setActivePageId(data.pages?.[0]?.id || DEFAULT_PAGES[0].id);
                  setSelectedId(null);
                  setMode('SELECT');
              }
          } catch (err) {
              alert("Ошибка при чтении файла проекта. Проверьте формат JSON.");
              console.error(err);
          }
      };
      reader.readAsText(file);
  };

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
      pageId: activePageId, // Assign to current page
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
  }, [mode, activePageId]);

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
    const html = generateHTML(elements, pages, canvasSize.width, canvasSize.height, customComponents, savedNodeGroups);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    a.click();
    URL.revokeObjectURL(url);
    setIsMainMenuOpen(false);
  };

  const handlePreview = () => {
    const html = generateHTML(elements, pages, canvasSize.width, canvasSize.height, customComponents, savedNodeGroups);
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
        else if (isMainMenuOpen) setIsMainMenuOpen(false);
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
  }, [selectedId, mode, menu.isOpen, handleDeleteElement, handleExitStamp, showNodeEditor, isMainMenuOpen]);

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
    if (isMainMenuOpen) setIsMainMenuOpen(false);
  }, [isMainMenuOpen]);

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

  // --- DROP HANDLERS FOR NEW ELEMENTS ---
  const handleCanvasDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
      e.preventDefault();
      
      const toolType = e.dataTransfer.getData('application/flowbuilder-tool') as ElementType;
      const customId = e.dataTransfer.getData('application/flowbuilder-custom-id');

      if (toolType && (TOOLS[toolType] || toolType === ElementType.CUSTOM)) {
          addElement(toolType, e.clientX, e.clientY, customId || undefined);
      }
  };

  const handleElementSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    canvasMouseDownRef.current = false;
    if (isMainMenuOpen) setIsMainMenuOpen(false);
    
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

  // Logic to edit a Saved Script (Node Group)
  const handleEditNodeGroup = (id: string) => {
      setEditingTarget({ type: 'SCRIPT', id });
      setShowNodeEditor(true);
  };
  
  const handleCreateNewComponent = () => {
      setEditingTarget(null);
      setShowNodeEditor(true);
  };

  // Handler for creating a new independent Script (for HierarchyPanel)
  const handleCreateNewScript = () => {
      setEditingTarget({ type: 'NEW_SCRIPT', id: uuidv4() });
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
      } else if (editingTarget?.type === 'SCRIPT' || editingTarget?.type === 'NEW_SCRIPT') {
          // Saving an existing Script asset OR creating a new one
          setSavedNodeGroups(prev => {
             const exists = prev.some(g => g.id === component.id);
             if (exists) {
                 return prev.map(g => g.id === component.id ? { ...component, id: g.id } : g);
             }
             return [...prev, component];
          });
      } else {
          // Saving to global library (Visual Component)
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
      // Check if updating existing or adding new
      setSavedNodeGroups(prev => {
          const exists = prev.some(g => g.id === group.id);
          if (exists) {
              return prev.map(g => g.id === group.id ? group : g);
          }
          return [...prev, group];
      });
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

  // Updated recursive renderer to only look at elements on the active page (for root calls)
  // Recursion handles children regardless of pageId, assuming parent hierarchy is consistent.
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
        scripts={savedNodeGroups} // Pass Scripts here so they can be executed
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
      } else if (editingTarget.type === 'SCRIPT') {
          const script = savedNodeGroups.find(g => g.id === editingTarget.id);
          if (script) {
              nodeEditorInitialData = script;
          }
      } else if (editingTarget.type === 'NEW_SCRIPT') {
          nodeEditorInitialData = {
              id: editingTarget.id,
              name: 'Новый Скрипт',
              nodes: [{ id: 'root', type: NodeType.OUTPUT, x: 500, y: 300, data: { label: 'Output' } }],
              connections: []
          };
      }
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      
      {/* Node Editor Overlay */}
      {showNodeEditor && (
          <NodeEditor 
            savedGroups={savedNodeGroups}
            pages={pages} // Pass pages to NodeEditor for Navigation Node
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

      {/* About Modal */}
      {showAboutModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="bg-white rounded-lg shadow-2xl w-96 p-6 relative">
                  <button 
                     onClick={() => setShowAboutModal(false)}
                     className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                  >
                      <X size={20} />
                  </button>
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                          <Workflow size={24} />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">OCK -очень крутой конструктор сайтов</h2>
                      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                          Создан Морозовым Елисеем. 9К
                      </p>
                      <div className="w-full bg-gray-50 rounded p-3 text-xs text-gray-500 border border-gray-100">
                          <div className="flex justify-between mb-1">
                              <span>Версия:</span>
                              <span className="font-mono text-gray-700">1.1.0 (Multi-page)</span>
                          </div>
                          <div className="flex justify-between">
                              <span>Сборка:</span>
                              <span className="font-mono text-gray-700">React + Tailwind</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      {!showNodeEditor && (
        <HierarchyPanel 
          elements={activePageElements} // ONLY show active page elements in tree
          selectedId={selectedId}
          customComponents={customComponents}
          scripts={savedNodeGroups}
          pages={pages}
          activePageId={activePageId}
          onSelect={setSelectedId}
          onReparent={handleReparent}
          onEditComponent={handleEditCustomComponent}
          onEditScript={handleEditNodeGroup}
          onDeleteScript={handleDeleteNodeGroup}
          onCreateScript={handleCreateNewScript} 
          onAddComponent={handleAddComponentFromSidebar}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onSelectPage={setActivePageId}
        />
      )}

      {/* Main Workspace */}
      <div 
        className={`flex-1 flex flex-col h-full bg-gray-100 relative ${!showNodeEditor ? 'ml-64' : ''}`}
        onContextMenu={handleContextMenu}
      >
        {/* Top Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-40 relative">
           <div className="flex items-center space-x-4">
              {/* Hamburger Menu */}
              <div className="relative">
                  <button 
                    onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
                  >
                      <Menu size={20} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMainMenuOpen && (
                      <div className="absolute top-12 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-2 flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Проект</div>
                          
                          <button onClick={handleSaveProjectJSON} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                              <FileJson size={16} className="mr-3 text-gray-400" />
                              Сохранить (.json)
                          </button>
                          
                          <button onClick={handleLoadProjectClick} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                              <Upload size={16} className="mr-3 text-gray-400" />
                              Загрузить (.json)
                          </button>
                          
                          <div className="my-1 border-t border-gray-100"></div>
                          
                          <button onClick={handleExport} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                              <Download size={16} className="mr-3 text-gray-400" />
                              Экспорт в HTML
                          </button>

                          <div className="my-1 border-t border-gray-100"></div>

                          <button onClick={handleResetProject} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              <RotateCcw size={16} className="mr-3 text-red-400" />
                              Сбросить всё
                          </button>

                          <div className="my-1 border-t border-gray-100"></div>

                          <button onClick={() => { setShowAboutModal(true); setIsMainMenuOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                              <Info size={16} className="mr-3 text-gray-400" />
                              О проекте
                          </button>
                      </div>
                  )}
              </div>
              
              {/* File input moved OUTSIDE the dropdown container completely to prevent unmounting/remounting issues */}
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json"
                  onChange={handleFileChange}
              />

              <div className="flex flex-col leading-none">
                  <span className="text-sm font-semibold text-gray-700 flex items-center select-none">
                      FlowBuilder
                      {isSaved && <Check size={12} className="ml-2 text-green-500 opacity-50" title="Сохранено" />}
                  </span>
                  <span className="text-[10px] text-gray-500">
                      Страница: <span className="font-medium text-gray-700">{pages.find(p => p.id === activePageId)?.name}</span>
                  </span>
              </div>
           </div>

           <div className="flex items-center space-x-2">
             <div className="flex items-center mr-4 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded select-none">
               <span className="font-mono">{Math.round(canvasSize.width)} x {Math.round(canvasSize.height)}</span>
             </div>
             
             {/* Node Editor Create Button */}
             <button 
                onClick={handleCreateNewComponent}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors shadow-sm mr-2"
             >
                <Workflow size={14} className="mr-1.5" />
                Нода
             </button>

             <button 
               onClick={handlePreview}
               className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-sm"
             >
               <Play size={14} className="mr-1.5 text-blue-600" />
               Запуск
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
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            {/* Render Root Elements for CURRENT PAGE */}
            {activePageElements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none select-none">
                    <div className="text-center">
                        <Box size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Холст пуст</p>
                        <p className="text-xs opacity-70">Перетащите элементы слева</p>
                    </div>
                </div>
            )}
            
            {activePageElements.filter(el => !el.parentId).map(el => renderElementRecursive(el.id))}
            
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
            onEditScript={handleEditNodeGroup}
            customDefinitions={customComponents}
            availableScripts={savedNodeGroups} // Pass SavedNodeGroups here
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
          elementCount={activePageElements.length}
          onExitStampMode={handleExitStamp}
        />
      </div>
    </div>
  );
};

export default App;
