import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Box } from 'lucide-react';
import { TOOLS } from '../constants';
import { ElementType, CustomComponentDefinition } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ElementType, customId?: string) => void;
  onStampRequest: (type: ElementType, customId?: string) => void;
  customComponents: CustomComponentDefinition[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  onSelect,
  onStampRequest,
  customComponents
}) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    const standard = Object.values(TOOLS).filter(tool => 
      tool.label.toLowerCase().includes(search.toLowerCase())
    );
    return standard;
  }, [search]);
  
  const filteredCustom = useMemo(() => {
      return customComponents.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, customComponents]);

  if (!isOpen) return null;

  // Ensure menu doesn't go off screen (basic clamp)
  const menuStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 250),
  };

  return (
    <div 
      className="fixed z-50 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden text-gray-200 animate-in fade-in zoom-in-95 duration-100"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск элементов..."
            className="w-full bg-gray-800 text-sm text-white pl-8 pr-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Elements */}
      <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar p-2">
          
        {/* Standard Tools */}
        <div className="grid grid-cols-2 gap-2 mb-2">
            {filteredTools.map((tool) => (
                <div
                key={tool.type}
                className="flex flex-col items-center justify-center p-3 rounded hover:bg-gray-800 cursor-pointer transition-colors group relative"
                onClick={() => onSelect(tool.type)}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStampRequest(tool.type);
                }}
                title="ЛКМ чтобы добавить, ПКМ для штампа"
                >
                <tool.icon className="w-6 h-6 mb-2 text-gray-400 group-hover:text-blue-400" />
                <span className="text-xs text-center font-medium">{tool.label}</span>
                
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                    <div className="w-2 h-2 rounded-full bg-blue-500" title="Режим штампа" />
                </div>
                </div>
            ))}
        </div>

        {/* Custom Components Section */}
        {filteredCustom.length > 0 && (
            <>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 px-1">Мои Компоненты</div>
                <div className="grid grid-cols-2 gap-2">
                    {filteredCustom.map((comp) => (
                        <div
                            key={comp.id}
                            className="flex flex-col items-center justify-center p-3 rounded bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors group relative border border-gray-700 hover:border-blue-500"
                            onClick={() => onSelect(ElementType.CUSTOM, comp.id)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onStampRequest(ElementType.CUSTOM, comp.id);
                            }}
                        >
                            <Box className="w-6 h-6 mb-2 text-orange-400 group-hover:text-orange-300" />
                            <span className="text-xs text-center font-medium truncate w-full px-1">{comp.name}</span>
                        </div>
                    ))}
                </div>
            </>
        )}

        {filteredTools.length === 0 && filteredCustom.length === 0 && (
          <div className="text-center py-4 text-xs text-gray-500">
            Ничего не найдено
          </div>
        )}
      </div>

      {/* Hint Footer */}
      <div className="bg-gray-950 p-2 text-[10px] text-gray-500 text-center border-t border-gray-800">
        <span className="font-bold text-gray-400">ЛКМ</span> добавить • <span className="font-bold text-gray-400">ПКМ</span> штамп
      </div>
    </div>
  );
};