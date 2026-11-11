"use client";

import React, { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import { OrderWorkspace } from "@/components/orders/OrderWorkspace";
import { decodeOrderPreviewPayload } from "@/lib/orders/preview-link";

function ClientOrderPreviewContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const orderId = params?.id ? decodeURIComponent(String(params.id)) : undefined;
  const encodedData = searchParams?.get("d");

  const previewData = useMemo(
    () => decodeOrderPreviewPayload(encodedData),
    [encodedData],
  );

  return (
    <div className="min-h-screen w-full bg-[var(--page)] text-[var(--text)]">
      <main className="w-full max-w-[1216px] mx-auto px-3 sm:px-4 xl:px-0 py-4 lg:py-6">
        <OrderWorkspace
          orderId={orderId}
          isClientPreview={true}
          previewData={previewData}
        />
      </main>
    </div>
  );
}

export default function ClientOrderPreviewPage() {
  return (
    <StoreProvider>
      <ClientOrderPreviewContent />
    </StoreProvider>
  );
}
