"use client";

import React, { useState } from "react";
import { useAccount } from "@/components/auth/AccountProvider";
import { StoreProvider, useStore } from "@/lib/store";
import { TourProvider } from "@/components/onboarding/TourProvider";
import { Navbar } from "@/components/Navbar";
import { OverviewScreen } from "@/components/screens/OverviewScreen";
import { ClientsScreen } from "@/components/screens/ClientsScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { ToastContainer, type ToastMessage } from "@/components/ui/Toasts";

function TailorFitApp() {
  const {
    activeScreen,
    orders,
    setActiveScreen,
    setSelectedClientId,
    setSelectedSnapshotId,
  } = useStore();

  const { requireAccount } = useAccount();
  const [orderRoute, setOrderRoute] = useState<{
    order?: string;
    client?: string;
  }>({});
  const historyScroll = React.useRef(0);
  const currentUrl = React.useRef("");
  const [routeReady, setRouteReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const canLeave = () =>
    window.dispatchEvent(
      new Event("tailorfit:before-navigation", { cancelable: true }),
    );
  const routeOrder = (
    order: string | undefined,
    client: string | undefined,
    replace = false,
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "clients");
    if (order) url.searchParams.set("order", order);
    else url.searchParams.delete("order");
    if (client) url.searchParams.set("client", client);
    else url.searchParams.delete("client");
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    currentUrl.current = url.toString();
    setSelectedClientId(client || null);
    setActiveScreen("clients");
    setOrderRoute({ order, client });
  };
  const backToHistory = () => {
    if (!canLeave()) return false;
    routeOrder(undefined, orderRoute.client, true);
    requestAnimationFrame(() =>
      window.scrollTo({ top: historyScroll.current, behavior: "instant" }),
    );
    return true;
  };
  React.useEffect(() => {
    const read = () => {
      if (currentUrl.current && !canLeave()) {
        history.pushState({}, "", currentUrl.current);
        return;
      }
      const url = new URL(location.href);
      currentUrl.current = url.toString();
      const tab = url.searchParams.get("tab");
      if (tab && ["clients", "settings", "overview"].includes(tab))
        setActiveScreen(tab);
      const client = url.searchParams.get("client") || undefined;
      const order = url.searchParams.get("order") || undefined;
      setSelectedClientId(client || null);
      setOrderRoute({ client, order });
      if (!order)
        requestAnimationFrame(() =>
          window.scrollTo({ top: historyScroll.current, behavior: "instant" }),
        );
    };
    queueMicrotask(() => {
      read();
      setRouteReady(true);
    });
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [setActiveScreen, setSelectedClientId]);
  React.useEffect(() => {
    const handle = (event: Event) => {
      setToasts((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "success",
          message: (event as CustomEvent<string>).detail,
        },
      ]);
    };
    window.addEventListener("tailorfit:notice", handle);
    return () => window.removeEventListener("tailorfit:notice", handle);
  }, []);

  // System toasts
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for cross-screen navigation
  const handleOpenClient = (clientId: string) => {
    if (!canLeave()) return;
    routeOrder(undefined, clientId);
    setSelectedClientId(clientId);
    setActiveScreen("clients");
  };

  const handleOpenNewOrder = (clientId?: string) => {
    if (!requireAccount() || !canLeave()) return;
    historyScroll.current = window.scrollY;
    routeOrder("new", clientId);
  };
  const handleEditOrder = (orderId: string) => {
    if (!canLeave()) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    historyScroll.current = window.scrollY;
    routeOrder(order.id, order.clientId);
  };

  const handleNewMeasurement = (clientId?: string) => {
    if (!canLeave()) return;
    if (clientId) {
      setSelectedClientId(clientId);
    }
    setSelectedSnapshotId(null);
    setActiveScreen("overview");
  };

  // Scroll restoration on screen navigation (A16)
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeScreen]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !routeReady) return;
    const currentTab =
      activeScreen === "client-profile" ? "clients" : activeScreen;
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== currentTab) {
      url.searchParams.set("tab", currentTab);
      if (currentTab !== "clients") {
        url.searchParams.delete("order");
        url.searchParams.delete("client");
        queueMicrotask(() => setOrderRoute({}));
      }
      window.history.replaceState({}, "", url.toString());
      currentUrl.current = url.toString();
    }
  }, [activeScreen, routeReady]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Skip to Content Accessible Link (A11, A16) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-md focus:shadow-md focus:outline-none"
      >
        Skip to content
      </a>

      {/* Navigation Header & Mobile Dock */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full">
        {(activeScreen === "overview" ||
          activeScreen === "dashboard" ||
          activeScreen === "new-measurement" ||
          activeScreen === "edit-measurement") && (
          <OverviewScreen
            onOpenClient={handleOpenClient}
            onOpenOrder={handleEditOrder}
          />
        )}

        {(activeScreen === "clients" || activeScreen === "client-profile") && (
          <ClientsScreen
            onOpenClient={handleOpenClient}
            onNewMeasurement={handleNewMeasurement}
            onNewOrder={(cid) => handleOpenNewOrder(cid)}
            onEditOrder={handleEditOrder}
            orderId={orderRoute.order === "new" ? undefined : orderRoute.order}
            newOrder={orderRoute.order === "new"}
            orderClientId={
              orderRoute.client ||
              orders.find((o) => o.id === orderRoute.order)?.clientId
            }
            onOrderBack={backToHistory}
            onOrderSaved={(id, cid) => routeOrder(id, cid, true)}
          />
        )}

        {activeScreen === "settings" && <SettingsScreen />}
      </main>

      {/* Floating System Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function Workspace() {
  const { user, ready } = useAccount();
  if (!ready)
    return (
      <p role="status" className="p-8 text-center">
        Opening your workspace…
      </p>
    );
  return (
    <StoreProvider key={user?.id || "guest"}>
      <TourProvider>
        <TailorFitApp />
      </TourProvider>
    </StoreProvider>
  );
}
