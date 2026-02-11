import React, { useState } from 'react';
import { CanvasElement, ElementType, CustomComponentDefinition } from '../types';
import { TOOLS } from '../constants';
import { ChevronRight, ChevronDown, Layers, Box, Edit2, Plus, Component, Unlink } from 'lucide-react';

interface SidebarPanelProps {
  elements: CanvasElement[];
  selectedId: string | null;
  customComponents: CustomComponentDefinition[];
  onSelect: (id: string) => void;
  onReparent: (draggedId: string, targetParentId: string | undefined) => void;
  onEditComponent: (id: string) => void;
  onAddComponent: (type: ElementType, customId?: string) => void;
}

export const HierarchyPanel: React.FC<SidebarPanelProps> = ({
  elements,
  selectedId,
  customComponents,
  onSelect,
  onReparent,
  onEditComponent,
  onAddComponent
}) => {
  const [activeTab, setActiveTab] = useState<'elements' | 'layers' | 'library'>('layers');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId === targetId) return;
    onReparent(draggedId, targetId);
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
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${activeTab === 'library' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            title="Компоненты"
        >
            <Component size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900 p-2">
        
        {/* TAB: LAYERS */}
        {activeTab === 'layers' && (
             <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, undefined)} className="h-full">
                {rootElements.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-xs italic mt-10">
                    Слои пусты
                </div>
                ) : (
                rootElements.map(el => renderTreeItem(el))
                )}
                <div className="h-20" />
            </div>
        )}

        {/* TAB: ELEMENTS */}
        {activeTab === 'elements' && (
            <div className="grid grid-cols-2 gap-2">
                 {Object.values(TOOLS).filter(t => t.type !== ElementType.CUSTOM).map((tool) => (
                    <div
                        key={tool.type}
                        onClick={() => onAddComponent(tool.type)}
                        className="flex flex-col items-center justify-center p-3 rounded bg-gray-800 border border-gray-700 hover:border-blue-500 hover:bg-gray-700 cursor-pointer transition-all group"
                    >
                        <tool.icon className="w-6 h-6 mb-2 text-gray-400 group-hover:text-blue-400" />
                        <span className="text-[10px] text-center font-medium text-gray-300">{tool.label}</span>
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
                         <div key={comp.id} className="bg-gray-800 rounded border border-gray-700 p-3 hover:border-blue-500/50 transition-colors group">
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

      </div>
    </div>
  );
};