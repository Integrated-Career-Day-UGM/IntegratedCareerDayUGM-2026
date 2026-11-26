import {
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';

/**
 * Pointer/focus hover state for thumbnail cards. The card owns the layout;
 * this hook only supplies the state, handlers and the accent CSS variable.
 */
export default function useHoverCard(themeColor: string) {
  const [hovered, setHovered] = useState(false);

  const handlers = useMemo(
    () => ({
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === 'mouse') setHovered(true);
      },
      onPointerLeave: () => setHovered(false),
      onFocus: () => setHovered(true),
      onBlur: () => setHovered(false),
    }),
    [],
  );

  const style = useMemo(
    () =>
      ({
        '--card-accent': themeColor,
      }) as CSSProperties,
    [themeColor],
  );

  return { hovered, handlers, style };
}
