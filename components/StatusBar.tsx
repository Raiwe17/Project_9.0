import React from 'react';
import { AppMode, ElementType } from '../types';
import { TOOLS } from '../constants';
import { MousePointer2, Stamp, X, Command } from 'lucide-react';

interface StatusBarProps {
  mode: AppMode;
  stampType: ElementType | null;
  elementCount: number;
  onExitStampMode: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  mode, 
  stampType, 
  elementCount,
  onExitStampMode 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-gray-900/90 backdrop-blur text-gray-400 text-xs flex items-center px-4 justify-between border-t border-gray-800 z-40 select-none">
      <div className="flex items-center space-x-6">
        {/* Mode Indicator */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-500 uppercase tracking-wider">Режим:</span>
          {mode === 'STAMP' ? (
            <div className="flex items-center text-orange-400 space-x-1 animate-pulse">
              <Stamp className="w-3 h-3" />
              <span className="font-bold">ШТАМП ({stampType && TOOLS[stampType].label})</span>
            </div>
          ) : (
            <div className="flex items-center text-blue-400 space-x-1">
              <MousePointer2 className="w-3 h-3" />
              <span className="font-bold">ВЫБОР</span>
            </div>
          )}
        </div>

        {/* Hints */}
        <div className="flex items-center space-x-3 border-l border-gray-700 pl-4 hidden md:flex">
          {mode === 'STAMP' ? (
            <>
              <span className="flex items-center"><span className="bg-gray-700 text-gray-200 px-1 rounded mx-1">ЛКМ</span> Разместить</span>
              <span className="flex items-center"><span className="bg-gray-700 text-gray-200 px-1 rounded mx-1">Esc</span> Отмена</span>
            </>
          ) : (
             <>
              <span className="flex items-center mr-2"><span className="bg-gray-700 text-gray-200 px-1 rounded mx-1">ПКМ</span> Меню</span>
              <div className="h-3 w-px bg-gray-700 mx-2"></div>
              <span className="flex items-center" title="Delete"><span className="bg-gray-700 text-gray-200 px-1 rounded mx-1">Del</span> Удалить</span>
              <span className="flex items-center" title="Ctrl+D"><span className="bg-gray-700 text-gray-200 px-1 rounded mx-1">Ctrl+D</span> Копия</span>
              <span className="flex items-center" title="Arrow Keys"><span className="bg-gray-700 text-gray-200 px-1 rounded mx-1">←↑↓→</span> Двигать</span>
             </>
          )}
        </div>
      </div>

      {/* Stats / Controls */}
      <div className="flex items-center space-x-4">
        <span>Элементов: {elementCount}</span>
        {mode === 'STAMP' && (
           <button 
             onClick={onExitStampMode}
             className="flex items-center space-x-1 hover:text-white hover:bg-red-500/20 px-2 py-0.5 rounded transition-colors"
           >
             <X className="w-3 h-3" />
             <span>Выйти</span>
           </button>
        )}
      </div>
    </div>
  );
};