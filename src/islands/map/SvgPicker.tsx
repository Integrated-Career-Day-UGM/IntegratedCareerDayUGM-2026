import { useEffect, useState } from 'react';

/**
 * DEV-only SVG picker. Click any `[data-svg-id]` element inside the warped
 * floor-plan overlay, inspect its name/class/id/src, and hide it locally.
 * Hidden ids live in localStorage (`icd:hidden-svgs`) so removals survive a
 * reload; copy the id list to make a removal permanent in source.
 */

const STORAGE_KEY = 'icd:hidden-svgs';

type Picked = {
  id: string;
  name: string;
  src: string;
  className: string;
  tag: string;
};

const readHidden = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export default function SvgPicker() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [hidden, setHidden] = useState<string[]>(readHidden);

  const persist = (next: string[]) => {
    setHidden(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
  };

  /* Apply hidden state + pick-mode hit areas whenever the overlay changes. */
  useEffect(() => {
    const apply = () => {
      const overlay = document.querySelector<HTMLElement>('[data-floorplan-root]');
      if (!overlay) return;
      overlay.querySelectorAll<HTMLElement>('[data-svg-id]').forEach((el) => {
        const id = el.dataset.svgId ?? '';
        if (hidden.includes(id)) {
          el.style.display = 'none';
          return;
        }
        el.style.display = '';
        el.style.pointerEvents = open ? 'auto' : '';
        el.style.cursor = open ? 'crosshair' : '';
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [hidden, open]);

  /* Pick listener on the overlay only (panel stays outside it). */
  useEffect(() => {
    if (!open) {
      document.querySelectorAll<HTMLElement>('[data-svg-picked]').forEach((el) => {
        el.style.outline = '';
        el.removeAttribute('data-svg-picked');
      });
      setPicked(null);
      return;
    }

    let overlay: HTMLElement | null = null;
    let attached = false;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const el = target?.closest?.('[data-svg-id]') as HTMLElement | null;
      if (!el) return;
      event.preventDefault();
      event.stopPropagation();

      document.querySelectorAll<HTMLElement>('[data-svg-picked]').forEach((node) => {
        node.style.outline = '';
        node.removeAttribute('data-svg-picked');
      });
      el.style.outline = '2px solid #ff2d6f';
      el.style.outlineOffset = '1px';
      el.setAttribute('data-svg-picked', '');

      setPicked({
        id: el.dataset.svgId ?? '',
        name: el.dataset.svgName ?? el.dataset.svgId ?? 'SVG',
        src: el.dataset.svgSrc ?? '',
        className: el.className,
        tag: el.tagName.toLowerCase(),
      });
    };

    const attach = () => {
      overlay = document.querySelector<HTMLElement>('[data-floorplan-root]');
      if (!overlay) return false;
      overlay.addEventListener('click', onClick, true);
      attached = true;
      return true;
    };

    attach();
    const observer = new MutationObserver(() => {
      if (!attached && attach()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (overlay && attached) overlay.removeEventListener('click', onClick, true);
      document.querySelectorAll<HTMLElement>('[data-svg-picked]').forEach((node) => {
        node.style.outline = '';
        node.removeAttribute('data-svg-picked');
      });
    };
  }, [open]);

  const hide = (id: string) => {
    if (!hidden.includes(id)) persist([...hidden, id]);
  };
  const restore = (id: string) => persist(hidden.filter((x) => x !== id));
  const restoreAll = () => persist([]);
  const pickedHidden = picked ? hidden.includes(picked.id) : false;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-24 z-[95] border border-[#34343a] bg-[#0c0c0f] px-3 py-2 font-mono text-[10px] text-white shadow-lg"
      >
        SVG
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 left-4 z-[96] w-80 border border-[#34343a] bg-[#0c0c0f] p-3 font-mono text-[10px] text-white shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold">SVG picker</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-[#34343a] px-1.5 py-0.5 hover:bg-[#1f1f23]"
          aria-label="Close SVG picker"
        >
          ×
        </button>
      </div>

      <div className="mb-2 text-[9px] leading-snug text-[#8f8f8f]">
        Click any SVG on the map. Remove hides it in this browser; copy the id
        list to make it permanent in source.
      </div>

      {picked ? (
        <div className="space-y-1.5 border-t border-[#34343a] pt-2">
          <div className="text-[11px] font-bold">{picked.name}</div>
          <dl className="space-y-1">
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-[#8f8f8f]">id</dt>
              <dd className="min-w-0 break-all text-[#d4d4d8]">{picked.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-[#8f8f8f]">tag</dt>
              <dd className="text-[#d4d4d8]">{picked.tag}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-[#8f8f8f]">class</dt>
              <dd className="min-w-0 break-all text-[#d4d4d8]">{picked.className}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-12 shrink-0 text-[#8f8f8f]">src</dt>
              <dd className="min-w-0 break-all text-[#d4d4d8]">{picked.src}</dd>
            </div>
          </dl>
          <div className="flex gap-1.5 pt-1">
            {pickedHidden ? (
              <button
                type="button"
                onClick={() => restore(picked.id)}
                className="flex-1 border border-[#ff2d6f] px-2 py-1 text-[10px] font-bold text-[#ff2d6f]"
              >
                Restore
              </button>
            ) : (
              <button
                type="button"
                onClick={() => hide(picked.id)}
                className="flex-1 border border-[#ff2d6f] bg-[#ff2d6f] px-2 py-1 text-[10px] font-bold text-white"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (picked) navigator.clipboard?.writeText(picked.id).catch(() => {});
              }}
              className="border border-[#34343a] px-2 py-1 text-[10px] hover:bg-[#1f1f23]"
            >
              Copy id
            </button>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="border border-[#34343a] px-2 py-1 text-[10px] hover:bg-[#1f1f23]"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-[#34343a] pt-2 text-[#8f8f8f]">
          No SVG selected.
        </div>
      )}

      {hidden.length > 0 && (
        <div className="mt-3 border-t border-[#34343a] pt-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[#8f8f8f]">Removed ({hidden.length})</span>
            <button
              type="button"
              onClick={restoreAll}
              className="text-[#d4d4d8] hover:text-white"
            >
              Restore all
            </button>
          </div>
          <ul className="max-h-40 space-y-0.5 overflow-auto">
            {hidden.map((id) => (
              <li key={id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[#d4d4d8]">{id}</span>
                <button
                  type="button"
                  onClick={() => restore(id)}
                  className="shrink-0 text-[#8f8f8f] hover:text-white"
                >
                  restore
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(hidden.join('\n')).catch(() => {});
            }}
            className="mt-1.5 w-full border border-[#34343a] px-2 py-1 text-[9px] hover:bg-[#1f1f23]"
          >
            Copy hidden ids
          </button>
        </div>
      )}
    </div>
  );
}
