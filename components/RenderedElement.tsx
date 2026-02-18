
import React, { useMemo } from 'react';
import { ElementType, CanvasElement, ResizeHandle, CustomComponentDefinition, SavedNodeGroup } from '../types';
import { TOOLS } from '../constants';
import { Play, Box, Unlink } from 'lucide-react';
import { evaluateNodeGraph, RuntimeContext } from '../utils/evaluate';

interface RenderedElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onResizeStart: (id: string, handle: ResizeHandle, e: React.MouseEvent) => void;
  children?: React.ReactNode; 
  customDefinitions?: CustomComponentDefinition[]; 
  scripts?: SavedNodeGroup[]; 
}

export const RenderedElement: React.FC<RenderedElementProps> = ({ 
  element, 
  isSelected, 
  onSelect,
  onResizeStart,
  children,
  customDefinitions = [],
  scripts = []
}) => {
  const tool = TOOLS[element.type] || { icon: Box };
  const commonClasses = "absolute transition-none select-none";
  
  const selectionClass = isSelected 
    ? "ring-2 ring-blue-500 z-30" 
    : "hover:ring-1 hover:ring-blue-300 z-10";

  // --- STATIC EDITOR STATE ---
  // In the editor, we force a static state (time=0, no hover/click) 
  // so scripts don't interfere with editing.
  
  // 1. Evaluate Logic (Static Preview)
  const evaluatedData = useMemo(() => {
      let mergedStyle = {};
      let mergedContent = element.content;

      // Static Context for Editor
      const runtimeContext: RuntimeContext = {
          isHovered: false,
          isClicked: false,
          time: 0
      };

      // A. Evaluate Base Custom Component
      if (element.type === ElementType.CUSTOM) {
          let def: CustomComponentDefinition | undefined | null;
          if (element.isDetached && element.customNodeGroup) {
              def = element.customNodeGroup;
          } else if (element.customComponentId) {
              def = customDefinitions.find(d => d.id === element.customComponentId);
          }

          if (def) {
              const res = evaluateNodeGraph(def, element.propOverrides, runtimeContext);
              mergedStyle = { ...mergedStyle, ...res.style };
              if (res.content !== undefined) mergedContent = res.content;
          }
      }

      // B. Evaluate Attached Scripts (Static)
      if (element.scripts && element.scripts.length > 0) {
          element.scripts.forEach(scriptId => {
              const scriptDef = scripts.find(d => d.id === scriptId);
              if (scriptDef) {
                  const res = evaluateNodeGraph(scriptDef, element.propOverrides, runtimeContext);
                  mergedStyle = { ...mergedStyle, ...res.style };
                  if (res.content) mergedContent = res.content;
              }
          });
      }

      return { style: mergedStyle, content: mergedContent };
  }, [
      element.type, 
      element.customComponentId, 
      element.isDetached, 
      element.customNodeGroup, 
      element.propOverrides, 
      element.scripts,
      customDefinitions,
      scripts
  ]);

  // 2. Merge Styles
  const instanceStyle = element.style || {};
  const computedStyle = evaluatedData.style || {};
  
  const effectiveStyle = {
      ...instanceStyle,
      ...computedStyle, 
  };

  // 3. Auto Font Size Logic
  let fontSizeString = effectiveStyle.fontSize ? `${effectiveStyle.fontSize}px` : undefined;
  
  if (effectiveStyle.autoFontSize) {
    const heightConstraint = Math.round(element.height * 0.6);
    const contentLen = (evaluatedData.content || '').length;
    const charCount = Math.max(1, contentLen || 1);
    const widthConstraint = Math.round((element.width / charCount) * 1.8);
    const calculatedSize = Math.max(10, Math.min(heightConstraint, widthConstraint));
    fontSizeString = `${calculatedSize}px`;
  }

  // 4. Construct Final React CSS Object
  const finalContentStyle: React.CSSProperties = {
    backgroundColor: effectiveStyle.backgroundColor,
    backgroundImage: effectiveStyle.backgroundImage,
    color: effectiveStyle.color,
    borderRadius: effectiveStyle.borderRadius ? `${effectiveStyle.borderRadius}px` : undefined,
    fontSize: fontSizeString,
    lineHeight: effectiveStyle.autoFontSize ? 1 : (effectiveStyle.lineHeight ?? 1.4),
    letterSpacing: effectiveStyle.letterSpacing,
    whiteSpace: effectiveStyle.autoFontSize ? 'nowrap' : undefined,
    textAlign: effectiveStyle.textAlign as any,
    fontWeight: effectiveStyle.fontWeight,
    fontFamily: effectiveStyle.fontFamily,
    borderWidth: effectiveStyle.borderWidth ? `${effectiveStyle.borderWidth}px` : undefined,
    borderBottomWidth: effectiveStyle.borderBottomWidth ? `${effectiveStyle.borderBottomWidth}px` : undefined,
    borderTopWidth: effectiveStyle.borderTopWidth ? `${effectiveStyle.borderTopWidth}px` : undefined,
    borderColor: effectiveStyle.borderColor,
    borderStyle: (effectiveStyle.borderWidth || effectiveStyle.borderBottomWidth || effectiveStyle.borderTopWidth) ? 'solid' : undefined,
    padding: effectiveStyle.padding ? `${effectiveStyle.padding}px` : undefined,
    marginTop: effectiveStyle.marginTop ? `${effectiveStyle.marginTop}px` : undefined,
    marginLeft: effectiveStyle.marginLeft ? `${effectiveStyle.marginLeft}px` : undefined,
    opacity: effectiveStyle.opacity,
    textOverflow: effectiveStyle.autoFontSize ? 'ellipsis' : undefined,
    display: effectiveStyle.display,
    flexDirection: effectiveStyle.flexDirection as any,
    alignItems: effectiveStyle.alignItems,
    justifyContent: effectiveStyle.justifyContent,
    gap: effectiveStyle.gap ? `${effectiveStyle.gap}px` : undefined,
    boxShadow: effectiveStyle.boxShadow,
    transform: effectiveStyle.transform,
    animation: effectiveStyle.animation, // CSS Animation string
    transition: effectiveStyle.transition, // CSS Transition string
  };

  const wrapperStyle: React.CSSProperties = {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  };

  const getFlexJustify = (align?: string) => {
    switch (align) {
      case 'left': return 'justify-start px-4';
      case 'right': return 'justify-end px-4';
      default: return 'justify-center';
    }
  };

  const renderTextContent = (text?: string) => {
     const t = text || element.content;
     if (effectiveStyle.autoFontSize) {
         return <span className="truncate max-w-full block">{t}</span>;
     }
     return t;
  };

  const contentToRender = evaluatedData.content !== undefined ? evaluatedData.content : element.content;

  const renderContent = () => {
    switch (element.type) {
      case ElementType.CUSTOM:
          return (
              <div 
                className="w-full h-full overflow-hidden relative" 
                style={finalContentStyle}
              >
                  {element.isDetached && (
                      <div className="absolute top-1 right-1 z-50 bg-orange-500/90 text-white p-1 rounded-full shadow-sm backdrop-blur-sm pointer-events-none" title="Отключено автообновление">
                          <Unlink size={10} />
                      </div>
                  )}
                  {effectiveStyle.autoFontSize ? (
                       <span className="truncate max-w-full block">{contentToRender}</span>
                  ) : (
                      <>
                        {contentToRender}
                        {children}
                      </>
                  )}
              </div>
          );

      case ElementType.BUTTON:
      case ElementType.BADGE:
        return (
          <div 
            className={`w-full h-full flex items-center ${getFlexJustify(effectiveStyle.textAlign)} overflow-hidden`}
            style={finalContentStyle}
          >
            {renderTextContent(contentToRender)}
            {children}
          </div>
        );
      case ElementType.HEADING:
        return (
          <div
             className="w-full h-full overflow-hidden flex flex-col justify-center"
             style={finalContentStyle}
          >
             {renderTextContent(contentToRender)}
             {children}
          </div>
        );
      case ElementType.PARAGRAPH:
        return (
          <div 
            className="w-full h-full overflow-hidden"
            style={finalContentStyle}
          >
            {renderTextContent(contentToRender)}
            {children}
          </div>
        );
      case ElementType.CARD:
      case ElementType.CONTAINER:
        return (
          <div 
            className={`w-full h-full ${element.type === ElementType.CONTAINER && !effectiveStyle.borderWidth && !effectiveStyle.borderBottomWidth && !effectiveStyle.borderTopWidth ? 'border-2 border-dashed border-gray-300' : ''}`}
            style={finalContentStyle}
          >
             {!children && !effectiveStyle.backgroundColor && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs pointer-events-none">
                   {element.type === ElementType.CONTAINER ? 'Контейнер' : 'Карточка'}
                </div>
             )}
             {children}
          </div>
        );
      case ElementType.INPUT:
        return (
          <div className="w-full h-full relative">
             <input 
              type="text" 
              readOnly 
              placeholder={contentToRender}
              style={{
                ...finalContentStyle,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            />
            {children}
          </div>
        );
      case ElementType.IMAGE_PLACEHOLDER:
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center text-gray-400"
            style={finalContentStyle}
          >
            <tool.icon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">Изображение</span>
            {children}
          </div>
        );
      case ElementType.VIDEO_PLACEHOLDER:
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 relative"
            style={finalContentStyle}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm mb-2">
               <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
            </div>
            <span className="text-xs text-white/50">Видео плеер</span>
            {children}
          </div>
        );
      case ElementType.AVATAR:
        return (
          <div 
            className="w-full h-full flex flex-col items-center justify-center overflow-hidden"
            style={finalContentStyle}
          >
             <tool.icon className="w-1/2 h-1/2 opacity-50" />
            {children}
          </div>
        );
      case ElementType.DIVIDER:
        return (
          <div className="w-full h-full flex items-center" style={{ opacity: effectiveStyle.opacity }}>
            <div 
              className="w-full" 
              style={{ height: '1px', backgroundColor: effectiveStyle.backgroundColor || '#d1d5db' }}
            ></div>
            {children}
          </div>
        );
      default:
        return <div>{children}</div>;
    }
  };

  const renderHandles = () => {
    if (!isSelected) return null;
    const handleClass = "absolute w-2.5 h-2.5 bg-white border border-blue-500 rounded-full z-40";
    return (
      <>
        <div className={`${handleClass} -top-1.5 -left-1.5 cursor-nw-resize`} onMouseDown={(e) => onResizeStart(element.id, 'nw', e)} />
        <div className={`${handleClass} -top-1.5 -right-1.5 cursor-ne-resize`} onMouseDown={(e) => onResizeStart(element.id, 'ne', e)} />
        <div className={`${handleClass} -bottom-1.5 -left-1.5 cursor-sw-resize`} onMouseDown={(e) => onResizeStart(element.id, 'sw', e)} />
        <div className={`${handleClass} -bottom-1.5 -right-1.5 cursor-se-resize`} onMouseDown={(e) => onResizeStart(element.id, 'se', e)} />
        <div className={`${handleClass} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`} onMouseDown={(e) => onResizeStart(element.id, 'n', e)} />
        <div className={`${handleClass} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize`} onMouseDown={(e) => onResizeStart(element.id, 's', e)} />
        <div className={`${handleClass} top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize`} onMouseDown={(e) => onResizeStart(element.id, 'w', e)} />
        <div className={`${handleClass} top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize`} onMouseDown={(e) => onResizeStart(element.id, 'e', e)} />
      </>
    );
  };

  return (
    <div 
      className={`${commonClasses} ${selectionClass}`} 
      style={wrapperStyle}
      onMouseDown={(e) => onSelect(element.id, e)}
    >
      {renderContent()}
      {renderHandles()}
    </div>
  );
};
