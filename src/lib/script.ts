// 话术归一化工具
export type SellingTag = '身世' | '工艺' | '稀缺' | '场景' | '趣味';

export interface SellingPoint {
  tag: SellingTag;
  text: string;
}

const VALID_TAGS: SellingTag[] = ['身世', '工艺', '稀缺', '场景', '趣味'];

export function normalizeSellingPoints(raw: unknown): SellingPoint[] {
  if (!Array.isArray(raw)) return [];
  const out: SellingPoint[] = [];
  for (const item of raw) {
    if (!item) continue;
    if (typeof item === 'string') {
      const t = item.trim();
      if (t) out.push({ tag: '工艺', text: t });
    } else if (typeof item === 'object') {
      const obj = item as { tag?: unknown; text?: unknown };
      const text = typeof obj.text === 'string' ? obj.text.trim() : '';
      if (!text) continue;
      const tag = (typeof obj.tag === 'string' && VALID_TAGS.includes(obj.tag as SellingTag))
        ? (obj.tag as SellingTag)
        : '工艺';
      out.push({ tag, text });
    }
  }
  return out;
}
