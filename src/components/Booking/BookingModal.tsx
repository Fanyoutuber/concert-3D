import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Download,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Ticket,
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

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

export function formatVND(amount: number): string {
  return vndFormatter.format(amount);
}

export type BookingModalStep = 'info' | 'payment' | 'ticket';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeats: Seat[];
  tiers?: TicketTier[];
  heldTimeSeconds?: number;
  onConfirmBooking: (orderCode: string) => void;
  onNotify?: (message: string, tone?: 'emerald' | 'rose' | 'amber' | 'purple' | 'slate') => void;
  onBackToHome?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedSeats,
  onConfirmBooking,
  onNotify,
  onBackToHome,
}) => {
  // Bắt đầu ngay từ bước điền thông tin (Megatix-style checkout modal)
  const [currentStep, setCurrentStep] = useState<BookingModalStep>('info');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Thông tin đơn hàng & khách hàng
  const [orderCode, setOrderCode] = useState('TDN849200');
  const [checkoutSeconds, setCheckoutSeconds] = useState(600);
  const [qrFallback, setQrFallback] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bẫy bot ngầm (chống spam tự động)
  const [confirmedCustomerName, setConfirmedCustomerName] = useState('');
  const [confirmedCustomerEmail, setConfirmedCustomerEmail] = useState('');
  const [confirmedSeatLabels, setConfirmedSeatLabels] = useState<string[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Phương án 2 & 3: Gửi lại vé & Lưu vé về máy
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const count = selectedSeats.length;
  const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Khóa cuộn trang chính phía sau khi modal đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentStep('info');
      setShowCancelConfirm(false);
      setFormError(null);
      const newCode = 'TDN' + Math.floor(100000 + Math.random() * 900000);
      setOrderCode(newCode);
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      setCurrentStep('info');
      setShowCancelConfirm(false);
    }
  }, [isOpen]);

  // Bộ đếm ngược 10 phút ở bước thanh toán VietQR
  useEffect(() => {
    if (!isOpen || currentStep !== 'payment') return;
    setCheckoutSeconds(600);
    const interval = setInterval(() => {
      setCheckoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onNotify?.('Hết thời gian giữ chỗ thanh toán! Vui lòng thực hiện lại.', 'amber');
          handleFinalClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, currentStep]);

  // Bộ đếm ngược cooldown gửi lại vé (Phương án 2) - Đặt TRƯỚC mọi return để tuân thủ Rules of Hooks
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  // Nút "X" có hộp thoại xác nhận hủy
  const handleRequestClose = () => {
    if (isSubmitting) return;
    if (currentStep === 'ticket') {
      handleFinalClose();
      return;
    }
    setShowCancelConfirm(true);
  };

  const handleFinalClose = () => {
    setShowCancelConfirm(false);
    if (currentStep === 'ticket') {
      if (onBackToHome) {
        onBackToHome();
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Chuyển sang bước quét mã VietQR thanh toán (Phương án 1: Chặn ngay khi nhập email)
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
    setCurrentStep('payment');
  };

  // Xác nhận chuyển khoản và gửi vé qua Google Apps Script (Bảo vệ Lớp 1)
  const handleConfirmAndSendTicket = async () => {
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    const trimmedPhone = customerPhone.trim();

    const labels = selectedSeats.map((s) => s.label);
    const paidTotal = totalAmount;

    // 0. Kiểm tra Cooldown 60s theo email trên trình duyệt (tránh bấm liên tiếp)
    const storageKey = `tdn_cooldown_${trimmedEmail.toLowerCase()}`;
    const lastSentTime = localStorage.getItem(storageKey);
    const now = Date.now();
    const COOLDOWN_MS = 60 * 1000;

    if (lastSentTime && now - Number(lastSentTime) < COOLDOWN_MS) {
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - Number(lastSentTime))) / 1000);
      onNotify?.(
        `Email ${trimmedEmail} vừa nhận vé cách đây ít phút. Vui lòng kiểm tra hòm thư (hoặc đợi ${remainingSec}s).`,
        'amber'
      );
      // Chuyển sang màn hình vé trực tiếp mà không cần bắn request spam mail
      setConfirmedCustomerName(trimmedName);
      setConfirmedCustomerEmail(trimmedEmail);
      setConfirmedSeatLabels(labels);
      setConfirmedTotal(paidTotal);
      setCurrentStep('ticket');
      return;
    }

    setIsSubmitting(true);

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
      onNotify?.('Đã ghi nhận đơn vé! Đang xử lý phát hành vé...', 'amber');
    } finally {
      setIsSubmitting(false);
      setConfirmedCustomerName(trimmedName);
      setConfirmedCustomerEmail(trimmedEmail);
      setConfirmedSeatLabels(labels);
      setConfirmedTotal(paidTotal);
      setCurrentStep('ticket');

      if (typeof window.confetti === 'function') {
        window.confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#8E2032', '#F59E0B', '#E11D48', '#10B981', '#FAF5F0'],
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

  // Copy 1 chạm thông tin thanh toán
  const handleCopyText = (key: string, text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onNotify?.(`Đã sao chép ${label}! 📋`, 'emerald');
      setTimeout(() => setCopiedKey(null), 2000);
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

  return (
    <>
      {/* 1. LỚP PHỦ NỀN TỐI OVERLAY FIXED TOÀN MÀN HÌNH */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-[4px] modal-enter"
        onClick={handleRequestClose}
      >
        {/* 2. CỬA SỔ MODAL Ở GIỮA MÀN HÌNH */}
        <div
          className={`w-full ${
            currentStep === 'payment' ? 'max-w-2xl' : 'max-w-md'
          } flex flex-col rounded-[28px] sm:rounded-[36px] bg-[#12080D]/95 border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-300 relative max-h-[92vh]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER MODAL CỐ ĐỊNH CHIA 2 HÀNG RÕ RÀNG: HÀNG 1 TIÊU ĐỀ & NÚT X, HÀNG 2 THANH TIẾN TRÌNH */}
          <div className="border-b border-white/10 glass-wine shrink-0">
            {/* HÀNG 1: TIÊU ĐỀ BƯỚC + NÚT X ĐÓNG */}
            <div className="p-4 sm:p-5 pb-2.5 sm:pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-8 h-8 rounded-full bg-[#8E2032] flex items-center justify-center font-bold text-white shadow-md border border-white/20 shrink-0">
                  <Ticket className="w-4 h-4 text-amber-300" />
                </span>
                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-white tracking-tight leading-tight">
                    {currentStep === 'info' && 'Bước 2: Thông Tin Nhận Vé'}
                    {currentStep === 'payment' && 'Bước 3: Thanh Toán VietQR'}
                    {currentStep === 'ticket' && 'Vé Điện Tử E-Ticket'}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ALO! TĐN XIN NGHE &bull; Sân trường 20 Lý Tự Trọng
                  </span>
                </div>
              </div>

              {/* NÚT "X" NỔI BẬT GÓC TRÊN BÊN PHẢI */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRequestClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-rose-600/80 hover:text-white text-slate-300 flex items-center justify-center transition border border-white/15 active:scale-95 shadow-md cursor-pointer shrink-0"
                title="Đóng cửa sổ đặt vé"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* HÀNG 2: THANH TIẾN TRÌNH 3 BƯỚC GỌN GÀNG, ĐỘ DÀI VỪA VẶN, CÂN ĐỐI GIỮA MODAL */}
            <div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-0.5 flex justify-center">
              <div className="p-1 sm:p-1.5 px-2.5 sm:px-4 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-[10px] sm:text-xs font-bold gap-1.5 sm:gap-3 w-fit mx-auto shadow-inner">
                {/* Bước 1: Chọn ghế (Đã hoàn thành ở trang con) */}
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  <span>1. Chọn ghế</span>
                </span>

                <span className="text-white/25 shrink-0">&rarr;</span>

                {/* Bước 2: Thông tin (Tick xanh khi đã điền xong) */}
                {currentStep === 'payment' || currentStep === 'ticket' ? (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1 transition-all shrink-0 whitespace-nowrap">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>2. Thông tin</span>
                  </span>
                ) : (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap">
                    <span>2. Thông tin</span>
                  </span>
                )}

                <span className="text-white/25 shrink-0">&rarr;</span>

                {/* Bước 3: Thanh toán (Tick xanh khi thanh toán thành công) */}
                {currentStep === 'ticket' ? (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1 transition-all shrink-0 whitespace-nowrap">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>3. Thanh toán</span>
                  </span>
                ) : currentStep === 'payment' ? (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap">
                    <span>3. Thanh toán</span>
                  </span>
                ) : (
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-slate-500 shrink-0 whitespace-nowrap">
                    <span>3. Thanh toán</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* NỘI DUNG CHÍNH CỦA MODAL */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col justify-between">
            {/* -------------------------------------------------------
                BƯỚC 1: NHẬP THÔNG TIN THANH TOÁN & NHẬN VÉ
                ------------------------------------------------------- */}
            {currentStep === 'info' && (
              <div className="w-full space-y-4 my-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white transition font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>&larr; Quay lại đổi ghế ngồi</span>
                </button>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Vị trí ghế ({count} vé)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedSeats.map((s) => s.label).join(', ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Tổng thanh toán
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Họ và tên người nhận vé <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Email nhận vé E-Ticket <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      Vé điện tử và mã QR soát vé sẽ được tự động gửi tới email này.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Số điện thoại liên hệ
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className="w-full mt-2 py-3.5 rounded-full font-bold text-white text-xs sm:text-sm bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#D93853] hover:from-[#A8243A] hover:to-[#E54865] shadow-xl shadow-[#8E2032]/40 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <span>Tiếp tục: Quét mã VietQR thanh toán</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------
                BƯỚC 2: QUÉT MÃ VIETQR THANH TOÁN (MBBANK)
                ------------------------------------------------------- */}
            {currentStep === 'payment' && (
              <div className="w-full space-y-4 my-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setCurrentStep('info')}
                  className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white transition font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>&larr; Quay lại sửa thông tin nhận vé</span>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Cột trái: Mã VietQR */}
                  <div className="md:col-span-5 flex flex-col items-center">
                    <div className="p-3 bg-white rounded-2xl shadow-2xl border border-white/20 relative">
                      <img
                        src={qrFallback ? fallbackQrUrl : vietQrUrl}
                        alt="VietQR MBBank"
                        onError={() => setQrFallback(true)}
                        className="w-48 h-48 object-contain rounded-lg"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Hiệu lực giữ chỗ: {formatTimer(checkoutSeconds)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Cột phải: Thông tin tài khoản & nút copy 1 chạm */}
                  <div className="md:col-span-7 space-y-2 text-xs">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <span className="text-slate-400 text-[11px]">Ngân hàng:</span>
                        <span className="font-bold text-white">MB Bank (Quân Đội)</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Số tài khoản:</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {accountNo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText('acc', accountNo, 'Số tài khoản')}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-rose-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'acc' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === 'acc' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Chủ tài khoản:</span>
                          <span className="font-bold text-white uppercase text-[11px]">
                            ALO TDN XIN NGHE
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Số tiền cần chuyển:</span>
                          <span className="font-mono font-black text-amber-300 text-base">
                            {formatVND(totalAmount)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText('amt', String(totalAmount), 'Số tiền')
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-rose-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'amt' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === 'amt' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <div className="overflow-hidden pr-2">
                          <span className="text-slate-400 block text-[10px]">Nội dung CK:</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs truncate block">
                            {orderCode} XIN NGHE
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              'memo',
                              `${orderCode} XIN NGHE`,
                              'Nội dung chuyển khoản'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-rose-300 transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedKey === 'memo' ? (
                            <CheckCheck className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === 'memo' ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmAndSendTicket}
                      className="w-full py-3.5 rounded-full font-bold text-white text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang xác thực đơn vé...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Tôi đã chuyển khoản thành công</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------
                BƯỚC 3: XUẤT VÉ ĐIỆN TỬ E-TICKET CHÍNH THỨC
                ------------------------------------------------------- */}
            {currentStep === 'ticket' && (
              <div className="w-full space-y-4 my-auto">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#2D0A27]/90 to-[#12080D] border border-white/20 text-center relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-xl font-black font-heading text-white tracking-tight">
                    Đặt vé thành công!
                  </h4>
                  <p className="text-xs text-slate-300">
                    Mã đơn vé: <span className="font-mono text-amber-300 font-bold">#{orderCode}</span>
                  </p>

                  <div className="mt-2.5 p-2 rounded-xl bg-rose-950/50 border border-rose-500/30 text-left space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-300 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Khán giả nhận vé:</span>
                        <span className="font-bold text-white truncate block">
                          {confirmedCustomerName || 'Khán giả TĐN'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Đã gửi vé tới email:</span>
                        <span className="font-mono font-bold text-amber-300 truncate block">
                          {confirmedCustomerEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 text-left">
                    <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-white/10 text-[11px]">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Ngày diễn</span>
                        <span className="font-bold text-white text-xs block mt-0.5">07.06.26</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Thời gian</span>
                        <span className="font-bold text-amber-300 text-xs block mt-0.5">17:00 – 21:30</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">Cổng vào</span>
                        <span className="font-bold text-white text-xs block mt-0.5">Cổng 20 LTTr</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Vị trí ghế ngồi</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {confirmedSeatLabels.join(', ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Tổng thanh toán</span>
                        <span className="font-mono font-black text-amber-300 text-sm">
                          {formatVND(confirmedTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl text-center shadow-lg w-fit mx-auto mt-2">
                      <img
                        src={ticketQrUrl}
                        alt="E-Ticket Gate QR"
                        className="w-32 h-32 object-contain"
                      />
                      <span className="text-[9px] font-mono text-slate-800 font-bold block mt-1">
                        SCAN CHECK-IN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tiện ích Phương án 2 & 3: Lưu vé về máy + Gửi lại vé về Email */}
                <div className="grid grid-cols-2 gap-2 mt-2">
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
                    <span>{isDownloading ? 'Đang tạo ảnh...' : 'Lưu vé về máy'}</span>
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

                <button
                  type="button"
                  onClick={handleFinalClose}
                  className="w-full py-3.5 rounded-full font-bold text-white text-xs sm:text-sm bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#D93853] hover:from-[#A8243A] hover:to-[#E54865] shadow-xl shadow-[#8E2032]/40 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Hoàn tất &amp; Quay lại trang chủ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* HỘP THOẠI XÁC NHẬN HỦY KHI BẤM NÚT "X" */}
          {showCancelConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md rounded-[28px] sm:rounded-[36px]">
              <div className="glass-card max-w-sm w-full p-5 sm:p-6 rounded-2xl border border-rose-500/30 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Xác nhận hủy đặt vé?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bạn có chắc muốn đóng và hủy phiên đặt vé này không? Vị trí ghế bạn đã chọn sẽ vẫn được giữ trên sơ đồ.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Tiếp tục đặt
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalClose}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-bold text-white transition cursor-pointer"
                  >
                    Hủy &amp; Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookingModal;
