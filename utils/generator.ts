import { CanvasElement, ElementType, CustomComponentDefinition } from '../types';
import { evaluateNodeGraph } from './evaluate';

export const generateHTML = (elements: CanvasElement[], width: number, height: number, customComponents: CustomComponentDefinition[] = []): string => {
  const rootElements = elements.filter(el => !el.parentId);

  // Helper to map element types to Tailwind classes
  const getTailwindClasses = (type: ElementType, style: any): string => {
    switch (type) {
      case ElementType.BUTTON:
      case ElementType.BADGE:
        let justifyClass = 'justify-center';
        if (style.textAlign === 'left') justifyClass = 'justify-start px-4';
        if (style.textAlign === 'right') justifyClass = 'justify-end px-4';
        return `w-full h-full flex items-center ${justifyClass} transition-opacity hover:opacity-90 overflow-hidden`;
        
      case ElementType.HEADING:
        return "w-full h-full overflow-hidden leading-tight flex flex-col justify-center";
      case ElementType.PARAGRAPH:
        return "w-full h-full overflow-hidden leading-relaxed";
      case ElementType.CARD:
        return "w-full h-full bg-white";
      case ElementType.INPUT:
        return "w-full h-full px-3 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent";
      case ElementType.IMAGE_PLACEHOLDER:
        return "w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50";
      case ElementType.VIDEO_PLACEHOLDER:
        return "w-full h-full flex flex-col items-center justify-center text-gray-400 relative overflow-hidden";
      case ElementType.AVATAR:
        return "w-full h-full flex items-center justify-center overflow-hidden";
      case ElementType.DIVIDER:
        return "w-full h-full flex items-center";
      case ElementType.CONTAINER:
      case ElementType.CUSTOM:
        return "w-full h-full"; 
      default:
        return "w-full h-full";
    }
  };

  // Helper to convert internal style object to CSS string
  const getElementCSS = (style: any, width: number, height: number, content: string): string => {
    let css = '';
    
    if (style.backgroundColor) css += `background-color: ${style.backgroundColor}; `;
    if (style.backgroundImage) css += `background-image: ${style.backgroundImage}; `;
    if (style.color) css += `color: ${style.color}; `;
    if (style.borderRadius) css += `border-radius: ${style.borderRadius}px; `;
    if (style.fontWeight) css += `font-weight: ${style.fontWeight}; `;
    if (style.fontFamily) css += `font-family: ${style.fontFamily}; `;
    if (style.opacity !== undefined) css += `opacity: ${style.opacity}; `;
    if (style.padding) css += `padding: ${style.padding}px; `;
    if (style.display) css += `display: ${style.display}; `;
    if (style.alignItems) css += `align-items: ${style.alignItems}; `;
    if (style.justifyContent) css += `justify-content: ${style.justifyContent}; `;
    if (style.boxShadow) css += `box-shadow: ${style.boxShadow}; `;
    if (style.transform) css += `transform: ${style.transform}; `;
    
    if (style.borderWidth) {
        css += `border-width: ${style.borderWidth}px; `;
        css += `border-style: solid; `;
        if (style.borderColor) css += `border-color: ${style.borderColor}; `;
    }
    
    // Auto Font Size Logic (Mirrored from RenderedElement)
    let fontSize = style.fontSize;
    if (style.autoFontSize) {
        const heightConstraint = Math.round(height * 0.6);
        const charCount = Math.max(1, content?.length || 1);
        const widthConstraint = Math.round((width / charCount) * 1.8);
        fontSize = Math.max(10, Math.min(heightConstraint, widthConstraint));
        
        css += `line-height: 1; `;
        css += `white-space: nowrap; `;
        css += `text-overflow: ellipsis; `;
    }
    if (fontSize) {
        css += `font-size: ${fontSize}px; `;
    }
    
    if (style.textAlign) css += `text-align: ${style.textAlign}; `;
    
    return css;
  };

  // Recursive render function
  const renderElement = (el: CanvasElement, parentWidth: number): string => {
    const children = elements.filter(child => child.parentId === el.id);
    const innerHTML = children.map(child => renderElement(child, el.width)).join('');
    
    const leftPercent = (el.x / parentWidth) * 100;
    const widthPercent = (el.width / parentWidth) * 100;
    
    const wrapperStyle = `
        position: absolute; 
        left: ${leftPercent.toFixed(4)}%; 
        top: ${el.y}px; 
        width: ${widthPercent.toFixed(4)}%; 
        height: ${el.height}px;
    `;
    
    let computedData = { style: {}, content: '' };
    
    // Evaluate Custom Component using Shared Logic
    if (el.type === ElementType.CUSTOM) {
        let def: CustomComponentDefinition | undefined;

        if (el.isDetached && el.customNodeGroup) {
            def = el.customNodeGroup;
        } else if (el.customComponentId) {
            def = customComponents.find(c => c.id === el.customComponentId);
        }

        if (def) {
            computedData = evaluateNodeGraph(def, el.propOverrides);
        }
    }

    // Merge Styles: Graph/Computed overrides Instance defaults
    const effectiveStyle = { 
        ...el.style, 
        ...computedData.style 
    };
    
    // Content: Computed overrides Instance if present, else Instance content
    const finalContent = computedData.content || el.content || '';

    const contentStyleCSS = getElementCSS(effectiveStyle, el.width, el.height, finalContent);
    const tailwindClass = getTailwindClasses(el.type, effectiveStyle);

    // Special handling for INPUT
    if (el.type === ElementType.INPUT) {
        return `
        <div id="${el.id}" style="${wrapperStyle}">
             <input type="text" value="${finalContent}" class="${tailwindClass}" style="${contentStyleCSS}" readonly />
             ${innerHTML}
        </div>`;
    }

    let tag = 'div';
    let innerContentHTML = '';

    const textWrapper = (text: string) => {
        if (effectiveStyle.autoFontSize) {
            return `<span class="truncate max-w-full block">${text}</span>`;
        }
        return text;
    };

    if (el.type === ElementType.BUTTON || el.type === ElementType.BADGE) {
        tag = el.type === ElementType.BUTTON ? 'button' : 'div';
        innerContentHTML = textWrapper(finalContent);
    } else if (el.type === ElementType.IMAGE_PLACEHOLDER) {
        innerContentHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span class="text-xs">Image</span>
        `;
    } else if (el.type === ElementType.VIDEO_PLACEHOLDER) {
         innerContentHTML = `
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm mb-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <span class="text-xs text-white/50">Video Player</span>
         `;
    } else if (el.type === ElementType.AVATAR) {
         innerContentHTML = `
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-1/2 h-1/2 opacity-50"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
         `;
    } else if (el.type === ElementType.DIVIDER) {
        innerContentHTML = `<div style="width:100%; height:1px; background-color:${effectiveStyle.backgroundColor || '#d1d5db'};"></div>`;
    } else {
        // Heading, Paragraph, Custom
        innerContentHTML = textWrapper(finalContent);
    }

    return `
      <div id="${el.id}-wrapper" style="${wrapperStyle}">
        <${tag} class="${tailwindClass}" style="${contentStyleCSS}">
           ${innerContentHTML}
           ${innerHTML}
        </${tag}>
      </div>
    `;
  };

  const bodyContent = rootElements.map(el => renderElement(el, width)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { 
            margin: 0; 
            padding: 0;
            overflow-x: hidden;
            background-color: #ffffff;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        #canvas-root {
            position: relative;
            width: 100%;
            min-height: 100vh;
            overflow-x: hidden;
        }
    </style>
</head>
<body>
    <div id="canvas-root">
        ${bodyContent}
    </div>
</body>
</html>`;
};