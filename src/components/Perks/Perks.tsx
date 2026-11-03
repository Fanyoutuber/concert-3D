import React from 'react';
import { Coffee, Sparkles, Tag, Ticket } from 'lucide-react';
import { PERKS } from '../../data/perks';
import { Perk } from '../../types';

export interface PerksProps {
  perks?: Perk[];
}

export const Perks: React.FC<PerksProps> = ({ perks = PERKS }) => {
  const renderIcon = (iconName: Perk['iconName']) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'tag':
        return <Tag className="w-3.5 h-3.5 text-purple-400" />;
      case 'ticket':
        return <Ticket className="w-3.5 h-3.5" />;
      case 'coffee':
        return <Coffee className="w-3.5 h-3.5" />;
    }
  };

  const accentStyles: Record<
    Perk['accentColor'],
    {
      cardHover: string;
      frameGradient: string;
      badgeClass: string;
      categoryClass: string;
      titleHover: string;
      footerClass: string;
      imgRotateHover: string;
    }
  > = {
    rose: {
      cardHover: 'hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-950/30',
      frameGradient: 'from-rose-500/15 via-white/[0.03] to-black/60',
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-500/40',
      categoryClass: 'text-rose-400',
      titleHover: 'group-hover:text-rose-200',
      footerClass: 'text-rose-300/80',
      imgRotateHover: 'group-hover:scale-105 group-hover:-rotate-2',
    },
    purple: {
      cardHover: 'hover:border-slate-300/40 hover:shadow-xl hover:shadow-purple-950/30',
      frameGradient: 'from-purple-500/15 via-white/[0.03] to-black/60',
      badgeClass: 'bg-black/90 text-slate-300 border-white/20',
      categoryClass: 'text-slate-300',
      titleHover: 'group-hover:text-purple-200',
      footerClass: 'text-slate-400',
      imgRotateHover: 'group-hover:scale-105 group-hover:rotate-2',
    },
    cyan: {
      cardHover: 'hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/30',
      frameGradient: 'from-cyan-500/15 via-white/[0.03] to-black/60',
      badgeClass: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40',
      categoryClass: 'text-cyan-400',
      titleHover: 'group-hover:text-cyan-200',
      footerClass: 'text-cyan-300/80',
      imgRotateHover: 'group-hover:scale-105',
    },
    amber: {
      cardHover: 'hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-950/30',
      frameGradient: 'from-amber-500/15 via-white/[0.03] to-black/60',
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/40',
      categoryClass: 'text-amber-400',
      titleHover: 'group-hover:text-amber-200',
      footerClass: 'text-amber-300/80',
      imgRotateHover: 'group-hover:scale-105',
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
            return (
              <div
                key={perk.id}
                className={`glass-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between text-left group ${style.cardHover} transition-all duration-300`}
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
                      className={`w-full h-full object-contain transition-transform duration-500 ${style.imgRotateHover} filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]`}
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
                  <h3
                    className={`font-heading font-black text-lg text-white mb-1.5 ${style.titleHover} transition-colors`}
                  >
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
