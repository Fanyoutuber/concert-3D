import React from 'react';
import { PhoneCall, Ticket } from 'lucide-react';

export interface HeaderProps {
  onOpenBooking?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBooking }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass-wine border-b border-white/10 px-4 md:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#8E2032] flex items-center justify-center font-bold text-white shadow-lg shadow-[#8E2032]/40 border border-white/20">
            <PhoneCall className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase font-bold text-rose-300 block">
              TRƯỜNG THCS VÀ THPT TRẦN ĐẠI NGHĨA
            </span>
            <span className="text-base md:text-lg font-heading font-black tracking-tight text-white">
              <span className="text-rose-400 font-black">ALO!</span> TĐN XIN NGHE
            </span>
          </div>
        </a>

        {/* Nav Links & CTA */}
        <div className="flex items-center gap-4 md:gap-7">
          <a
            href="#about"
            className="text-xs md:text-sm font-medium text-slate-300 hover:text-white transition hidden sm:inline"
          >
            Tổng Quan
          </a>
          <a
            href="#lineup"
            className="text-xs md:text-sm font-medium text-slate-300 hover:text-white transition hidden sm:inline"
          >
            Dàn Nghệ Sĩ
          </a>
          <a
            href="#/dat-ve"
            onClick={(e) => {
              if (onOpenBooking) {
                e.preventDefault();
                onOpenBooking();
              }
            }}
            className="text-xs md:text-sm font-medium text-slate-300 hover:text-white transition hidden sm:inline"
          >
            Sơ Đồ &amp; Đặt Vé
          </a>
          <a
            href="#perks"
            className="text-xs md:text-sm font-medium text-slate-300 hover:text-white transition hidden sm:inline"
          >
            Quà Tặng &amp; Perks
          </a>

          <button
            type="button"
            onClick={onOpenBooking}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8E2032] to-[#B52A40] hover:from-[#A3263B] hover:to-[#C9334C] text-white font-bold text-xs md:text-sm shadow-lg shadow-[#8E2032]/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>Mua vé</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
