'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScheduleCardData, ScheduleDayData } from './data';

interface ScheduleDayProps {
  day: ScheduleDayData;
  variant: 'desktop' | 'mobile';
}

function SpeakerArtwork({ card, variant }: { card: ScheduleCardData; variant: 'desktop' | 'mobile' }) {
  const isDesktop = variant === 'desktop';

  return (
    <div
      className={`relative overflow-hidden ${isDesktop ? 'h-[226px] w-full' : 'h-full w-full'}`}
      style={{
        background:
          'repeating-conic-gradient(#ff5a88 0 25%, #f6f1f2 25% 50%) 50% / ' +
          (isDesktop ? '70px 70px' : '46px 46px'),
      }}
    >
      {card.photo ? (
        <img
          src={card.photo}
          alt=""
          className="absolute inset-0 size-full object-cover object-top"
          draggable={false}
        />
      ) : card.logo ? (
        <img
          src={card.logo}
          alt={`Logo ${card.companyName}`}
          className={`absolute left-1/2 -translate-x-1/2 object-contain ${
            isDesktop ? 'top-[54px] max-h-[112px] w-[156px]' : 'top-[56px] max-h-[96px] w-[138px]'
          }`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          className={`absolute left-1/2 top-1/2 w-[86%] -translate-x-1/2 -translate-y-1/2 text-center font-priego font-bold leading-tight text-[#1f2f48] ${
            isDesktop ? 'text-[26px]' : 'text-[22px]'
          }`}
        >
          {card.companyShortName}
        </span>
      )}

      {card.logo && card.photo && (
        <img
          src={card.logo}
          alt=""
          className={`absolute left-[8px] top-[8px] bg-white/90 object-contain p-[2px] ${
            isDesktop ? 'h-[27px] max-w-[110px]' : 'h-[23px] max-w-[92px]'
          }`}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

function SpeakerCard({ card, variant }: { card: ScheduleCardData; variant: 'desktop' | 'mobile' }) {
  const isDesktop = variant === 'desktop';

  return (
    <li className={`shrink-0 snap-start ${isDesktop ? 'w-[223px]' : 'w-[200px]'}`}>
      <a
        href={`/map/#company=${card.companyId}`}
        aria-label={`${card.speakerName} — ${card.companyName}`}
        className="figma-link block"
      >
        <div className="flex items-center bg-[#181818] px-[8px] py-[2px]">
          <span className={`font-priego font-bold leading-normal text-[#f2f2f2] ${isDesktop ? 'text-[15px]' : 'text-[15.098px]'}`}>
            Booth {card.boothCode ?? '—'}
          </span>
        </div>

        <div className={`relative overflow-hidden bg-[#ebebeb] ${isDesktop ? 'h-[226px]' : 'h-[265.394px]'}`}>
          <SpeakerArtwork card={card} variant={variant} />

          <div className={`absolute inset-x-[12px] bottom-[8px] flex flex-col gap-[2px] ${isDesktop ? 'text-[14px]' : ''}`}>
            <strong className={`w-fit max-w-full bg-[#d9ff73] px-[3px] font-priego font-bold leading-normal text-black ${isDesktop ? 'text-[15px]' : 'text-[14.504px]'}`}>
              {card.speakerName}
            </strong>
            <span className={`font-priego font-bold leading-normal text-white ${isDesktop ? 'text-[14px]' : 'text-[14.504px]'}`}>
              {card.speakerTitle}
            </span>
            <span className={`font-priego font-bold leading-normal text-white ${isDesktop ? 'text-[10px]' : 'text-[9.732px]'}`}>
              {card.companyName}
            </span>
          </div>
        </div>
      </a>
    </li>
  );
}

export default function ScheduleDay({ day, variant }: ScheduleDayProps) {
  const isDesktop = variant === 'desktop';
  const [slotIndex, setSlotIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const trackRef = useRef<HTMLUListElement>(null);

  const slot = day.slots[slotIndex] ?? day.slots[0];
  const cards = slot?.cards ?? [];

  useEffect(() => {
    setCardIndex(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [slotIndex]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    const cardWidth = first?.offsetWidth ?? 1;
    const gap = isDesktop ? 34 : 16;
    setCardIndex(Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / (cardWidth + gap)))));
  };

  const shift = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    const cardWidth = (first?.offsetWidth ?? 200) + (isDesktop ? 34 : 16);
    track.scrollBy({ left: cardWidth * direction, behavior: 'smooth' });
  };

  return (
    <article
      className={`relative flex flex-col gap-[16px] ${
        isDesktop
          ? 'w-[864px] bg-transparent'
          : 'min-h-[457px] w-[342px] max-w-full rounded-[8px] bg-[#fafafa] p-[16px]'
      }`}
      aria-label={`Company Session ${day.date}`}
    >
      <div className="flex w-full items-center gap-[12px]">
        {/* Date block */}
        <div className={`flex shrink-0 flex-col items-center justify-center ${isDesktop ? 'w-[74px]' : 'h-[66.33px] w-[61.38px]'}`}>
          <div className="flex flex-col items-center leading-none">
            {day.dayNumbers.map((number, index) => (
              <span
                key={number}
                className={`font-priego font-bold ${
                  index === day.activeDayIndex
                    ? `bg-[#ff316b] text-white ${isDesktop ? 'px-[8px] text-[30px]' : 'px-[7px] text-[15.716px]'}`
                    : `text-[#1f2f48] ${isDesktop ? 'text-[24px]' : 'text-[13px]'}`
                }`}
              >
                {number}
              </span>
            ))}
          </div>
          <span className={`mt-[3px] bg-[#d9ff73] px-[8px] font-priego font-bold text-[#1f2f48] ${isDesktop ? 'text-[13px]' : 'text-[10.618px]'}`}>
            {day.badge}
          </span>
        </div>

        {/* Times */}
        <div className="relative flex-1">
          <div className={`grid gap-[8px] ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
            {day.slots.map((entry, index) => (
              <button
                key={entry.time}
                type="button"
                onClick={() => setSlotIndex(index)}
                aria-pressed={index === slotIndex}
                className={`flex items-center justify-center overflow-clip font-priego font-bold transition-colors ${
                  isDesktop ? 'min-h-[55px] text-[27px]' : 'h-[32px] text-[12px]'
                } ${
                  index === slotIndex ? 'bg-[#ff316b] text-white' : 'text-[#1f2f48] hover:bg-[#ff316b]/10'
                }`}
              >
                {entry.time}
              </button>
            ))}
          </div>
        </div>

        {isDesktop && (
          <div className="flex shrink-0 gap-[5px]">
            <button
              type="button"
              aria-label="Kartu sebelumnya"
              onClick={() => shift(-1)}
              className="figma-link flex h-[44px] w-[38px] items-center justify-center bg-[#dedede] text-[32px] leading-none text-[var(--icd-ink)] hover:bg-[var(--icd-lime)]"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Kartu berikutnya"
              onClick={() => shift(1)}
              className="figma-link flex h-[44px] w-[38px] items-center justify-center bg-[#dedede] text-[32px] leading-none text-[var(--icd-ink)] hover:bg-[var(--icd-lime)]"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {isDesktop && (
        <p className="font-priego text-[16px] font-bold text-[var(--icd-ink)]">
          {slot?.time} · {cards.length} pembicara
        </p>
      )}

      {/* Carousel */}
      <div className={`relative w-full overflow-hidden ${isDesktop ? 'h-[353px]' : 'h-[289px]'}`}>
        <ul
          ref={trackRef}
          onScroll={handleScroll}
          className={`flex h-full list-none items-start overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isDesktop ? 'gap-[34px]' : 'gap-[16px]'
          }`}
          style={{ scrollSnapType: 'x proximity' }}
        >
          {cards.map((card) => (
            <SpeakerCard key={card.id} card={card} variant={variant} />
          ))}
        </ul>
      </div>

      {/* Caption + dots */}
      <div className={`flex items-center justify-between ${isDesktop ? 'pl-[33px]' : ''}`}>
        <span className={`font-priego font-bold text-[var(--icd-ink)] ${isDesktop ? 'text-[16px]' : 'text-[12px]'}`}>
          {String(cardIndex + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-[6px]">
          {cards.map((card, index) => (
            <span
              key={card.id}
              className={`block h-[6px] rounded-full transition-all ${
                index === cardIndex ? 'w-[18px] bg-[#ff316b]' : 'w-[6px] bg-[#d9d9d9]'
              }`}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
