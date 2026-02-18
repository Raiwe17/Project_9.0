
import { CanvasElement, ElementType, CustomComponentDefinition, SavedNodeGroup, Page } from '../types';
import { evaluateNodeGraph } from './evaluate';
import { GOOGLE_FONTS } from '../constants';

const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const generateHTML = (
    elements: CanvasElement[], 
    pages: Page[],
    width: number, 
    height: number, 
    customComponents: CustomComponentDefinition[] = [],
    scripts: SavedNodeGroup[] = []
): string => {
  
  // Helper: Convert Pixel value to Viewport Width (vw) based on Canvas Width
  const pxToVw = (px: number) => `${(px / width) * 100}vw`;

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
      case ElementType.VIDEO_PLACEHOLDER:
      case ElementType.AVATAR:
        return "w-full h-full overflow-hidden";
      case ElementType.DIVIDER:
        return "w-full h-full flex items-center";
      case ElementType.CONTAINER:
      case ElementType.CUSTOM:
        return "w-full h-full"; 
      default:
        return "w-full h-full";
    }
  };

  // Helper to convert internal style object to CSS string with scaling
  const getElementCSS = (style: any, elemWidth: number, elemHeight: number, content: string): string => {
    let css = '';
    
    if (style.backgroundColor) css += `background-color: ${style.backgroundColor}; `;
    if (style.backgroundImage) css += `background-image: ${style.backgroundImage}; `;
    if (style.color) css += `color: ${style.color}; `;
    if (style.fontWeight) css += `font-weight: ${style.fontWeight}; `;
    if (style.fontFamily) css += `font-family: '${style.fontFamily}', sans-serif; `;
    if (style.opacity !== undefined) css += `opacity: ${style.opacity}; `;
    if (style.display) css += `display: ${style.display}; `;
    if (style.alignItems) css += `align-items: ${style.alignItems}; `;
    if (style.justifyContent) css += `justify-content: ${style.justifyContent}; `;
    if (style.transform) css += `transform: ${style.transform}; `;
    if (style.textAlign) css += `text-align: ${style.textAlign}; `;
    if (style.animation) css += `animation: ${style.animation}; `;
    if (style.transition) css += `transition: ${style.transition}; `;
    
    // New Props
    if (style.flexDirection) css += `flex-direction: ${style.flexDirection}; `;
    if (style.lineHeight) css += `line-height: ${style.lineHeight}; `;
    if (style.letterSpacing) css += `letter-spacing: ${style.letterSpacing}; `;
    if (style.marginTop) css += `margin-top: ${pxToVw(style.marginTop)}; `;
    if (style.marginLeft) css += `margin-left: ${pxToVw(style.marginLeft)}; `;
    if (style.gap) css += `gap: ${pxToVw(style.gap)}; `;
    if (style.textShadow) css += `text-shadow: ${style.textShadow}; `;
    if (style.objectFit) css += `object-fit: ${style.objectFit}; `;

    // Scale these properties to vw
    if (style.borderRadius) css += `border-radius: ${pxToVw(style.borderRadius)}; `;
    if (style.padding) css += `padding: ${pxToVw(style.padding)}; `;
    
    if (style.borderWidth || style.borderBottomWidth || style.borderTopWidth) {
        if (style.borderWidth) css += `border-width: ${pxToVw(style.borderWidth)}; `;
        if (style.borderBottomWidth) css += `border-bottom-width: ${pxToVw(style.borderBottomWidth)}; `;
        if (style.borderTopWidth) css += `border-top-width: ${pxToVw(style.borderTopWidth)}; `;
        css += `border-style: solid; `;
        if (style.borderColor) css += `border-color: ${style.borderColor}; `;
    }

    if (style.boxShadow) {
         // Convert pixel values in shadow string to vw
         const scaledShadow = style.boxShadow.replace(/(-?\d+(\.\d+)?)px/g, (match: string, num: string) => {
             return pxToVw(parseFloat(num));
         });
         css += `box-shadow: ${scaledShadow}; `;
    }
    
    let fontSize = style.fontSize;
    if (style.autoFontSize) {
        const heightConstraint = Math.round(elemHeight * 0.6);
        const charCount = Math.max(1, content?.length || 1);
        const widthConstraint = Math.round((elemWidth / charCount) * 1.8);
        fontSize = Math.max(10, Math.min(heightConstraint, widthConstraint));
        
        css += `line-height: 1; `;
        css += `white-space: nowrap; `;
        css += `text-overflow: ellipsis; `;
    }
    
    if (fontSize) {
        css += `font-size: ${pxToVw(fontSize)}; `;
    }
    
    return css;
  };

  // Recursive render function
  const renderElement = (el: CanvasElement, parentWidth: number, parentHeight: number): string => {
    const children = elements.filter(child => child.parentId === el.id);
    const innerHTML = children.map(child => renderElement(child, el.width, el.height)).join('');
    
    // Calculate layout in percentages relative to parent
    const leftPercent = (el.x / parentWidth) * 100;
    const topPercent = (el.y / parentHeight) * 100;
    const widthPercent = (el.width / parentWidth) * 100;
    const heightPercent = (el.height / parentHeight) * 100;
    
    const wrapperStyle = `
        position: absolute; 
        left: ${leftPercent.toFixed(4)}%; 
        top: ${topPercent.toFixed(4)}%; 
        width: ${widthPercent.toFixed(4)}%; 
        height: ${heightPercent.toFixed(4)}%;
    `;
    
    // Static evaluation for initial state
    let computedData = { style: {}, content: '' };
    
    if (el.type === ElementType.CUSTOM) {
        let def: CustomComponentDefinition | undefined;
        if (el.isDetached && el.customNodeGroup) {
            def = el.customNodeGroup;
        } else if (el.customComponentId) {
            def = customComponents.find(c => c.id === el.customComponentId);
        }
        if (def) computedData = evaluateNodeGraph(def, el.propOverrides);
    }

    if (el.scripts && el.scripts.length > 0) {
        el.scripts.forEach(scriptId => {
            const scriptDef = scripts.find(s => s.id === scriptId);
            if (scriptDef) {
                const res = evaluateNodeGraph(scriptDef, el.propOverrides);
                computedData.style = { ...computedData.style, ...res.style };
                if (res.content !== undefined) computedData.content = res.content;
            }
        });
    }

    const effectiveStyle = { ...el.style, ...computedData.style };
    const finalContent = computedData.content || el.content || '';
    
    const contentStyleCSS = getElementCSS(effectiveStyle, el.width, el.height, finalContent);
    const tailwindClass = getTailwindClasses(el.type, effectiveStyle);

    let tag = 'div';
    let innerContentHTML = '';
    const textWrapper = (text: string) => effectiveStyle.autoFontSize ? `<span class="truncate max-w-full block">${text}</span>` : text;

    if (el.type === ElementType.BUTTON || el.type === ElementType.BADGE) {
        tag = el.type === ElementType.BUTTON ? 'button' : 'div';
        innerContentHTML = textWrapper(finalContent);
    } else if (el.type === ElementType.IMAGE_PLACEHOLDER) {
        if (el.src) {
            tag = 'img';
            // We use 'src' attribute on the main tag, no inner HTML
            // Note: We need to inject src into the tag generation logic below or handle it specifically
        } else {
             innerContentHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; color:#9ca3af; height:100%;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
             </div>`;
        }
    } else if (el.type === ElementType.VIDEO_PLACEHOLDER) {
         if (el.src) {
             const ytId = getYoutubeId(el.src);
             if (ytId) {
                 innerContentHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ytId}?autoplay=${el.videoOptions?.autoplay ? 1 : 0}&controls=${el.videoOptions?.controls === false ? 0 : 1}&loop=${el.videoOptions?.loop ? 1 : 0}&playlist=${el.videoOptions?.loop ? ytId : ''}&mute=${el.videoOptions?.muted ? 1 : 0}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style="border-radius: inherit; pointer-events: auto;"></iframe>`;
             } else {
                 tag = 'video';
                 // src will be added below
             }
         } else {
            innerContentHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; color:#9ca3af; height:100%;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            </div>`;
         }
    } else if (el.type === ElementType.AVATAR) {
         if (el.src) {
             tag = 'img';
         } else {
             innerContentHTML = `<svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
         }
    } else if (el.type === ElementType.DIVIDER) {
        innerContentHTML = `<div style="width:100%; height:1px; background-color:${effectiveStyle.backgroundColor || '#d1d5db'};"></div>`;
    } else if (el.type === ElementType.INPUT) {
        return `
        <div id="${el.id}-wrapper" style="${wrapperStyle}">
             <input data-el-id="${el.id}" type="text" value="${finalContent}" class="${tailwindClass}" style="${contentStyleCSS}" readonly />
             ${innerHTML}
        </div>`;
    } else {
        innerContentHTML = textWrapper(finalContent);
    }

    // Special handling for tags that use SRC attribute
    let srcAttr = '';
    let extraAttrs = '';
    if (tag === 'img') {
        srcAttr = `src="${el.src}" alt="${el.alt || ''}"`;
    } else if (tag === 'video') {
        srcAttr = `src="${el.src}"`;
        if (el.videoOptions?.autoplay) extraAttrs += ' autoplay';
        if (el.videoOptions?.loop) extraAttrs += ' loop';
        if (el.videoOptions?.muted) extraAttrs += ' muted';
        if (el.videoOptions?.controls !== false) extraAttrs += ' controls'; // default true
        extraAttrs += ' playsinline';
    }

    return `
      <div id="${el.id}-wrapper" style="${wrapperStyle}">
        <${tag} data-el-id="${el.id}" class="${tailwindClass}" style="${contentStyleCSS}" ${srcAttr} ${extraAttrs}>
           ${innerContentHTML}
           ${innerHTML}
        </${tag}>
      </div>
    `;
  };

  // Generate HTML for each page container
  const pagesHTML = pages.map((page, index) => {
      const pageElements = elements.filter(el => el.pageId === page.id && !el.parentId);
      const content = pageElements.map(el => renderElement(el, width, height)).join('\n');
      const hiddenClass = index === 0 ? '' : 'hidden'; // Show first page by default
      return `
        <div id="page-${page.id}" class="page-container absolute inset-0 w-full h-full ${hiddenClass}">
            ${content}
        </div>
      `;
  }).join('\n');

  const serializedData = JSON.stringify({
      elements: elements.map(e => ({
          id: e.id,
          scripts: e.scripts || [],
          propOverrides: e.propOverrides || {},
          customComponentId: e.customComponentId,
          customNodeGroup: e.customNodeGroup,
          isDetached: e.isDetached,
          type: e.type,
          pageId: e.pageId
      })),
      components: customComponents,
      scripts: scripts,
      pages: pages
  });

  const containerHeightVw = (height / width) * 100;

  // Collect Fonts
  const fontsToLoad = new Set<string>();
  elements.forEach(el => {
      if (el.style.fontFamily && GOOGLE_FONTS.includes(el.style.fontFamily)) {
          fontsToLoad.add(el.style.fontFamily);
      }
  });
  let fontLink = '';
  if (fontsToLoad.size > 0) {
      const query = Array.from(fontsToLoad).map(f => `family=${f.replace(/ /g, '+')}:wght@400;700`).join('&');
      fontLink = `<link href="https://fonts.googleapis.com/css2?${query}&display=swap" rel="stylesheet">`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
    ${fontLink}
    <style>
        body { margin: 0; padding: 0; overflow-x: hidden; background-color: #ffffff; font-family: sans-serif; }
        #app-root { position: relative; width: 100vw; height: ${containerHeightVw}vw; overflow: hidden; }
        .hidden { display: none !important; }
        /* Animations */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideInUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        /* ... other animations ... */
    </style>
</head>
<body>
    <div id="app-root">
        ${pagesHTML}
    </div>

    <script>
        const PROJECT_DATA = ${serializedData};
        const RUNTIME = {
            startTime: Date.now(),
            activePageId: PROJECT_DATA.pages[0]?.id,
            state: { hovers: {}, clicks: {}, time: 0, triggerStates: {} },
            
            init: function() {
                document.querySelectorAll('[data-el-id]').forEach(el => {
                    const id = el.getAttribute('data-el-id');
                    el.addEventListener('mouseenter', () => { this.state.hovers[id] = true; });
                    el.addEventListener('mouseleave', () => { this.state.hovers[id] = false; });
                    el.addEventListener('click', (e) => { 
                        // Don't stop propagation if it's a link or form input
                        if (['A','INPUT','BUTTON'].includes(e.target.tagName)) return;
                        e.stopPropagation();
                        this.state.clicks[id] = !this.state.clicks[id]; 
                    });
                });
                this.loop();
            },

            navigateTo: function(pageId) {
                if (this.activePageId === pageId) return;

                // Reset interaction states for elements on the page we are leaving
                // This prevents "stuck" true states (like clicks) from triggering immediately when we return
                const leavingElements = PROJECT_DATA.elements.filter(el => el.pageId === this.activePageId);
                leavingElements.forEach(el => {
                   this.state.clicks[el.id] = false;
                   this.state.hovers[el.id] = false;
                });

                document.getElementById('page-' + this.activePageId)?.classList.add('hidden');
                document.getElementById('page-' + pageId)?.classList.remove('hidden');
                this.activePageId = pageId;
            },

            evaluateNodeGraph: function(def, overrides, context) {
                const outputNode = def.nodes.find(n => n.type === 'OUTPUT');
                const memo = new Map();
                const visited = new Set();
                const evaluateNode = (nodeId) => {
                    if (memo.has(nodeId)) return memo.get(nodeId);
                    if (visited.has(nodeId)) return null;
                    visited.add(nodeId);
                    if (overrides[nodeId] !== undefined) return overrides[nodeId];
                    const node = def.nodes.find(n => n.id === nodeId);
                    if (!node) return null;
                    const getVal = (inputSocketId) => {
                        const conn = def.connections.find(c => c.targetNodeId === nodeId && c.targetSocketId === inputSocketId);
                        return conn ? evaluateNode(conn.sourceNodeId) : null;
                    };
                    
                    let res = null;
                    const val = node.data.value;

                    switch (node.type) {
                        case 'NAVIGATE': {
                             const trigger = getVal('in-trigger');
                             const prevTrigger = this.state.triggerStates[nodeId];
                             
                             if (trigger === true && !prevTrigger && val) {
                                 this.navigateTo(val);
                             }
                             this.state.triggerStates[nodeId] = trigger;
                             break;
                        }
                        case 'LINK': {
                             const trigger = getVal('in-trigger');
                             const prevTrigger = this.state.triggerStates[nodeId];
                             const url = getVal('in-url') || val;
                             const newTab = getVal('in-new-tab') !== null ? getVal('in-new-tab') : node.data.newTab;

                             if (trigger === true && !prevTrigger && url) {
                                 if (newTab) {
                                     window.open(url, '_blank');
                                 } else {
                                     window.location.href = url;
                                 }
                             }
                             this.state.triggerStates[nodeId] = trigger;
                             break;
                        }
                        case 'ALERT': {
                             const trigger = getVal('in-trigger');
                             const prevTrigger = this.state.triggerStates[nodeId];
                             const msg = getVal('in-message') || val;
                             
                             if (trigger === true && !prevTrigger && msg) {
                                 // Use setTimeout to allow the UI update/frame to complete before blocking
                                 setTimeout(() => alert(msg), 0);
                             }
                             this.state.triggerStates[nodeId] = trigger;
                             break;
                        }
                        case 'INTERACTION_HOVER': res = context.isHovered; break;
                        case 'INTERACTION_CLICK': res = context.isClicked; break;
                        case 'TIMER': res = context.time * Number(getVal('in-speed') ?? 1); break;
                        case 'IF_ELSE': res = getVal('in-condition') ? getVal('in-true') : getVal('in-false'); break;
                        case 'EQUAL': res = getVal('in-a') == getVal('in-b'); break;
                        // ... (Include other math/logic ops from evaluate.ts) ...
                        case 'TEXT': case 'COLOR': case 'NUMBER': case 'TOGGLE': res = val; break;
                        case 'STYLE': res = { backgroundColor: getVal('in-bg'), color: getVal('in-text'), fontSize: getVal('in-size') }; break;
                        default: res = val;
                    }
                    visited.delete(nodeId);
                    memo.set(nodeId, res);
                    return res;
                };

                // Trigger action nodes
                def.nodes.forEach(n => {
                    if (['NAVIGATE', 'LINK', 'ALERT'].includes(n.type)) {
                        evaluateNode(n.id);
                    }
                });

                // Standard Output
                if (!outputNode) return { style: {}, content: '' };
                const styleConn = def.connections.find(c => c.targetNodeId === outputNode.id && c.targetSocketId === 'in-style');
                const finalStyle = styleConn ? (evaluateNode(styleConn.sourceNodeId) || {}) : {};
                const contentConn = def.connections.find(c => c.targetNodeId === outputNode.id && c.targetSocketId === 'in-content');
                const finalContent = contentConn ? String(evaluateNode(contentConn.sourceNodeId)) : undefined;
                return { style: finalStyle, content: finalContent };
            },

            loop: function() {
                this.state.time = (Date.now() - this.startTime) / 1000;
                
                // Only process elements on ACTIVE page
                const activeElements = PROJECT_DATA.elements.filter(el => el.pageId === this.activePageId);

                activeElements.forEach(el => {
                    if ((!el.scripts || el.scripts.length === 0) && el.type !== 'CUSTOM') return;
                    const domEl = document.querySelector(\`[data-el-id="\${el.id}"]\`);
                    if (!domEl) return;

                    const context = {
                        isHovered: !!this.state.hovers[el.id],
                        isClicked: !!this.state.clicks[el.id],
                        time: this.state.time
                    };

                    let computedStyle = {};
                    let computedContent = undefined;

                    if (el.type === 'CUSTOM') {
                        let def = el.isDetached ? el.customNodeGroup : PROJECT_DATA.components.find(c => c.id === el.customComponentId);
                        if (def) {
                            const res = this.evaluateNodeGraph(def, el.propOverrides, context);
                            Object.assign(computedStyle, res.style);
                            if (res.content !== undefined) computedContent = res.content;
                        }
                    }

                    if (el.scripts) {
                        el.scripts.forEach(sid => {
                            const def = PROJECT_DATA.scripts.find(s => s.id === sid);
                            if (def) {
                                const res = this.evaluateNodeGraph(def, el.propOverrides, context);
                                Object.assign(computedStyle, res.style);
                                if (res.content !== undefined) computedContent = res.content;
                            }
                        });
                    }

                    if (computedContent !== undefined && domEl.innerText !== computedContent) {
                         if(['BUTTON','HEADING','PARAGRAPH'].includes(el.type)) domEl.innerText = computedContent;
                    }
                    if (computedStyle.backgroundColor) domEl.style.backgroundColor = computedStyle.backgroundColor;
                    if (computedStyle.color) domEl.style.color = computedStyle.color;
                    if (computedStyle.transform) domEl.style.transform = computedStyle.transform;
                    if (computedStyle.animation) domEl.style.animation = computedStyle.animation;
                });
                requestAnimationFrame(() => this.loop());
            }
        };
        RUNTIME.init();
    </script>
</body>
</html>`;
}
