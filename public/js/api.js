// The one way the page talks to the server: same-origin JSON. No other host is ever contacted.

export async function api(path, body) {
  let res;
  try {
    res = await fetch(path, body === undefined
      ? { credentials: 'same-origin' }
      : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch (e) {
    throw Object.assign(new Error('Jag når inte PenPal just nu. Kolla nätet och försök igen.'), { status: 0 });
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* no JSON in the answer */ }
  if (!res.ok) {
    const message = data && typeof data.error === 'string' ? data.error : 'Något gick fel. Försök igen.';
    throw Object.assign(new Error(message), { status: res.status, code: data && data.code });
  }
  return data || {};
}

/**
 * A photo file -> { image, thumb } as JPEG data URLs: at most 1600 px on the long side for the
 * analysis, and a small one for the history list. Phone photos are several MB; this is ~300 kB.
 */
export async function preparePhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
    const draw = (max, quality) => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';                               // a transparent PNG becomes white paper, not black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality);
    };
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('empty');
    let image = draw(1600, 0.8);
    if (image.length > 4.4e6) image = draw(1280, 0.65);    // the server takes 3.5 MB of picture
    return { image, thumb: draw(320, 0.7) };
  } catch (e) {
    throw new Error('Den bilden kunde jag inte öppna. Prova en annan bild.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
