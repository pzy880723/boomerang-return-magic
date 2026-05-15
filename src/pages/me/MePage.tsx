import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { User as UserIcon, Heart, History, Bell, Settings, ChevronRight, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const ENTRIES = [
  { to: "/me/profile", label: "我的主页", Icon: UserIcon, hint: "我发的中古好物" },
  { to: "/me/favorites", label: "我的收藏", Icon: Heart, hint: "收藏的中古好物" },
  { to: "/me/history", label: "识别历史", Icon: History, hint: "我拍过的物件" },
  { to: "/me/notifications", label: "互动消息", Icon: Bell, hint: "点赞 / 评论 / @我" },
  { to: "/me/settings", label: "账号设置", Icon: Settings, hint: "改昵称 / 头像" },
] as const;

export default function MePage() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const nickname = profile?.nickname ?? "中古er";
  const avatarChar = nickname.slice(0, 1);

  return (
    <div className="container max-w-md pt-6 pb-12">
      {/* 头部信息卡 */}
      <div className="rounded-2xl bg-gradient-accent p-5 text-foreground">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={nickname} className="w-16 h-16 rounded-full object-cover ring-2 ring-background/40" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-background/30 backdrop-blur flex items-center justify-center font-display text-2xl">
              {avatarChar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg truncate">{nickname}</div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {profile?.bio ?? "还没有简介，去设置一个吧"}
            </div>
          </div>
          <Link to="/me/settings" className="shrink-0">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* 功能入口 */}
      <ul className="mt-5 rounded-xl border border-border/50 divide-y divide-border/40 bg-background overflow-hidden">
        {ENTRIES.map(({ to, label, Icon, hint }) => (
          <li key={to}>
            <Link to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors">
              <Icon className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.6} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-[11px] text-muted-foreground">{hint}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            </Link>
          </li>
        ))}
      </ul>

      <Button
        variant="ghost"
        onClick={async () => { await signOut(); navigate({ to: "/" }); }}
        className="mt-6 w-full text-muted-foreground"
      >
        <LogOut className="w-4 h-4 mr-1.5" /> 退出登录
      </Button>
    </div>
  );
}
