import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeImageHash } from '@/lib/imageHash';
import { compressDataUrl } from '@/lib/imageThumb';
import type { RecognitionResult, ProductCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';

const VALID_CATS: ProductCategory[] = [
  'jp_porcelain', 'eu_porcelain', 'incense', 'antique_art', 'local_craft',
  'anime_toy', 'otaku_goods', 'luxury', 'vintage_jewelry', 'game_console',
  'walkman', 'ccd', 'media_record', 'playback_device', 'home_appliance',
  'hobby', 'other',
];

export interface GuestRecognitionResult extends RecognitionResult {
  remaining?: number;
  story?: string;
  appreciation?: string;
  careTips?: string;
}

export function useGuestRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<GuestRecognitionResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const { toast } = useToast();

  const recognize = async (input: string | string[]) => {
    setIsRecognizing(true);
    setResult(null);
    try {
      // 识别前压缩：把任意大小的原图缩到 ~1024px / 0.7 jpeg，
      // 减小 base64 体积、加快上行速度。多张并行处理。
      const compressed = Array.isArray(input)
        ? await Promise.all(input.map((src) => compressDataUrl(src)))
        : [await compressDataUrl(input)];
      const firstImage = compressed[0];
      const imageHash = firstImage ? await computeImageHash(firstImage) : null;
      const body: Record<string, unknown> =
        compressed.length > 1
          ? { imageBase64: compressed[0], images: compressed }
          : { imageBase64: compressed[0] };
      if (imageHash) body.imageHash = imageHash;

      const { data, error } = await supabase.functions.invoke('recognize-product-public', { body });

      if (error) {
        const msg = (error as any)?.message || '识别失败';
        toast({ title: '识别失败', description: msg, variant: 'destructive' });
        return null;
      }
      if (data?.error) {
        toast({ title: '识别未完成', description: data.error, variant: 'destructive' });
        if (typeof data.remaining === 'number') setRemaining(data.remaining);
        return null;
      }

      const category: ProductCategory = VALID_CATS.includes(data.category) ? data.category : 'other';
      const out: GuestRecognitionResult = {
        name: data.name || '未知商品',
        category,
        era: data.era || undefined,
        origin: data.origin || undefined,
        material: data.material || undefined,
        craft: data.craft || undefined,
        description: data.description || undefined,
        sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [],
        pitch: data.pitch && typeof data.pitch === 'object' ? data.pitch : undefined,
        tips: data.tips,
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.7,
        rarity: typeof data.rarity === 'number' ? data.rarity : undefined,
        collectionValue: typeof data.collectionValue === 'string' ? data.collectionValue : undefined,
        marketValue: typeof data.marketValue === 'string' ? data.marketValue : undefined,
        buyReason: typeof data.buyReason === 'string' ? data.buyReason : undefined,
        imageHash: data.imageHash || imageHash || undefined,
        fromCache: !!data.fromCache,
        cacheSource: data.cacheSource,
        cachedAt: data.cachedAt,
        cachedProductId: data.cachedProductId,
        __pipeline: data.__pipeline,
        remaining: typeof data.remaining === 'number' ? data.remaining : undefined,
        story: typeof data.story === 'string' ? data.story : undefined,
        appreciation: typeof data.appreciation === 'string' ? data.appreciation : undefined,
        careTips: typeof data.careTips === 'string' ? data.careTips : undefined,
      };
      setResult(out);
      if (typeof data.remaining === 'number') setRemaining(data.remaining);
      return out;
    } catch (e: any) {
      toast({ title: '识别失败', description: e?.message || '请重试', variant: 'destructive' });
      return null;
    } finally {
      setIsRecognizing(false);
    }
  };

  const clear = () => setResult(null);

  return { isRecognizing, result, remaining, recognize, clear };
}
