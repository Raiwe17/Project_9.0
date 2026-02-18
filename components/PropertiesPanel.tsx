
import React, { useState } from 'react';
import { CanvasElement, ElementType, ElementStyle, CustomComponentDefinition, NodeType, SavedNodeGroup } from '../types';
import { X, Trash2, AlignLeft, Move, Scaling, Palette, Type, AlignCenter, AlignRight, Bold, BoxSelect, Maximize, Settings2, Tag, GitFork, Link, Workflow, Pencil, Unlink, RefreshCw, Scroll, Plus, Image as ImageIcon, MonitorPlay, Film } from 'lucide-react';
import { GOOGLE_FONTS } from '../constants';

interface PropertiesPanelProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEditGraph: (elementId: string) => void;
  onEditScript: (scriptId: string) => void; // New prop for editing scripts
  customDefinitions?: CustomComponentDefinition[];
  availableScripts?: SavedNodeGroup[]; 
  onRenameComponent?: (id: string, name: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  onUpdate,
  onClose,
  onDelete,
  onEditGraph,
  onEditScript,
  customDefinitions = [],
  availableScripts = [], 
  onRenameComponent
}) => {
  const [isAddingScript, setIsAddingScript] = useState(false);

  const handleChange = (field: keyof CanvasElement, value: any) => {
    onUpdate(element.id, { [field]: value });
  };

  const handleVideoOptionChange = (key: keyof NonNullable<CanvasElement['videoOptions']>, value: boolean) => {
      const current = element.videoOptions || {};
      onUpdate(element.id, {
          videoOptions: { ...current, [key]: value }
      });
  };

  const handleStyleChange = (field: keyof ElementStyle, value: string | number | boolean) => {
    onUpdate(element.id, {
      style: {
        ...element.style,
        [field]: value
      }
    });
  };

  const handleAddScript = (scriptId: string) => {
      const currentScripts = element.scripts || [];
      if (!currentScripts.includes(scriptId)) {
          onUpdate(element.id, { scripts: [...currentScripts, scriptId] });
      }
      setIsAddingScript(false);
  };

  const handleRemoveScript = (scriptId: string) => {
      const currentScripts = element.scripts || [];
      onUpdate(element.id, { scripts: currentScripts.filter(id => id !== scriptId) });
  };

  // Override Handler for Custom Component Properties
  const handlePropOverride = (nodeId: string, value: any) => {
      // If the component is detached (Local), update the graph Node directly.
      if (element.isDetached && element.customNodeGroup) {
          const nodes = element.customNodeGroup.nodes || [];
          const updatedNodes = nodes.map(n => 
              n.id === nodeId 
              ? { ...n, data: { ...n.data, value: value } } 
              : n
          );
          
          const updatedGroup = {
              ...element.customNodeGroup,
              nodes: updatedNodes
          };

          const currentOverrides = { ...(element.propOverrides || {}) };
          delete currentOverrides[nodeId];

          onUpdate(element.id, {
              customNodeGroup: updatedGroup,
              propOverrides: currentOverrides
          });
      } else {
          // Standard behavior for Library components: Use Overrides
          const currentOverrides = element.propOverrides || {};
          onUpdate(element.id, {
              propOverrides: {
                  ...currentOverrides,
                  [nodeId]: value
              }
          });
      }
  };

  const handleDetachToggle = () => {
    const isCurrentlyDetached = element.isDetached === true;

    if (!isCurrentlyDetached) {
        const def = customDefinitions.find(d => d.id === element.customComponentId);
        if (def) {
            const clonedDef = JSON.parse(JSON.stringify(def));
            clonedDef.id = element.id + '_local';
            clonedDef.name = `Local Copy of ${def.name}`;

            const currentOverrides = element.propOverrides || {};
            
            if (clonedDef.nodes && Object.keys(currentOverrides).length > 0) {
                clonedDef.nodes = clonedDef.nodes.map((node: any) => {
                    if (currentOverrides[node.id] !== undefined) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                value: currentOverrides[node.id]
                            }
                        };
                    }
                    return node;
                });
            }

            onUpdate(element.id, {
                isDetached: true,
                customNodeGroup: clonedDef,
                propOverrides: {}
            });
        }
    } else {
        const masterDef = customDefinitions.find(d => d.id === element.customComponentId);
        const localDef = element.customNodeGroup;
        const newOverrides: Record<string, any> = {};

        if (masterDef && localDef) {
            const masterNodes = masterDef.nodes || [];
            const localNodes = localDef.nodes || [];

            masterNodes.forEach(mNode => {
                const lNode = localNodes.find(n => n.id === mNode.id);
                if (lNode && lNode.data) {
                    const localValue = lNode.data.value;
                    const masterValue = mNode.data?.value;
                    
                    if (localValue !== undefined && localValue !== masterValue) {
                        newOverrides[mNode.id] = localValue;
                    }
                }
            });
        }

        onUpdate(element.id, {
            isDetached: false,
            customNodeGroup: null, 
            propOverrides: newOverrides   
        });
    }
  };

  const showContent = [
    ElementType.BUTTON, 
    ElementType.HEADING, 
    ElementType.PARAGRAPH, 
    ElementType.INPUT, 
    ElementType.BADGE,
    ElementType.CUSTOM
  ].includes(element.type);

  const showTypography = [
    ElementType.BUTTON, 
    ElementType.HEADING, 
    ElementType.PARAGRAPH, 
    ElementType.INPUT, 
    ElementType.BADGE,
    ElementType.CUSTOM
  ].includes(element.type);

  const isMedia = [ElementType.IMAGE_PLACEHOLDER, ElementType.VIDEO_PLACEHOLDER, ElementType.AVATAR].includes(element.type);
  const showAppearance = true;

  // Custom Component Properties Logic
  const exposedProperties = React.useMemo(() => {
      if (element.type !== ElementType.CUSTOM) return [];
      
      let def: CustomComponentDefinition | undefined | null;
      if (element.isDetached && element.customNodeGroup) {
          def = element.customNodeGroup;
      } else if (element.customComponentId) {
          def = customDefinitions.find(d => d.id === element.customComponentId);
      }

      if (!def) return [];
      
      return (def.nodes || []).filter(n => n.data.exposed).map(node => ({
          id: node.id,
          type: node.type,
          label: node.data.exposedLabel || node.data.label,
          defaultValue: node.data.value,
          currentValue: element.isDetached 
              ? node.data.value 
              : (element.propOverrides?.[node.id] ?? node.data.value)
      }));
  }, [element, customDefinitions]);

  return (
    <div 
      className="fixed right-0 top-0 bottom-8 w-72 bg-gray-900 border-l border-gray-800 shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="font-semibold text-gray-200">Свойства</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Name / ID Section */}
        <div className="space-y-2">
           <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
              <Tag size={12} className="mr-1" />
              Имя Элемента
           </div>
           <input
                type="text"
                value={element.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Без имени (ID)"
                className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
           />
        </div>

        {/* MEDIA SETTINGS (Images/Video) */}
        {isMedia && (
            <div className="space-y-3 bg-gray-800/30 p-3 rounded border border-gray-700">
                <div className="flex items-center text-xs text-blue-400 uppercase tracking-wider font-semibold">
                    {element.type === ElementType.VIDEO_PLACEHOLDER ? <Film size={12} className="mr-1" /> : <ImageIcon size={12} className="mr-1" />}
                    Медиа
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-medium">Ссылка (URL)</label>
                    <input
                        type="text"
                        value={element.src || ''}
                        onChange={(e) => handleChange('src', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-gray-900 text-xs text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                    <div className="text-[9px] text-gray-500">
                        {element.type === ElementType.VIDEO_PLACEHOLDER ? 'MP4, WebM или ссылка YouTube' : 'Прямая ссылка на изображение'}
                    </div>
                </div>

                {element.type !== ElementType.VIDEO_PLACEHOLDER && (
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-medium">Alt Текст</label>
                        <input
                            type="text"
                            value={element.alt || ''}
                            onChange={(e) => handleChange('alt', e.target.value)}
                            className="w-full bg-gray-900 text-xs text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-medium">Заполнение (Object Fit)</label>
                    <select
                        value={element.style?.objectFit || 'cover'}
                        onChange={(e) => handleStyleChange('objectFit', e.target.value)}
                        className="w-full bg-gray-900 text-xs text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="cover">Cover (Обрезать)</option>
                        <option value="contain">Contain (Вписать)</option>
                        <option value="fill">Fill (Растянуть)</option>
                    </select>
                </div>
                
                {/* Video Options */}
                {element.type === ElementType.VIDEO_PLACEHOLDER && (
                    <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-2">
                         <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={element.videoOptions?.controls ?? true} onChange={(e) => handleVideoOptionChange('controls', e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-blue-500"/>
                            <span className="text-[10px] text-gray-300">Контролы</span>
                        </label>
                         <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={element.videoOptions?.autoplay || false} onChange={(e) => handleVideoOptionChange('autoplay', e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-blue-500"/>
                            <span className="text-[10px] text-gray-300">Автоплей</span>
                        </label>
                         <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={element.videoOptions?.loop || false} onChange={(e) => handleVideoOptionChange('loop', e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-blue-500"/>
                            <span className="text-[10px] text-gray-300">Повтор</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={element.videoOptions?.muted || false} onChange={(e) => handleVideoOptionChange('muted', e.target.checked)} className="rounded bg-gray-700 border-gray-600 text-blue-500"/>
                            <span className="text-[10px] text-gray-300">Звук выкл</span>
                        </label>
                    </div>
                )}
            </div>
        )}

        {/* SCRIPTS (COMPONENTS) SECTION */}
        <div className="space-y-3 bg-gray-800/30 p-3 rounded border border-gray-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-blue-400 uppercase tracking-wider font-semibold">
                    <Scroll size={12} className="mr-1" />
                    Скрипты
                </div>
                {!isAddingScript && (
                    <button 
                        onClick={() => setIsAddingScript(true)}
                        className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded flex items-center transition-colors"
                    >
                        <Plus size={10} className="mr-1" /> Добавить
                    </button>
                )}
            </div>

            {/* Attached Scripts List */}
            <div className="space-y-2">
                {(element.scripts || []).map(scriptId => {
                    const scriptDef = availableScripts.find(d => d.id === scriptId); 
                    return (
                        <div key={scriptId} className="bg-gray-800 border border-gray-600 rounded p-2 flex flex-col space-y-2 group">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-200 truncate flex-1">
                                    {scriptDef?.name || 'Неизвестный скрипт'}
                                </span>
                                <button 
                                    onClick={() => handleRemoveScript(scriptId)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Открепить"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="flex space-x-1">
                                <button 
                                    onClick={() => onEditScript(scriptId)} 
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-[10px] text-gray-300 py-1 rounded transition-colors flex items-center justify-center"
                                >
                                    <Settings2 size={10} className="mr-1" />
                                    Редактировать
                                </button>
                            </div>
                        </div>
                    );
                })}
                
                {(!element.scripts || element.scripts.length === 0) && !isAddingScript && (
                    <div className="text-[10px] text-gray-500 text-center py-2 italic">
                        Нет прикрепленных скриптов
                    </div>
                )}
            </div>

            {/* Add Script Dropdown */}
            {isAddingScript && (
                <div className="mt-2 animate-in fade-in zoom-in-95">
                    <select 
                        className="w-full bg-gray-900 border border-blue-500 text-xs text-white p-2 rounded mb-2 focus:outline-none"
                        onChange={(e) => handleAddScript(e.target.value)}
                        autoFocus
                        defaultValue=""
                    >
                        <option value="" disabled>Выберите скрипт...</option>
                        {availableScripts.map(def => ( 
                            <option 
                                key={def.id} 
                                value={def.id}
                                disabled={(element.scripts || []).includes(def.id)}
                            >
                                {def.name}
                            </option>
                        ))}
                    </select>
                    <button 
                        onClick={() => setIsAddingScript(false)}
                        className="w-full text-[10px] text-gray-400 hover:text-white"
                    >
                        Отмена
                    </button>
                </div>
            )}
        </div>

        {/* CUSTOM PROPERTIES SECTION (For Type=CUSTOM elements) */}
        {element.type === ElementType.CUSTOM && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-3 space-y-3">
                 <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center text-xs font-semibold text-indigo-300">
                        <Workflow size={12} className="mr-1" />
                        Custom Logic
                     </div>
                     <span className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center ${element.isDetached ? 'border-orange-500 text-orange-300 bg-orange-900/20' : 'border-blue-500 text-blue-300 bg-blue-900/20'}`}>
                         {element.isDetached ? <Unlink size={10} className="mr-1"/> : <Link size={10} className="mr-1"/>}
                         {element.isDetached ? 'Локальная' : 'Связана'}
                     </span>
                 </div>

                 {/* Master Component Renaming */}
                 {element.customComponentId && !element.isDetached && onRenameComponent && (
                     <div className="space-y-1">
                         <label className="text-[10px] text-indigo-300">Имя в библиотеке</label>
                         <div className="flex items-center bg-gray-900 border border-indigo-500/30 rounded p-1">
                             <input 
                                type="text"
                                value={customDefinitions.find(d => d.id === element.customComponentId)?.name || ''}
                                onChange={(e) => onRenameComponent(element.customComponentId!, e.target.value)}
                                className="w-full bg-transparent text-xs text-white focus:outline-none"
                                placeholder="Имя компонента..."
                             />
                             <Pencil size={10} className="text-indigo-500 ml-1 opacity-50" />
                         </div>
                     </div>
                 )}

                 {/* Detach / Sync Toggle */}
                 <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-700">
                      <div className="flex flex-col">
                        <label className="text-[11px] text-gray-300 font-medium">Автообновление</label>
                        <span className="text-[9px] text-gray-500">{element.isDetached ? 'Отключено' : 'Включено'}</span>
                      </div>
                      
                      <button 
                         onClick={handleDetachToggle}
                         title={element.isDetached ? "Включить автообновление (Применить локальные свойства к мастеру)" : "Отключить автообновление (Создать локальную копию)"}
                         className={`w-10 h-5 rounded-full relative transition-colors border border-transparent focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-900 focus:ring-indigo-500 ${!element.isDetached ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm flex items-center justify-center ${!element.isDetached ? 'left-5.5 translate-x-0' : 'left-0.5 translate-x-0'}`}>
                                {element.isDetached ? <Unlink size={8} className="text-gray-600"/> : <RefreshCw size={8} className="text-blue-600"/>}
                          </div>
                      </button>
                 </div>

                 <button 
                    onClick={() => onEditGraph(element.id)}
                    className="w-full flex items-center justify-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors border border-indigo-400/20"
                 >
                     <Settings2 size={12} className="mr-2" />
                     {element.isDetached ? 'Редактировать локальный граф' : 'Редактировать мастер-граф'}
                 </button>
            </div>
        )}

        {/* CUSTOM EXPOSED PROPERTIES */}
        {exposedProperties.length > 0 && (
            <div className="space-y-3 bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="flex items-center text-xs text-blue-400 uppercase tracking-wider font-semibold">
                  <Settings2 size={12} className="mr-1" />
                  Параметры
                </div>
                {exposedProperties.map(prop => (
                    <div key={prop.id} className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-medium">{prop.label}</label>
                        
                        {prop.type === NodeType.TEXT && (
                             <textarea
                                value={prop.currentValue}
                                onChange={(e) => handlePropOverride(prop.id, e.target.value)}
                                className="w-full bg-gray-900 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none min-h-[60px] resize-y"
                             />
                        )}

                        {prop.type === NodeType.COLOR && (
                             <div className="flex items-center bg-gray-900 border border-gray-700 rounded p-1">
                                <input
                                type="color"
                                value={prop.currentValue}
                                onChange={(e) => handlePropOverride(prop.id, e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent mr-2"
                                />
                                <span className="text-xs text-gray-300 font-mono uppercase truncate">{prop.currentValue}</span>
                            </div>
                        )}

                        {prop.type === NodeType.NUMBER && (
                             <input
                                type="number"
                                value={prop.currentValue}
                                onChange={(e) => handlePropOverride(prop.id, Number(e.target.value))}
                                className="w-full bg-gray-900 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                                placeholder={String(prop.defaultValue)}
                             />
                        )}

                        {prop.type === NodeType.TOGGLE && (
                            <div className="flex items-center">
                                <input
                                type="checkbox"
                                checked={!!prop.currentValue}
                                onChange={(e) => handlePropOverride(prop.id, e.target.checked)}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-offset-gray-900"
                                />
                                <span className="text-xs text-gray-400 ml-2">{prop.currentValue ? 'Включено' : 'Выключено'}</span>
                            </div>
                        )}

                    </div>
                ))}
            </div>
        )}


        {/* Content Section */}
        {showContent && element.type !== ElementType.CUSTOM && (
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
              <AlignLeft size={12} className="mr-1" />
              Содержимое
            </div>
            {element.type === ElementType.PARAGRAPH ? (
              <textarea
                value={element.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none min-h-[80px] resize-y"
              />
            ) : (
              <input
                type="text"
                value={element.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>
        )}

        {/* Typography Section */}
        {showTypography && (
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  <Type size={12} className="mr-1" />
                  Типографика
                </div>
                {/* Auto Size Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoFontSize"
                    checked={element.style?.autoFontSize || false}
                    onChange={(e) => handleStyleChange('autoFontSize', e.target.checked)}
                    className="w-3 h-3 mr-1 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-offset-gray-900"
                  />
                  <label htmlFor="autoFontSize" className="text-[10px] text-gray-400 cursor-pointer select-none">Авторазмер</label>
                </div>
             </div>

             {/* Fonts Dropdown */}
             <div className="space-y-1">
                 <label className="text-[10px] text-gray-500 mb-1 block">Шрифт</label>
                 <select
                     value={element.style?.fontFamily || 'sans-serif'}
                     onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                     className="w-full bg-gray-800 text-xs text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                 >
                     <option value="sans-serif">System Sans</option>
                     <option value="serif">System Serif</option>
                     <option value="monospace">System Mono</option>
                     <optgroup label="Google Fonts">
                        {GOOGLE_FONTS.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                     </optgroup>
                 </select>
             </div>
            
            <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Размер (px)</label>
                  <input
                    type="number"
                    value={element.style?.autoFontSize ? Math.round(element.height * 0.5) : (element.style?.fontSize || 14)}
                    disabled={element.style?.autoFontSize}
                    onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                    className={`w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none ${element.style?.autoFontSize ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
               </div>
               <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Цвет текста</label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded p-1">
                    <input
                      type="color"
                      value={element.style?.color || '#000000'}
                      onChange={(e) => handleStyleChange('color', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent mr-2"
                    />
                    <span className="text-xs text-gray-300 font-mono uppercase truncate">{element.style?.color}</span>
                  </div>
               </div>
            </div>

             {/* Text Shadow & Highlight */}
             <div className="space-y-1">
                 <label className="text-[10px] text-gray-500 mb-1 block">Тень / Выделение</label>
                 <input
                     type="text"
                     value={element.style?.textShadow || ''}
                     onChange={(e) => handleStyleChange('textShadow', e.target.value)}
                     placeholder="2px 2px 4px rgba(0,0,0,0.5)"
                     className="w-full bg-gray-800 text-xs text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                 />
            </div>

            <div className="flex items-center gap-2">
                 {/* Alignment */}
                 <div className="flex flex-1 bg-gray-800 rounded border border-gray-700 p-0.5">
                    {[
                      { id: 'left', icon: AlignLeft },
                      { id: 'center', icon: AlignCenter },
                      { id: 'right', icon: AlignRight }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleStyleChange('textAlign', item.id)}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded transition-colors ${
                          (element.style?.textAlign || 'left') === item.id 
                            ? 'bg-gray-700 text-blue-400' 
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                        }`}
                      >
                        <item.icon size={14} />
                      </button>
                    ))}
                 </div>
                 
                 {/* Bold Toggle */}
                 <button
                    onClick={() => handleStyleChange('fontWeight', element.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`w-9 h-full flex items-center justify-center rounded border border-gray-700 transition-colors ${
                        element.style?.fontWeight === 'bold' 
                        ? 'bg-gray-700 text-blue-400' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700/50'
                    }`}
                 >
                    <Bold size={14} />
                 </button>
            </div>
          </div>
        )}

        {/* Appearance Section */}
        {showAppearance && (
          <div className="space-y-3">
             <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
              <Palette size={12} className="mr-1" />
              Внешний вид
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Фон</label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded p-1">
                    <input
                      type="color"
                      value={element.style?.backgroundColor || '#ffffff'}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent mr-2"
                    />
                    <span className="text-xs text-gray-300 font-mono uppercase truncate">{element.style?.backgroundColor}</span>
                  </div>
               </div>
               <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Скругление (px)</label>
                  <input
                    type="number"
                    value={element.style?.borderRadius || 0}
                    onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value))}
                    className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
               </div>
            </div>

            <div>
               <label className="text-[10px] text-gray-500 mb-1 flex justify-between">
                  <span>Прозрачность</span>
                  <span>{Math.round((element.style?.opacity ?? 1) * 100)}%</span>
               </label>
               <input 
                 type="range" 
                 min="0" 
                 max="1" 
                 step="0.05"
                 value={element.style?.opacity ?? 1}
                 onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
                 className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
               />
            </div>
          </div>
        )}

        {/* Borders Section */}
        <div className="space-y-3">
             <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
              <BoxSelect size={12} className="mr-1" />
              Граница
            </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Толщина (px)</label>
                  <input
                    type="number"
                    min="0"
                    value={element.style?.borderWidth || 0}
                    onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value))}
                    className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
               </div>
               <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Цвет</label>
                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded p-1">
                    <input
                      type="color"
                      value={element.style?.borderColor || '#000000'}
                      onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent mr-2"
                    />
                    <span className="text-xs text-gray-300 font-mono uppercase truncate">{element.style?.borderColor || '#000'}</span>
                  </div>
               </div>
            </div>
        </div>

        <hr className="border-gray-800" />

        {/* Position & Size Section */}
        <div className="space-y-4">
           <div className="space-y-2">
             <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
                <Move size={12} className="mr-1" />
                Позиция
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">X</label>
                  <input
                    type="number"
                    value={Math.round(element.x)}
                    onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Y</label>
                  <input
                    type="number"
                    value={Math.round(element.y)}
                    onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
          </div>

          <div className="space-y-2">
             <div className="flex items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
                <Scaling size={12} className="mr-1" />
                Размер и Отступы
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Ширина</label>
                  <input
                    type="number"
                    value={Math.round(element.width)}
                    onChange={(e) => handleChange('width', Math.max(10, parseInt(e.target.value) || 0))}
                    className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Высота</label>
                  <input
                    type="number"
                    value={Math.round(element.height)}
                    onChange={(e) => handleChange('height', Math.max(10, parseInt(e.target.value) || 0))}
                    className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                 <div className="col-span-2">
                  <label className="text-[10px] text-gray-500 mb-1 flex items-center">
                      <Maximize size={10} className="mr-1" />
                      Внутренний отступ (padding)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={element.style?.padding || 0}
                    onChange={(e) => handleStyleChange('padding', parseInt(e.target.value))}
                    className="w-full bg-gray-800 text-sm text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <button 
          onClick={() => onDelete(element.id)}
          className="w-full flex items-center justify-center p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors text-sm"
        >
          <Trash2 size={14} className="mr-2" />
          Удалить элемент
        </button>
      </div>
    </div>
  );
};
