import { OrderStatus } from '@/types';

export interface OrderStatusPresentation {
  /** User-facing label conforming to UX audit (e.g. 'Ready for pickup', 'Collected', 'In progress') */
  label: string;
  /** Badge label accounting for deadline risk ('Overdue', 'Due soon', or status label) */
  badgeLabel: string;
  /** Background color variable for badge/pill */
  badgeColor: string;
  /** Calendar dot color variable */
  dotColor: string;
  /** Deadline risk status */
  risk?: 'overdue' | 'due-soon' | 'none';
}

/**
 * Returns human-readable status presentation adhering to UX Audit A14 & A19 specifications.
 */
export function getOrderStatusPresentation(
  status: OrderStatus | string | undefined,
  pickupDateTime?: string | null,
  now: Date = new Date()
): OrderStatusPresentation {
  const norm = (status || '').trim();

  // Baseline status labels
  let label = 'In progress';
  let badgeColor = 'var(--pill-pending)';
  let dotColor = 'var(--pending)';

  if (norm === 'Pending') {
    label = 'Pending';
    badgeColor = 'var(--pill-pending)';
    dotColor = 'var(--pending)';
  } else if (norm === 'In Progress') {
    label = 'In progress';
    badgeColor = 'var(--pill-pending)';
    dotColor = 'var(--pending)';
  } else if (norm === 'Paused') {
    label = 'Paused';
    badgeColor = 'var(--pill-paused)';
    dotColor = 'var(--paused)';
  } else if (norm === 'Ready') {
    label = 'Ready for pickup';
    badgeColor = 'var(--pill-completed)';
    dotColor = 'var(--completed)';
  } else if (norm === 'Completed') {
    label = 'Completed';
    badgeColor = 'var(--pill-completed)';
    dotColor = 'var(--completed)';
  } else if (norm === 'Picked Up' || norm === 'PickedUp') {
    label = 'Collected';
    badgeColor = 'var(--pill-completed)';
    dotColor = 'var(--completed)';
  }

  // Finished orders never have deadline risk
  const isFinished = norm === 'Completed' || norm === 'Picked Up' || norm === 'PickedUp';
  if (isFinished || !pickupDateTime) {
    return {
      label,
      badgeLabel: label,
      badgeColor,
      dotColor,
      risk: 'none',
    };
  }

  // Calculate deadline risk for open orders
  const dueDate = new Date(pickupDateTime);
  if (isNaN(dueDate.getTime())) {
    return {
      label,
      badgeLabel: label,
      badgeColor,
      dotColor,
      risk: 'none',
    };
  }

  // Compare using start-of-day
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueTime = dueDate.getTime();
  const diffDays = (dueTime - startOfToday) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) {
    return {
      label,
      badgeLabel: 'Overdue',
      badgeColor: 'var(--pill-urgent)',
      dotColor: 'var(--paused)',
      risk: 'overdue',
    };
  } else if (diffDays <= 2 && norm !== 'Ready') {
    return {
      label,
      badgeLabel: 'Due soon',
      badgeColor: 'var(--pill-urgent)',
      dotColor: 'var(--pending)',
      risk: 'due-soon',
    };
  }

  return {
    label,
    badgeLabel: label,
    badgeColor,
    dotColor,
    risk: 'none',
  };
}

/**
 * Format a date string into readable DD/MM/YYYY or DD-MM-YYYY
 */
export function formatDate(dateString: string | undefined | null, separator: '/' | '-' = '-'): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}${separator}${month}${separator}${year}`;
}
