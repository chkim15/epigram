"use client";

import { CheckCircle, X } from "lucide-react";
import UnifiedHeader from "@/components/layout/UnifiedHeader";

interface AppShellProps {
  children: React.ReactNode;
  showCheckoutSuccess?: boolean;
  onDismissCheckout?: () => void;
}

export default function AppShell({
  children,
  showCheckoutSuccess = false,
  onDismissCheckout,
}: AppShellProps) {
  return (
    <div className="w-full h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      {/* Checkout Success Banner */}
      {showCheckoutSuccess && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            backgroundColor: '#141310',
            color: '#ffffff',
            maxWidth: '90%',
          }}
        >
          <CheckCircle size={20} style={{ color: '#10b981' }} />
          <div>
            <p className="font-semibold text-sm">Payment successful!</p>
            <p className="text-xs" style={{ opacity: 0.8 }}>
              Your subscription is being activated. This may take a few seconds...
            </p>
          </div>
          <button
            onClick={onDismissCheckout}
            className="ml-4 p-1 rounded hover:bg-white/10 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <UnifiedHeader />

      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
