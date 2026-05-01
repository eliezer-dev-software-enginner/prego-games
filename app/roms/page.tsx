// app/roms/RomPageContent.tsx

import RomPageContent from './RomPageContent';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RomPageContent />
    </Suspense>
  );
}
