export type Theme = {
  id: string;
  name: string;
  price: number;
  /** vertical gradient stops for the backdrop */
  stops: [string, string, string];
  /** wooden shelves under each row of bottles */
  shelf: boolean;
  /** translucent panels / pills drawn on top of the backdrop */
  panel: string;
  accent: string;
};

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    price: 0,
    stops: ['#16397f', '#0b2250', '#050d26'],
    shelf: false,
    panel: 'rgba(5,16,44,0.62)',
    accent: '#2fb4ff',
  },
  {
    id: 'violet',
    name: 'Violet Shelf',
    price: 120,
    stops: ['#33196b', '#1d0f45', '#0e0626'],
    shelf: true,
    panel: 'rgba(22,8,52,0.62)',
    accent: '#b57cff',
  },
  {
    id: 'forest',
    name: 'Forest',
    price: 200,
    stops: ['#14704a', '#0a4129', '#03180e'],
    shelf: false,
    panel: 'rgba(3,32,18,0.62)',
    accent: '#5be07c',
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    price: 200,
    stops: ['#4a2582', '#281552', '#12082b'],
    shelf: false,
    panel: 'rgba(24,10,56,0.62)',
    accent: '#d6a2ff',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    price: 300,
    stops: ['#f39a35', '#b23f1c', '#35101a'],
    shelf: false,
    panel: 'rgba(50,14,14,0.55)',
    accent: '#ffc247',
  },
];

export const themeById = (id: string): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];
