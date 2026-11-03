export type SeatStatus = 'available' | 'selected' | 'sold';

export type TicketTierId = 'STANDARD' | 'VIP' | 'GUEST';

export interface ArtistSong {
  number: string;
  title: string;
  performer?: string;
  description: string;
  isHighlight?: boolean;
}

export interface SubArtistProfile {
  id: string;
  name: string;
  role: string;
  style: string;
  message: string;
  stageEffects: string;
  songs: ArtistSong[];
}

export interface Artist {
  id: string;
  key: 'club' | 'linh' | 'long' | 'vibe' | 'dalab';
  row: 1 | 2;
  name: string;
  subtitle: string;
  roleBadge: string;
  drawerHeaderBadge: string;
  cheerCount: number;
  cutoutImage: string;
  backdropImage: string;
  backdropPosition?: string;
  hintTagText: string;
  hintIcon: 'music' | 'flame';
  message: string;
  description: string;
  duration: string;
  style: string;
  setlistHeaderBadge: string;
  stageEffects: string;
  ctaText: string;
  songs: ArtistSong[];
  /** Tách rõ thông tin từng nghệ sĩ đối với thẻ ghép (ví dụ: TLINH & Low G) */
  subArtists?: SubArtistProfile[];
  theme: {
    glowColor: string;
    glowSoft: string;
    borderGlow: string;
    cardBgTint: string;
    accentColorName: 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple';
    dotColorClass: string;
    rolePillClass: string;
    titleColorClass: string;
    hintTagClass: string;
    drawerBadgeClass: string;
    sloganBoxClass: string;
    ctaGradientClass: string;
  };
}

export interface TicketTier {
  id: TicketTierId;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  isSoldOut: boolean;
  statusBadge: string;
  description: string;
  zonesSummary: string;
  perksIncluded: string[];
  ctaLabel: string;
}

export type SeatZoneSection =
  | 'upper-left-vip'
  | 'upper-left-cat'
  | 'upper-center-standing'
  | 'upper-right-cat'
  | 'upper-right-vip'
  | 'mid-left-cat'
  | 'mid-center-statue'
  | 'mid-right-cat'
  | 'lower-row-1-left-vip'
  | 'lower-row-1-cat'
  | 'lower-row-1-right-vip'
  | 'lower-row-2-cat'
  | 'lower-row-3-cat'
  | 'bottom-guest-foh';

export type SeatZoneVariant =
  | 'zone-cat-front'
  | 'zone-cat'
  | 'zone-cat-tall'
  | 'zone-stardom'
  | 'zone-fanzone'
  | 'zone-vip-pink'
  | 'zone-bvip'
  | 'zone-vip'
  | 'zone-guest'
  | 'zone-foh'
  | 'zone-empty';

export interface Seat {
  id: string;
  row: string;
  seatNumber: number;
  label: string;
  topLabel: string;
  subLabel?: string;
  section: SeatZoneSection;
  variant: SeatZoneVariant;
  tier: TicketTierId;
  price: number;
  status: SeatStatus;
}

export interface Perk {
  id: string;
  code: string;
  name: string;
  category: string;
  badgeText: string;
  description: string;
  materialNote: string;
  image: string;
  iconName: 'sparkles' | 'tag' | 'ticket' | 'coffee';
  accentColor: 'rose' | 'purple' | 'cyan' | 'amber';
}
