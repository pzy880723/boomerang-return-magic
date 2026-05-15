import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SINGLE_STEPS,
  buildMultiSteps,
  currentStepIndex,
  type NarrativeStep,
} from '@/lib/recognitionNarrative';

interface Props {
  image: string | null;
  imageCount?: number;
  /** 失败时显示的错误信息（含失败时切换到失败态 UI） */
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

/** 拍完→结果页之间的"AI 在思考"骨架页：模糊大图 + 渐进叙事 + 内容骨架。 */
export function RevealSkeleton({ image, imageCount = 1, error, onRetry, onCancel }: Props) {
  const steps: NarrativeStep[] = imageCount > 1 ? buildMultiSteps(imageCount) : SINGLE_STEPS;
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (error) return; // 失败后停止计时
    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [error]);

  const idx = currentStepIndex(steps, elapsed);

  return (
    <div className="container max-w-screen-md py-3 space-y-5">
      {/* Hero：模糊照片 + 扫描线 + 顶层叙事 */}
      <section className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden ring-1 ring-border/50 shadow-elevated bg-neutral-900 animate-scale-in">
        {image ? (
          <img
            src={image}
            alt="正在识别"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
        )}
        {/* 暗化层 */}
        <div className="absolute inset-0 bg-black/40" />
        {/* 扫描线（accent → 透明，垂直循环） */}
        {!error && (
          <div
            className="absolute inset-x-0 h-24 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--accent) 35%, transparent), transparent)',
              animation: 'reveal-scan 2.4s ease-in-out infinite',
            }}
          />
        )}
        <style>{`
          @keyframes reveal-scan {
            0%   { transform: translateY(-100%); opacity: 0.3; }
            45%  { opacity: 0.85; }
            100% { transform: translateY(420%); opacity: 0; }
          }
        `}</style>

        {/* 顶部小标 */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur text-white/90 text-[11px] font-medium flex items-center gap-1.5">
            {error ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                识别未成功
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-accent" />
                AI 正在识别
              </>
            )}
          </div>
          <div className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur text-white/70 text-[11px] tabular-nums">
            {(elapsed / 1000).toFixed(1)}s
          </div>
        </div>

        {/* 中央叙事步骤 */}
        <div className="absolute inset-0 flex items-end p-5 sm:p-6">
          <div className="w-full max-w-[20rem] text-white space-y-2.5">
            {error ? (
              <div className="space-y-3">
                <p className="font-display text-[18px] leading-tight">{error}</p>
                <div className="flex gap-2">
                  {onRetry && (
                    <Button size="sm" onClick={onRetry} className="bg-white text-neutral-900 hover:bg-white/90">
                      再试一次
                    </Button>
                  )}
                  {onCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancel}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> 重新拍一张
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {steps.map((step, i) => {
                  const done = i < idx;
                  const active = i === idx;
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-2.5 text-[13px] leading-tight transition-all duration-200 ${
                        done ? 'text-accent' : active ? 'text-white' : 'text-white/35'
                      }`}
                    >
                      <span
                        className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                          done
                            ? 'bg-accent/15 ring-1 ring-accent/40'
                            : active
                              ? 'bg-white/10 ring-1 ring-white/30'
                              : 'ring-1 ring-white/15'
                        }`}
                      >
                        {done ? (
                          <Check className="w-2.5 h-2.5 text-accent animate-scale-in" strokeWidth={3} />
                        ) : active ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" strokeWidth={2.5} />
                        ) : null}
                      </span>
                      <span className="truncate">
                        {step.label}
                        {active && <span className="inline-block ml-1 animate-pulse">···</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 标题骨架 */}
      <div className="space-y-2 px-1">
        <div className="h-2.5 w-28 bg-muted rounded animate-pulse" />
        <div className="h-7 w-3/4 bg-muted rounded animate-pulse" style={{ animationDelay: '120ms' }} />
      </div>

      {/* 估值卡骨架 */}
      <div
        className="rounded-3xl bg-gradient-to-br from-accent/10 via-muted/40 to-muted/40 ring-1 ring-accent/20 p-5 sm:p-6 space-y-4 animate-pulse"
        style={{ animationDelay: '240ms' }}
      >
        <div className="h-2.5 w-32 bg-muted-foreground/20 rounded" />
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="h-2.5 w-20 bg-muted-foreground/20 rounded" />
            <div className="h-8 w-32 bg-muted-foreground/25 rounded" />
            <div className="h-2.5 w-28 bg-muted-foreground/15 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-16 bg-muted-foreground/20 rounded" />
            <div className="h-5 w-24 bg-muted-foreground/25 rounded" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-20 bg-muted-foreground/15 rounded-full" />
          <div className="h-6 w-20 bg-muted-foreground/15 rounded-full" />
        </div>
      </div>

      {/* Meta 网格骨架 */}
      <div className="px-1 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border/60 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5 animate-pulse" style={{ animationDelay: `${300 + i * 80}ms` }}>
            <div className="h-2 w-12 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* 故事段骨架 */}
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="pl-[38px] space-y-2">
          {[100, 95, 88, 70].map((w, i) => (
            <div
              key={i}
              className="h-3.5 bg-muted rounded animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${500 + i * 90}ms` }}
            />
          ))}
        </div>
      </div>

      {/* 看点骨架 */}
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="pl-[38px] space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5 animate-pulse" style={{ animationDelay: `${720 + i * 100}ms` }}>
              <div className="h-2.5 w-16 bg-muted rounded" />
              <div className="h-3.5 w-full bg-muted rounded" />
              <div className="h-3.5 w-4/5 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {!error && (
        <p className="text-center text-[11px] text-muted-foreground/70 tracking-wide pt-1">
          通常 2-4 秒，复杂物件可能稍久
        </p>
      )}
    </div>
  );
}
