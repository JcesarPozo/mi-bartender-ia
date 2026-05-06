/**
 * exportCatalogPdf.ts
 * Genera y descarga el catálogo de cócteles en PDF usando @react-pdf/renderer.
 * La generación ocurre íntegramente en el navegador — sin ventanas emergentes.
 */
import React from 'react';

export interface CocktailForExport {
  id: string;
  name: string;
  recipe: string;
  image_path: string | null;
  created_at: string;
}

/** Convierte una URL de imagen en una base64 data URI para incrustarla en el PDF. */
async function toBase64(url: string): Promise<string | null> {
  if (!url || url.includes('default-cocktail')) return null;
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Descarga un Blob como archivo. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportCatalogPdf(
  cocktails: CocktailForExport[],
  locale: 'es' | 'en' = 'es'
): Promise<void> {
  if (cocktails.length === 0) return;

  // ── 1. Pre-cargar imágenes como base64 en paralelo ────────────────────────
  const imageMap = new Map<string, string>();
  await Promise.all(
    cocktails.map(async (c) => {
      if (c.image_path) {
        const b64 = await toBase64(c.image_path);
        if (b64) imageMap.set(c.id, b64);
      }
    })
  );

  // ── 2. Preparar datos para el documento ────────────────────────────────────
  const dateFormat: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
  const generatedDate = new Date().toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US', dateFormat
  );
  const footerBrand = locale === 'es' ? 'Mi Bartender IA' : 'My AI Bartender';
  const filename    = locale === 'es'
    ? `catalogo-cocteles-${new Date().toISOString().slice(0, 10)}.pdf`
    : `cocktail-catalog-${new Date().toISOString().slice(0, 10)}.pdf`;

  const items = cocktails.map((c) => ({
    id:       c.id,
    name:     c.name,
    recipe:   c.recipe,
    imageSrc: imageMap.get(c.id) ?? null,
    date:     new Date(c.created_at).toLocaleDateString(
      locale === 'es' ? 'es-ES' : 'en-US',
      { day: '2-digit', month: 'short', year: 'numeric' }
    ),
  }));

  // ── 3. Importar @react-pdf/renderer dinámicamente (evita errores SSR) ──────
  const { pdf }                         = await import('@react-pdf/renderer');
  const { CatalogDocument }             = await import('./CatalogPdfDocument');

  // ── 4. Generar el PDF como Blob ────────────────────────────────────────────
  const element = React.createElement(CatalogDocument, {
    cocktails:     items,
    locale,
    generatedDate,
    footerBrand,
  });

  //const blob = await pdf(element).toBlob();
  const blob = await pdf(element as any).toBlob();

  // ── 5. Descargar ───────────────────────────────────────────────────────────
  downloadBlob(blob, filename);
}
