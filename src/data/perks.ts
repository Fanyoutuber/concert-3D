import { Perk } from '../types';

export const PERKS: Perk[] = [
  {
    id: 'perk-crimson-card',
    code: '#TDN-01',
    name: 'Thẻ Bo Góc Crimson',
    category: 'Photocard Độc Quyền',
    badgeText: 'Crimson Wine',
    description:
      'Thẻ cứng bo góc hiệu ứng rượu vang loang nghệ thuật in dập nổi chữ bạc 3D độc quyền "ALO! TĐN XIN NGHE".',
    materialNote: 'Chất liệu cứng bóng cao cấp',
    image: '/assets/ALO_TICKET-2.png',
    iconName: 'sparkles',
    accentColor: 'rose',
  },
  {
    id: 'perk-dark-chrome-card',
    code: '#TDN-02',
    name: 'Thẻ Bo Góc Dark Chrome',
    category: 'Photocard Phiên Bản Kim Loại',
    badgeText: 'Dark Chrome',
    description:
      'Phiên bản nền đen huyền bí kết hợp typography bạc chrome phồng 3D cùng logo Trường THCS & THPT Trần Đại Nghĩa.',
    materialNote: 'Dập nổi logo trường',
    image: '/assets/ALO_TICKET.png',
    iconName: 'tag',
    accentColor: 'purple',
  },
  {
    id: 'perk-wristband',
    code: '#TDN-03',
    name: 'Vòng Tay Festival ALO! TĐN',
    category: 'Vòng Tay Đeo Sự Kiện',
    badgeText: 'Check-in Pass',
    description:
      'Set vòng tay festival vải dệt đa sắc màu phân biệt từng hạng vé và khu vực (Glamping VIP, StandART, Early Bird).',
    materialNote: 'Chống nước & xé rách',
    image: '/assets/perk-wristband.png',
    iconName: 'ticket',
    accentColor: 'cyan',
  },
  {
    id: 'perk-tumbler',
    code: '#TDN-04',
    name: 'Ly Giữ Nhiệt ALO! TĐN',
    category: 'Ly Giữ Nhiệt Du Lịch',
    badgeText: 'Special Tumbler',
    description:
      'Bình / Ly giữ nhiệt thể thao 3 tone màu (Trắng tinh tế, Xanh Navy, Đỏ Hồng) trang bị quai xách tiện lợi cho concert.',
    materialNote: 'Giữ nhiệt nóng/lạnh bền bỉ',
    image: '/assets/IMG_2351.png',
    iconName: 'coffee',
    accentColor: 'amber',
  },
];
