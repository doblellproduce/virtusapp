
import * as React from 'react';
import { Suspense } from 'react';
import ContractForm from './contract-form';
import { Loader2 } from 'lucide-react';

// This is now a Server Component that acts as a shell.
export default function ContractPage() {
  return (
    // The Suspense boundary is crucial. It tells Next.js to wait for the
    // client component to load, preventing the build-time error.
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
             <div className="flex flex-col items-center gap-2 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-lg font-semibold">Cargando Contrato...</p>
                <p className="text-muted-foreground">Preparando los detalles de su reserva.</p>
            </div>
        </div>
    }>
      <ContractForm />
    </Suspense>
  );
}
