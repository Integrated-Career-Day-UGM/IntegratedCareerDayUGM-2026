// Reusable logo data for the bento marquee, presenting-companies wall and
// media partners. Swap/add `src` entries when the final PNG pack arrives.

export interface LogoItem {
  name: string;
  src: string;
}

export const companyLogos: LogoItem[] = [
  { name: 'Astra', src: '/landing/companies/logos/gold-logo-pt-astra-international1.webp' },
  { name: 'BNI', src: '/landing/companies/logos/logo-bni-png1.png' },
  { name: 'Paragon', src: '/landing/companies/logos/logo-paragoncorp2.webp' },
  { name: 'Odoo', src: '/landing/companies/logos/odoo-purple-logo-for-white-background1.png' },
  { name: 'Zurich', src: '/landing/companies/logos/zurich1.png' },
  { name: 'Polygon', src: '/landing/companies/logos/logo-polygon-group-new.png' },
  { name: 'Cobra Dental', src: '/landing/companies/logos/e10cobra-dental-logo1.webp' },
  { name: 'Partner logo', src: '/landing/companies/logos/image813.webp' },
  { name: 'OCBC', src: '/landing/companies/logos/logo-ocbc-new1.png' },
  { name: 'Hutama Karya', src: '/landing/companies/logos/gold-logo-pt-hutama-karya-infrastruktur-photoroom1.webp' },
  { name: 'Seainsure', src: '/landing/companies/logos/seainsure-indonesia-logo1.png' },
  { name: 'APP', src: '/landing/companies/logos/image809.png' },
  { name: 'Quick', src: '/landing/companies/logos/image810.png' },
];

export const mediaPartnerLogos: LogoItem[] = [
  { name: 'UGM Online', src: '/landing/partners/ugm-online.png' },
  { name: 'Komap UGM', src: '/landing/partners/komap.png' },
];

export const careerExpoColumns: LogoItem[][] = [0, 1, 2].map((column) =>
  companyLogos.filter((_, index) => index % 3 === column),
);
