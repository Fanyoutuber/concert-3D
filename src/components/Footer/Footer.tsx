import React from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  Calendar,
  Mail,
  MapPin,
  PhoneCall,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-14 border-t border-white/10 bg-[#080406] text-slate-400 text-xs relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-[#8E2032]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          {/* Left: Event Info & School */}
          <div className="md:col-span-5 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
              <div className="w-9 h-9 rounded-full bg-[#8E2032] flex items-center justify-center font-bold text-white shadow-md border border-white/20 shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] tracking-widest uppercase font-bold text-rose-300 block">
                  TRƯỜNG THCS VÀ THPT TRẦN ĐẠI NGHĨA
                </span>
                <h4 className="font-heading font-black text-lg text-white">
                  <span className="text-rose-400">ALO!</span> TĐN XIN NGHE 2026
                </h4>
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              Lễ hội âm nhạc của <strong>Ban Âm nhạc Trường THCS và THPT Trần Đại Nghĩa</strong>. Nhịp cầu kết nối quá khứ và hiện tại, lưu giữ những ký ức thanh xuân rực rỡ nhất.
            </p>
            <div className="space-y-1 text-[11px] text-slate-400">
              <p className="flex items-center gap-1.5 justify-center md:justify-start">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>20 Lý Tự Trọng, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
              </p>
              <p className="flex items-center gap-1.5 justify-center md:justify-start">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>17:00 – 21:30 • Chủ Nhật, Ngày 07.06.2026 • Quy mô: 900+ khách</span>
              </p>
            </div>
          </div>

          {/* Center: Đơn Vị Tổ Chức O.L.A */}
          <div className="md:col-span-3 text-center md:text-left">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold block mb-2">
              ĐƠN VỊ TỔ CHỨC
            </span>
            <h5 className="font-heading font-bold text-sm text-white mb-2">
              O.L.A – One Legacy, All
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Tổ chức bởi Ban Âm nhạc (M Music Club) phối hợp cùng cựu học sinh Trường THCS và THPT Trần Đại Nghĩa.
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start text-[10px]">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                O – One
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                L – Legacy
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                A – All
              </span>
            </div>
          </div>

          {/* Right: Email Ban Tổ Chức (BTC) & Quick Links */}
          <div className="md:col-span-4 text-center md:text-left">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block mb-2">
              EMAIL BAN TỔ CHỨC (BTC)
            </span>
            <p className="text-[11px] text-slate-300 mb-3">
              Mọi thắc mắc về sự kiện, đặt vé, hợp tác truyền thông xin vui lòng liên hệ:
            </p>

            <div className="space-y-2 mb-4">
              <a
                href="mailto:uyentran620119@gmail.com"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-xs text-white group-hover:text-rose-300">
                    uyentran620119@gmail.com
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </a>

              <a
                href="mailto:wonseori290811@gmail.com"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-xs text-white group-hover:text-cyan-300">
                    wonseori290811@gmail.com
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </a>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 text-[11px]">
              <a href="#about" className="hover:text-white transition">
                Tổng quan
              </a>
              <span className="text-white/20">•</span>
              <a href="#lineup" className="hover:text-white transition">
                Line-up
              </a>
              <span className="text-white/20">•</span>
              <a href="#booking-section" className="hover:text-white transition">
                Đặt vé
              </a>
              <span className="text-white/20">•</span>
              <a href="#perks" className="hover:text-white transition">
                Quà tặng
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Back to Top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            © 2026 ALO! TĐN XIN NGHE • O.L.A &amp; Ban Âm nhạc Trường THCS và THPT Trần Đại Nghĩa. All rights reserved.
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition"
          >
            <span>Lên đầu trang</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
