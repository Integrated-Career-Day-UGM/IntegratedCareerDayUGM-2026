interface LogoBoxProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

/** Reusable white logo tile. Pass any PNG/WebP logo through `src`. */
export default function LogoBox({ src, alt, className = '', imgClassName = '' }: LogoBoxProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-[10px] border-[3px] border-[#c3c3c3] bg-white p-[6px] shadow-[0_1px_2px_rgba(16,24,40,0.12)] ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className={`max-h-full max-w-full object-contain ${imgClassName}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
