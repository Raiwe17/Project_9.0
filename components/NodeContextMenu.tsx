import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NodeType } from '../types';
import { Box, Palette, Type, Droplet, Search, Calculator, Link, Hash, ToggleLeft, Split, BoxSelect, Maximize, Merge, Minus, X, Divide, Equal, ArrowLeft, Check, Layers, ArrowUpAz, Move, List } from 'lucide-react';

interface NodeContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
  onStampRequest: (type: NodeType) => void;
}

const NODE_TYPES_CONFIG = [
  { type: NodeType.OUTPUT, label: 'Результат', icon: Box, color: 'text-gray-400' },
  { type: NodeType.STYLE, label: 'Типографика (CSS)', icon: Palette, color: 'text-blue-400' },
  { type: NodeType.GRADIENT, label: 'Градиент (Фон)', icon: Palette, color: 'text-indigo-400' },
  { type: NodeType.TRANSFORM, label: 'Трансформация', icon: Move, color: 'text-orange-400' },
  { type: NodeType.FONT, label: 'Семейство Шрифтов', icon: Type, color: 'text-slate-400' },
  { type: NodeType.BORDER, label: 'Граница', icon: BoxSelect, color: 'text-indigo-400' },
  { type: NodeType.SHADOW, label: 'Тень', icon: Layers, color: 'text-gray-400' },
  { type: NodeType.LAYOUT, label: 'Макет', icon: Maximize, color: 'text-cyan-400' },
  { type: NodeType.MERGE, label: 'Слияние Стилей', icon: Merge, color: 'text-slate-400' },
  { type: NodeType.TEXT, label: 'Текст', icon: Type, color: 'text-green-400' },
  { type: NodeType.UPPERCASE, label: 'Заглавные (Upper)', icon: ArrowUpAz, color: 'text-green-500' },
  { type: NodeType.CONCAT, label: 'Объединить строки', icon: Link, color: 'text-orange-400' },
  { type: NodeType.COLOR, label: 'Цвет', icon: Droplet, color: 'text-purple-400' },
  { type: NodeType.ARRAY, label: 'Массив (Список)', icon: List, color: 'text-gray-400' },
  { type: NodeType.NUMBER, label: 'Число', icon: Hash, color: 'text-yellow-400' },
  { type: NodeType.TOGGLE, label: 'Переключатель', icon: ToggleLeft, color: 'text-teal-400' },
  { type: NodeType.IF_ELSE, label: 'Если / Иначе', icon: Split, color: 'text-pink-400' },
  { type: NodeType.MATH, label: 'Сложение (+)', icon: Calculator, color: 'text-red-400' },
  { type: NodeType.SUBTRACT, label: 'Вычитание (-)', icon: Minus, color: 'text-red-400' },
  { type: NodeType.MULTIPLY, label: 'Умножение (*)', icon: X, color: 'text-red-400' },
  { type: NodeType.DIVIDE, label: 'Деление (/)', icon: Divide, color: 'text-red-400' },
  { type: NodeType.EQUAL, label: 'Равно (==)', icon: Equal, color: 'text-pink-600' },
  { type: NodeType.GREATER, label: 'Больше (>)', icon: ArrowLeft, color: 'text-pink-600' },
  { type: NodeType.AND, label: 'И (&&)', icon: Check, color: 'text-teal-600' },
  { type: NodeType.OR, label: 'ИЛИ (||)', icon: Split, color: 'text-teal-600' },
];

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  x,
  y,
  isOpen,
  onClose,
  onAddNode,
  onStampRequest
}) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredNodes = useMemo(() => {
    return NODE_TYPES_CONFIG.filter(node => 
      node.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  if (!isOpen) return null;

  const menuStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 250),
  };

  return (
    <div 
      className="fixed z-[60] w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden text-gray-200 animate-in fade-in zoom-in-95 duration-100"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Search Bar */}
      <div className="p-2 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-3 h-3 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск ноды..."
            className="w-full bg-gray-800 text-xs text-white pl-7 pr-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar p-1">
        {filteredNodes.length > 0 ? (
          filteredNodes.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                onAddNode(item.type);
                onClose();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStampRequest(item.type);
              }}
              className="w-full flex items-center px-3 py-2 text-sm rounded hover:bg-gray-800 transition-colors text-left group relative"
            >
              <item.icon className={`w-4 h-4 mr-2 ${item.color}`} />
              <span>{item.label}</span>
              
              {/* Stamp Hint Indicator */}
              <div className="absolute right-2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" title="ПКМ для штампа" />
            </button>
          ))
        ) : (
           <div className="text-center py-2 text-xs text-gray-500">
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