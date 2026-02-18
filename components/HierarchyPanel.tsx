
import React, { useState } from 'react';
import { CanvasElement, ElementType, CustomComponentDefinition, SavedNodeGroup, Page } from '../types';
import { TOOLS } from '../constants';
import { ChevronRight, ChevronDown, Layers, Box, Edit2, Plus, Component, Unlink, FileCode, Trash2, GripVertical, File, LayoutTemplate } from 'lucide-react';

interface SidebarPanelProps {
  elements: CanvasElement[];
  selectedId: string | null;
  customComponents: CustomComponentDefinition[];
  scripts: SavedNodeGroup[]; 
  pages: Page[];
  activePageId: string;
  onSelect: (id: string) => void;
  onReparent: (draggedId: string, targetParentId: string | undefined) => void;
  onEditComponent: (id: string) => void;
  onEditScript: (id: string) => void;
  onDeleteScript: (id: string) => void;
  onCreateScript: () => void; 
  onAddComponent: (type: ElementType, customId?: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, name: string) => void;
  onSelectPage: (id: string) => void;
}

const ELEMENT_GROUPS = [
  { 
    id: 'layout', 
    label: 'Макет', 
    types: [ElementType.CONTAINER, ElementType.CARD, ElementType.DIVIDER] 
  },
  { 
    id: 'typography', 
    label: 'Текст', 
    types: [ElementType.HEADING, ElementType.PARAGRAPH] 
  },
  { 
    id: 'media', 
    label: 'Медиа', 
    types: [ElementType.IMAGE_PLACEHOLDER, ElementType.VIDEO_PLACEHOLDER, ElementType.AVATAR] 
  },
  { 
    id: 'forms', 
    label: 'Формы и UI', 
    types: [ElementType.BUTTON, ElementType.INPUT, ElementType.BADGE] 
  }
];

export const HierarchyPanel: React.FC<SidebarPanelProps> = ({
  elements,
  selectedId,
  customComponents,
  scripts,
  pages,
  activePageId,
  onSelect,
  onReparent,
  onEditComponent,
  onEditScript,
  onDeleteScript,
  onCreateScript,
  onAddComponent,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onSelectPage
}) => {
  const [activeTab, setActiveTab] = useState<'elements' | 'layers' | 'library' | 'scripts' | 'pages'>('elements');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [tempPageName, setTempPageName] = useState('');

  // --- HIERARCHY LOGIC ---
  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newCollapsed = new Set(collapsed);
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id);
    } else {
      newCollapsed.add(id);
    }
    setCollapsed(newCollapsed);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleToolDragStart = (e: React.DragEvent, type: ElementType, customId?: string) => {
      e.dataTransfer.setData('application/flowbuilder-tool', type);
      if (customId) {
          e.dataTransfer.setData('application/flowbuilder-custom-id', customId);
      }
      e.dataTransfer.effectAllowed = 'copy';
      
      const el = e.currentTarget as HTMLElement;
      el.style.opacity = '0.5';
  };

  const handleToolDragEnd = (e: React.DragEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    // Ignore tool drops here, only handle hierarchy reordering
    if (!draggedId || draggedId.includes('flowbuilder')) return;

    if (draggedId === targetId) return;
    onReparent(draggedId, targetId);
  };

  const startPageRename = (page: Page) => {
      setEditingPageId(page.id);
      setTempPageName(page.name);
  };

  const savePageRename = () => {
      if (editingPageId && tempPageName.trim()) {
          onRenamePage(editingPageId, tempPageName.trim());
      }
      setEditingPageId(null);
  };

  const renderTreeItem = (element: CanvasElement, level: number = 0) => {
    const children = elements.filter(e => e.parentId === element.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsed.has(element.id);
    const ToolIcon = TOOLS[element.type]?.icon || Box;

    const displayName = element.name 
        ? element.name 
        : (element.content && element.content.length < 20 
            ? element.content 
            : (element.customComponentId 
                ? customComponents.find(c => c.id === element.customComponentId)?.name || 'Custom' 
                : TOOLS[element.type]?.label || 'Element'));

    return (
      <div key={element.id} className="select-none">
        <div
          className={`flex items-center py-1.5 px-2 cursor-pointer text-xs border-b border-gray-800 transition-colors ${
            selectedId === element.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => onSelect(element.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, element.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, element.id)}
        >
          <button
            className={`mr-1 p-0.5 rounded hover:bg-white/10 ${hasChildren ? 'visible' : 'invisible'}`}
            onClick={(e) => toggleCollapse(e, element.id)}
          >
            {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
          </button>
          
          <ToolIcon size={12} className="mr-2 opacity-70" />
          <span className="truncate flex-1">
            {displayName}
          </span>
          {element.isDetached && (
              <span title="Отключено от мастера">
                <Unlink size={10} className="text-orange-400 ml-1 opacity-80" />
              </span>
          )}
        </div>
        
        {!isCollapsed && children.map(child => renderTreeItem(child, level + 1))}
      </div>
    );
  };

  const rootElements = elements.filter(e => !e.parentId);

  return (
    <div 
      className="fixed left-0 top-0 bottom-8 w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-50 shadow-xl"
      onMouseDown={(e) => e.stopPropagation()} 
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Sidebar Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-950">
        <button 
            onClick={() => setActiveTab('elements')}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'elements' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            title="Элементы"
        >
            <Plus size={16} />
        </button>
        <button 
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'layers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            title="Слои"
        >
            <Layers size={16} />
        </button>
        <button 
            onClick={() => setActiveTab('pages')}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'pages' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            title="Страницы"
        >
            <LayoutTemplate size={16} />
        </button>
        <button 
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'library' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            title="Компоненты"
        >
            <Component size={16} />
        </button>
        <button 
            onClick={() => setActiveTab('scripts')}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'scripts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            title="Скрипты"
        >
            <FileCode size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900 p-2">
        
        {/* TAB: LAYERS */}
        {activeTab === 'layers' && (
             <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, undefined)} className="h-full">
                {rootElements.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-xs italic mt-10">
                    Слои текущей страницы пусты
                </div>
                ) : (
                rootElements.map(el => renderTreeItem(el))
                )}
                <div className="h-20" />
            </div>
        )}

        {/* TAB: PAGES */}
        {activeTab === 'pages' && (
            <div className="space-y-3">
                 <div className="flex items-center justify-between mb-2">
                     <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Страницы</div>
                     <button 
                        onClick={onAddPage}
                        className="text-[10px] bg-indigo-700 hover:bg-indigo-600 text-white px-2 py-0.5 rounded flex items-center shadow-sm"
                     >
                        <Plus size={10} className="mr-1"/> Добавить
                     </button>
                 </div>
                 
                 {pages.map((page) => (
                     <div 
                        key={page.id} 
                        onClick={() => onSelectPage(page.id)}
                        className={`p-2 rounded border transition-colors cursor-pointer group flex items-center justify-between ${page.id === activePageId ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                     >
                         <div className="flex items-center flex-1 min-w-0">
                             <File size={14} className={`mr-2 shrink-0 ${page.id === activePageId ? 'text-indigo-400' : 'text-gray-500'}`} />
                             
                             {editingPageId === page.id ? (
                                 <input 
                                    autoFocus
                                    type="text"
                                    value={tempPageName}
                                    onChange={(e) => setTempPageName(e.target.value)}
                                    onBlur={savePageRename}
                                    onKeyDown={(e) => e.key === 'Enter' && savePageRename()}
                                    className="bg-gray-900 text-sm text-white px-1 py-0.5 rounded border border-blue-500 focus:outline-none w-full"
                                    onClick={(e) => e.stopPropagation()}
                                 />
                             ) : (
                                 <span className={`text-sm font-medium truncate ${page.id === activePageId ? 'text-white' : 'text-gray-300'}`}>{page.name}</span>
                             )}
                         </div>

                         {editingPageId !== page.id && (
                             <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); startPageRename(page); }}
                                    className="p-1 hover:text-white text-gray-500"
                                    title="Переименовать"
                                 >
                                     <Edit2 size={12} />
                                 </button>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                                    className="p-1 hover:text-red-400 text-gray-500"
                                    title="Удалить"
                                    disabled={pages.length <= 1}
                                 >
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                         )}
                     </div>
                 ))}
            </div>
        )}

        {/* TAB: ELEMENTS (Now with Drag & Drop) */}
        {activeTab === 'elements' && (
            <div className="space-y-4 pb-10">
                <div className="text-[10px] text-gray-500 text-center mb-2 italic">
                    Нажмите или перетащите на холст
                </div>
                {ELEMENT_GROUPS.map(group => (
                    <div key={group.id}>
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 px-1">{group.label}</div>
                        <div className="grid grid-cols-2 gap-2">
                             {group.types.map((type) => {
                                 const tool = TOOLS[type];
                                 if (!tool) return null;
                                 return (
                                    <div
                                        key={tool.type}
                                        draggable
                                        onDragStart={(e) => handleToolDragStart(e, tool.type)}
                                        onDragEnd={handleToolDragEnd}
                                        onClick={() => onAddComponent(tool.type)}
                                        className="flex flex-col items-center justify-center p-3 rounded bg-gray-800 border border-gray-700 hover:border-blue-500 hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-all group relative"
                                    >
                                        <GripVertical className="absolute top-1 right-1 w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100" />
                                        <tool.icon className="w-6 h-6 mb-2 text-gray-400 group-hover:text-blue-400" />
                                        <span className="text-[10px] text-center font-medium text-gray-300">{tool.label}</span>
                                    </div>
                                 );
                             })}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* TAB: LIBRARY (COMPONENTS) */}
        {activeTab === 'library' && (
            <div className="space-y-3">
                 <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Мои Компоненты</div>
                 {customComponents.length === 0 ? (
                     <div className="text-xs text-gray-600 text-center py-8 border border-dashed border-gray-800 rounded">
                         Нет созданных компонентов.
                         <br/><br/>
                         Откройте редактор нод, чтобы создать свой первый компонент.
                     </div>
                 ) : (
                     customComponents.map((comp) => (
                         <div 
                            key={comp.id} 
                            draggable
                            onDragStart={(e) => handleToolDragStart(e, ElementType.CUSTOM, comp.id)}
                            onDragEnd={handleToolDragEnd}
                            className="bg-gray-800 rounded border border-gray-700 p-3 hover:border-blue-500/50 transition-colors group cursor-grab active:cursor-grabbing"
                        >
                             <div className="flex items-center justify-between mb-2">
                                 <div className="flex items-center font-medium text-sm text-gray-200 truncate">
                                     <Box size={14} className="mr-2 text-orange-400" />
                                     {comp.name}
                                 </div>
                             </div>
                             <div className="flex space-x-2 mt-2">
                                 <button 
                                    onClick={() => onAddComponent(ElementType.CUSTOM, comp.id)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded flex items-center justify-center"
                                 >
                                     <Plus size={12} className="mr-1" /> Добавить
                                 </button>
                                 <button 
                                    onClick={() => onEditComponent(comp.id)}
                                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-1.5 rounded flex items-center justify-center"
                                    title="Редактировать Логику"
                                 >
                                     <Edit2 size={12} />
                                 </button>
                             </div>
                         </div>
                     ))
                 )}
            </div>
        )}

        {/* TAB: SCRIPTS */}
        {activeTab === 'scripts' && (
            <div className="space-y-3">
                 <div className="flex items-center justify-between mb-2">
                     <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Доступные Скрипты</div>
                     <button 
                        onClick={onCreateScript}
                        className="text-[10px] bg-green-700 hover:bg-green-600 text-white px-2 py-0.5 rounded flex items-center shadow-sm"
                     >
                        <Plus size={10} className="mr-1"/> Создать
                     </button>
                 </div>
                 {scripts.length === 0 ? (
                     <div className="text-xs text-gray-600 text-center py-8 border border-dashed border-gray-800 rounded">
                         Нет сохраненных скриптов.
                         <br/><br/>
                         Нажмите "Создать", чтобы добавить логику для элементов.
                     </div>
                 ) : (
                     scripts.map((script) => (
                         <div key={script.id} className="bg-gray-800 rounded border border-gray-700 p-2 hover:border-green-500/50 transition-colors group flex items-center justify-between">
                             <div className="flex items-center font-medium text-sm text-gray-200 truncate">
                                 <FileCode size={14} className="mr-2 text-green-400" />
                                 {script.name}
                             </div>
                             <div className="flex items-center space-x-1">
                                 <button 
                                    onClick={() => onEditScript(script.id)}
                                    className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded"
                                    title="Редактировать"
                                 >
                                     <Edit2 size={12} />
                                 </button>
                                 <button 
                                    onClick={() => onDeleteScript(script.id)}
                                    className="p-1.5 bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-400 rounded"
                                    title="Удалить"
                                 >
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                         </div>
                     ))
                 )}
            </div>
        )}

      </div>
    </div>
  );
};
