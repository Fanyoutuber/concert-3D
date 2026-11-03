import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Plus,
  Share2,
  X,
} from 'lucide-react';
import { Seat, TicketTier } from '../../types';

declare global {
  interface Window {
    confetti?: (options: Record<string, unknown>) => void;
  }
}

export interface TicketSummaryProps {
  selectedSeats: Seat[];
  tiers: TicketTier[];
  maxSeats?: number;
  heldTimeSeconds: number;
  onQuickSelectStandard: () => void;
  onConfirmBooking: (orderCode: string) => void;
  onNotify?: (message: string, tone?: 'emerald' | 'rose' | 'amber' | 'purple' | 'slate') => void;
}

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

export function formatVND(amount: number): string {
  return vndFormatter.format(amount);
}

export const TicketSummary: React.FC<TicketSummaryProps> = ({
  selectedSeats,
  tiers,
  maxSeats = 5,
  heldTimeSeconds,
  onQuickSelectStandard,
  onConfirmBooking,
  onNotify,
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [orderCode, setOrderCode] = useState('TDN849200');
  const [checkoutSeconds, setCheckoutSeconds] = useState(600);
  const [confirmedSeatLabels, setConfirmedSeatLabels] = useState<string[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [qrFallback, setQrFallback] = useState(false);

  const count = selectedSeats.length;
  const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isCheckoutOpen) return;
    setCheckoutSeconds(600);
    const interval = setInterval(() => {
      setCheckoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCheckoutOpen(false);
          onNotify?.('Hết thời gian thanh toán! Vui lòng thực hiện lại.', 'amber');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckoutOpen, onNotify]);

  const handleOpenCheckout = () => {
    if (count === 0) return;
    const newCode = 'TDN' + Math.floor(100000 + Math.random() * 900000);
    setOrderCode(newCode);
    setQrFallback(false);
    setIsCheckoutOpen(true);
  };

  const handleSimulatePaymentSuccess = () => {
    const labels = selectedSeats.map((s) => s.label);
    const paidTotal = totalAmount;

    setIsCheckoutOpen(false);
    setConfirmedSeatLabels(labels);
    setConfirmedTotal(paidTotal);
    setIsTicketOpen(true);

    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#EC4899', '#E11D48', '#F59E0B', '#10B981', '#FAF5F0'],
      });
    }

    onConfirmBooking(orderCode);
    onNotify?.('Xác nhận thành công! Vé E-Ticket của bạn đã sẵn sàng.', 'purple');
  };

  const bankId = 'MB';
  const accountNo = '888866669999';
  const template = 'compact2';
  const description = encodeURIComponent(`${orderCode} XIN NGHE`);
  const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${totalAmount}&addInfo=${description}&accountName=ALO%20TDN%20XIN%20NGHE`;
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `PAYMENT:${orderCode}:${totalAmount}:MB888866669999`
  )}`;

  const ticketQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `TDN-CONCERT:${orderCode}:${confirmedSeatLabels.join(',')}:${confirmedTotal}`
  )}`;

  const standardTier = tiers.find((t) => t.id === 'STANDARD');
  const vipTier = tiers.find((t) => t.id === 'VIP');

  return (
    <>
      {/* Tier Selector Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 w-full max-w-xl">
        {/* Standard Tier Card */}
        <div className="glass-card rounded-2xl p-4 border-2 border-purple-500/60 bg-purple-950/20 shadow-lg shadow-purple-900/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white uppercase">
                {standardTier?.name ?? 'Vé Thường'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 uppercase">
                {standardTier?.statusBadge ?? 'MỞ BÁN'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-amber-300">
              250,000 đ
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {standardTier?.description ??
                'Khu CAT 1–30, Stardom & Fanzone • Tặng trọn bộ Perks'}
            </p>
          </div>
          <button
            id="btn-quick-select-std"
            type="button"
            onClick={onQuickSelectStandard}
            className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />{' '}
            {standardTier?.ctaLabel ?? 'Chọn nhanh 1 vé'}
          </button>
        </div>

        {/* VIP Tier Card (Sold out) */}
        <div className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-rose-950/10 opacity-75 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase">
                {vipTier?.name ?? 'Hạng VIP'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-300 uppercase">
                {vipTier?.statusBadge ?? 'SOLD OUT'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-500 line-through">
              250,000 đ
            </div>
            <p className="text-[10px] text-red-400/80 mt-1">
              {vipTier?.description ?? 'Khu VIP & BVIP giới hạn • Đã bán hết'}
            </p>
          </div>
          <button
            disabled
            type="button"
            className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-500 cursor-not-allowed"
          >
            {vipTier?.ctaLabel ?? 'Đã bán hết'}
          </button>
        </div>
      </div>

      {/* Selected Seat Summary Pill & Live Countdown */}
      <div
        id="selection-pill-bar"
        className="w-full max-w-xl mt-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            {count === 0 ? (
              <>
                <div
                  id="selected-seats-label"
                  className="text-xs font-bold text-white flex items-center gap-2"
                >
                  Chưa chọn khu vực / vé nào
                </div>
                <div id="selected-seats-desc" className="text-[11px] text-slate-400">
                  Nhấp vào khu CAT, Stardom hoặc Fanzone bất kỳ trên sơ đồ để giữ chỗ (tối đa {maxSeats} ghế)
                </div>
              </>
            ) : (
              <>
                <div
                  id="selected-seats-label"
                  className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap"
                >
                  <span className="text-purple-300 font-extrabold">
                    {count}/{maxSeats} vé
                  </span>
                  <span>•</span>
                  <span>{selectedSeats.map((s) => s.label).join(', ')}</span>
                </div>
                <div id="selected-seats-desc" className="text-[11px] text-slate-400">
                  Vé Thường • 250.000 đ / vé • Đã bao gồm trọn bộ Perks
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Giữ chỗ:{' '}
            <strong id="seats-held-timer" className="font-mono">
              {count > 0 ? formatTimer(heldTimeSeconds) : '09:59'}
            </strong>
          </span>
        </div>
      </div>

      {/* Bottom Total & Confirm Booking Bar */}
      <div className="w-full max-w-xl mt-6 pt-5 border-t border-white/10 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block">Tổng thanh toán:</span>
          <span
            id="seat-total-price"
            className="text-2xl sm:text-3xl font-black font-mono text-amber-300"
          >
            {count === 0 ? '0 đ' : formatVND(totalAmount)}
          </span>
        </div>

        <button
          id="btn-continue-checkout"
          type="button"
          disabled={count === 0}
          onClick={handleOpenCheckout}
          className="py-3.5 px-6 sm:px-8 rounded-full font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-xl shadow-purple-900/40 active:scale-[0.98]"
        >
          <span>Xác nhận đặt vé</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* MODAL THANH TOÁN QR VIETQR */}
      {isCheckoutOpen && (
        <div
          id="modal-checkout"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
          onClick={() => setIsCheckoutOpen(false)}
        >
          <div
            className="glass-wine w-full max-w-md rounded-3xl p-6 border border-white/20 shadow-2xl modal-enter max-h-[92vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Thanh toán vé Concert
                </h3>
                <p className="text-xs text-slate-400">
                  Quét mã QR qua Ngân hàng hoặc Ví MoMo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Mã đơn vé</span>
                  <span className="font-mono font-bold text-white">#{orderCode}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Số tiền</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="relative p-3 bg-white rounded-2xl shadow-2xl my-2">
                <img
                  src={qrFallback ? fallbackQrUrl : vietQrUrl}
                  onError={() => setQrFallback(true)}
                  alt="Mã QR thanh toán concert"
                  className="w-52 h-52 object-contain rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 mt-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Hiệu lực thanh toán:</span>
                <span className="font-mono font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  {formatTimer(checkoutSeconds)}
                </span>
              </div>

              <div className="w-full bg-white/5 p-3 rounded-2xl text-[11px] text-slate-300 space-y-1.5 border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ngân hàng:</span>
                  <span className="font-semibold text-white">MB Bank (Quân Đội)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="font-mono font-bold text-white">8888 6666 9999</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nội dung CK:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {orderCode} XIN NGHE
                  </span>
                </div>
              </div>

              <div className="w-full mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleSimulatePaymentSuccess}
                  className="w-full py-3.5 rounded-full font-bold text-white text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>Tôi đã chuyển khoản thành công</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 font-normal">
                  Hệ thống kích hoạt E-Ticket ngay tại chỗ không cần tải lại trang
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VÉ ĐIỆN TỬ E-TICKET */}
      {isTicketOpen && (
        <div
          id="modal-ticket"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl"
          onClick={() => setIsTicketOpen(false)}
        >
          <div className="w-full max-w-sm modal-enter" onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-[32px] overflow-hidden border border-white/20 bg-[#12080D] shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
              <div className="p-6 text-center bg-gradient-to-b from-purple-950/60 to-transparent">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 mb-3">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-black font-heading text-white tracking-tight">
                  Booking confirmed!
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Vé concert đã sẵn sàng •{' '}
                  <span className="font-mono text-purple-300 font-bold">#{orderCode}</span>
                </p>
              </div>

              <div className="px-5 pb-5">
                <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-inner">
                  <div
                    className="h-28 relative overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('assets/truong-tdn.jpg')" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12080D] via-black/40 to-black/20" />
                    <div className="absolute bottom-2 left-3 right-3 text-left">
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-600/80 text-white">
                        LIVE MUSIC CONCERT
                      </span>
                      <h4 className="text-base font-black font-heading text-white leading-tight mt-1">
                        ALO! TĐN XIN NGHE
                      </h4>
                      <p className="text-[10px] text-slate-300">
                        Trường THCS &amp; THPT Trần Đại Nghĩa • 20 Lý Tự Trọng
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 text-left">
                    <div className="grid grid-cols-3 gap-2 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Ngày</span>
                        <span className="text-xs font-bold text-white">07.06.26</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Giờ diễn</span>
                        <span className="text-xs font-bold text-amber-300">19:00</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Cổng vào</span>
                        <span className="text-xs font-bold text-purple-300">Cổng 20 LTTr</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pb-2">
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block">Vị trí ghế ngồi</span>
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          {confirmedSeatLabels.map((s) => `Khu ${s}`).join(', ') || 'Khu CAT 17'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Số lượng</span>
                        <span className="text-xs font-bold text-white">
                          {confirmedSeatLabels.length} vé
                        </span>
                      </div>
                    </div>

                    <div className="relative py-2 flex items-center justify-between">
                      <div className="w-3 h-6 rounded-r-full bg-[#12080D] -ml-4 border-r border-white/15" />
                      <div className="flex-1 border-t-2 border-dashed border-white/20 mx-2" />
                      <div className="w-3 h-6 rounded-l-full bg-[#12080D] -mr-4 border-l border-white/15" />
                    </div>

                    <div className="flex flex-col items-center justify-center pt-1 text-center">
                      <div className="p-2.5 bg-white rounded-xl shadow-lg mb-1.5">
                        <img
                          src={ticketQrUrl}
                          alt="Mã QR soát vé concert"
                          className="w-32 h-32 object-contain"
                        />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Scan at entrance • Quét mã tại cổng trường
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300 mt-1">
                        Đã thanh toán: {formatVND(confirmedTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      onNotify?.(
                        'Đã lưu vé vào Apple Wallet / Google Wallet thành công! 🎟️',
                        'purple'
                      )
                    }
                    className="py-2.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                    <span>Add to wallet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                      }
                      onNotify?.(
                        'Đã sao chép liên kết chia sẻ vé concert thành công! 📋',
                        'rose'
                      );
                    }}
                    className="py-2.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Chia sẻ vé</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTicketOpen(false)}
                  className="mt-2.5 w-full py-3 rounded-full font-bold text-white text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Hoàn tất &amp; Quay lại trang chủ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketSummary;
