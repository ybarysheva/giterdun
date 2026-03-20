'use client';

import { useEffect, useState } from 'react';

interface Font {
  name: string;
}

// Hardcoded list of popular Google Fonts
const FONTS: Font[] = [
  { name: 'Roboto' },
  { name: 'Open Sans' },
  { name: 'Lato' },
  { name: 'Poppins' },
  { name: 'Inter' },
  { name: 'Montserrat' },
  { name: 'Raleway' },
  { name: 'Ubuntu' },
  { name: 'Playfair Display' },
  { name: 'Crimson Text' },
  { name: 'IBM Plex Sans' },
  { name: 'Inconsolata' },
  { name: 'Merriweather' },
  { name: 'Fjalla One' },
  { name: 'Oswald' },
  { name: 'PT Sans' },
  { name: 'Work Sans' },
  { name: 'Quicksand' },
  { name: 'Sora' },
  { name: 'Nunito' },
  { name: 'Mulish' },
  { name: 'Dm Sans' },
  { name: 'Jost' },
  { name: 'Outfit' },
  { name: 'Manrope' },
  { name: 'Catamaran' },
  { name: 'Rubik' },
  { name: 'Lexend' },
  { name: 'Comfortaa' },
  { name: 'Varela Round' },
  { name: 'Caveat' },
  { name: 'Great Vibes' },
  { name: 'Bebas Neue' },
  { name: 'Righteous' },
  { name: 'Fredoka One' },
  { name: 'Indie Flower' },
  { name: 'Permanent Marker' },
  { name: 'Dancing Script' },
  { name: 'Pacifico' },
  { name: 'Schoolbell' },
];

function getGoogleFonts(): Font[] {
  return FONTS;
}

export function useRandomFont() {
  const [currentFont, setCurrentFont] = useState<string>('');

  useEffect(() => {
    const injectFont = (fontName: string) => {
      // Create a link element for Google Fonts CSS
      let linkTag = document.getElementById('dynamic-font-link') as HTMLLinkElement;
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.id = 'dynamic-font-link';
        linkTag.rel = 'stylesheet';
        document.head.appendChild(linkTag);
      }

      // Use Google Fonts CSS API
      const fontFamily = fontName.replace(/ /g, '+');
      linkTag.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`;

      // Apply font to html element to override .font-body class
      document.documentElement.style.fontFamily = `"${fontName}", sans-serif`;

      setCurrentFont(fontName);
      console.log('🎨 Font changed to:', fontName);
    };

    // Load initial random font
    const randomFont = FONTS[Math.floor(Math.random() * FONTS.length)];
    console.log('🎨 Initial font loaded:', randomFont.name);
    injectFont(randomFont.name);

    // Set up interval to change every 2 seconds
    const interval = setInterval(() => {
      const random = FONTS[Math.floor(Math.random() * FONTS.length)];
      injectFont(random.name);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { currentFont, fontList: FONTS };
}
