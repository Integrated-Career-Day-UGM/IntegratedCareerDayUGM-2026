'use client';

import { useEffect, useState } from 'react';

export default function HeroHeader() {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Always show when at the very top.
      if (currentScrollY <= 0) {
        setHidden(false);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down and past threshold -> hide.
        setHidden(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up -> show.
        setHidden(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className="-translate-x-1/2 absolute left-1/2 top-0 z-50 flex h-[118px] w-[1440px] items-center justify-center gap-[10px] overflow-clip px-[102px] py-[24px] transition-transform duration-300 ease-out"
      style={{ transform: hidden ? 'translate(-50%, -100%)' : 'translate(-50%, 0)' }}
      data-name="header"
    >
      <div className="relative flex shrink-0 items-center gap-[317px] rounded-[35px] border border-solid border-[#8f8989] bg-[rgba(95,95,95,0.5)] px-[20px] py-[15px]" data-name="logo header">
        <div className="relative flex shrink-0 items-center gap-[14px]" data-name="logo-header-kiri">
          <div className="relative inline-grid shrink-0 place-items-start leading-[0]">
            <div className="relative col-span-full row-span-full ml-[13.26px] inline-grid place-items-start">
              <div className="relative col-span-full row-span-full ml-[0.46px] mt-0 size-[34.015px]" data-name="Vector">
                <div className="absolute inset-[-3.34%_-3.39%_-3.34%_-3.38%]">
                  <img alt="" className="block size-full max-w-none" src="/landing/hero/vector.svg" />
                </div>
              </div>
              <div className="relative col-span-full row-span-full ml-0 mt-0 h-[34.015px] w-[34.475px]" data-name="image 43">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <img alt="" className="absolute left-[0.7%] top-0 h-full max-w-none w-[98.6%]" src="/landing/hero/image43.webp" />
                </div>
              </div>
            </div>
            <div className="relative col-span-full row-span-full flex h-[14.651px] w-[61.393px] flex-col justify-end font-inter text-[3.067px] font-normal not-italic leading-normal tracking-[-0.0613px] text-white">
              <p className="mb-0 font-semibold leading-[3.908px]">KEMENTRIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</p>
              <p className="font-light leading-[3.908px]">REPUBLIK INDONESIA</p>
            </div>
          </div>
          <div className="relative inline-grid shrink-0 place-items-start leading-[0]">
            <div className="relative col-span-full row-span-full h-[51.683px] w-[50.841px]" data-name="2544303660832">
              <img alt="" className="absolute inset-0 block size-full max-w-none" src="/landing/hero/2544303660832.svg" />
            </div>
          </div>
          <div className="relative h-[52px] w-[158px]">
            <div className="absolute contents left-[0.28px] top-[4.35px]">
              <div
                className="absolute left-[0.28px] top-[4.35px] h-[38.342px] w-[87.538px] bg-white"
                style={{ maskImage: "url('/landing/hero/image45.png')", WebkitMaskImage: "url('/landing/hero/image45.png')", maskSize: '87.538px 38.342px', WebkitMaskSize: '87.538px 38.342px', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' }}
                data-name="image 45"
              />
            </div>
          </div>
        </div>
        <div className="relative flex h-[42px] shrink-0 flex-col items-start py-[5px]" data-name="dikti">
          <div className="relative aspect-[1630/481] w-full shrink-0" data-name="Puith_Horizontal Logo 2">
            <img alt="" className="pointer-events-none absolute inset-0 block size-full max-w-none object-cover" src="/landing/hero/puith-horizontal-logo2.png" />
          </div>
        </div>
      </div>
      <a
        href="/#pendaftaran"
        aria-label="Daftar"
        className="figma-link absolute left-[1037px] top-[37px] flex flex-col items-start"
        data-name="Button Variants"
      >
        <div className="relative flex shrink-0 flex-col items-start" data-name="btn/solid/base">
          <div className="relative flex shrink-0 items-end justify-center gap-[11.665px] rounded-[116.651px] bg-[var(--icd-lime)] px-[20.747px] py-[14.264px]" data-name="btn/base">
            <div className="relative flex shrink-0 items-center justify-center">
              <div className="rotate-180">
                <div className="relative size-[15.561px]" data-name="Union">
                  <img alt="" className="absolute inset-0 block size-full max-w-none" src="/landing/hero/union.svg" />
                </div>
              </div>
            </div>
            <div className="relative flex shrink-0 items-center gap-[12.174px]" data-name="Elements">
              <p className="relative shrink-0 whitespace-nowrap font-inter text-[18.261px] font-semibold not-italic leading-[18.261px] text-[var(--icd-ink)]">
                Daftar
              </p>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
