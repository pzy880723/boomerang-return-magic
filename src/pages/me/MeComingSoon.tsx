import { Link } from "@tanstack/react-router";
import { Construction, ArrowLeft } from "lucide-react";

export default function MeComingSoon({ title }: { title: string }) {
  return (
    <div className="container max-w-md pt-10 pb-12">
      <Link to="/me" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /> 返回我的
      </Link>
      <div className="flex flex-col items-center text-center py-16">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Construction className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-lg">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">该功能即将上线，敬请期待</p>
      </div>
    </div>
  );
}
