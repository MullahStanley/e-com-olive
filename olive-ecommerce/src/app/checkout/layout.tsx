import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex justify-center py-32 bg-gray-50">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
