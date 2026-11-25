// Registration flow data, derived from the friend's codegen (registration.tsx)
// and Figma node 1482:18857.

export type StepIcon = 'apps' | 'clipboard' | 'lock' | 'cursor' | 'simaster';

export interface StepSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  /** Render a line break before this segment. */
  newLine?: boolean;
}

export interface Step {
  number: string;
  segments: StepSegment[];
  /** Card height in the 1440px desktop frame. */
  height: number;
  /** Exact card height in the 390px mobile frame (falls back to min-height). */
  mobileHeight?: number;
  icon?: StepIcon;
}

export interface RegistrationColumn {
  title: string;
  ctaLabel: string;
  ctaHref: string;
  ctaIcon: string;
  left: Step[];
  right: Step[];
}

export const ICONS: Record<StepIcon, { src: string; w: number; h: number }> = {
  apps: { src: '/landing/registration/group7361.svg', w: 37.4, h: 37.4 },
  clipboard: { src: '/landing/registration/group.svg', w: 30, h: 36 },
  lock: { src: '/landing/registration/group1.svg', w: 30, h: 34 },
  cursor: { src: '/landing/registration/group2.svg', w: 34, h: 36 },
  simaster: { src: '/landing/registration/icon-simaster-student2.png', w: 53.5, h: 53.5 },
};

export const columns: RegistrationColumn[] = [
  {
    title: 'Sivitas UGM',
    ctaLabel: 'Buka Simaster',
    ctaHref: 'https://simaster.ugm.ac.id/',
    ctaIcon: '/landing/registration/union2.svg',
    left: [
      {
        number: '1',
        height: 160.405,
        mobileHeight: 109,
        icon: 'simaster',
        segments: [
          { text: 'Buka ' },
          { text: 'aplikasi Simaster UGM vNEXT', bold: true },
        ],
      },
      {
        number: '4',
        height: 106.046,
        mobileHeight: 92,
        icon: 'cursor',
        segments: [
          { text: 'Pilih submenu ' },
          { text: 'Career Fair', bold: true, italic: true },
        ],
      },
      {
        number: '6',
        height: 106.046,
        mobileHeight: 75,
        icon: 'cursor',
        segments: [{ text: 'klik ' }, { text: '‘Simpan’', bold: true }],
      },
    ],
    right: [
      {
        number: '2',
        height: 106,
        mobileHeight: 92,
        icon: 'apps',
        segments: [
          { text: 'Pilih' },
          { text: 'Simaster Apps', bold: true, italic: true, newLine: true },
        ],
      },
      {
        number: '3',
        height: 106,
        mobileHeight: 92,
        icon: 'clipboard',
        segments: [
          { text: 'Buka menu ' },
          { text: 'UGM Career', bold: true, italic: true },
        ],
      },
      {
        number: '5',
        height: 211,
        mobileHeight: 143,
        icon: 'lock',
        segments: [
          { text: 'Mengisi registrasi pendaftaran pada ' },
          { text: 'Universitas Gadjah Mada ', bold: true },
          { text: 'Integrated Career Days 2026', bold: true, italic: true },
        ],
      },
    ],
  },
  {
    title: 'Non-Sivitas UGM',
    ctaLabel: 'Buka Mitra Simaster',
    ctaHref: 'https://mitra.simaster.ugm.ac.id/',
    ctaIcon: '/landing/registration/union3.svg',
    left: [
      {
        number: '1',
        height: 146,
        icon: 'simaster',
        segments: [
          { text: 'Buka' },
          { text: 'mitra.simaster.ugm.ac.id', bold: true, newLine: true },
        ],
      },
      {
        number: '4',
        height: 106.046,
        icon: 'cursor',
        segments: [
          { text: 'Mengisi ' },
          { text: 'data diri', bold: true },
          { text: ' dan submit' },
        ],
      },
      {
        number: '6',
        height: 106.046,
        segments: [
          { text: 'Login', bold: true },
          { text: ' dan pilih menu Career Fair' },
        ],
      },
      {
        number: '8',
        height: 106.046,
        segments: [{ text: 'Lakukan ' }, { text: 'Checkpoint', bold: true }, { text: ' di Simaster' }],
      },
    ],
    right: [
      {
        number: '2',
        height: 106,
        icon: 'apps',
        segments: [{ text: 'Buat akun ' }, { text: 'baru/sign up', bold: true }],
      },
      {
        number: '3',
        height: 106,
        icon: 'clipboard',
        segments: [
          { text: 'Pilih ' },
          { text: 'Pribadi', bold: true },
          { text: ' pada jenis akun mitra' },
        ],
      },
      {
        number: '5',
        height: 100,
        segments: [
          { text: 'Cek ' },
          { text: 'e-mail', bold: true },
          { text: ' dan ' },
          { text: 'verifikasi', bold: true },
        ],
      },
      {
        number: '7',
        height: 114,
        segments: [
          { text: 'Mengisi form pendaftaran dan ' },
          { text: 'simpan', bold: true },
        ],
      },
    ],
  },
];
