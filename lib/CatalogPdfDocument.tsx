/**
 * CatalogPdfDocument.tsx
 * Documento React PDF del catálogo de cócteles.
 * Usa @react-pdf/renderer — NO usa HTML ni CSS del navegador.
 */
import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer';

// Extraemos el tipo Style del propio StyleSheet — sin importar paquetes externos
type PdfStyle = ReturnType<typeof StyleSheet.create>[string];

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface CocktailPdfItem {
  id: string;
  name: string;
  recipe: string;
  imageSrc: string | null;
  date: string;
}

// ── Parser de Markdown → bloques estructurados ───────────────────────────────
type Run  = { text: string; bold?: boolean; italic?: boolean };
type Block =
  | { type: 'h2';       runs: Run[] }
  | { type: 'h3';       runs: Run[] }
  | { type: 'bullet';   runs: Run[] }
  | { type: 'numbered'; n: number; runs: Run[] }
  | { type: 'para';     runs: Run[] }
  | { type: 'blank' };

function stripEmoji(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu,   '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\uFE00-\uFE0F]/g,        '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseInline(raw: string): Run[] {
  const runs: Run[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) runs.push({ text: raw.slice(last, m.index) });
    if (m[1] != null)      runs.push({ text: m[1], bold: true });
    else if (m[2] != null) runs.push({ text: m[2], italic: true });
    last = m.index + m[0].length;
  }
  if (last < raw.length) runs.push({ text: raw.slice(last) });
  return runs
    .map(r => ({ ...r, text: stripEmoji(r.text) }))
    .filter(r => r.text.length > 0);
}

function parseMarkdown(md: string): Block[] {
  return md.split('\n').reduce<Block[]>((acc, rawLine) => {
    const line = stripEmoji(rawLine);
    if (!line.trim()) { acc.push({ type: 'blank' }); return acc; }

    const h1 = line.match(/^#{1}\s+(.+)$/);
    if (h1)  { acc.push({ type: 'h2', runs: parseInline(h1[1]) }); return acc; }

    const h23 = line.match(/^#{2,}\s+(.+)$/);
    if (h23) { acc.push({ type: 'h3', runs: parseInline(h23[1]) }); return acc; }

    const bullet = line.match(/^[-•*]\s+(.+)$/);
    if (bullet) { acc.push({ type: 'bullet', runs: parseInline(bullet[1]) }); return acc; }

    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      acc.push({ type: 'numbered', n: parseInt(numbered[1]), runs: parseInline(numbered[2]) });
      return acc;
    }
    acc.push({ type: 'para', runs: parseInline(line) });
    return acc;
  }, []);
}

// ── Paleta de colores ─────────────────────────────────────────────────────────
const C = {
  gold:        '#f5c842',
  goldFaint:   'rgba(245,200,66,0.25)',
  goldMuted:   'rgba(245,200,66,0.65)',
  navy:        '#000810',
  amberDark:   '#6b4f0a',
  amberMid:    '#8b6914',
  bodyText:    '#2a1f00',
  border:      '#e8dfc0',
  pageBg:      '#ffffff',
  coverFooter: 'rgba(245,200,66,0.33)',
  footerLine:  '#e8dfc0',
  mutedGray:   '#aaaaaa',
  warmBg:      '#fdf8ec',
} as const;

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  coverPage:       { backgroundColor: C.navy, padding: 0 },
  coverInner:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60 },
  coverTitle:      { fontFamily: 'Times-Roman', fontSize: 34, color: C.gold, textAlign: 'center', marginBottom: 10, letterSpacing: 1.5 },
  coverDivider:    { width: 56, height: 1.5, backgroundColor: C.gold, opacity: 0.45, marginVertical: 18 },
  coverDate:       { fontFamily: 'Helvetica', fontSize: 12, color: C.goldMuted, textAlign: 'center', marginBottom: 28 },
  coverBadge:      { borderWidth: 1, borderColor: C.goldFaint, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 9 },
  coverBadgeText:  { fontFamily: 'Helvetica', fontSize: 11, color: C.goldMuted, textAlign: 'center' },
  coverFooter:     { position: 'absolute', bottom: 22, left: 0, right: 0, alignItems: 'center' },
  coverFooterText: { fontFamily: 'Helvetica', fontSize: 8, color: C.coverFooter },

  page:            { backgroundColor: C.pageBg, paddingHorizontal: 42, paddingTop: 36, paddingBottom: 48 },

  cardHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  cocktailImg:     { width: 128, height: 128, borderRadius: 10, marginRight: 18, backgroundColor: C.warmBg, objectFit: 'cover' },
  imgPlaceholder:  { width: 128, height: 128, borderRadius: 10, marginRight: 18, backgroundColor: C.warmBg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  imgPlaceholderText: { fontFamily: 'Helvetica', fontSize: 8, color: C.amberMid },
  titleBlock:      { flex: 1, paddingTop: 4 },
  cocktailName:    { fontFamily: 'Times-Roman', fontSize: 24, color: C.amberDark, lineHeight: 1.25, marginBottom: 7 },
  cocktailDate:    { fontFamily: 'Helvetica', fontSize: 9, color: C.amberMid },

  recipeBody:      { flex: 1 },
  h2:              { fontFamily: 'Times-Bold',   fontSize: 13, color: C.amberDark, marginTop: 11, marginBottom: 4 },
  h3:              { fontFamily: 'Times-Bold',   fontSize: 11, color: C.amberDark, marginTop: 8,  marginBottom: 3 },
  para:            { fontFamily: 'Helvetica',    fontSize: 10, color: C.bodyText,  marginBottom: 3, lineHeight: 1.55 },
  bulletRow:       { flexDirection: 'row', marginBottom: 2.5, paddingLeft: 6 },
  bulletDot:       { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.gold, width: 13, lineHeight: 1.4 },
  bulletText:      { fontFamily: 'Helvetica', fontSize: 10, color: C.bodyText, flex: 1, lineHeight: 1.55 },
  numberedRow:     { flexDirection: 'row', marginBottom: 2.5, paddingLeft: 2 },
  numberedN:       { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.gold, width: 18, lineHeight: 1.55 },
  numberedText:    { fontFamily: 'Helvetica', fontSize: 10, color: C.bodyText, flex: 1, lineHeight: 1.55 },
  bold:            { fontFamily: 'Helvetica-Bold' },
  italic:          { fontFamily: 'Helvetica-Oblique' },

  footer:          { position: 'absolute', bottom: 18, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: C.footerLine, paddingTop: 5 },
  footerLeft:      { fontFamily: 'Helvetica', fontSize: 7.5, color: C.mutedGray },
  footerRight:     { fontFamily: 'Helvetica', fontSize: 7.5, color: C.mutedGray },
});

// ── Componentes de renderizado ────────────────────────────────────────────────

function Runs({ runs, base }: { runs: Run[]; base: PdfStyle }) {
  if (!runs.length) return null;
  return (
    <Text style={base}>
      {runs.map((r, i) =>
        r.bold   ? <Text key={i} style={S.bold}>{r.text}</Text>   :
        r.italic ? <Text key={i} style={S.italic}>{r.text}</Text> :
                   <Text key={i}>{r.text}</Text>
      )}
    </Text>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'blank')    return null;
        if (b.type === 'h2')      return <Runs key={i} runs={b.runs} base={S.h2} />;
        if (b.type === 'h3')      return <Runs key={i} runs={b.runs} base={S.h3} />;
        if (b.type === 'para')    return <Runs key={i} runs={b.runs} base={S.para} />;
        if (b.type === 'bullet')  return (
          <View key={i} style={S.bulletRow}>
            <Text style={S.bulletDot}>{'\u2022'}</Text>
            <Runs runs={b.runs} base={S.bulletText} />
          </View>
        );
        if (b.type === 'numbered') return (
          <View key={i} style={S.numberedRow}>
            <Text style={S.numberedN}>{b.n}.</Text>
            <Runs runs={b.runs} base={S.numberedText} />
          </View>
        );
        return null;
      })}
    </>
  );
}

// ── Documento principal ───────────────────────────────────────────────────────
export interface CatalogDocumentProps {
  cocktails:     CocktailPdfItem[];
  locale:        'es' | 'en';
  generatedDate: string;
  footerBrand:   string;
}

export function CatalogDocument({ cocktails, locale, generatedDate, footerBrand }: CatalogDocumentProps) {
  const title = locale === 'es' ? 'Mi Catálogo de Cócteles' : 'My Cocktail Catalog';
  const count = cocktails.length;
  const countLabel = locale === 'es'
    ? `${count} cóctel${count !== 1 ? 'es' : ''} guardado${count !== 1 ? 's' : ''}`
    : `${count} cocktail${count !== 1 ? 's' : ''} saved`;

  return (
    <Document title={title} author="Mi Bartender IA" language={locale} creator="Mi Bartender IA">

      {/* ── Portada ── */}
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverInner}>
          <Text style={S.coverTitle}>{title}</Text>
          <View style={S.coverDivider} />
          <Text style={S.coverDate}>{generatedDate}</Text>
          <View style={S.coverBadge}>
            <Text style={S.coverBadgeText}>{countLabel}</Text>
          </View>
        </View>
        <View style={S.coverFooter}>
          <Text style={S.coverFooterText}>{footerBrand}</Text>
        </View>
      </Page>

      {/* ── Una página por cóctel ── */}
      {cocktails.map((c) => {
        const blocks   = parseMarkdown(c.recipe);
        const safeName = stripEmoji(c.name);
        return (
          <Page key={c.id} size="A4" style={S.page}>
            <View style={S.cardHeader}>
              {c.imageSrc ? (
                <Image src={c.imageSrc} style={S.cocktailImg} />
              ) : (
                <View style={S.imgPlaceholder}>
                  <Text style={S.imgPlaceholderText}>Sin imagen</Text>
                </View>
              )}
              <View style={S.titleBlock}>
                <Text style={S.cocktailName}>{safeName}</Text>
                <Text style={S.cocktailDate}>{c.date}</Text>
              </View>
            </View>

            <View style={S.recipeBody}>
              <Blocks blocks={blocks} />
            </View>

            <View style={S.footer} fixed>
              <Text style={S.footerLeft}>{footerBrand}</Text>
              <Text
                style={S.footerRight}
                render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
              />
            </View>
          </Page>
        );
      })}

    </Document>
  );
}
