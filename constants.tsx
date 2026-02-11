import { 
  Type, 
  MousePointer2, 
  Square, 
  Image, 
  Minus, 
  Box, 
  TextCursor, 
  Heading1,
  PlayCircle,
  User,
  Tag
} from 'lucide-react';
import { ElementType, ToolDefinition } from './types';

export const TOOLS: Record<ElementType, ToolDefinition> = {
  [ElementType.BUTTON]: {
    type: ElementType.BUTTON,
    label: 'Кнопка',
    icon: MousePointer2,
    defaultWidth: 120,
    defaultHeight: 40,
    defaultContent: 'Кнопка',
    defaultStyle: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 'normal',
      borderRadius: 4,
      borderWidth: 0,
      borderColor: '#000000',
      padding: 0,
      opacity: 1,
      textAlign: 'center'
    }
  },
  [ElementType.HEADING]: {
    type: ElementType.HEADING,
    label: 'Заголовок',
    icon: Heading1,
    defaultWidth: 300,
    defaultHeight: 50,
    defaultContent: 'Новый заголовок',
    defaultStyle: {
      color: '#1f2937',
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'left',
      backgroundColor: 'transparent',
      padding: 0,
      opacity: 1,
      borderWidth: 0
    }
  },
  [ElementType.PARAGRAPH]: {
    type: ElementType.PARAGRAPH,
    label: 'Текст',
    icon: Type,
    defaultWidth: 300,
    defaultHeight: 80,
    defaultContent: 'Введите ваш текст здесь...',
    defaultStyle: {
      color: '#4b5563',
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'left',
      backgroundColor: 'transparent',
      padding: 0,
      opacity: 1,
      borderWidth: 0
    }
  },
  [ElementType.BADGE]: {
    type: ElementType.BADGE,
    label: 'Бейдж',
    icon: Tag,
    defaultWidth: 80,
    defaultHeight: 24,
    defaultContent: 'New',
    defaultStyle: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      fontSize: 12,
      fontWeight: 'bold',
      borderRadius: 12,
      borderWidth: 0,
      textAlign: 'center',
      padding: 0,
      opacity: 1
    }
  },
  [ElementType.CARD]: {
    type: ElementType.CARD,
    label: 'Карточка',
    icon: Square,
    defaultWidth: 200,
    defaultHeight: 250,
    defaultStyle: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      padding: 10,
      opacity: 1
    }
  },
  [ElementType.INPUT]: {
    type: ElementType.INPUT,
    label: 'Поле ввода',
    icon: TextCursor,
    defaultWidth: 250,
    defaultHeight: 40,
    defaultContent: 'Введите текст...',
    defaultStyle: {
      backgroundColor: '#ffffff',
      color: '#1f2937',
      fontSize: 14,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#d1d5db',
      textAlign: 'left',
      padding: 8,
      opacity: 1
    }
  },
  [ElementType.IMAGE_PLACEHOLDER]: {
    type: ElementType.IMAGE_PLACEHOLDER,
    label: 'Изображение',
    icon: Image,
    defaultWidth: 200,
    defaultHeight: 150,
    defaultStyle: {
      backgroundColor: '#e5e7eb',
      borderRadius: 4,
      color: '#9ca3af',
      borderWidth: 0,
      opacity: 1
    }
  },
  [ElementType.VIDEO_PLACEHOLDER]: {
    type: ElementType.VIDEO_PLACEHOLDER,
    label: 'Видео',
    icon: PlayCircle,
    defaultWidth: 320,
    defaultHeight: 180,
    defaultStyle: {
      backgroundColor: '#1f2937',
      borderRadius: 4,
      color: '#6b7280',
      borderWidth: 0,
      opacity: 1
    }
  },
  [ElementType.AVATAR]: {
    type: ElementType.AVATAR,
    label: 'Аватар',
    icon: User,
    defaultWidth: 64,
    defaultHeight: 64,
    defaultStyle: {
      backgroundColor: '#e5e7eb',
      borderRadius: 9999, // Full circle
      color: '#9ca3af',
      borderWidth: 0,
      opacity: 1
    }
  },
  [ElementType.DIVIDER]: {
    type: ElementType.DIVIDER,
    label: 'Разделитель',
    icon: Minus,
    defaultWidth: 400,
    defaultHeight: 2,
    defaultStyle: {
      backgroundColor: '#d1d5db',
      opacity: 1
    }
  },
  [ElementType.CONTAINER]: {
    type: ElementType.CONTAINER,
    label: 'Контейнер',
    icon: Box,
    defaultWidth: 400,
    defaultHeight: 200,
    defaultStyle: {
      backgroundColor: '#f9fafb',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      color: '#9ca3af',
      padding: 10,
      opacity: 1
    }
  },
  [ElementType.CUSTOM]: {
    type: ElementType.CUSTOM,
    label: 'Компонент',
    icon: Box,
    defaultWidth: 200,
    defaultHeight: 100,
    defaultStyle: {
      backgroundColor: 'transparent',
      opacity: 1
    }
  }
};