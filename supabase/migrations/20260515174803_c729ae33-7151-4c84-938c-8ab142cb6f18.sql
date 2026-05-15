
-- ===== community_posts =====
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  product_id uuid,
  image_url text,
  thumbnail_url text,
  name text not null,
  category text not null default 'other',
  era text,
  origin text,
  material text,
  craft text,
  dimensions text,
  condition text,
  selling_points jsonb default '[]'::jsonb,
  tips text,
  story text,
  appreciation text,
  description text,
  care_tips text,
  confidence numeric,
  rarity int,
  collection_value text,
  market_value text,
  buy_reason text,
  is_public boolean not null default true,
  is_guest boolean not null default true,
  guest_name text default '游客',
  likes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_posts_public_idx on public.community_posts (is_public, is_guest, created_at desc);
create index community_posts_category_idx on public.community_posts (category, created_at desc);

alter table public.community_posts enable row level security;

create policy "Public posts readable by anon"
  on public.community_posts for select
  using (is_public = true);

-- 写入只走 service role / edge function

-- ===== guest_daily_usage =====
create table public.guest_daily_usage (
  ip_hash text not null,
  usage_date date not null,
  recognize_count int not null default 0,
  share_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (ip_hash, usage_date)
);
alter table public.guest_daily_usage enable row level security;
-- 仅 service role 访问，无 policy 即可

-- ===== app_settings =====
create table public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

create policy "Settings readable by anon"
  on public.app_settings for select
  using (true);

insert into public.app_settings (key, value) values
  ('guest_limits', '{"enabled": true, "recognize_per_day": 30, "share_per_day": 5}'::jsonb)
on conflict (key) do nothing;

-- ===== updated_at trigger helper =====
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger community_posts_touch_updated_at
  before update on public.community_posts
  for each row execute function public.touch_updated_at();

create trigger app_settings_touch_updated_at
  before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- ===== 公共图片存储桶 =====
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
