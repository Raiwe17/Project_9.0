
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NodeType } from '../types';
import { Box, Palette, Type, Droplet, Search, Calculator, Link, Hash, ToggleLeft, Split, BoxSelect, Maximize, Merge, Minus, X, Divide, Equal, ArrowLeft, Check, Layers, ArrowUpAz, Move, List, Braces, Ruler, ListChecks, Dices, Sigma, Ban, MousePointerClick, MousePointer2, Timer, Waves, ArrowDownZa, ArrowLeftRight, CaseSensitive, Clapperboard, FastForward, Navigation } from 'lucide-react';

interface NodeContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: NodeType) => void;
  onStampRequest: (type: NodeType) => void;
}

const CATEGORIES = [
    {
        name: 'Interaction',
        items: [
            { type: NodeType.INTERACTION_HOVER, label: 'При наведении', icon: MousePointer2, color: 'text-red-400' },
            { type: NodeType.INTERACTION_CLICK, label: 'При клике (Toggle)', icon: MousePointerClick, color: 'text-red-400' },
            { type: NodeType.TIMER, label: 'Таймер / Анимация', icon: Timer, color: 'text-red-500' },
            { type: NodeType.NAVIGATE, label: 'Переход (Навигация)', icon: Navigation, color: 'text-orange-400' },
        ]
    },
    {
        name: 'Animation',
        items: [
            { type: NodeType.ANIMATION, label: 'CSS Анимация', icon: Clapperboard, color: 'text-rose-400' },
            { type: NodeType.TRANSITION, label: 'Плавный переход', icon: FastForward, color: 'text-rose-400' },
        ]
    },
    {
        name: 'Logic',
        items: [
            { type: NodeType.TOGGLE, label: 'Переключатель', icon: ToggleLeft, color: 'text-teal-400' },
            { type: NodeType.IF_ELSE, label: 'Если / Иначе', icon: Split, color: 'text-pink-400' },
            { type: NodeType.EQUAL, label: 'Равно (==)', icon: Equal, color: 'text-pink-600' },
            { type: NodeType.GREATER, label: 'Больше (>)', icon: ArrowLeft, color: 'text-pink-600' },
            { type: NodeType.AND, label: 'И (&&)', icon: Check, color: 'text-teal-600' },
            { type: NodeType.OR, label: 'ИЛИ (||)', icon: Split, color: 'text-teal-600' },
            { type: NodeType.NOT, label: 'НЕ (!)', icon: Ban, color: 'text-teal-600' },
        ]
    },
    {
        name: 'Math',
        items: [
            { type: NodeType.NUMBER, label: 'Число', icon: Hash, color: 'text-yellow-400' },
            { type: NodeType.MATH, label: 'Сложение (+)', icon: Calculator, color: 'text-red-400' },
            { type: NodeType.SUBTRACT, label: 'Вычитание (-)', icon: Minus, color: 'text-red-400' },
            { type: NodeType.MULTIPLY, label: 'Умножение (*)', icon: X, color: 'text-red-400' },
            { type: NodeType.DIVIDE, label: 'Деление (/)', icon: Divide, color: 'text-red-400' },
            { type: NodeType.SIN, label: 'Sin (Синус)', icon: Waves, color: 'text-red-500' },
            { type: NodeType.COS, label: 'Cos (Косинус)', icon: Waves, color: 'text-red-500' },
            { type: NodeType.ROUND, label: 'Округление', icon: Sigma, color: 'text-yellow-500' },
            { type: NodeType.RANDOM, label: 'Случайное', icon: Dices, color: 'text-yellow-500' },
        ]
    },
    {
        name: 'Styling',
        items: [
            { type: NodeType.OUTPUT, label: 'Результат', icon: Box, color: 'text-gray-400' },
            { type: NodeType.STYLE, label: 'Типографика (CSS)', icon: Palette, color: 'text-blue-400' },
            { type: NodeType.GRADIENT, label: 'Градиент', icon: Palette, color: 'text-indigo-400' },
            { type: NodeType.TRANSFORM, label: 'Трансформация', icon: Move, color: 'text-orange-400' },
            { type: NodeType.LAYOUT, label: 'Макет', icon: Maximize, color: 'text-cyan-400' },
            { type: NodeType.MERGE, label: 'Слияние Стилей', icon: Merge, color: 'text-slate-400' },
            { type: NodeType.COLOR, label: 'Цвет', icon: Droplet, color: 'text-purple-400' },
            { type: NodeType.HSL, label: 'HSL Цвет', icon: Droplet, color: 'text-purple-500' },
            { type: NodeType.BORDER, label: 'Граница', icon: BoxSelect, color: 'text-indigo-400' },
            { type: NodeType.SHADOW, label: 'Тень', icon: Layers, color: 'text-gray-400' },
        ]
    },
    {
        name: 'Text & Lists',
        items: [
            { type: NodeType.TEXT, label: 'Текст', icon: Type, color: 'text-green-400' },
            { type: NodeType.FONT, label: 'Шрифт', icon: Type, color: 'text-slate-400' },
            { type: NodeType.CONCAT, label: 'Объединить', icon: Link, color: 'text-orange-400' },
            { type: NodeType.UPPERCASE, label: 'Заглавные', icon: ArrowUpAz, color: 'text-green-500' },
            { type: NodeType.LOWERCASE, label: 'Строчные', icon: ArrowDownZa, color: 'text-green-500' },
            { type: NodeType.CAPITALIZE, label: 'Заглавная (1-я)', icon: CaseSensitive, color: 'text-green-500' },
            { type: NodeType.REPLACE, label: 'Замена', icon: ArrowLeftRight, color: 'text-green-500' },
            { type: NodeType.STRING_LENGTH, label: 'Длина Текста', icon: Ruler, color: 'text-green-500' },
            { type: NodeType.ARRAY, label: 'Массив', icon: List, color: 'text-gray-400' },
            { type: NodeType.ARRAY_GET, label: 'Получить эл.', icon: Braces, color: 'text-gray-400' },
            { type: NodeType.ARRAY_LENGTH, label: 'Длина массива', icon: Ruler, color: 'text-gray-400' },
            { type: NodeType.ARRAY_JOIN, label: 'В строку', icon: ListChecks, color: 'text-gray-400' },
        ]
    }
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

  const filteredCategories = useMemo(() => {
      const lowerSearch = search.toLowerCase();
      if (!lowerSearch) return CATEGORIES;

      return CATEGORIES.map(cat => ({
          name: cat.name,
          items: cat.items.filter(item => item.label.toLowerCase().includes(lowerSearch))
      })).filter(cat => cat.items.length > 0);
  }, [search]);

  if (!isOpen) return null;

  const menuStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 250),
  };

  return (
    <div 
      className="fixed z-[60] w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden text-gray-200 animate-in fade-in zoom-in-95 duration-100"
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

      <div className="flex-1 overflow-y-auto max-h-80 custom-scrollbar p-1">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat, i) => (
             <div key={cat.name} className="mb-1">
                 <div className="text-[10px] uppercase font-bold text-gray-500 px-3 py-1 mt-1 sticky top-0 bg-gray-900/90 backdrop-blur z-10">
                     {cat.name}
                 </div>
                 {cat.items.map((item) => (
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
                    className="w-full flex items-center px-3 py-1.5 text-sm rounded hover:bg-gray-800 transition-colors text-left group relative"
                    >
                    <item.icon className={`w-4 h-4 mr-2 ${item.color}`} />
                    <span className="text-xs text-gray-300 group-hover:text-white">{item.label}</span>
                    
                    {/* Stamp Hint Indicator */}
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" title="ПКМ для штампа" />
                    </button>
                 ))}
             </div>
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
