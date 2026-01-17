import { Suspense } from 'react';
import TitleScreen from '@/components/TitleScreen';

function TitleScreenWrapper() {
  return <TitleScreen />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <TitleScreenWrapper />
    </Suspense>
  );
}
