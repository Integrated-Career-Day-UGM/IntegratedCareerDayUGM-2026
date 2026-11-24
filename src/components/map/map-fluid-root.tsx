// Per-island Fluid Functionalism provider wrapper. The map page's islands
// are separate `client:only="react"` roots (hydration rule: password-manager
// extensions inject fdprocessedid into SSR'd buttons), so a single provider
// in BaseLayout would wrap nothing — every island mounts its own tree.
//
// shape="sharp": the boxy/pixel aesthetic (§11 radius ladder).
// size="compact": the 28px step for sidebar/sheet FF components (§0).
// Icons: Lucide (FluidProvider default — the islands already use Lucide).
import { FluidProvider } from '@/lib/fluid-provider';

export function MapFluidRoot({ children }: { children: React.ReactNode }) {
  return <FluidProvider shape="sharp" size="compact">{children}</FluidProvider>;
}
