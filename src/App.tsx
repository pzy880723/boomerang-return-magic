import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';

const PublicLayout = lazy(() =>
  import('@/components/layout/PublicLayout').then((m) => ({ default: m.PublicLayout })),
);
const PublicScan = lazy(() => import('@/pages/public/PublicScan'));
const PublicResult = lazy(() => import('@/pages/public/PublicResult'));
const PublicCommunity = lazy(() => import('@/pages/public/PublicCommunity'));
const PublicAbout = lazy(() => import('@/pages/public/PublicAbout'));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  // 客户端挂载后再渲染 BrowserRouter，避免 SSR 时访问 window
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <RouteFallback />;

  return (
    <ErrorBoundary scope="app">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/u" replace />} />
              <Route path="/u" element={<PublicLayout />}>
                <Route index element={<PublicScan />} />
                <Route path="result" element={<PublicResult />} />
                <Route path="community" element={<PublicCommunity />} />
                <Route path="about" element={<PublicAbout />} />
              </Route>
              <Route path="*" element={<Navigate to="/u" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
