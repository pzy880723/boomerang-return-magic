import type { LucideIcon } from 'lucide-react';
import {
  Cherry, Crown, Flame, Landmark, MapPin, ToyBrick, Sparkles, Gem, Diamond,
  Gamepad2, Headphones, Camera, Disc3, Radio, Tv, Puzzle, Package,
} from 'lucide-react';

export type AppRole = 'admin' | 'anchor';

export type ProductCategory =
  | 'jp_porcelain' | 'eu_porcelain' | 'incense' | 'antique_art' | 'local_craft'
  | 'anime_toy' | 'otaku_goods' | 'luxury' | 'vintage_jewelry' | 'game_console'
  | 'walkman' | 'ccd' | 'media_record' | 'playback_device' | 'home_appliance'
  | 'hobby' | 'other'
  | 'porcelain' | 'stationery' | 'lacquerware' | 'bronze' | 'woodcraft'
  | 'textile' | 'jewelry' | 'painting';

export interface RecognitionResult {
  name: string;
  category: ProductCategory;
  era?: string;
  origin?: string;
  material?: string;
  craft?: string;
  dimensions?: string;
  condition?: string;
  description?: string;
  sellingPoints?: Array<string | { tag: string; text: string }>;
  pitch?: { opener: string; highlight: string; story?: string };
  tips?: string | { memory?: string; objection?: string };
  confidence?: number;
  rarity?: number;
  collectionValue?: string;
  marketValue?: string;
  buyReason?: string;
  imageHash?: string;
  fromCache?: boolean;
  cacheSource?: string;
  cachedAt?: string;
  cachedProductId?: string;
  __pipeline?: {
    source: 'hash_cache' | 'name_cache' | 'lovable_gemini';
    model?: string;
    cacheSource?: string;
    webSearchEnabled?: boolean;
    webSearchUsed?: boolean;
    aiTimeMs?: number;
  };
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jp_porcelain: '日瓷', eu_porcelain: '欧瓷', incense: '线香',
  antique_art: '古美术', local_craft: '本地特色', anime_toy: '动漫玩具',
  otaku_goods: '二次元周边', luxury: '奢侈品', vintage_jewelry: '中古首饰',
  game_console: '游戏机', walkman: '随身听', ccd: 'CCD',
  media_record: '音像制品', playback_device: '播放设备', home_appliance: '家用电器',
  hobby: '兴趣爱好', other: '其他',
  porcelain: '瓷器', stationery: '文房四宝', lacquerware: '漆器',
  bronze: '铜器', woodcraft: '木器', textile: '织物/布艺',
  jewelry: '首饰/饰品', painting: '书画',
};

export const CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  jp_porcelain: Cherry, eu_porcelain: Crown, incense: Flame,
  antique_art: Landmark, local_craft: MapPin, anime_toy: ToyBrick,
  otaku_goods: Sparkles, luxury: Gem, vintage_jewelry: Diamond,
  game_console: Gamepad2, walkman: Headphones, ccd: Camera,
  media_record: Disc3, playback_device: Radio, home_appliance: Tv,
  hobby: Puzzle, other: Package,
  porcelain: Cherry, stationery: Package, lacquerware: Package,
  bronze: Package, woodcraft: Package, textile: Package,
  jewelry: Diamond, painting: Package,
};
