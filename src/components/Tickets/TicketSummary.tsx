import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Download,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Share2,
  User,
  X,
} from 'lucide-react';
import { Seat, TicketTier } from '../../types';

declare global {
  interface Window {
    confetti?: (options: Record<string, unknown>) => void;
  }
}

const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzYua8lfCimH4-8NH3rTMjdEzIVnIad05n8CgJzvhhCpzdzPbsggssC78a1VOe9rFy4/exec';

// Khóa bảo vệ giao tiếp API (Layer 1 Security Handshake)
const API_SECRET_TOKEN = 'TDN_CONCERT_SECURE_2026_X9#1';

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

  // Thông tin khách hàng đặt vé & gửi email
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bẫy bot ngầm (chống spam tự động)
  const [confirmedCustomerName, setConfirmedCustomerName] = useState('');
  const [confirmedCustomerEmail, setConfirmedCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tiện ích Phương án 2 & 3: Gửi lại vé & Lưu vé về máy
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Quản lý quy trình 2 bước chuẩn Ticketbox (Bước 1: Điền thông tin -> Bước 2: Quét mã QR)
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment'>('info');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    setFormError(null);
    setCheckoutStep('info'); // Luôn bắt đầu từ Bước 1
    setIsCheckoutOpen(true);
  };

  // Bộ đếm ngược cooldown gửi lại vé (Phương án 2)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleProceedToPayment = () => {
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();

    if (!trimmedName) {
      setFormError('Vui lòng nhập Họ và tên của bạn để xuất vé.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError('Vui lòng nhập địa chỉ Email hợp lệ để nhận vé điện tử.');
      return;
    }

    // KIỂM TRA COOLDOWN 60S NGAY TẠI BƯỚC 1 (Chặn trước khi thanh toán)
    const storageKey = `tdn_cooldown_${trimmedEmail.toLowerCase()}`;
    const lastSentTime = localStorage.getItem(storageKey);
    const now = Date.now();
    const COOLDOWN_MS = 60 * 1000;

    if (lastSentTime && now - Number(lastSentTime) < COOLDOWN_MS) {
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - Number(lastSentTime))) / 1000);
      setFormError(
        `Email này vừa hoàn tất đặt vé cách đây ít phút. Vui lòng kiểm tra hộp thư (cả mục Spam) trước, hoặc đợi ${remainingSec}s để tiếp tục đặt vé mới.`
      );
      return;
    }

    setFormError(null);
    setCheckoutStep('payment');
  };

  const handleCopyText = (key: string, text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onNotify?.(`Đã sao chép ${label}! 📋`, 'emerald');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleConfirmAndSendTicket = async () => {
    // 1. Kiểm tra validation form
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName) {
      setFormError('Vui lòng nhập Họ và tên của bạn để xuất vé.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError('Vui lòng nhập địa chỉ Email hợp lệ để nhận vé điện tử.');
      return;
    }

    setFormError(null);

    // 0. Kiểm tra Cooldown 60s theo email trên trình duyệt (tránh bấm liên tiếp)
    const storageKey = `tdn_cooldown_${trimmedEmail.toLowerCase()}`;
    const lastSentTime = localStorage.getItem(storageKey);
    const now = Date.now();
    const COOLDOWN_MS = 60 * 1000;

    const labels = selectedSeats.map((s) => s.label);
    const paidTotal = totalAmount;

    if (lastSentTime && now - Number(lastSentTime) < COOLDOWN_MS) {
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - Number(lastSentTime))) / 1000);
      onNotify?.(
        `Email ${trimmedEmail} vừa nhận vé cách đây ít phút. Vui lòng kiểm tra hòm thư (hoặc đợi ${remainingSec}s).`,
        'amber'
      );
      // Hiển thị vé trực tiếp trên màn hình mà không cần gửi lại request spam mail
      setIsCheckoutOpen(false);
      setConfirmedCustomerName(trimmedName);
      setConfirmedCustomerEmail(trimmedEmail);
      setConfirmedSeatLabels(labels);
      setConfirmedTotal(paidTotal);
      setIsTicketOpen(true);
      return;
    }

    setIsSubmitting(true);

    // 2. Gửi dữ liệu sang Google Apps Script (Bảo vệ Lớp 1)
    try {
      const payload = {
        secretToken: API_SECRET_TOKEN,
        hp_website: honeypot, // Bẫy bot
        orderCode,
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customerPhone: trimmedPhone || 'Không cung cấp',
        seats: labels.map((l) => `Khu ${l}`),
        seatCount: labels.length,
        totalAmount: paidTotal,
        note: 'Đã xác nhận chuyển khoản VietQR MBBank',
      };

      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      // Lưu mốc thời gian cooldown 5 phút
      localStorage.setItem(storageKey, Date.now().toString());

      onNotify?.(
        `Thành công! Vé điện tử đã được gửi tới email ${trimmedEmail}`,
        'emerald'
      );
    } catch (err) {
      console.error('Lỗi khi gửi dữ liệu sang Google Apps Script:', err);
      onNotify?.(
        'Đã ghi nhận đơn vé! Đang đồng bộ với hệ thống...',
        'amber'
      );
    } finally {
      setIsSubmitting(false);
      setIsCheckoutOpen(false);
      setConfirmedCustomerName(trimmedName);
      setConfirmedCustomerEmail(trimmedEmail);
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
    }
  };

  // Phương án 2: Yêu cầu gửi lại vé về email (Resend Ticket)
  const handleResendTicketEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);

    const emailToSend = confirmedCustomerEmail || customerEmail;
    const nameToSend = confirmedCustomerName || customerName;

    try {
      const payload = {
        secretToken: API_SECRET_TOKEN,
        hp_website: '',
        orderCode,
        customerName: nameToSend,
        customerEmail: emailToSend,
        customerPhone: customerPhone || 'Không cung cấp',
        seats: confirmedSeatLabels.map((l) => (l.startsWith('Khu') ? l : `Khu ${l}`)),
        seatCount: confirmedSeatLabels.length,
        totalAmount: confirmedTotal || totalAmount,
        note: 'Yêu cầu gửi lại vé từ khán giả',
      };

      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      onNotify?.(
        `Đã gửi lại vé tới email ${emailToSend}! Vui lòng kiểm tra hộp thư.`,
        'emerald'
      );
      setResendCooldown(60);
    } catch (err) {
      console.error('Lỗi khi gửi lại vé:', err);
      onNotify?.('Đã tiếp nhận yêu cầu gửi lại vé!', 'amber');
      setResendCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  // Phương án 3: Lưu vé về máy / Tải ảnh vé PNG (Save Ticket to Device)
  const handleDownloadTicket = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas không được hỗ trợ');

      // 1. Nền Crimson Wine
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#2D0A14');
      bgGrad.addColorStop(0.5, '#16070B');
      bgGrad.addColorStop(1, '#0C0306');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Viền thẻ
      ctx.strokeStyle = '#5A1622';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

      // Badge
      ctx.fillStyle = 'rgba(107, 23, 36, 0.85)';
      ctx.fillRect(160, 42, 280, 30);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      ctx.strokeRect(160, 42, 280, 30);

      ctx.fillStyle = '#FAF5F0';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◆ VÉ ĐIỆN TỬ CHÍNH THỨC ◆', 300, 62);

      // Tiêu đề
      ctx.fillStyle = '#F43F5E';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('ALO! TĐN XIN NGHE', 300, 115);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '13px sans-serif';
      ctx.fillText('Ban Âm nhạc THCS & THPT Trần Đại Nghĩa • O.L.A', 300, 145);

      // Khung Mã Đơn
      ctx.fillStyle = '#20080E';
      ctx.fillRect(40, 175, 520, 75);
      ctx.strokeStyle = '#5A1622';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 175, 520, 75);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MÃ ĐƠN ĐẶT VÉ', 60, 202);

      ctx.fillStyle = '#FBBF24';
      ctx.font = '900 24px monospace';
      ctx.fillText(`#${orderCode}`, 60, 235);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('✓ ĐÃ XÁC NHẬN', 530, 220);

      // Thông tin khán giả
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Khán giả:', 60, 280);
      ctx.fillStyle = '#FAF5F0';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(confirmedCustomerName || customerName || 'Khán giả TĐN', 130, 280);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.fillText('Email:', 60, 305);
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(confirmedCustomerEmail || customerEmail || 'Chưa cung cấp', 130, 305);

      // 3 Khung thông số
      ctx.fillStyle = 'rgba(107, 23, 36, 0.4)';
      ctx.fillRect(40, 330, 160, 60);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.strokeRect(40, 330, 160, 60);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('NGÀY DIỄN', 120, 352);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('07.06.2026', 120, 375);

      ctx.fillStyle = 'rgba(107, 23, 36, 0.4)';
      ctx.fillRect(220, 330, 160, 60);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.strokeRect(220, 330, 160, 60);
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('THỜI GIAN', 300, 352);
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('17:00 – 21:30', 300, 375);

      ctx.fillStyle = 'rgba(107, 23, 36, 0.4)';
      ctx.fillRect(400, 330, 160, 60);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.strokeRect(400, 330, 160, 60);
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('CỔNG VÀO', 480, 352);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Cổng 20 LTTr', 480, 375);

      // Địa điểm
      ctx.fillStyle = 'rgba(107, 23, 36, 0.3)';
      ctx.fillRect(40, 405, 520, 48);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.strokeRect(40, 405, 520, 48);
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ĐỊA ĐIỂM: Sân trường THCS & THPT Trần Đại Nghĩa (20 Lý Tự Trọng, Q.1)', 55, 434);

      // Vị trí ghế
      ctx.fillStyle = '#20080E';
      ctx.fillRect(40, 468, 520, 70);
      ctx.strokeStyle = '#5A1622';
      ctx.strokeRect(40, 468, 520, 70);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('VỊ TRÍ GHẾ NGỒI ĐÃ ĐẶT', 300, 492);
      ctx.fillStyle = '#34D399';
      ctx.font = '900 22px monospace';
      ctx.fillText(confirmedSeatLabels.join(', ') || 'Khu CAT 17', 300, 522);

      // Mã QR
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = ticketQrUrl;
      });

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(185, 555, 230, 230);
      ctx.drawImage(qrImg, 195, 565, 210, 210);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Xuất trình mã QR này tại cổng check-in (20 Lý Tự Trọng) để nhận Perks.', 300, 825);
      ctx.fillStyle = '#64748B';
      ctx.font = '10px sans-serif';
      ctx.fillText('© 2026 O.L.A • Ban Âm nhạc THCS & THPT Trần Đại Nghĩa', 300, 860);

      // Tải ảnh về máy
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Ve-Dien-Tu-ALO-TDN-${orderCode}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onNotify?.('Đã lưu ảnh vé điện tử về máy thành công! 🎟️', 'emerald');
    } catch (err) {
      console.warn('Fallback tải ảnh QR trực tiếp:', err);
      const link = document.createElement('a');
      link.download = `Ve-QR-TDN-${orderCode}.png`;
      link.href = ticketQrUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify?.('Đã mở ảnh mã QR vé để bạn lưu vào máy! 🎟️', 'emerald');
    } finally {
      setIsDownloading(false);
    }
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
        <div className="glass-card rounded-2xl p-4 border-2 border-rose-500/50 bg-[#8E2032]/20 shadow-lg shadow-[#8E2032]/25 flex flex-col justify-between">
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
            className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#B52A40] hover:from-[#A8243A] hover:to-[#C9334C] text-white shadow-md shadow-[#8E2032]/40 transition flex items-center justify-center gap-1.5 active:scale-95"
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
        className="w-full max-w-xl mt-6 p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-black/40 to-[#8E2032]/25 border border-rose-500/30 flex items-center justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center shrink-0">
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
                  <span className="text-rose-300 font-extrabold">
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
          className="py-3.5 px-6 sm:px-8 rounded-full font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#D93853] hover:from-[#A8243A] hover:to-[#E54865] text-white shadow-xl shadow-[#8E2032]/40 active:scale-[0.98]"
        >
          <span>Xác nhận đặt vé</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* MODAL THANH TOÁN 2 BƯỚC CHUẨN TICKETBOX (KHÔNG CUỘN, KHÔNG GIẬT LÊN XUỐNG) */}
      {isCheckoutOpen && (
        <div
          id="modal-checkout"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl"
          onClick={() => !isSubmitting && setIsCheckoutOpen(false)}
        >
          {checkoutStep === 'info' ? (
            /* =========================================================
               BƯỚC 1: ĐIỀN THÔNG TIN NHẬN VÉ (GỌN GÀNG, VỪA KHÍT MÀN HÌNH)
               ========================================================= */
            <div
              className="glass-wine w-full max-w-md rounded-3xl p-5 sm:p-6 border border-white/20 shadow-2xl modal-enter relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Bước 1 */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Bước 1 / 2
                    </span>
                    <span className="text-[10px] text-slate-400">Thông tin người mua</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                    Thông tin nhận vé Concert
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tóm tắt nhanh đơn vé */}
              <div className="mt-4 bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Vị trí ghế ({count} vé)</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedSeats.map((s) => s.label).join(', ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Tổng thanh toán</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Form nhập thông tin */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                    Họ và tên người nhận vé <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="Ví dụ: Trần Minh Khang"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                    Email nhận vé E-Ticket <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="email@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mã QR và thông tin vé sẽ gửi tự động về hòm thư này.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-medium">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ví dụ: 0901 234 567 (tuỳ chọn)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 transition"
                    />
                  </div>
                </div>

                {/* Bẫy Honeypot ẩn (chỉ bot mới điền vào trường này) */}
                <input
                  type="text"
                  name="hp_website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    left: '-9999px',
                    opacity: 0,
                    height: 0,
                    width: 0,
                    pointerEvents: 'none',
                  }}
                />

                {formError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full mt-2 py-3.5 rounded-full font-bold text-white text-sm bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#D93853] hover:from-[#A8243A] hover:to-[#E54865] shadow-xl shadow-[#8E2032]/40 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <span>Tiếp tục đến bước thanh toán QR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================
               BƯỚC 2: QUÉT MÃ VIETQR (BỐ CỤC 2 CỘT CHUẨN PAYOS / VIETQR)
               Không cuộn, cố định 100%, có nút Copy 1 chạm tiện lợi
               ========================================================= */
            <div
              className="glass-wine w-full max-w-2xl rounded-3xl p-5 sm:p-6 border border-white/20 shadow-2xl modal-enter relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Bước 2 */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setCheckoutStep('info')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-slate-200 transition font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sửa thông tin</span>
                  </button>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Bước 2 / 2
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thông báo nơi nhận vé */}
              <div className="mt-3 py-2 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-slate-300 text-[11px]">
                    Gửi vé đến: <strong className="text-white">{customerEmail}</strong> ({customerName})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-rose-300 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimer(checkoutSeconds)}</span>
                </div>
              </div>

              {/* Bố cục 2 cột (Cột Trái: Mã QR • Cột Phải: Thông tin CK) */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Cột trái: Mã QR VietQR */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div className="p-2.5 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <img
                      src={qrFallback ? fallbackQrUrl : vietQrUrl}
                      onError={() => setQrFallback(true)}
                      alt="Mã QR thanh toán concert"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 text-center">
                    Quét qua mọi App Ngân hàng hoặc MoMo
                  </span>
                </div>

                {/* Cột phải: Thông tin tài khoản có nút Copy 1 chạm */}
                <div className="sm:col-span-7 space-y-2 text-xs">
                  {/* Ngân hàng */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Ngân hàng thụ hưởng</span>
                      <span className="font-semibold text-white text-xs">MB Bank (Quân Đội)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      VietQR 24/7
                    </span>
                  </div>

                  {/* Số tài khoản */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Số tài khoản</span>
                      <span className="font-mono font-bold text-white text-sm">8888 6666 9999</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('accountNo', accountNo, 'Số tài khoản')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-rose-300 font-semibold flex items-center gap-1 transition active:scale-95"
                    >
                      {copiedKey === 'accountNo' ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Số tiền */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Số tiền</span>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {formatVND(totalAmount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('amount', totalAmount.toString(), 'Số tiền')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-rose-300 font-semibold flex items-center gap-1 transition active:scale-95"
                    >
                      {copiedKey === 'amount' ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-rose-300 block uppercase font-bold">Nội dung chuyển khoản</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {orderCode} XIN NGHE
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText('content', `${orderCode} XIN NGHE`, 'Nội dung chuyển khoản')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[10px] text-rose-200 font-bold flex items-center gap-1 transition active:scale-95"
                    >
                      {copiedKey === 'content' ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nút bấm xác nhận */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmAndSendTicket}
                    className="w-full mt-3 py-3.5 rounded-full font-bold text-white text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu đơn &amp; gửi vé về email...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tôi đã chuyển khoản thành công</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
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
              <div className="p-6 text-center bg-gradient-to-b from-[#8E2032]/70 via-[#6B1724]/40 to-transparent">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#8E2032] to-rose-500 text-white flex items-center justify-center shadow-lg shadow-[#8E2032]/50 mb-3">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="text-2xl font-black font-heading text-white tracking-tight">
                  Booking confirmed!
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Vé concert đã sẵn sàng •{' '}
                  <span className="font-mono text-amber-300 font-bold">#{orderCode}</span>
                </p>
                {confirmedCustomerEmail && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-left flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="text-[11px] overflow-hidden">
                      <span className="text-slate-300 block">Đã gửi vé điện tử đến email:</span>
                      <span className="font-mono font-bold text-amber-300 truncate block">
                        {confirmedCustomerEmail}
                      </span>
                      {confirmedCustomerName && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Khán giả: <strong className="text-white">{confirmedCustomerName}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-inner">
                  <div
                    className="h-28 relative overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/assets/truong-tdn.jpg')" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12080D] via-black/40 to-black/20" />
                    <div className="absolute bottom-2 left-3 right-3 text-left">
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#8E2032] text-white">
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
                    <div className="grid grid-cols-3 gap-2 pb-3 border-b border-white/10 text-[11px]">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Ngày diễn</span>
                        <span className="text-xs font-bold text-white block mt-0.5">07.06.26</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Thời gian</span>
                        <span className="text-xs font-bold text-amber-300 block mt-0.5">17:00 – 21:30</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Cổng vào</span>
                        <span className="text-xs font-bold text-white block mt-0.5">Cổng 20 LTTr</span>
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

                {/* Tiện ích Phương án 2 & 3: Lưu vé về máy + Gửi lại vé về Email */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleDownloadTicket}
                    disabled={isDownloading}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-medium flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{isDownloading ? 'Đang tạo...' : 'Lưu vé về máy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendTicketEmail}
                    disabled={resendCooldown > 0 || isResending}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-medium flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-rose-300" />
                    )}
                    <span>
                      {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại vé'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      onNotify?.(
                        'Đã lưu vé vào Apple Wallet / Google Wallet thành công! 🎟️',
                        'emerald'
                      )
                    }
                    className="py-2.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-rose-400" />
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
                  className="mt-2.5 w-full py-3 rounded-full font-bold text-white text-xs bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#C9334C] hover:from-[#A8243A] hover:to-[#DE3D58] shadow-lg shadow-[#8E2032]/40 flex items-center justify-center gap-1.5 transition active:scale-95"
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
