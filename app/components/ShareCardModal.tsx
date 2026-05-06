'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';
import { getTagById } from '@/lib/autoTags';

interface ShareCardModalProps {
  cocktailName: string;
  recipe:       string;
  imageSrc:     string | null;
  rating:       number;
  tags:         string[];
  onClose:      () => void;
}

export default function ShareCardModal({
  cocktailName, recipe, imageSrc, rating, tags, onClose,
}: ShareCardModalProps) {
  // ── Contexto (UNA sola vez) ───────────────────────────────────────────────
  const { isDark, locale } = useApp();

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [rendered,   setRendered]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Extraer solo la sección de ingredientes
  const extractIngredients = (text: string) => {
    // Busca el bloque de ingredientes y detente antes de la preparación
    const match = text.match(/(?:###?\s*Ingredientes|Ingredients|Ingredientes)([\s\S]*?)(?:###?\s*Preparación|Instructions|Preparation|Preparación|$)/i);
    return match ? match[1].trim() : text.substring(0, 150); // Fallback si no encuentra el tag
  };

  const ingredientsSnippet = extractIngredients(recipe);

  // ── Dibujar tarjeta en canvas ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 900, H = 500;
    canvas.width  = W;
    canvas.height = H;

    const draw = async () => {
      // Fondo
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#000510');
      bg.addColorStop(0.5, '#000c1f');
      bg.addColorStop(1, '#000308');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Borde dorado exterior
      ctx.strokeStyle = '#f5c84250';
      ctx.lineWidth   = 2;
      ctx.strokeRect(12, 12, W - 24, H - 24);

      // Línea decorativa izquierda (gradiente)
      const lineGrad = ctx.createLinearGradient(0, 0, 0, H);
      lineGrad.addColorStop(0,   '#f5c84200');
      lineGrad.addColorStop(0.5, '#f5c842');
      lineGrad.addColorStop(1,   '#f5c84200');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 30); ctx.lineTo(40, H - 30);
      ctx.stroke();

      // ── Imagen del cóctel (izquierda) ──
      const imgX = 50, imgY = 50, imgW = 320, imgH = H - 100;
      ctx.save();
      ctx.beginPath();
      roundRectPath(ctx, imgX, imgY, imgW, imgH, 16);
      ctx.clip();

      if (imageSrc && !imageSrc.includes('default-cocktail')) {
        try {
          const img   = await loadImage(imageSrc);
          const scale = Math.max(imgW / img.width, imgH / img.height);
          const sw = imgW / scale, sh = imgH / scale;
          const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
        } catch {
          drawPlaceholder(ctx, imgX, imgY, imgW, imgH);
        }
      } else {
        drawPlaceholder(ctx, imgX, imgY, imgW, imgH);
      }
      ctx.restore();

      // Overlay lateral sobre la imagen
      const imgOverlay = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY);
      imgOverlay.addColorStop(0.7, '#00000000');
      imgOverlay.addColorStop(1,   '#000c1f99');
      ctx.fillStyle = imgOverlay;
      ctx.beginPath();
      roundRectPath(ctx, imgX, imgY, imgW, imgH, 16);
      ctx.fill();

      // ── Zona de texto (derecha) ──
      const tx = 400, ty = 50;

      // Marca
      ctx.fillStyle = '#f5c84270';
      ctx.font      = '500 13px system-ui, sans-serif';
      ctx.fillText('🍸  Mi Bartender IA', tx, ty + 20);

      // Separador
      ctx.strokeStyle = '#f5c84230';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(tx, ty + 32); ctx.lineTo(W - 40, ty + 32);
      ctx.stroke();

      // Nombre del cóctel
      const nameFontSize = cocktailName.length > 22 ? 24 : 32;
      ctx.fillStyle = '#f5c842';
      ctx.font      = `bold ${nameFontSize}px Georgia, serif`;
      const nameLines = wrapText(ctx, cocktailName, tx, ty + 70, W - tx - 40, nameFontSize * 1.25);

      // ── Estrellas — POSICIÓN CORRECTA bajo el nombre ──
      // nameLines devuelve el Y final; usamos eso + margen
      const starsY = nameLines + 30;
      const filled = '★', empty = '☆';
      ctx.font     = '20px system-ui';
      let starX    = tx;
      for (let i = 1; i <= 5; i++) {
        ctx.fillStyle = i <= rating ? '#f5c842' : '#f5c84230';
        ctx.fillText(i <= rating ? filled : empty, starX, starsY);
        starX += 24;
      }

      // Snippet de ingredientes
      ctx.fillStyle = '#f5c84290';
      ctx.font      = '14px system-ui, sans-serif';
      const snippetY = starsY + 30;
      
      // Ajustamos el texto a mostrar
      const displaySnippet = ingredientsSnippet.replace(/\*\*/g, '').replace(/\*/g, '').substring(0, 150);
      wrapText(ctx, displaySnippet ? `${displaySnippet}...` : '', tx, snippetY, W - tx - 40, 22);

      // Tags (pills)
      const tagsY = snippetY + 80; // Ajustado ligeramente abajo
      let tagX    = tx;
      for (const tagId of tags.slice(0, 4)) {
        const tag = getTagById(tagId);
        if (!tag) continue;
        const label = `${tag.emoji} ${locale === 'es' ? tag.label : tag.labelEn}`;
        ctx.font    = '12px system-ui, sans-serif';
        const tw    = ctx.measureText(label).width + 20;

        if (tagX + tw > W - 45) break; // no overflow

        ctx.fillStyle   = '#f5c84218';
        ctx.strokeStyle = '#f5c84240';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        roundRectPath(ctx, tagX, tagsY - 14, tw, 22, 11);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#f5c842bb';
        ctx.fillText(label, tagX + 10, tagsY);
        tagX += tw + 8;
      }

      // ── Footer ──
      const footerY = H - 36;
      ctx.strokeStyle = '#f5c84220';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(40, footerY - 14); ctx.lineTo(W - 40, footerY - 14);
      ctx.stroke();

      ctx.fillStyle = '#f5c84260';
      ctx.font      = '12px Georgia, serif';
      ctx.fillText('"Beber es una necesidad, pero saber beber es un Arte."', tx, footerY);

      ctx.fillStyle   = '#f5c84240';
      ctx.font        = '11px system-ui';
      ctx.textAlign   = 'right';
      ctx.fillText('© 2026 Borrach@s y más', W - 40, footerY);
      ctx.textAlign   = 'left';

      setRendered(true);
    };

    draw();
  }, [cocktailName, imageSrc, rating, tags, ingredientsSnippet, locale]);

  // ── Descargar PNG ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !rendered) return;
    setDownloading(true);
    const link     = document.createElement('a');
    link.download  = `${cocktailName.replace(/\s+/g, '-').toLowerCase()}-bartender-ia.png`;
    link.href      = canvas.toDataURL('image/png');
    link.click();
    setTimeout(() => setDownloading(false), 1200);
  };

  // ── Compartir (Web Share API / fallback descarga) ─────────────────────────
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !rendered) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${cocktailName}-bartender-ia.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: cocktailName,
            text: locale === 'es'
              ? `¡Mira este cóctel que creé con Mi Bartender IA! 🍸`
              : `Check out this cocktail I created with My AI Bartender! 🍸`,
          });
        } catch { /* el usuario canceló */ }
      } else {
        handleDownload();
      }
    }, 'image/png');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={   { scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl
            ${isDark
              ? 'bg-[#000510] border border-[#f5c842]/20'
              : 'bg-white border border-[#8B6914]/20'}`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b
            ${isDark ? 'border-[#f5c842]/10' : 'border-[#8B6914]/10'}`}>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
                {locale === 'es' ? '📤 Compartir tarjeta' : '📤 Share card'}
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/50'}`}>
                {locale === 'es' ? 'Descarga o comparte tu creación' : 'Download or share your creation'}
              </p>
            </div>
            <button onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors
                ${isDark ? 'hover:bg-[#f5c842]/10 text-[#f5c842]/60' : 'hover:bg-[#8B6914]/10 text-[#8B6914]/60'}`}>
              ✕
            </button>
          </div>

          {/* Preview canvas */}
          <div className="p-5">
            <div className="relative rounded-xl overflow-hidden bg-black">
              {!rendered && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#000c1f] z-10" style={{ minHeight: 200 }}>
                  <div className="w-8 h-8 border-4 border-[#f5c842] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <canvas ref={canvasRef} className="w-full h-auto" style={{ opacity: rendered ? 1 : 0 }} />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 px-5 pb-5">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleDownload}
              disabled={!rendered || downloading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                transition-all disabled:opacity-50
                ${isDark ? 'bg-[#f5c842] text-[#000510] hover:bg-[#e6b830]' : 'bg-[#c9a227] text-white hover:bg-[#b8901f]'}`}
            >
              <span>{downloading ? '✓' : '⬇'}</span>
              <span>{downloading
                ? (locale === 'es' ? '¡Descargado!' : 'Downloaded!')
                : (locale === 'es' ? 'Descargar PNG' : 'Download PNG')
              }</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleShare}
              disabled={!rendered}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                transition-all disabled:opacity-50 border
                ${isDark
                  ? 'border-[#f5c842]/30 text-[#f5c842] hover:bg-[#f5c842]/10'
                  : 'border-[#8B6914]/30 text-[#8B6914] hover:bg-[#8B6914]/10'}`}
            >
              <span>↗</span>
              <span>{locale === 'es' ? 'Compartir' : 'Share'}</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Helpers de canvas ─────────────────────────────────────────────────────────

/** Dibuja un path de rectángulo redondeado (sin fill/stroke) */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}

/**
 * Dibuja texto con word-wrap y devuelve el Y final (útil para posicionar
 * elementos dinámicamente bajo el texto).
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, startY: number, maxW: number, lineH: number
): number {
  const words = text.split(' ');
  let line    = '';
  let y       = startY;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line !== '') {
      ctx.fillText(line.trim(), x, y);
      line = word + ' ';
      y   += lineH;
    } else {
      line = test;
    }
  }
  if (line.trim()) { ctx.fillText(line.trim(), x, y); y += lineH; }
  return y; // Y final tras el último renglón
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img    = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = src;
  });
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(1, '#000c1f');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle  = '#f5c84240';
  ctx.font       = '64px system-ui';
  ctx.textAlign  = 'center';
  ctx.fillText('🍸', x + w / 2, y + h / 2 + 22);
  ctx.textAlign  = 'left';
}
