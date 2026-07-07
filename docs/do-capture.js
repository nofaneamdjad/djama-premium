/**
 * Script exécuté DANS la page via preview_eval pour naviguer + capturer.
 * Chaque page est capturée et stockée dans window.__caps[nom].
 * Puis on lit window.__caps pour sauvegarder.
 *
 * Usage depuis eval :
 *   await window.__startCapture()
 *   window.__caps   // => { dashboard: "data:image/jpeg;base64,...", ... }
 */
(async function() {
  // Inject html-to-image
  if (typeof htmlToImage === 'undefined') {
    await new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  const capture = async (name) => {
    window.scrollTo(0, 0);
    try {
      const data = await htmlToImage.toJpeg(document.body, {
        quality: 0.65,
        pixelRatio: 0.85,
        backgroundColor: '#0f0f1a',
        skipFonts: true,
      });
      window.__caps = window.__caps || {};
      window.__caps[name] = data;
      return data.length;
    } catch(e) {
      return 'error: ' + e.message;
    }
  };

  return capture;
})();
