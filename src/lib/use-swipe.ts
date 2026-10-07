import { useRef } from "react";

/**
 * Détecte un swipe horizontal sur mobile.
 * onLeft  = swipe vers la gauche (→ onglet suivant)
 * onRight = swipe vers la droite (→ onglet précédent)
 */
export function useSwipe(
  onLeft:    () => void,
  onRight:   () => void,
  threshold  = 50,
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    startY.current = null;
    // Ignore les swipes principalement verticaux (scroll)
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) < threshold) return;
    if (dx < 0) onLeft();
    else onRight();
  }

  return { onTouchStart, onTouchEnd };
}
