import React from 'react';
import {
  ArrowUpRight,
  Clock,
  Info,
  Mail,
  MapPin,
  PhoneIncoming,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from 'lucide-react';

export interface HeroProps {
  onOpenBooking?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking }) => {
  return (
    <>
      {/* HERO SECTION & BANNER TICKET SHOWCASE */}
      <section className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#6B1724]/30 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center relative z-10">
          {/* Meta Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-wine border border-rose-500/20 text-xs text-rose-200 mb-6 shadow-md flex-wrap justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold tracking-wider uppercase">Live performances • 07.06.26</span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-amber-300 font-semibold inline-flex items-center">
              <Clock className="w-3 h-3 inline mr-1" />
              17:00 - 21:30
            </span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-slate-300">20 Lý Tự Trọng, Q.1, TPHCM</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-heading uppercase leading-[1.12] mb-4 flex flex-wrap items-baseline justify-center gap-x-3 sm:gap-x-5 gap-y-2">
            <span className="relative inline-flex items-center group">
              <span className="absolute -inset-2 bg-gradient-to-r from-rose-500/30 to-amber-500/25 blur-2xl rounded-full pointer-events-none" />
              <span className="relative text-5xl sm:text-7xl md:text-8xl font-black bg-gradient-to-r from-amber-200 via-rose-300 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(244,63,94,0.65)] tracking-tight">
                ALO!
              </span>
            </span>
            <span className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
              TĐN XIN NGHE
            </span>
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-rose-100 max-w-3xl mx-auto font-semibold leading-relaxed mb-4 tracking-tight">
            Lễ hội âm nhạc của Ban Âm nhạc Trường THCS và THPT Trần Đại Nghĩa
          </p>
          <p className="text-xs sm:text-sm text-slate-300/90 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
            Đơn vị tổ chức: <strong className="text-amber-300 font-semibold">O.L.A – One Legacy, All</strong> • Nhịp cầu thanh xuân kết nối các thế hệ học sinh và cựu thành viên dưới mái trường TĐN.
          </p>

          {/* Ticket Price Pill & CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-3 glass-card px-5 py-3 rounded-full border border-white/10">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Hạng Vé Thường:</span>
              <span className="text-xl md:text-2xl font-black font-mono text-amber-300">250,000 VND</span>
            </div>

            <button
              type="button"
              onClick={onOpenBooking}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#C9334C] hover:from-[#A8243A] hover:to-[#DE3D58] font-bold text-white text-base shadow-xl shadow-[#8E2032]/40 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Ticket className="w-5 h-5 text-amber-300" />
              <span>Đặt mua vé ngay</span>
            </button>
          </div>

          {/* Real Ticket Banner Embed */}
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(107,23,36,0.5)] border border-white/15 group">
              <img
                src="/assets/ticket-banner.png"
                alt="ALO! TĐN XIN NGHE Ticket Banner"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                decoding="async"
              />
            </div>

            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 px-2 sm:px-4 text-center sm:text-left">
              <span className="text-xs sm:text-sm text-slate-300 font-medium italic flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                Chính thức phát hành vé số lượng giới hạn • 900+ Khán giả
              </span>
              <span className="font-mono text-[11px] sm:text-xs text-amber-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                ADMIT ONE • 07.06.26
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TỔNG QUAN SỰ KIỆN & ĐƠN VỊ TỔ CHỨC O.L.A */}
      <section
        id="about"
        className="py-16 md:py-20 bg-gradient-to-b from-[#0C0709] via-[#15070D] to-[#0C0709] border-t border-white/5 relative overflow-hidden"
      >
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[#8E2032]/20 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-wine border border-rose-500/25 text-xs text-rose-300 font-bold tracking-widest uppercase mb-3 shadow-lg">
              <Info className="w-3.5 h-3.5 text-amber-300" />
              <span>TỔNG QUAN SỰ KIỆN • ONE LEGACY, ALL</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black font-heading text-white tracking-tight">
              Về &ldquo;<span className="text-rose-400">ALO!</span> TĐN XIN NGHE&rdquo;
            </h2>
            <p className="text-sm md:text-base text-slate-300 mt-2 max-w-2xl mx-auto font-normal">
              Lễ hội âm nhạc của <strong>Ban Âm nhạc Trường THCS và THPT Trần Đại Nghĩa</strong>, gắn kết tinh thần thanh xuân và tiếp nối những giá trị truyền thống qua nhiều thế hệ.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            {/* Cột Trái (7 Cột): Thông điệp cuộc gọi thanh xuân */}
            <div className="lg:col-span-7 glass-card rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <PhoneIncoming className="w-4 h-4" />
                  <span>Nhịp Cầu Nối Liền Quá Khứ &amp; Hiện Tại</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black font-heading text-white mb-3">
                  Câu Chuyện Về Người Gọi Về &amp; Người Nhấc Máy
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-3 font-normal">
                  Lấy hình ảnh một cuộc gọi làm nhịp cầu nối liền quá khứ và hiện tại,{' '}
                  <strong className="text-white">“ALO! TĐN xin nghe”</strong> kể câu chuyện về người gọi về và người nhấc máy.{' '}
                  <strong className="text-rose-300">Người cất lời</strong> là các anh chị cựu thành viên Ban Âm nhạc cùng nhiều nghệ sĩ nổi tiếng;{' '}
                  <strong className="text-cyan-300">người đón nhận</strong> là thế hệ học sinh Trần Đại Nghĩa hôm nay — nơi từng lưu giữ tuổi trẻ và tiếng hát của họ.
                </p>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
                  Tên chương trình cũng là một điểm nhấn chơi chữ nhẹ nhàng.{' '}
                  <em className="text-amber-200">“Xin nghe”</em> không chỉ là câu chào tổng đài quen thuộc, mà còn là lời mời{' '}
                  <em className="text-amber-200">“xin được nghe”</em> lại từng khúc ca, đưa khán giả trở về không khí ấm áp của những chương trình quà tặng âm nhạc trên radio ngày trước.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Thời gian</span>
                  <span className="text-amber-300 font-bold text-xs sm:text-sm">17:00 – 21:30</span>
                  <span className="text-[10px] text-slate-400 block">07.06.2026</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quy mô</span>
                  <span className="text-emerald-300 font-bold text-xs sm:text-sm">900+ Khán Giả</span>
                  <span className="text-[10px] text-slate-400 block">THCS, THPT &amp; Cựu HS</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Địa điểm</span>
                  <span className="text-rose-300 font-bold text-xs sm:text-sm">Sân Trường TĐN</span>
                  <span className="text-[10px] text-slate-400 block">20 Lý Tự Trọng, Q.1</span>
                </div>
              </div>
            </div>

            {/* Cột Phải (5 Cột): Đơn Vị Tổ Chức O.L.A */}
            <div className="lg:col-span-5 glass-wine rounded-3xl p-6 md:p-8 border border-rose-500/25 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> ĐƠN VỊ TỔ CHỨC
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono font-bold">EST. 2026</span>
                </div>

                <h3 className="text-2xl font-black font-heading text-white tracking-tight mb-2">
                  O.L.A – One Legacy, All
                </h3>
                <p className="text-xs text-rose-200/90 leading-relaxed mb-4">
                  Dự án do thế hệ học sinh và cựu thành viên Ban Âm nhạc Trường THCS và THPT Trần Đại Nghĩa chung tay khởi xướng:
                </p>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/30">
                      O
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">One • Một Mái Nhà</span>
                      <span className="text-[11px] text-slate-300 leading-tight block">
                        Nơi các thế hệ Trần Đại Nghĩa cùng hội tụ dưới một vòm trời thanh xuân.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-300 font-mono font-black text-sm flex items-center justify-center shrink-0 border border-rose-500/30">
                      L
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Legacy • Di Sản &amp; Ký Ức</span>
                      <span className="text-[11px] text-slate-300 leading-tight block">
                        Những giá trị và ngọn lửa đam mê âm nhạc được truyền nối không ngừng.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-black text-sm flex items-center justify-center shrink-0 border border-cyan-500/30">
                      A
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">All • Tất Cả Chúng Ta</span>
                      <span className="text-[11px] text-slate-300 leading-tight block">
                        Sự gắn kết của toàn thể học sinh, cựu học sinh và thầy cô vì một đêm nhạc bùng nổ.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Ban Tổ Chức (BTC):
                </span>
                <div className="flex flex-col gap-1 text-xs font-mono">
                  <a
                    href="mailto:uyentran620119@gmail.com"
                    className="text-slate-200 hover:text-rose-300 transition flex items-center gap-1.5"
                  >
                    <ArrowUpRight className="w-3 h-3 text-rose-400" /> uyentran620119@gmail.com
                  </a>
                  <a
                    href="mailto:wonseori290811@gmail.com"
                    className="text-slate-200 hover:text-rose-300 transition flex items-center gap-1.5"
                  >
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" /> wonseori290811@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quy Trình Đăng Ký Vé */}
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10">
            <div className="text-center md:text-left mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-1">
                  HƯỚNG DẪN THAM DỰ
                </span>
                <h3 className="text-xl md:text-2xl font-black font-heading text-white">
                  2 Cách Đăng Ký &amp; Nhận Vé Concert
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenBooking}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-2 self-center md:self-auto cursor-pointer"
              >
                <span>Mở cửa sổ đặt vé &amp; chọn chỗ</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-500/40">
                      1
                    </span>
                    <h4 className="font-bold text-white text-sm">
                      Mua Vé Trực Tuyến Qua Ứng Dụng / Website
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 pl-8 list-disc">
                    <li>
                      <strong className="text-white">Hình thức:</strong> Chọn trực tiếp vị trí ghế mong muốn trên sơ đồ sân trường 2D bên dưới.
                    </li>
                    <li>
                      <strong className="text-white">Thanh toán:</strong> Quét mã VietQR tự động qua ứng dụng Ngân hàng hoặc Ví MoMo.
                    </li>
                    <li>
                      <strong className="text-white">Nhận vé:</strong> E-Ticket xuất vé điện tử kèm mã QR soát vé cổng check-in ngay lập tức.
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-purple-300">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Giữ chỗ 10 phút
                  </span>
                  <span className="font-bold">Mở bán trực tuyến 24/7</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                      2
                    </span>
                    <h4 className="font-bold text-white text-sm">Mua Vé Trực Tiếp Tại Trường</h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 pl-8 list-disc">
                    <li>
                      <strong className="text-white">Địa điểm:</strong> Quầy bán vé sự kiện ALO! TĐN XIN NGHE tại Trường THCS và THPT Trần Đại Nghĩa.
                    </li>
                    <li>
                      <strong className="text-white">Hình thức:</strong> Đăng ký trực tiếp với Ban tổ chức (Thanh toán Tiền mặt hoặc Chuyển khoản).
                    </li>
                    <li>
                      <strong className="text-white">Nhận vé:</strong> Nhận vé cứng kỷ niệm kèm trọn bộ merchandise độc quyền ngay tại quầy.
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> 20 Lý Tự Trọng, Q.1
                  </span>
                  <span className="font-bold">Hỗ trợ học sinh &amp; cựu HS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
