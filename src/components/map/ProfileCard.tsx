import { useState, type CSSProperties } from 'react';
import { Github, Instagram } from 'lucide-react';
import { placementVars, randomSparkySkew } from '../../lib/map/sparky-tips';

/**
 * Maintainer card. The empty-dialog art is the frame: round avatar window on
 * the left, greeting inside the bubble, links and one contact line below.
 * Every part is a `data-layout-tune` target so the dev panel can place, scale
 * and rotate it (the bubble art carries the idle skew animation).
 */
export default function ProfileCard() {
  // Independent speed + phase + strength for this card's bubble.
  const [skew] = useState(randomSparkySkew);

  return (
    <section className="rounded-[4px] bg-surface-2 p-3">
      <div
        data-layout-tune="profile-title"
        style={placementVars('profile-title')}
        className="sparky-tip-part mb-2 inline-block bg-white px-2 py-0.5 font-heading text-[0.6875rem] font-bold tracking-[0.08em] text-black uppercase shadow-[0_1px_0_rgba(0,0,0,0.25)]"
      >
        Developer
      </div>

      <div className="relative aspect-[1996/814] w-full">
        <img
          src="/sparky/bubble-dark.png"
          alt=""
          draggable={false}
          className="sparky-dialog-art absolute inset-0 size-full max-w-none"
          style={{
            animationDelay: `${skew.delay}s`,
            animationDuration: `${skew.duration}s`,
            '--skew-amp': String(skew.amp),
          } as CSSProperties}
        />
        <div
          data-layout-tune="profile-avatar"
          style={placementVars('profile-avatar')}
          className="sparky-tip-part absolute top-[8%] left-[5%] aspect-square w-[15%] overflow-hidden rounded-full border border-white/20"
        >
          <img
            src="/profile/ryuko.jpg"
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        </div>
        <div
          data-layout-tune="profile-greeting"
          style={placementVars('profile-greeting')}
          className="sparky-tip-part absolute top-[9%] left-[24%] max-w-[68%]"
        >
          <p className="inline-block bg-white px-2 py-1 font-heading text-[0.75rem] leading-none font-bold text-black md:text-[0.8125rem]">
            {"Hi I'm '@erwdev'"}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href="https://github.com/Erwdev"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[#d4d4d8] underline underline-offset-2 hover:text-white"
        >
          <Github size={12} /> @erwdev
        </a>
        <a
          href="https://instagram.com/benerwin__"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[#d4d4d8] underline underline-offset-2 hover:text-white"
        >
          <Instagram size={12} /> @benerwin__
        </a>
      </div>
      <p className="mt-1.5 text-[0.625rem] leading-snug text-[#71717a]">
        Contact me for any issue or information mistake.
      </p>
    </section>
  );
}
