"use client";

import React, { useState } from "react";
import { WorkspaceLoading } from "@/components/workspace/WorkspaceLoading";
import loadingStyles from "@/components/workspace/workspace-loading.module.css";
import { useAccount } from "@/components/auth/AccountProvider";
import { StoreProvider, useStore } from "@/lib/store";
import {StudioSetupProvider} from "@/components/onboarding/StudioSetupProvider";
import {useStudioSetup} from "@/components/onboarding/StudioSetupContext";
import { TourProvider, useTour } from "@/components/onboarding/TourProvider";
import {normalizeWorkspaceUrl} from '@/lib/workspace-routes';
import {requestWorkspaceNavigation} from "@/lib/workspace-confirmation";
import { Navbar } from "@/components/Navbar";
import { OverviewScreen } from "@/components/screens/OverviewScreen";
import { ClientsScreen } from "@/components/screens/ClientsScreen";
import { OrdersScreen } from "@/components/screens/OrdersScreen";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";
import { orderFilters, type OrderFilter } from "@/lib/workspace-analytics";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { ToastContainer, type ToastMessage } from "@/components/ui/Toasts";

function TailorFitApp() {
  const {
    activeScreen,
    isHydrated,
    orders,
    selectedClientId,
    addClient,
    updateClient,
    error,
    refresh,
    setActiveScreen,
    setSelectedClientId,
    setSelectedSnapshotId,
  } = useStore();

  const { requireAccount } = useAccount();
  const [orderRoute, setOrderRoute] = useState<{
    order?: string;
    client?: string;
    fitting?: string;
  }>({});
  const tour=useTour();
  const studioSetup=useStudioSetup();
  const [addingClient,setAddingClient]=useState(false);
  const [list,setList]=useState<{filter:OrderFilter;query:string}|null>(null);
  const origin=React.useRef('?tab=overview');
  const historyScroll = React.useRef(0);
  const currentUrl = React.useRef("");
  const [routeReady, setRouteReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const canLeave = (resume:()=>void=()=>{}) => requestWorkspaceNavigation(resume);
  const routeOrder = React.useCallback((
    order: string | undefined,
    client: string | undefined,
    replace = false,
    fitting?:string,
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "clients");
    url.searchParams.delete('view');url.searchParams.delete('filter');url.searchParams.delete('q');url.searchParams.delete('capture');
    if (order) url.searchParams.set('returnTo',origin.current);else url.searchParams.delete('returnTo');
    if(fitting){url.searchParams.set('fitting',fitting);url.searchParams.set('reuse','1');}else{url.searchParams.delete('fitting');url.searchParams.delete('reuse');}
    setList(null);
    if (order) url.searchParams.set("order", order);
    else url.searchParams.delete("order");
    if (client) url.searchParams.set("client", client);
    else url.searchParams.delete("client");
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    currentUrl.current = url.toString();
    setSelectedClientId(client || null);
    setActiveScreen("clients");
    setOrderRoute({ order, client, fitting });
  }, [setSelectedClientId,setActiveScreen]);
  const readFilter=(value:string|null):OrderFilter=>orderFilters.includes(value as OrderFilter)?value as OrderFilter:'all';
  const rememberOrigin=()=>{if(!orderRoute.order){origin.current=location.search||'?tab=overview';historyScroll.current=window.scrollY;}};
  const showOrders=(filter:OrderFilter,query='')=>{
    if(!canLeave(()=>showOrders(filter,query)))return;const url=new URL(location.href);url.search='';url.searchParams.set('tab','clients');url.searchParams.set('view','orders');url.searchParams.set('filter',filter);if(query)url.searchParams.set('q',query);
    history[list&&list.filter===filter?'replaceState':'pushState']({},'',url);currentUrl.current=url.toString();setSelectedClientId(null);setOrderRoute({});setList({filter,query});setActiveScreen('clients');
  };
  const backToHistory = () => {
    if (!canLeave(()=>{backToHistory();})) return false;
    const url=normalizeWorkspaceUrl(new URL(origin.current,location.origin+location.pathname));
    window.history.replaceState({},'',url);currentUrl.current=url.toString();
    const tab=url.searchParams.get('tab')||'overview';setActiveScreen(tab);
    const client=url.searchParams.get('client')||undefined;setSelectedClientId(client||null);setOrderRoute({client});
    setList(url.searchParams.get('view')==='orders'?{filter:readFilter(url.searchParams.get('filter')),query:url.searchParams.get('q')||''}:null);
    requestAnimationFrame(() =>
      window.scrollTo({ top: historyScroll.current, behavior: "instant" }),
    );
    return true;
  };
  React.useEffect(() => {
    const read = () => {
      const requested=location.href;
      if (currentUrl.current && !canLeave(()=>{history.replaceState({},"",requested);read();})) {
        history.pushState({}, "", currentUrl.current);
        return;
      }
      const url = new URL(location.href);
      currentUrl.current = url.toString();
      normalizeWorkspaceUrl(url);
      if(url.toString()!==location.href){history.replaceState({},'',url);currentUrl.current=url.toString();}
      const tab = url.searchParams.get("tab") || "overview";
      if (tab && ["clients", "settings", "overview"].includes(tab))
        setActiveScreen(tab);
      const returnTo=url.searchParams.get('returnTo');
      if(returnTo?.startsWith('?')&&!returnTo.includes('://'))origin.current=returnTo;
      setList(tab==='clients'&&url.searchParams.get('view')==='orders'?{filter:readFilter(url.searchParams.get('filter')),query:url.searchParams.get('q')||''}:null);
      const client = url.searchParams.get("client") || undefined;
      const order = url.searchParams.get("order") || undefined;
      setSelectedClientId(client || null);
      const fitting=order==='new'&&url.searchParams.get('reuse')==='1'?url.searchParams.get('fitting')||undefined:undefined;
      setOrderRoute({ client:order==='new'&&!fitting?undefined:client, order, fitting });
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
    const handleResetClients = () => {
      routeOrder(undefined, undefined, true);
    };
    window.addEventListener("tailorfit:reset-clients-route", handleResetClients);
    return () =>
      window.removeEventListener(
        "tailorfit:reset-clients-route",
        handleResetClients,
      );
  }, [routeOrder]);
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
    if (!canLeave(()=>handleOpenClient(clientId))) return;
    routeOrder(undefined, clientId);
    setSelectedClientId(clientId);
    setActiveScreen("clients");
  };

  const handleBackToClientDirectory = () => {
    if (!canLeave(handleBackToClientDirectory)) return;
    routeOrder(undefined, undefined, true);
    setSelectedClientId(null);
  };

  const handleOpenNewOrder = () => {
    if (!requireAccount() || !canLeave(handleOpenNewOrder)) return false;
    historyScroll.current = window.scrollY;
    rememberOrigin();
    routeOrder("new", undefined);
    return true;
  };
  const startOverviewTour=(resume:boolean)=>{
    if(!canLeave(()=>startOverviewTour(resume)))return;
    const url=new URL(location.href);url.search='?tab=overview';history.pushState({},'',url);currentUrl.current=url.toString();setOrderRoute({});setList(null);setSelectedClientId(null);setActiveScreen('overview');
    requestAnimationFrame(()=>{if(resume)tour.resumeTour();else tour.startTour();});
  };
  React.useEffect(()=>{const start=(event:Event)=>startOverviewTour(!!(event as CustomEvent<{resume:boolean}>).detail?.resume);window.addEventListener('tailorfit:request-tour',start);return()=>window.removeEventListener('tailorfit:request-tour',start);});
  React.useEffect(()=>{const show=()=>{const go=()=>{if(!requireAccount())return;void studioSetup?.setChecklistHidden(false).then(saved=>{if(!saved)return;const url=new URL(location.href);url.search='?tab=overview';history.pushState({},'',url);currentUrl.current=url.toString();setList(null);setOrderRoute({});setSelectedClientId(null);setActiveScreen('overview');});};if(canLeave(go))go();};window.addEventListener('tailorfit:request-getting-started',show);return()=>window.removeEventListener('tailorfit:request-getting-started',show);});
  const handleReuseFitting=(clientId:string,fittingId:string)=>{if(!requireAccount()||!canLeave(()=>handleReuseFitting(clientId,fittingId)))return;rememberOrigin();routeOrder('new',clientId,false,fittingId);};
  const handleEditOrder = (orderId: string) => {
    if (!canLeave(()=>handleEditOrder(orderId))) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    historyScroll.current = window.scrollY;
    rememberOrigin();
    routeOrder(order.id, order.clientId);
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
      if(!['new-measurement','edit-measurement'].includes(currentTab))url.searchParams.delete('capture');
      if (currentTab !== "clients") {
        url.searchParams.delete("order");
        if(currentTab==='new-measurement'||currentTab==='edit-measurement'){if(selectedClientId)url.searchParams.set('client',selectedClientId);else url.searchParams.delete('client');}else url.searchParams.delete("client");
        url.searchParams.delete("view");url.searchParams.delete("filter");url.searchParams.delete("q");url.searchParams.delete("returnTo");
        queueMicrotask(() => {setList(null);setOrderRoute({});});
      }
      window.history.replaceState({}, "", url.toString());
      currentUrl.current = url.toString();
    }
  }, [activeScreen, routeReady, selectedClientId]);

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

      {error&&<div role="alert" className="mx-auto mt-3 flex w-[calc(100%_-_24px)] max-w-[1216px] flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button type="button" className="min-h-11 rounded-full border border-red-200 px-4" onClick={()=>void refresh()}>Retry loading</button></div>}
      {/* Main Content Area */}
      <main id="main-content" aria-busy={!isHydrated || !routeReady} className="flex-1 w-full max-lg:pb-24">
        {!isHydrated || !routeReady ? <WorkspaceLoading embedded screen={activeScreen} stage="records" /> : <div className={loadingStyles.ready}>
        {(activeScreen==='overview'||activeScreen==='dashboard')&&<OverviewScreen onOpenOrder={handleEditOrder} onAddClient={()=>{if(requireAccount())setAddingClient(true);}} onNewOrder={()=>handleOpenNewOrder()} onOpenOrders={showOrders} onOpenClients={()=>{routeOrder(undefined,undefined);}}/>}
        {activeScreen==='clients'&&list&&<OrdersScreen filter={list.filter} query={list.query} onFilter={f=>showOrders(f,list.query)} onQuery={q=>showOrders(list.filter,q)} onEditOrder={handleEditOrder} onNewOrder={()=>handleOpenNewOrder()} onBack={()=>{setList(null);setActiveScreen('overview');}}/>}

        {(activeScreen === "clients" || activeScreen === "client-profile") && !list && (
          <ClientsScreen
            onOpenClient={handleOpenClient}
            onNewOrder={() => handleOpenNewOrder()}
            onReuseFitting={handleReuseFitting}
            reuseSnapshotId={orderRoute.fitting}
            onEditOrder={handleEditOrder}
            orderId={orderRoute.order === "new" ? undefined : orderRoute.order}
            newOrder={orderRoute.order === "new"}
            orderClientId={
              orderRoute.client ||
              orders.find((o) => o.id === orderRoute.order)?.clientId
            }
            onOrderBack={backToHistory}
            onOrderSaved={(id, cid) => routeOrder(id, cid, true)}
            onBackToDirectory={handleBackToClientDirectory}
          />
        )}

        {activeScreen === "settings" && <SettingsScreen onStartTour={startOverviewTour} />}
        </div>}
      </main>

      {addingClient&&<ClientDetailsDialog target={{kind:'create'}} onCreate={addClient} onUpdate={updateClient} persistenceError={error} onClose={()=>setAddingClient(false)} onSaved={saved=>{setAddingClient(false);handleOpenClient(saved.id);}}/>}
      {/* Floating System Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function Workspace({ initialScreen = 'overview' }: { initialScreen?: string }) {
  const { user, ready } = useAccount();
  if (!ready) return <WorkspaceLoading screen={initialScreen} />;
  return (
    <StoreProvider key={user?.id || "guest"}>
      <TourProvider>
        <StudioSetupProvider><TailorFitApp /></StudioSetupProvider>
      </TourProvider>
    </StoreProvider>
  );
}
