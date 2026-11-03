import { TicketTier } from '../types';

export const TICKET_TIERS: TicketTier[] = [
  {
    id: 'STANDARD',
    name: 'Vé Thường',
    price: 250000,
    currency: 'VND',
    isSoldOut: false,
    statusBadge: 'MỞ BÁN',
    description: 'Khu CAT 1–30, Stardom & Fanzone • Tặng trọn bộ Perks',
    zonesSummary: 'Toàn bộ khu CAT 1–30, STARDOM L/R, FANZONE L/R',
    perksIncluded: [
      'Thẻ Bo Góc Crimson (#TDN-01)',
      'Thẻ Bo Góc Dark Chrome (#TDN-02)',
      'Vòng Tay Festival ALO! TĐN (#TDN-03)',
      'Ly Giữ Nhiệt ALO! TĐN (#TDN-04)',
    ],
    ctaLabel: 'Chọn nhanh 1 vé',
  },
  {
    id: 'VIP',
    name: 'Hạng VIP',
    price: 500000,
    originalPrice: 250000,
    currency: 'VND',
    isSoldOut: true,
    statusBadge: 'SOLD OUT',
    description: 'Khu VIP & BVIP giới hạn • Đã bán hết',
    zonesSummary: 'Khu VIP, BVIP & Dải VIP hai cánh sân khấu',
    perksIncluded: [
      'Vị trí VIP/BVIP ưu tiên sát sân khấu',
      'Trọn bộ 4 vật phẩm Merchandise giới hạn',
      'Lối vào Check-in ưu tiên (Fast-track)',
    ],
    ctaLabel: 'Đã bán hết',
  },
];
