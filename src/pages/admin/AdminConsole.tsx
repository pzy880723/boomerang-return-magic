import { useCallback, useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_LABELS, ProductCategory } from '@/types';
import { ArrowLeft, ImageOff, Loader2, LogOut, Lock, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { verifyAdminPassword, adminDeletePost } from '@/lib/admin.functions';

const STORAGE_KEY = 'admin_pwd';

interface Post {
  id: string;
  image_url: string | null;
  thumbnail_url: string | null;
  name: string;
  category: ProductCategory;
  era: string | null;
  origin: string | null;
  created_at: string;
  is_guest: boolean | null;
  guest_name: string | null;
}

const cats: Array<ProductCategory | 'all'> = [
  'all', 'jp_porcelain', 'eu_porcelain', 'anime_toy', 'luxury', 'walkman', 'ccd', 'other',
];

export default function AdminConsole() {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPassword(window.sessionStorage.getItem(STORAGE_KEY));
    }
  }, []);

  if (!password) {
    return <PasswordGate onSuccess={(pwd) => {
      window.sessionStorage.setItem(STORAGE_KEY, pwd);
      setPassword(pwd);
    }} />;
  }

  return <PostManager password={password} onLogout={() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setPassword(null);
  }} />;
}

function PasswordGate({ onSuccess }: { onSuccess: (pwd: string) => void }) {
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verify = useServerFn(verifyAdminPassword);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verify({ data: { password: pwd } });
      if (res.ok) {
        onSuccess(pwd);
      } else {
        setError('密码不正确');
      }
    } catch {
      setError('校验失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-screen-sm py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> 返回首页
      </Link>
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <h1 className="font-display text-lg tracking-tight">管理后台</h1>
            <p className="text-xs text-muted-foreground">请输入管理员密码</p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="密码"
              autoFocus
              disabled={loading}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !pwd.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '进入'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PostManager({ password, onLogout }: { password: string; onLogout: () => void }) {
  const PAGE_SIZE = 24;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cat, setCat] = useState<ProductCategory | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const deleteFn = useServerFn(adminDeletePost);

  const fetchPage = useCallback(async (offset: number) => {
    let q = supabase.from('community_posts')
      .select('id,image_url,thumbnail_url,name,category,era,origin,created_at,is_guest,guest_name')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (cat !== 'all') q = q.eq('category', cat);
    const { data } = await q;
    return (data || []) as Post[];
  }, [cat]);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchPage(0);
    setPosts(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }, [fetchPage]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const rows = await fetchPage(posts.length);
    setPosts((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteFn({ data: { password, postId: pendingDelete.id } });
      setPosts((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast({ title: '已删除', description: pendingDelete.name });
      setPendingDelete(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除失败';
      if (msg.includes('Unauthorized')) {
        toast({ title: '密码已失效', description: '请重新登录', variant: 'destructive' });
        onLogout();
      } else {
        toast({ title: '删除失败', description: msg, variant: 'destructive' });
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container max-w-screen-md py-4 space-y-4">
      <header className="flex items-center justify-between gap-3 px-1">
        <div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground/80">Admin</div>
          <h1 className="font-display text-[22px] leading-tight tracking-tight">中古圈管理</h1>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} className="gap-1.5">
          <LogOut className="w-3.5 h-3.5" /> 退出
        </Button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 pb-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 px-3.5 py-1.5 text-[12px] rounded-full transition-all ${
              cat === c
                ? 'bg-foreground text-background font-medium shadow-soft'
                : 'bg-card text-muted-foreground ring-1 ring-border/60 hover:text-foreground'
            }`}
          >
            {c === 'all' ? '全部' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="masonry-2col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="masonry-item rounded-2xl bg-muted animate-pulse"
              style={{ height: 160 + (i % 3) * 60 }}
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">该分类下还没有内容</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-[11.5px] text-muted-foreground px-1">共 {posts.length} 条{hasMore ? '+' : ''}</div>
          <div className="masonry-2col">
            {posts.map((post) => {
              const src = post.thumbnail_url || post.image_url;
              return (
                <div
                  key={post.id}
                  className="masonry-item relative rounded-2xl overflow-hidden bg-card ring-1 ring-border/50 shadow-soft"
                >
                  <div className="relative">
                    {src ? (
                      <img
                        src={src}
                        alt={post.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto block bg-muted"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-[10px] font-medium ring-1 ring-border/60">
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    <button
                      onClick={() => setPendingDelete(post)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center shadow-soft transition-colors"
                      aria-label="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-[13px] font-medium leading-snug line-clamp-2">{post.name}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1 tracking-wide">
                      {post.guest_name || '游客'} · {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-3 pb-1">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-5 h-10 rounded-full bg-card ring-1 ring-border/60 text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                {loadingMore ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && !deleting && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除这条内容？</AlertDialogTitle>
            <AlertDialogDescription>
              「{pendingDelete?.name}」将从中古圈中永久移除，无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
