// Decoupled FAQ copy. Swap titles/answers here; the section and accordion
// only consume this array. Four items mirror the Figma/codegen FAQ frame.

export interface FaqItem {
  value: string;
  title: string;
  content: string;
}

export const faqItems: FaqItem[] = [
  {
    value: 'item-1',
    title: 'Kapan Integrated Career Days 2026 berlangsung?',
    content:
      'Integrated Career Days 2026 berlangsung pada 28–29 November 2026 di Gelanggang Inovasi dan Kreativitas (GIK) UGM, Yogyakarta.',
  },
  {
    value: 'item-2',
    title: 'Bagaimana cara mendaftar?',
    content:
      'Ikuti alur pendaftaran sesuai statusmu. Sivitas UGM mendaftar melalui Simaster UGM, sedangkan Non-Sivitas UGM mendaftar melalui Mitra Simaster. Detail langkahnya ada di bagian Alur Pendaftaran.',
  },
  {
    value: 'item-3',
    title: 'Apakah acara ini gratis?',
    content:
      'Ya, Integrated Career Days 2026 terbuka untuk umum dan gratis. Pastikan kamu sudah mendaftar dan membawa KTP untuk sesi walk-in interview.',
  },
  {
    value: 'item-4',
    title: 'Di mana saya bisa melihat lokasi booth dan perusahaan?',
    content:
      'Buka Denah Interaktif untuk melihat peta GIK, daftar perusahaan, dan lokasi booth. Gunakan Quick Find atau List View untuk mencari perusahaan tertentu.',
  },
];
