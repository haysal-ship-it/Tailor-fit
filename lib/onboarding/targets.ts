import { TourTargetKey } from './steps';

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  radius: number;
}

export interface CardPlacement {
  mode: 'anchored' | 'sheet-bottom' | 'sheet-top' | 'centered';
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  width?: number;
  arrowPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  arrowOffset?: number;
}

/**
 * Checks whether an element is truly visible in the layout:
 * - Attached to DOM
 * - Not display: none
 * - Not visibility: hidden
 * - offsetWidth > 0 and offsetHeight > 0 (or SVG equivalent)
 */
export function isElementVisible(el: Element): boolean {
  if (!el || !el.isConnected) return false;

  const htmlEl = el as HTMLElement;
  if (htmlEl.offsetWidth === 0 && htmlEl.offsetHeight === 0) {
    // Check if SVG element
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }
  }

  if (typeof window !== 'undefined') {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
  }

  return true;
}

/**
 * Resolves the currently active & visible DOM element for a tour target key.
 * If multiple responsive elements match [data-tour="key"], chooses the one visible.
 */
export function resolveVisibleTarget(
  targetKey: TourTargetKey,
  root: Document | HTMLElement = document
): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  const selector = `[data-tour="${targetKey}"]`;
  const candidates = root.querySelectorAll(selector);

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i] as HTMLElement;
    if (isElementVisible(el)) {
      return el;
    }
  }

  return null;
}

/**
 * Bounded target wait helper: polls using requestAnimationFrame until target mounts
 * with nonzero bounds or timeout (default 2000ms) expires.
 */
export function waitForVisibleTarget(
  targetKey: TourTargetKey,
  timeoutMs: number = 2000
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = performance.now();

    function check() {
      const el = resolveVisibleTarget(targetKey);
      if (el) {
        resolve(el);
        return;
      }
      if (performance.now() - start > timeoutMs) {
        resolve(null);
        return;
      }
      requestAnimationFrame(check);
    }

    check();
  });
}

/**
 * Measures the target element relative to viewport, applying 6-8px cutout padding
 * and clamping to viewport bounds.
 */
export function measureTargetRect(
  target: HTMLElement,
  cutoutPadding: number = 6
): TargetRect {
  const rect = target.getBoundingClientRect();
  const radius = parseFloat(window.getComputedStyle(target).borderRadius) || 8;

  const left = Math.max(0, rect.left - cutoutPadding);
  const top = Math.max(0, rect.top - cutoutPadding);
  const right = Math.min(window.innerWidth, rect.right + cutoutPadding);
  const bottom = Math.min(window.innerHeight, rect.bottom + cutoutPadding);
  const width = right - left;
  const height = bottom - top;

  return {
    x: left,
    y: top,
    width,
    height,
    top,
    right,
    bottom,
    left,
    radius: Math.min(radius + 4, 16),
  };
}

/**
 * Scrolls the target safely into view without colliding with top header (min 70px)
 * or mobile bottom dock (min 80px).
 */
export function scrollTargetIntoSafeView(target: HTMLElement): void {
  if (typeof window === 'undefined') return;

  const rect = target.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const headerHeight = 72; // Nav header clearance
  const bottomMargin = 96; // Space for card / mobile dock

  const safeTop = headerHeight + 16;
  const safeBottom = viewportHeight - bottomMargin;

  if (rect.top < safeTop || rect.bottom > safeBottom) {
    const elementCenter = rect.top + window.scrollY + rect.height / 2;
    const targetScrollY = Math.max(0, elementCenter - viewportHeight / 2);

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  }
}

/**
 * Calculates responsive card placement:
 * - On mobile (< 768px): sheet-bottom or sheet-top (if target is at bottom, like nav-clients)
 * - On desktop (>= 768px): anchored card flipping/shifting with 12px gap, 16px viewport clearance
 */
export function computeCardPlacement(
  targetRect: TargetRect | null,
  cardWidth: number = 320,
  cardHeight: number = 240,
  preferredPlacement: 'bottom' | 'top' | 'left' | 'right' = 'bottom'
): CardPlacement {
  if (typeof window === 'undefined') {
    return {
      mode: 'centered',
      left: Math.max(16, (1024 - cardWidth) / 2),
      top: Math.max(16, (768 - cardHeight) / 2),
      width: cardWidth,
      arrowPosition: 'none',
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const edgeMargin = 16;
  const gap = 12;

  // If no target available, show centered card
  if (!targetRect) {
    return {
      mode: 'centered',
      left: Math.max(edgeMargin, (viewportWidth - cardWidth) / 2),
      top: Math.max(edgeMargin, (viewportHeight - cardHeight) / 2),
      width: Math.min(cardWidth, viewportWidth - edgeMargin * 2),
      arrowPosition: 'none',
    };
  }

  const isMobile = viewportWidth < 768;

  // On Mobile: Sheet placement
  if (isMobile) {
    // If target is in lower 40% of screen (e.g. bottom navigation dock), place sheet at top
    const isTargetNearBottom = targetRect.bottom > viewportHeight * 0.65;
    if (isTargetNearBottom) {
      return {
        mode: 'sheet-top',
        top: Math.max(16, targetRect.top > 120 ? 16 : 80),
        left: edgeMargin,
        width: viewportWidth - edgeMargin * 2,
        arrowPosition: 'none',
      };
    }

    return {
      mode: 'sheet-bottom',
      bottom: Math.max(16, 76), // Clear mobile dock
      left: edgeMargin,
      width: viewportWidth - edgeMargin * 2,
      arrowPosition: 'none',
    };
  }

  // Desktop anchored placement
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  let placement = preferredPlacement;

  // Check if preferred placement has room
  if (placement === 'right') {
    if (targetRect.right + gap + cardWidth > viewportWidth - edgeMargin) {
      placement = targetRect.left - gap - cardWidth > edgeMargin ? 'left' : 'bottom';
    }
  } else if (placement === 'left') {
    if (targetRect.left - gap - cardWidth < edgeMargin) {
      placement = targetRect.right + gap + cardWidth < viewportWidth - edgeMargin ? 'right' : 'bottom';
    }
  } else if (placement === 'bottom') {
    if (targetRect.bottom + gap + cardHeight > viewportHeight - edgeMargin) {
      placement = targetRect.top - gap - cardHeight > edgeMargin ? 'top' : 'right';
    }
  } else if (placement === 'top') {
    if (targetRect.top - gap - cardHeight < edgeMargin) {
      placement = targetRect.bottom + gap + cardHeight < viewportHeight - edgeMargin ? 'bottom' : 'right';
    }
  }

  let top = 0;
  let left = 0;
  let arrowPosition: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none';

  if (placement === 'right') {
    left = targetRect.right + gap;
    top = targetCenterY - cardHeight / 2;
    arrowPosition = 'left';
  } else if (placement === 'left') {
    left = targetRect.left - gap - cardWidth;
    top = targetCenterY - cardHeight / 2;
    arrowPosition = 'right';
  } else if (placement === 'top') {
    top = targetRect.top - gap - cardHeight;
    left = targetCenterX - cardWidth / 2;
    arrowPosition = 'bottom';
  } else {
    // bottom
    top = targetRect.bottom + gap;
    left = targetCenterX - cardWidth / 2;
    arrowPosition = 'top';
  }

  // Clamp within viewport
  left = Math.max(edgeMargin, Math.min(left, viewportWidth - cardWidth - edgeMargin));
  top = Math.max(edgeMargin, Math.min(top, viewportHeight - cardHeight - edgeMargin));

  return {
    mode: 'anchored',
    top,
    left,
    width: cardWidth,
    arrowPosition,
  };
}
