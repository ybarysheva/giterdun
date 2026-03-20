'use client';

import { useEffect, useState } from 'react';

// Curated list of popular Google Fonts with direct woff2 URLs
// Format: { name, url }
const GOOGLE_FONTS = [
  { name: 'Roboto', url: 'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Me5WZLCzYlKXo.woff2' },
  { name: 'Open Sans', url: 'https://fonts.gstatic.com/s/opensans/v36/memvYaGs126MiZpBA-UvWbX5c-_8O0-H6vTjS-BwE0I.woff2' },
  { name: 'Poppins', url: 'https://fonts.gstatic.com/s/poppins/v20/pxiGyp8kv8JHgFVrJJbecnFHGPc.woff2' },
  { name: 'Inter', url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3i6t4kDuyKAeJycX19io4zO.woff2' },
  { name: 'Lora', url: 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuMwr7I50-r-TsSLlhloS8.woff2' },
  { name: 'Playfair Display', url: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anv5HiMlAjJDmkDMCPI.woff2' },
  { name: 'Montserrat', url: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw0aXpsog.woff2' },
  { name: 'Raleway', url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyC0ISojc5tH7fWNW_FfJLwfM5NU.woff2' },
  { name: 'Merriweather', url: 'https://fonts.gstatic.com/s/merriweather/v30/u-450q2drNAsS3VjS737ArtM70KwMVZERc6I.woff2' },
  { name: 'Source Sans Pro', url: 'https://fonts.gstatic.com/s/sourcesanspro/v22/6xKV9ZsQSiU9eVL8HAVSNsnMwU5nSVxg.woff2' },
  { name: 'Ubuntu', url: 'https://fonts.gstatic.com/s/ubuntu/v20/4iCpE1TDkO5__0KzRLryVFkQcOCeTTVe.woff2' },
  { name: 'Pacifico', url: 'https://fonts.gstatic.com/s/pacifico/v17/FwZc7-QwsZg_HDTiR2HhGRJW.woff2' },
  { name: 'Dancing Script', url: 'https://fonts.gstatic.com/s/dancingscript/v16/If2cXTr6YS-dMa3fgeIAiWjQ8seG67Mr.woff2' },
  { name: 'Courier Prime', url: 'https://fonts.gstatic.com/s/courierprime/v15/Ld_gMfEiS4Yd3fUmEgJWIVhfVxJ8.woff2' },
  { name: 'IBM Plex Sans', url: 'https://fonts.gstatic.com/s/ibmplexsans/v19/zYXgKVnMK25OulRz-Kpqp-TsSLlhloS8.woff2' },
  { name: 'Work Sans', url: 'https://fonts.gstatic.com/s/worksans/v13/QGYvzf4wL8LQZLC7-8qQNfTsSLlhloS8.woff2' },
  { name: 'Quicksand', url: 'https://fonts.gstatic.com/s/quicksand/v31/6xK-dSZearstP3V-BT_rNV__RXh-TXhX4.woff2' },
  { name: 'Bebas Neue', url: 'https://fonts.gstatic.com/s/bebasneue/v13/JTUSjIg69CK48gIUYvOcGbmIRg.woff2' },
  { name: 'Oswald', url: 'https://fonts.gstatic.com/s/oswald/v54/TK3_WkUVqA0jBkErY-CCG-TsSLlhloS8.woff2' },
  { name: 'Crimson Text', url: 'https://fonts.gstatic.com/s/crimsontext/v11/wlp5gwHJ7s9t2TrJLlxVxIhD2RJ0.woff2' },
  { name: 'Nunito', url: 'https://fonts.gstatic.com/s/nunito/v26/XRXQ3I8_Bp1cNqNID9_lKQ.woff2' },
  { name: 'Space Mono', url: 'https://fonts.gstatic.com/s/spacemono/v13/i7dMIFZifjKcF5UAVvhERVhfVxJ8.woff2' },
  { name: 'Inconsolata', url: 'https://fonts.gstatic.com/s/inconsolata/v33/QldKNThLqRwH-OJ1UHjI5_xLbYN5d5jA.woff2' },
  { name: 'Bitter', url: 'https://fonts.gstatic.com/s/bitter/v17/raxiLiQjXPqF5OdIDKzE.woff2' },
  { name: 'PT Serif', url: 'https://fonts.gstatic.com/s/ptserif/v12/ga4iw1V5ZW7pKEO_xIGAPcKEWgJ8.woff2' },
  { name: 'Roboto Mono', url: 'https://fonts.gstatic.com/s/robotomono/v22/L0xuDF4xlVMF-BfR8bXMIjhIUXhI0JpqCqj8jFUf5-I.woff2' },
  { name: 'Lato', url: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wWJnnVClSKMqxJh3Pw.woff2' },
  { name: 'Dosis', url: 'https://fonts.gstatic.com/s/dosis/v32/HhyJU5wlp-R7tMz9NXDxTcNrVDL.woff2' },
  { name: 'Comfortaa', url: 'https://fonts.gstatic.com/s/comfortaa/v32/1Ptxg83UYesJBxwWRd_K-TjJTe90.woff2' },
  { name: 'Fredoka One', url: 'https://fonts.gstatic.com/s/fredokaone/v9/I_CY_AEegM6YBhKM8fUTwYEAww.woff2' },
  { name: 'Archivo', url: 'https://fonts.gstatic.com/s/archivo/v24/k3k7o4UDI25bAJ5_jbVzvWhowyJ8.woff2' },
  { name: 'Fira Sans', url: 'https://fonts.gstatic.com/s/firasans/v17/va9E4kDNxMZdL-6mwVf9abK5VZ45M4j3_cc.woff2' },
  { name: 'Cabin', url: 'https://fonts.gstatic.com/s/cabin/v26/QdVVSTEyC-msDcYy8gC_4pxsQQ.woff2' },
  { name: 'Mukta', url: 'https://fonts.gstatic.com/s/mukta/v12/iJWcBXeUZV5n-FKhdsnJ0l5P.woff2' },
  { name: 'Aleo', url: 'https://fonts.gstatic.com/s/aleo/v1/-FA_OjtH_VdJkr6HY4FMqcN0Dw.woff2' },
  { name: 'Volkhov', url: 'https://fonts.gstatic.com/s/volkhov/v13/SlGGwRpXKsVLjU8yx8B52-TsSLlhloS8.woff2' },
  { name: 'Cinzel', url: 'https://fonts.gstatic.com/s/cinzel/v20/8vIM7at_4yX97tSQSS6w.woff2' },
  { name: 'Cormorant Garamond', url: 'https://fonts.gstatic.com/s/cormorantgaramond/v18/cIf-4d_kJhh0PW9Y06uPRLxfIVZQFn86DI0-OU_N0O.woff2' },
  { name: 'Satisfy', url: 'https://fonts.gstatic.com/s/satisfy/v16/rP2Hp2ywxg0T86CsDtXHLHw.woff2' },
  { name: 'Great Vibes', url: 'https://fonts.gstatic.com/s/greatvibes/v19/SZc43FDrI0WKoLXnVyXYgPy6TYIq.woff2' },
  { name: 'Caveat', url: 'https://fonts.gstatic.com/s/caveat/v20/Wnzof9-a742KttDKM-HrV_.woff2' },
  { name: 'Righteous', url: 'https://fonts.gstatic.com/s/righteous/v15/1Ptrg83HLNaUes8jmtavW4JJZRpG.woff2' },
  { name: 'JetBrains Mono', url: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flIEm7ZIcMVTj7elQwcxC.woff2' },
];

export function useRandomFont() {
  const [currentFont, setCurrentFont] = useState<string>('');

  useEffect(() => {
    // Function to inject a font into the DOM
    const injectFont = (fontName: string, fontUrl: string) => {
      let styleTag = document.getElementById('dynamic-font-style');

      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-font-style';
        document.head.appendChild(styleTag);
      }

      styleTag.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${fontUrl}') format('woff2');
          font-display: swap;
        }
        body {
          font-family: '${fontName}', sans-serif !important;
        }
      `;

      setCurrentFont(fontName);
    };

    // Load initial random font
    const randomIndex = Math.floor(Math.random() * GOOGLE_FONTS.length);
    const randomFont = GOOGLE_FONTS[randomIndex];
    injectFont(randomFont.name, randomFont.url);

    // Set up interval to change font every 15 seconds
    const interval = setInterval(() => {
      const index = Math.floor(Math.random() * GOOGLE_FONTS.length);
      const font = GOOGLE_FONTS[index];
      injectFont(font.name, font.url);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { currentFont, fontList: GOOGLE_FONTS };
}
