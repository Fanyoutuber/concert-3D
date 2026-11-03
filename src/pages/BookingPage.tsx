import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  HelpCircle,
  Plus,
  ShieldCheck,
  Ticket,
  PhoneCall,
} from 'lucide-react';
import { Seat, TicketTier } from '../types';
import { SeatMap } from '../components/Tickets/SeatMap';
import BookingModal from '../components/Booking/BookingModal';

export interface BookingPageProps {
  seats: Seat[];
  selectedSeats: Seat[];
  tiers: TicketTier[];
  maxSeats?: number;
  heldTimeSeconds: number;
  onSeatToggle: (seat: Seat) => void;
  onQuickSelectStandard: () => void;
  onConfirmBooking: (orderCode: string) => void;
  onNotify?: (message: string, tone?: 'emerald' | 'rose' | 'amber' | 'purple' | 'slate') => void;
  onBackToHome: () => void;
}

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

function formatVND(amount: number): string {
  return vndFormatter.format(amount);
}

export const BookingPage: React.FC<BookingPageProps> = ({
  seats,
  selectedSeats,
  tiers,
  maxSeats = 5,
  heldTimeSeconds,
  onSeatToggle,
  onQuickSelectStandard,
  onConfirmBooking,
  onNotify,
  onBackToHome,
}) => {
  // State quản lý việc mở Booking Modal điền thông tin & thanh toán
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Cuộn lên đầu trang khi mở trang Đặt vé
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedSeatIds = selectedSeats.map((s) => s.id);
  const count = selectedSeats.length;
  const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const standardTier = tiers.find((t) => t.id === 'STANDARD');

  const handleOpenCheckoutModal = () => {
    if (count === 0) {
      onNotify?.('Vui lòng chọn ít nhất 1 ghế trên sơ đồ trước khi tiếp tục!', 'amber');
      return;
    }
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0C0709] text-[#F8F4F0] antialiased flex flex-col justify-between">
      {/* 1. TOP NAVBAR TRANG ĐẶT VÉ */}
      <nav className="sticky top-0 z-40 glass-wine border-b border-white/10 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Nút quay lại Trang chủ */}
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition group active:scale-95 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Về Trang Chủ</span>
            <span className="sm:hidden">Trang Chủ</span>
          </button>

          {/* Logo Brand Trung Tâm (Hiển thị đầy đủ chữ ALO! TĐN XIN NGHE trên cả mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#8E2032] flex items-center justify-center font-bold text-white shadow-md border border-white/20 shrink-0">
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-left">
              <span className="text-[8px] sm:text-[9px] tracking-wider uppercase font-bold text-rose-300 block leading-tight truncate max-w-[110px] sm:max-w-none">
                TRẦN ĐẠI NGHĨA
              </span>
              <span className="text-xs sm:text-sm font-heading font-black tracking-tight text-white leading-tight block whitespace-nowrap">
                <span className="text-rose-400">ALO!</span> TĐN XIN NGHE
              </span>
            </div>
          </div>

          {/* Huy hiệu Trang Đặt Vé */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 sm:gap-1.5 shadow-sm whitespace-nowrap">
              <Ticket className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">CỔNG ĐẶT VÉ CHÍNH THỨC</span>
              <span className="sm:hidden">ĐẶT VÉ</span>
            </span>
          </div>
        </div>
      </nav>

      {/* 2. NỘI DUNG CHÍNH TRANG ĐẶT VÉ (SƠ ĐỒ CHỖ NGỒI 2D) */}
      <main className="flex-1 py-8 md:py-14 relative overflow-hidden">
        {/* Vệt sáng trang trí nền */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#8E2032]/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          {/* Breadcrumb & Tiêu Đề */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-xs text-slate-400 mb-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="hover:text-white transition cursor-pointer"
              >
                Trang Chủ
              </button>
              <span>/</span>
              <span className="text-rose-300 font-semibold">Sơ Đồ Chỗ Ngồi &amp; Đặt Vé</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-heading text-white tracking-tight">
              Sơ Đồ Chỗ Ngồi Sân Trường TĐN
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto">
              Nhấp trực tiếp vào phân khu ghế trên sơ đồ 2D để chọn chỗ (Tối đa {maxSeats} vé). Sau khi chọn xong, bấm <strong>Xác nhận đặt vé</strong> để mở cửa sổ thanh toán.
            </p>
          </div>

          {/* KHUNG SƠ ĐỒ CHỖ NGỒI & THANH TỔNG HỢP */}
          <div className="glass-card rounded-[32px] border border-white/15 shadow-2xl overflow-hidden relative">
            <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center">
              {/* Sơ đồ 2D */}
              <SeatMap
                seats={seats}
                selectedSeatIds={selectedSeatIds}
                maxSeats={maxSeats}
                onSeatToggle={onSeatToggle}
              />

              <div className="text-center text-xs sm:text-sm font-semibold text-slate-300 mt-3">
                Sơ đồ phân khu sân trường • Quy mô:{' '}
                <span className="text-amber-300 font-bold">~900 khách</span>
              </div>

              {/* Thanh Chú Thích Ghế (Legend Bar) */}
              <div className="flex items-center justify-center gap-3 sm:gap-5 mt-5 py-2.5 px-4 sm:px-5 rounded-full bg-black/40 border border-white/10 text-[11px] text-slate-300 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#4CAEE3] border border-sky-200/50" />
                  <span>Vé Thường (250K)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-br from-[#8E2032] to-[#E11D48] border border-rose-200 shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
                  <span className="text-rose-300 font-semibold">Đang chọn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#2E5CE6] border border-amber-400/70" />
                  <span className="text-rose-400 font-semibold">Hạng VIP (Sold out)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#E07A16] border border-orange-300/40" />
                  <span className="text-slate-400">Khách mời / FOH</span>
                </div>
              </div>

              {/* THẺ HẠNG VÉ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full mx-auto mt-6">
                <div className="glass-card rounded-2xl p-4 border-2 border-rose-500/50 bg-[#8E2032]/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white uppercase">
                        {standardTier?.name ?? 'Vé Thường'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 uppercase">
                        MỞ BÁN
                      </span>
                    </div>
                    <div className="text-xl font-mono font-black text-amber-300">
                      250,000 đ
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Khu CAT 1–30, Stardom &bull; Tặng trọn bộ Perks
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onQuickSelectStandard}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#B52A40] hover:from-[#A8243A] hover:to-[#C9334C] text-white transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Chọn nhanh 1 vé</span>
                  </button>
                </div>

                <div className="glass-card rounded-2xl p-4 border border-rose-500/20 bg-rose-950/10 opacity-70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase">Hạng VIP</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-300 uppercase">
                        SOLD OUT
                      </span>
                    </div>
                    <div className="text-xl font-mono font-bold text-slate-500 line-through">
                      250,000 đ
                    </div>
                    <p className="text-[10px] text-red-400/80 mt-0.5">Đã bán hết toàn bộ</p>
                  </div>
                  <button
                    disabled
                    type="button"
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  >
                    Đã bán hết
                  </button>
                </div>
              </div>

              {/* THANH TỔNG HỢP VÉ & NÚT XÁC NHẬN ĐẶT VÉ (STICKY ACTION BAR) */}
              <div className="w-full max-w-2xl mt-6 p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl shadow-xl">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <span className="text-xs text-slate-400">
                      {count === 0
                        ? 'Chưa chọn ghế nào'
                        : `Đã chọn: ${selectedSeats.map((s) => s.label).join(', ')} (${count} vé)`}
                    </span>
                    {count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {formatTimer(heldTimeSeconds)}
                      </span>
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-0.5">
                    {count === 0 ? '0 đ' : formatVND(totalAmount)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={count === 0}
                  onClick={handleOpenCheckoutModal}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#D93853] hover:from-[#A8243A] hover:to-[#E54865] text-white shadow-xl shadow-[#8E2032]/40 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                >
                  <span>Xác nhận đặt vé</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* CHÍNH SÁCH & LƯU Ý KHI ĐẶT VÉ */}
          <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl glass-card border border-white/10">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Quyền Lợi Vé Khán Giả</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
                <li>Mỗi vé bao gồm quyền tham dự toàn bộ 5 set diễn của đêm nhạc.</li>
                <li>Tặng kèm trọn bộ merchandise (Áo, Vòng LED, Bình nước, Lanyard).</li>
                <li>Hệ thống gửi vé điện tử tự động lưu trên Google Sheet của BTC.</li>
              </ul>
            </div>

            <div className="p-5 rounded-3xl glass-card border border-white/10">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Hỗ Trợ &amp; Giải Đáp Thắc Mắc</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
                <li>Email BTC: <strong className="text-white">uyentran620119@gmail.com</strong></li>
                <li>Thời gian check-in: Từ 16:30 tại Cổng 20 Lý Tự Trọng, Quận 1.</li>
                <li>Xuất trình mã QR trên điện thoại để quét mã vào cổng.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 3. FOOTER TRANG ĐẶT VÉ */}
      <footer className="py-6 border-t border-white/10 bg-[#080406] text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; 2026 ALO! TĐN XIN NGHE &bull; Trường THCS &amp; THPT Trần Đại Nghĩa</span>
          <button
            type="button"
            onClick={onBackToHome}
            className="text-rose-400 hover:text-rose-300 font-semibold transition cursor-pointer"
          >
            &larr; Quay lại Trang Chủ
          </button>
        </div>
      </footer>

      {/* 4. POP-UP MODAL (ĐIỀN THÔNG TIN -> THANH TOÁN VIETQR -> VÉ ĐIỆN TỬ E-TICKET) */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedSeats={selectedSeats}
        onConfirmBooking={onConfirmBooking}
        onNotify={onNotify}
        onBackToHome={onBackToHome}
      />
    </div>
  );
};

export default BookingPage;
