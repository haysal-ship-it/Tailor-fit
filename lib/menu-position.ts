type Bounds = { left: number; top: number; width: number; height: number };

export function menuPosition(trigger: Bounds, bounds: Bounds, minimumWidth = 0, contentHeight = 280, alignEnd = false) {
  const edge = 8;
  const gap = 4;
  const width = Math.min(Math.max(trigger.width, minimumWidth), Math.max(0, bounds.width - 2 * edge));
  const anchor = trigger.left + (alignEnd ? trigger.width - width : 0);
  const left = Math.max(bounds.left + edge, Math.min(anchor, bounds.left + bounds.width - width - edge));
  const bottom = trigger.top + trigger.height;
  const below = Math.max(0, bounds.top + bounds.height - edge - bottom - gap);
  const above = Math.max(0, trigger.top - gap - bounds.top - edge);
  const desired = Math.min(280, contentHeight);
  const flip = below < desired && above > below;
  const maxHeight = Math.min(desired, flip ? above : below);
  return { left, width, maxHeight, top: flip ? trigger.top - gap - maxHeight : bottom + gap };
}
