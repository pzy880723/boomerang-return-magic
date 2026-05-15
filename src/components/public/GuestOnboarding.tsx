import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface OnboardStep {
  /** 高亮目标元素 id；不传或找不到时，渲染居中插画卡 */
  targetId?: string;
  title: string;
  desc: string;
  /** 气泡相对高亮区放在上方还是下方；默认自动 */
  placement?: 'top' | 'bottom' | 'auto';
  /** 高亮形状：默认 rounded；底部 tab 用 pill */
  shape?: 'rounded' | 'pill' | 'square';
  /** 居中插画卡用的图标 */
  icon?: LucideIcon;
}

interface Props {
  steps: OnboardStep[];
  onDone: () => void;
  /** 进入页面到出现遮罩的延迟（ms） */
  startDelay?: number;
}

const SAFE_TOP = 12;
const SAFE_BOTTOM = 16;
const BUBBLE_GAP = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function readRect(id: string): Rect | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function GuestOnboarding({ steps, onDone, startDelay = 400 }: Props) {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerWidth,
  );
  const [vh, setVh] = useState(() =>
    typeof window === 'undefined' ? 0 : window.innerHeight,
  );
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [bubbleH, setBubbleH] = useState(0);

  const step = steps[stepIndex];
  const isNarrow = vw > 0 && vw < 400;
  const PADDING = isNarrow ? 6 : 8;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  // 切换步骤时主动滚动目标到视口中央
  useEffect(() => {
    if (!visible || !step?.targetId) return;
    const el = document.getElementById(step.targetId);
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      el.scrollIntoView();
    }
  }, [visible, step]);

  useLayoutEffect(() => {
    if (!visible || !step) return;
    const measure = () => {
      const r = step.targetId ? readRect(step.targetId) : null;
      setRect(r);
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    measure();
    // 等 smooth scroll 落定后再测一次
    const t1 = window.setTimeout(measure, 120);
    const t2 = window.setTimeout(measure, 360);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [visible, step]);

  // 测气泡自身高度，参与翻转决策
  useLayoutEffect(() => {
    if (!visible) return;
    if (bubbleRef.current) {
      setBubbleH(bubbleRef.current.offsetHeight);
    }
  }, [visible, stepIndex, rect, vw, vh]);

  if (!visible || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const radius =
    step.shape === 'pill' ? 9999 : step.shape === 'square' ? 8 : 16;

  const hi = rect
    ? {
        top: Math.max(0, rect.top - PADDING),
        left: Math.max(0, rect.left - PADDING),
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  // 决定气泡位置：top / bottom / sheet（贴底）
  type Mode = 'bottom' | 'top' | 'sheet' | 'center';
  let mode: Mode = 'center';
  let bubbleStyle: React.CSSProperties = {};
  const effectiveBubbleH = bubbleH || 220;

  if (hi) {
    const spaceBelow = vh - (hi.top + hi.height) - SAFE_BOTTOM - BUBBLE_GAP;
    const spaceAbove = hi.top - SAFE_TOP - BUBBLE_GAP;
    const fitsBelow = spaceBelow >= effectiveBubbleH;
    const fitsAbove = spaceAbove >= effectiveBubbleH;

    let placement: 'top' | 'bottom';
    if (step.placement === 'top') {
      placement = fitsAbove ? 'top' : fitsBelow ? 'bottom' : 'top';
    } else if (step.placement === 'bottom') {
      placement = fitsBelow ? 'bottom' : fitsAbove ? 'top' : 'bottom';
    } else {
      placement = spaceBelow >= spaceAbove ? 'bottom' : 'top';
    }

    if (!fitsAbove && !fitsBelow) {
      mode = 'sheet';
      bubbleStyle = {
        left: '50%',
        bottom: SAFE_BOTTOM,
        transform: 'translateX(-50%)',
        maxHeight: '60vh',
      };
    } else if (placement === 'bottom') {
      mode = 'bottom';
      bubbleStyle = {
        left: '50%',
        top: hi.top + hi.height + BUBBLE_GAP,
        transform: 'translateX(-50%)',
      };
    } else {
      mode = 'top';
      bubbleStyle = {
        left: '50%',
        top: Math.max(SAFE_TOP, hi.top - BUBBLE_GAP - effectiveBubbleH),
        transform: 'translateX(-50%)',
      };
    }
  } else {
    mode = 'center';
    bubbleStyle = {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      maxHeight: `calc(100vh - ${SAFE_TOP * 2}px)`,
    };
  }

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      onDone();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    onDone();
  };

  const Icon = step.icon;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="使用引导"
    >
      {/* 遮罩 + 高亮挖洞 */}
      {hi ? (
        <>
          <div
            className="absolute left-0 right-0 top-0 bg-black/60"
            style={{ height: hi.top }}
          />
          <div
            className="absolute left-0 right-0 bg-black/60"
            style={{ top: hi.top + hi.height, bottom: 0 }}
          />
          <div
            className="absolute bg-black/60"
            style={{
              top: hi.top,
              left: 0,
              width: hi.left,
              height: hi.height,
            }}
          />
          <div
            className="absolute bg-black/60"
            style={{
              top: hi.top,
              left: hi.left + hi.width,
              right: 0,
              height: hi.height,
            }}
          />
          <div
            className="absolute pointer-events-none ring-2 ring-accent/80 shadow-[0_0_0_4px_hsl(var(--accent)/0.25)]"
            style={{
              top: hi.top,
              left: hi.left,
              width: hi.width,
              height: hi.height,
              borderRadius: radius,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      )}

      {/* 气泡 / 插画卡 / 底部 sheet */}
      <div
        ref={bubbleRef}
        className={cn(
          'absolute w-[min(22rem,calc(100vw-1.5rem))]',
          'rounded-2xl bg-background text-foreground shadow-elevated ring-1 ring-border',
          'p-4 animate-in fade-in slide-in-from-bottom-2 duration-200',
          'flex flex-col',
          (mode === 'sheet' || mode === 'center') && 'overflow-hidden',
        )}
        style={{
          ...bubbleStyle,
          paddingBottom:
            mode === 'sheet'
              ? `calc(1rem + env(safe-area-inset-bottom, 0px))`
              : undefined,
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground tabular-nums">
            {stepIndex + 1} / {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all',
                  i === stepIndex ? 'w-5 bg-accent' : 'w-1.5 bg-border',
                )}
              />
            ))}
          </div>
        </div>

        <div
          className={cn(
            'flex-1',
            (mode === 'sheet' || mode === 'center') && 'overflow-y-auto -mx-1 px-1',
          )}
        >
          {mode === 'center' && Icon && (
            <div className="my-2 flex items-center justify-center">
              <span className="w-14 h-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center ring-1 ring-accent/30">
                <Icon className="w-7 h-7" strokeWidth={1.6} />
              </span>
            </div>
          )}

          <h3
            className={cn(
              'font-display tracking-tight leading-tight',
              mode === 'center' ? 'text-[18px] text-center' : 'text-base',
            )}
          >
            {step.title}
          </h3>
          <p
            className={cn(
              'mt-1.5 text-[13px] text-muted-foreground leading-relaxed',
              mode === 'center' && 'text-center',
            )}
          >
            {step.desc}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 min-h-9">
          {!isLast ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              跳过
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={handleNext} className="px-4">
            {isLast ? '开始体验' : '下一步'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
