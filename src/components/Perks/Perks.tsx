import React, { useState, useEffect } from 'react';
import { Coffee, Sparkles, Tag, Ticket } from 'lucide-react';
import { PERKS } from '../../data/perks';
import { Perk } from '../../types';

export interface PerksProps {
  perks?: Perk[];
}

export const Perks: React.FC<PerksProps> = ({ perks = PERKS }) => {
  const [activePerkId, setActivePerkId] = useState<string | null>(null);

  // Nhấn vào chỗ khác ngoài các thẻ sẽ tắt hiệu ứng phóng to + phát sáng
  useEffect(() => {
    const handleGlobalClick = () => {
      setActivePerkId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handlePerkClick = (e: React.MouseEvent, perkId: string) => {
    e.stopPropagation();
    // Nhấn vào chính nó lần nữa thì tắt hiệu ứng, hoặc bật thẻ mới
    setActivePerkId((prev) => (prev === perkId ? null : perkId));
  };

  const renderIcon = (iconName: Perk['iconName']) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'tag':
        return <Tag className="w-3.5 h-3.5 text-amber-400" />;
      case 'ticket':
        return <Ticket className="w-3.5 h-3.5 text-rose-400" />;
      case 'coffee':
        return <Coffee className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const accentStyles: Record<
    Perk['accentColor'],
    {
      frameGradient: string;
      badgeClass: string;
      categoryClass: string;
      footerClass: string;
    }
  > = {
    rose: {
      frameGradient: 'from-rose-500/15 via-[#8E2032]/10 to-black/70',
      badgeClass: 'bg-[#8E2032]/90 text-rose-200 border-rose-500/40',
      categoryClass: 'text-rose-400',
      footerClass: 'text-rose-300/90',
    },
    purple: {
      frameGradient: 'from-amber-500/15 via-[#6B1724]/10 to-black/70',
      badgeClass: 'bg-amber-950/90 text-amber-200 border-amber-500/40',
      categoryClass: 'text-amber-400',
      footerClass: 'text-amber-300/90',
    },
    cyan: {
      frameGradient: 'from-[#8E2032]/25 via-white/[0.03] to-black/70',
      badgeClass: 'bg-[#6B1724]/90 text-rose-200 border-rose-400/40',
      categoryClass: 'text-rose-300',
      footerClass: 'text-rose-300/90',
    },
    amber: {
      frameGradient: 'from-amber-500/20 via-[#8E2032]/10 to-black/70',
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/40',
      categoryClass: 'text-amber-400',
      footerClass: 'text-amber-300/90',
    },
  };

  return (
    <section
      id="perks"
      className="py-20 bg-gradient-to-b from-[#0C0709] via-[#160A0F] to-[#0C0709] border-t border-white/5 relative"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300 block mb-1.5">
            ĐẶC QUYỀN KHÁN GIẢ
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-heading text-white tracking-tight">
            Quà Tặng &amp; Perks Đi Kèm Vé
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto font-normal">
            Mỗi tấm vé <span className="text-amber-300 font-bold">ALO! TĐN XIN NGHE</span> khi đặt mua thành công đều được tặng kèm trọn bộ Merchandise phiên bản giới hạn tại cổng check-in!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((perk) => {
            const style = accentStyles[perk.accentColor];
            const isActive = activePerkId === perk.id;
            return (
              <div
                key={perk.id}
                onClick={(e) => handlePerkClick(e, perk.id)}
                className={`glass-card perk-card perk-card-${perk.accentColor} ${
                  isActive ? 'is-active' : ''
                } rounded-3xl p-5 border border-white/10 flex flex-col justify-between text-left cursor-pointer transition-all duration-300 select-none`}
              >
                <div>
                  {/* Image Frame */}
                  <div
                    className={`w-full h-48 rounded-2xl bg-gradient-to-b ${style.frameGradient} border border-white/10 p-2 flex items-center justify-center overflow-hidden mb-4 relative shadow-inner`}
                  >
                    <span
                      className={`absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border backdrop-blur-md shadow-sm ${style.badgeClass}`}
                    >
                      {perk.badgeText}
                    </span>
                    <img
                      src={perk.image}
                      alt={perk.name}
                      className="perk-img w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${style.categoryClass} text-[11px] font-bold uppercase tracking-wider mb-1`}
                  >
                    {renderIcon(perk.iconName)}
                    <span>{perk.category}</span>
                  </div>
                  <h3 className="perk-title font-heading font-black text-lg text-white mb-1.5">
                    {perk.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {perk.description}
                  </p>
                </div>

                <div
                  className={`mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] ${style.footerClass}`}
                >
                  <span>{perk.materialNote}</span>
                  <span className="font-mono font-bold">{perk.code}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Perks;
