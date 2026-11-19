'use client';
import {useState,useMemo} from 'react';
import {AnimatePresence,motion} from 'framer-motion';
import {ChevronLeft,ChevronRight,X,ClipboardList} from 'lucide-react';
import {useStore} from '@/lib/store';
import {getOrderStatusPresentation,type OrderStatusPresentation} from '@/lib/status';
import {ContextualTip} from '@/components/onboarding/ContextualTip';
import {springSnappy} from '@/lib/motion-tokens';
import {cn} from '@/lib/utils';
interface CalendarOrderItem {id:string;clientId:string;client:string;garment:string;time:string;status:string;statusPresentation:OrderStatusPresentation}
export function PickupsAndRecent({onOpenOrder}:{onOpenOrder:(id:string)=>void}) {
const {orders,clients}=useStore();
  // Calendar state
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activeDatePopover, setActiveDatePopover] = useState<number | null>(null);

  const calendarYear = viewDate.getFullYear();
  const calendarMonth = viewDate.getMonth();
  const calendarOffset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const calendarDaysCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const todayWeekdayIndex = (new Date().getDay() + 6) % 7;
  const calendarMonthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate);

  // Status dots on calendar synced strictly with store orders
  const getOrdersForDay = (day: number) => {
    const dayOrders: CalendarOrderItem[] = [];

    if (orders && orders.length > 0) {
      for (const ord of orders) {
        if (!ord.pickupDateTime) continue;
        const d = new Date(ord.pickupDateTime);
        if (
          !isNaN(d.getTime()) &&
          d.getFullYear() === calendarYear &&
          d.getMonth() === calendarMonth &&
          d.getDate() === day
        ) {
          const clientObj = clients?.find((c) => c.id === ord.clientId);
          const cName = clientObj?.name || 'Client';
          const statusPres = getOrderStatusPresentation(ord.status, ord.pickupDateTime);

          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
          const timeStr = `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${ampm}`;

          dayOrders.push({
            id: ord.id,
            clientId: ord.clientId,
            client: cName,
            garment: ord.garmentType || 'Garment',
            time: timeStr,
            status: ord.status,
            statusPresentation: statusPres,
          });
        }
      }
    }

    return dayOrders;
  };


  // Live Recent Orders list connected to global store, sorted by createdAt descending
  const recentOrdersList = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, 4).map((ord) => {
      const cl = clients.find((c) => c.id === ord.clientId);
      const clientFullName = cl?.name || 'Client';
      const initials =
        clientFullName
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'CL';
      return {
        id: ord.id,
        client: clientFullName,
        initials,
        garment: ord.garmentType || 'Bespoke Order',
        clientId: cl?.id || ord.clientId || '',
      };
    });
  }, [orders, clients]);


  const renderCalendarCard = () => (
    <div
      id="overview-calendar" data-tour="overview-calendar"
      className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-3 relative"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[var(--text-strong)] leading-none">
          Pickup Calendar
        </h3>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-strong)]">
          <span>{calendarMonthLabel}</span>
          <div className="flex items-center gap-0.5 text-[var(--text-2)]">
            <button
              type="button"
              aria-label="Previous Month"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none transition-colors cursor-pointer"
              title="Previous Month"
              onClick={() => {
                setActiveDatePopover(null);
                setViewDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                );
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next Month"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none transition-colors cursor-pointer"
              title="Next Month"
              onClick={() => {
                setActiveDatePopover(null);
                setViewDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                );
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ContextualTip id="calendar-dates" variant="inline" className="mt-0.5" />

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-[2px]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, idx) => (
          <div
            key={d}
            className="h-8 bg-white rounded-[4px] flex items-center justify-center text-[11px] font-semibold"
          >
            <span
              className={
                idx === todayWeekdayIndex
                  ? 'text-[var(--text-strong)]'
                  : 'text-[var(--weekday)]'
              }
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-[2px]">
        {Array.from({ length: calendarOffset }, (_, idx) => (
          <div key={`offset-${idx}`} className="h-10 opacity-0 pointer-events-none" />
        ))}

        {Array.from({ length: calendarDaysCount }, (_, i) => i + 1).map((day) => {
          const dayOrders = getOrdersForDay(day);
          const hasOrders = dayOrders.length > 0;
          const status = dayOrders[0]?.status;

          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                if (hasOrders) {
                  setActiveDatePopover(activeDatePopover === day ? null : day);
                } else {
                  setActiveDatePopover(null);
                }
              }}
              className={cn(
                'h-10 bg-white rounded-[4px] relative flex items-center justify-center text-[12px] font-medium text-[var(--text-date)] tabular-nums transition-colors',
                hasOrders ? 'cursor-pointer hover:bg-neutral-50' : 'cursor-default'
              )}
            >
              <span>{day}</span>

              {hasOrders && (
                <span
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: dayOrders[0]?.statusPresentation.dotColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Peek Card Popover */}
      <AnimatePresence>
        {activeDatePopover !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={springSnappy}
            className="absolute left-3 right-3 top-[170px] z-30 bg-white border border-[var(--outline)] rounded-[8px] p-3 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--outline)] mb-2">
              <span className="text-[12px] font-bold text-[var(--text-strong)] tabular-nums">
                {activeDatePopover} {calendarMonthLabel} — Pickups
              </span>
              <button
                type="button"
                aria-label="Close pickups popover"
                onClick={() => setActiveDatePopover(null)}
                className="text-[var(--text-2)] hover:text-black p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {getOrdersForDay(activeDatePopover).length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {getOrdersForDay(activeDatePopover).map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => {
                      setActiveDatePopover(null);
                      onOpenOrder(item.id);
                    }}
                    className="w-full text-left flex items-center justify-between text-[11px] bg-[var(--chip)] hover:bg-[#EAEAEA] p-2 rounded-[6px] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-[var(--text-strong)] flex items-center gap-1.5">
                        <span>{item.client}</span>
                        <span
                          style={{ backgroundColor: item.statusPresentation.badgeColor }}
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-white leading-none"
                        >
                          {item.statusPresentation.badgeLabel}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {item.garment}
                      </div>
                    </div>
                    <span className="font-semibold text-[var(--text-date)] tabular-nums">
                      {item.time}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center flex flex-col items-center justify-center gap-1.5">
                <p className="text-[12px] text-[var(--muted)]">
                  No pickups or fittings scheduled for this date.
                </p>
                
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend row */}
      <div className="pt-2 flex items-center justify-start gap-[24px] text-[11px] font-normal text-[var(--text-strong)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--pending)] shrink-0" />
          <span>Pending</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--completed)] shrink-0" />
          <span>Completed</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--paused)] shrink-0" />
          <span>Paused</span>
        </span>
      </div>
    </div>
  );

  const renderRecentOrdersCard = () => (
    <div
      id="overview-recent-orders"
      className="w-full bg-[var(--card)] rounded-[6px] p-3 flex flex-col gap-2"
    >
      <h3 className="text-[14px] font-semibold text-[var(--text-strong)]">
        Recent Orders
      </h3>

      {recentOrdersList.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-[8px] p-6 text-center flex flex-col items-center justify-center gap-2 border border-[var(--outline)]">
          <div className="w-10 h-10 rounded-full bg-[var(--chip)] flex items-center justify-center text-[var(--muted)] mb-0.5">
            <ClipboardList className="w-5 h-5 text-[var(--text-2)]" />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-strong)]">
            No Recent Orders
          </span>
          <p className="text-[11px] text-[var(--muted)] max-w-xs leading-relaxed">
            Active fittings and garment orders will appear here automatically as you create client orders.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] p-[2px] rounded-[8px] flex flex-col gap-[2px]">
          {recentOrdersList.map((order) => (
            <div
              key={order.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenOrder(order.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenOrder(order.id);
                }
              }}
              className="bg-[var(--chip)] hover:bg-[#EAEAEA] rounded-[6px] p-2 flex items-center gap-2 justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px] font-bold text-[var(--text-strong)] shrink-0">
                  {order.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-medium text-[var(--text-strong)] leading-tight truncate">
                    {order.client}
                  </span>
                  <span className="text-[11px] font-normal text-[var(--muted)] leading-tight truncate">
                    {order.garment}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label={`Open order for ${order.client}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenOrder(order.id);
                }}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[var(--text-strong)] hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
                title={`Open order for ${order.client}`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );


return <div className="min-w-0 flex flex-col gap-[2px] rounded-lg bg-white p-[2px]">{renderCalendarCard()}{renderRecentOrdersCard()}</div>;
}
