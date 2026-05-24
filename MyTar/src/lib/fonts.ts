// Google Fonts dynamic loader for the canvas editor

export const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Playfair Display',
  'Lato',
  'Poppins',
  'Raleway',
  'Nunito',
  'Merriweather',
  'Source Sans 3',
  'Ubuntu',
  'Oswald',
  'PT Sans',
  'Noto Sans',
  'Bebas Neue',
  'Dancing Script',
  'Pacifico',
  'Abril Fatface',
  'Righteous',
  // RTL fonts
  'Noto Naskh Arabic',
  'Noto Sans Arabic',
  'Amiri',
  'Cairo',
  'Tajawal',
];

const loadedFonts = new Set<string>();

export async function loadGoogleFont(fontFamily: string): Promise<void> {
  if (loadedFonts.has(fontFamily)) return;

  const formatted = fontFamily.replace(/ /g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formatted}:wght@400;600;700&display=swap`;

  return new Promise((resolve) => {
    link.onload = () => {
      loadedFonts.add(fontFamily);
      resolve();
    };
    link.onerror = () => resolve(); // fail silently
    document.head.appendChild(link);
  });
}

export async function preloadEditorFonts(): Promise<void> {
  const priority = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Playfair Display'];
  await Promise.all(priority.map(loadGoogleFont));
}

export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily);
}

