/**
 * Stroke icons on a 24×24 grid, as lists of path `d` strings so one <Icon> can draw
 * any of them without {@html}. UI glyphs follow Lucide; the brew-method drawings are
 * our own.
 */
import type { BrewMethod } from './types';

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
  `h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

export const ICONS = {
  brew: ['M10 2v2', 'M14 2v2', 'M6 2v2', 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1'],
  journal: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  insights: ['M3 3v16a2 2 0 0 0 2 2h16', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  bean: ['M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z', 'M5.341 10.62a4 4 0 1 0 5.279-5.28'],
  recipe: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z'],
  settings: ['M20 7h-9', 'M14 17H5', circle(17, 17, 3), circle(7, 7, 3)],
  plus: ['M5 12h14', 'M12 5v14'],
  search: [circle(11, 11, 8), 'm21 21-4.3-4.3'],
  chevronRight: ['m9 18 6-6-6-6'],
  chevronLeft: ['m15 18-6-6 6-6'],
  chevronDown: ['m6 9 6 6 6-6'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  repeat: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
  edit: ['M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
  timer: ['M10 2h4', 'M12 14l3-3', circle(12, 14, 8)],
  check: ['M20 6 9 17l-5-5'],
  refresh: ['M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16', 'M16 16h5v5'],
  play: ['M7 4.5v15l12-7.5z'],
  pause: ['M9 5v14', 'M15 5v14'],
  table: ['M3 9h18', 'M3 15h18', 'M12 3v18', rect(3, 3, 18, 18, 2)],
} as const;

export type IconName = keyof typeof ICONS;

export const METHOD_ICONS: Record<BrewMethod, readonly string[]> = {
  v60: ['M3.5 6h17l-6 9.5h-5z', 'M9.5 15.5V18h5v-2.5', 'M6 21h12', 'M20.5 6c1.5 0 1.5 3.5-1.6 4.5'],
  french_press: [rect(5, 7, 11, 14, 1.5), 'M10.5 7V2.5', 'M7.5 2.5h6', 'M16 10h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2', 'M5 12h11'],
  aeropress: [rect(7, 2.5, 10, 6, 1), rect(8, 8.5, 8, 10, 1), 'M5.5 21.5h13', 'M10 18.5v3', 'M14 18.5v3'],
  moka_pot: ['M8 3h7l1.5 7.5h-10z', 'M6.5 10.5h10L15 21H8z', 'M15.4 5H19l-1.6 4.5', 'M11.5 3V1.5'],
  chemex: ['M6 2.5h12l-4.2 8.5 4.7 10.5h-13L10.2 11z', 'M9.5 9h5l-.8 3.5h-3.4z'],
  cold_brew: ['M5 4h14l-1.4 16.1a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z', rect(8.5, 9, 4, 4, 0.8), rect(12, 13, 3.5, 3.5, 0.8)],
  espresso: ['M4.5 10h11v3.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z', 'M15.5 11h1.5a2 2 0 0 1 0 4h-1.5', 'M3 21.5h16', 'M8.5 3c-.6 1 .6 2 0 3.5', 'M11.5 3c-.6 1 .6 2 0 3.5'],
  other: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z'],
};
