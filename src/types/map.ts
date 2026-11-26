export type Day = {
  id: string;
  date: string;
  label: string;
};

export type TrackType = 'booth' | 'session';

export type Track = {
  id: string;
  label: string;
  type: TrackType;
};

export type EventConfig = {
  id: string;
  name: string;
  shortName: string;
  timezone: string;
  days: Day[];
  tracks: Track[];
  defaultVenueId: string;
  locale: string;
};

export type AreaMap = {
  svg: string;
  viewBox: [number, number, number, number];
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
} | null;

export type AreaKind = 'hall' | 'room';

export type Area = {
  id: string;
  name: string;
  kind: AreaKind;
  trackId: string;
  map: AreaMap;
};

export type Venue = {
  id: string;
  name: string;
  areas: Area[];
};

export type Zone = {
  id: string;
  areaId: string;
  name: string;
  color: string;
  boothIds: string[];
};

export type Booth = {
  id: string;
  areaId: string;
  zoneId: string;
  code: string;
  label: string;
  companyId: string | null;
};

export type JobOpening = {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  location?: string | null;
  deadline?: string | null;
  deadlineLabel?: string | null;
  applyUrl?: string | null;
  applyLabel?: string | null;
  program?: string | null;
  intakeCount?: number | null;
  qualifications?: string[];
  preferences?: string[];
  posterUrl?: string | null;
  posterDownloadUrl?: string | null;
  updatedAt?: string | null;
  isMock?: boolean;
  dataSource?: string | null;
  availableDays?: string[];
};

export type ImportantDate = {
  event: string;
  date: string | null;
  time: string | null;
  location: string | null;
  note: string | null;
};

export type ProgramLink = {
  url: string | null;
  label: string;
};

export type CompanyProfile = {
  description?: string | null;
  categories: string[];
  importantDates: ImportantDate[];
  programLinks: ProgramLink[];
  cta?: string | null;
};

export type OpeningsStatus = 'ok' | 'unavailable';

export type CareerFairFile = {
  meta: {
    updatedAt: string | null;
    status: OpeningsStatus;
  };
  profiles?: Record<string, CompanyProfile>;
  items: (JobOpening & { companyId: string })[];
};

/** @deprecated Use CareerFairFile. Kept while old imports settle. */
export type OpeningsFile = CareerFairFile;

export type Company = {
  id: string;
  name: string;
  shortName: string;
  tags: string[];
  websiteUrl: string | null;
  programUrl: string | null;
  logoUrl: string | null;
  posterUrl?: string | null;
  posterDownloadUrl?: string | null;
  description?: string | null;
  profile?: CompanyProfile;
  posters?: CompanyPoster[];
  openings: JobOpening[];
};

export type Session = {
  id: string;
  areaId: string;
  companyId: string;
  trackId: string;
  dayId: string;
  start: string;
  end: string;
  title: string;
};

export type StageSession = {
  id: string;
  dayId: string;
  companyId: string;
  start: string;
  end: string;
  title: string;
  speakers: { name: string; title: string }[];
};

export type WalkInSession = {
  id: string;
  dayId: string;
  companyId: string | null;
  companyName: string;
  room: string;
  boothRef?: string | null;
  start: string;
  end: string;
};

export type QuickFindItem = {
  id: string;
  label: string;
  icon: string;
  category: 'facility' | 'waypoint';
};

export type UiStrings = {
  event: Record<string, string>;
  search: {
    placeholder: string;
    shortcutHint: string;
    shortcutKey: string;
    resultsLabel: string;
    emptyResults: string;
    emptyTitle: string;
    emptyBody: string;
    emptyAction: string;
    filters: {
      trigger: string;
      title: string;
      clear: string;
      sector: string;
      role: string;
    };
  };
  tabs: Record<string, string>;
  quickFind: { title: string; items: Record<string, string> };
  venueList: Record<string, string>;
  walkInList: {
    title: string;
    emptyTitle: string;
    emptyBody: string;
  };
  happeningNow: Record<string, string>;
  boothDetail: Record<string, string> & { shareLabel: string };
  walkInDetail: {
    selectedLabel: string;
    roomPrefix: string;
    openCompanyCta: string;
    noCompanyHint: string;
  };
  companySessions: {
    title: string;
    stageLabel: string;
    roomPrefix: string;
    emptyTitle: string;
    emptyBody: string;
  };
  saved: Record<string, string>;
  insights: {
    title: string;
    subtitle: string;
    kpiSectionTitle: string;
    kpiSectionSubtitle: string;
    sectorsLabel: string;
    kpiEmptyLabel: string;
    cards: Record<string, { label: string; value: string; change?: string; caption: string }>;
    kpi: Record<string, string>;
  };
  info: {
    title: string;
    helpTitle: string;
    registerLabel: string;
    mapsCta: string;
    mapsQuery: string;
    overview: {
      heading: string;
      companies: string;
      tracks: string;
      days: string;
    };
    sections: Record<
      string,
      { heading: string; headline?: string; subline?: string; body: string; items?: string[]; note?: string }
    >;
  };
  map: Record<string, string>;
  posters: Record<string, string>;
  social: {
    title: string;
    instagram: { label: string; handle: string; url: string };
    whatsapp: { label: string; handle: string; url: string };
  };
};

export type PosterInfo = {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  accent: string;
  downloadUrl?: string;
  thumbUrl?: string;
  companyId?: string;
};

export type CompanyPoster = {
  id: string;
  companyId: string;
  companyName: string;
  companyShortName: string;
  kind: 'visit-booth' | 'apply-now' | 'gallery';
  title: string;
  src: string;
  thumbUrl: string;
  downloadUrl: string;
  bytes?: number;
  thumbBytes?: number;
};

export type FacilityInfo = {
  title: string;
  kind: string;
  accent: string;
  summary: string;
  items: { heading: string; body: string }[];
  tip?: string;
};

export type MapViewState = {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
};
