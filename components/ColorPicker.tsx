import React, { useState, useEffect, useRef } from 'react';

interface ColorPickerProps {
  initialColor: string;
  onChange: (color: string) => void;
  onClose: () => void;
  x: number;
  y: number;
}

// Helper Functions
const hexToHsv = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
  let r = 0, g = 0, b = 0;
  let i = 0, f = 0, p = 0, q = 0, t = 0;
  h /= 60;
  s /= 100;
  v /= 100;
  i = Math.floor(h);
  f = h - i;
  p = v * (1 - s);
  q = v * (1 - s * f);
  t = v * (1 - s * (1 - f));
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ initialColor, onChange, onClose, x, y }) => {
  const [hsv, setHsv] = useState(hexToHsv(initialColor));
  const [isDraggingSat, setIsDraggingSat] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  
  const satRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      onChange(hex);
  }, [hsv]);

  const handleSatMouseDown = (e: React.MouseEvent) => {
      setIsDraggingSat(true);
      updateSat(e);
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
      setIsDraggingHue(true);
      updateHue(e);
  };

  const updateSat = (e: MouseEvent | React.MouseEvent) => {
      if (!satRef.current) return;
      const rect = satRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      
      setHsv(prev => ({
          ...prev,
          s: (x / rect.width) * 100,
          v: 100 - (y / rect.height) * 100
      }));
  };

  const updateHue = (e: MouseEvent | React.MouseEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      
      setHsv(prev => ({
          ...prev,
          h: (y / rect.height) * 360
      }));
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDraggingSat) updateSat(e);
          if (isDraggingHue) updateHue(e);
      };
      const handleMouseUp = () => {
          setIsDraggingSat(false);
          setIsDraggingHue(false);
      };
      
      if (isDraggingSat || isDraggingHue) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDraggingSat, isDraggingHue]);

  // Prevent closing when clicking inside
  const handleWrapperClick = (e: React.MouseEvent) => {
      e.stopPropagation();
  };

  const currentColor = rgbToHex(hsvToRgb(hsv.h, hsv.s, hsv.v).r, hsvToRgb(hsv.h, hsv.s, hsv.v).g, hsvToRgb(hsv.h, hsv.s, hsv.v).b);
  const hueColor = rgbToHex(hsvToRgb(hsv.h, 100, 100).r, hsvToRgb(hsv.h, 100, 100).g, hsvToRgb(hsv.h, 100, 100).b);

  return (
    <div 
        className="fixed inset-0 z-[100]" 
        onMouseDown={onClose}
    >
        <div 
            className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-3 w-64 flex flex-col space-y-3"
            style={{ 
                left: Math.min(x, window.innerWidth - 270), 
                top: Math.min(y, window.innerHeight - 300) 
            }}
            onMouseDown={handleWrapperClick}
        >
            <div className="flex h-40 space-x-3">
                {/* Saturation/Value Box */}
                <div 
                    ref={satRef}
                    className="flex-1 relative cursor-crosshair rounded overflow-hidden"
                    style={{ backgroundColor: hueColor }}
                    onMouseDown={handleSatMouseDown}
                >
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }}></div>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }}></div>
                    <div 
                        className="absolute w-3 h-3 border-2 border-white rounded-full shadow-sm -ml-1.5 -mt-1.5 pointer-events-none"
                        style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                    ></div>
                </div>

                {/* Hue Slider */}
                <div 
                    ref={hueRef}
                    className="w-6 relative cursor-pointer rounded overflow-hidden"
                    style={{ background: 'linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
                    onMouseDown={handleHueMouseDown}
                >
                    <div 
                        className="absolute left-0 right-0 h-2 bg-white border border-gray-400 -mt-1 pointer-events-none"
                        style={{ top: `${(hsv.h / 360) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded border border-gray-600" style={{ backgroundColor: currentColor }}></div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Hex Color</label>
                    <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-2 py-1">
                        <span className="text-gray-500 mr-1">#</span>
                        <input 
                            type="text" 
                            value={currentColor.replace('#', '')}
                            onChange={(e) => {
                                const val = "#" + e.target.value;
                                if (/^#[0-9A-F]{6}$/i.test(val)) {
                                    setHsv(hexToHsv(val));
                                }
                            }}
                            className="bg-transparent text-sm text-white w-full focus:outline-none font-mono uppercase"
                            maxLength={6}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};