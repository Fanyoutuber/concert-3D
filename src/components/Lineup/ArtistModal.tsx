import React, { useState, useEffect } from 'react';
import {
  Clock,
  MessageSquare,
  Music,
  Sparkles,
  Ticket,
  UserCheck,
  X,
} from 'lucide-react';
import { Artist } from '../../types';

export interface ArtistModalProps {
  artist: Artist | null;
  onClose: () => void;
  onOpenBooking?: () => void;
}

export const ArtistModal: React.FC<ArtistModalProps> = ({ artist, onClose, onOpenBooking }) => {
  const [selectedSubId, setSelectedSubId] = useState<string>('all');
  const [contentTab, setContentTab] = useState<'slogan' | 'setlist'>('slogan');

  useEffect(() => {
    if (artist) {
      if (artist.subArtists && artist.subArtists.length > 0) {
        setSelectedSubId(artist.subArtists[0].id);
      } else {
        setSelectedSubId('all');
      }
      setContentTab('slogan');
    }
  }, [artist]);

  // Khóa hoàn toàn tính năng cuộn trang chính khi modal mở (overflow: hidden cho body)
  useEffect(() => {
    if (artist) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [artist]);

  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (artist) setClosing(false);
  }, [artist]);

  // Mobile: chạy animation trượt xuống rồi mới đóng; desktop đóng ngay
  const requestClose = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      onClose();
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 200);
  };

  if (!artist) return null;

  const hasSubArtists = Boolean(artist.subArtists && artist.subArtists.length > 0);
  const currentSubArtist =
    hasSubArtists && selectedSubId !== 'all'
      ? artist.subArtists!.find((s) => s.id === selectedSubId)
      : undefined;

  const displayName = currentSubArtist ? currentSubArtist.name : artist.name;
  const displayRole = currentSubArtist ? currentSubArtist.role : artist.subtitle;
  const displayStyle = currentSubArtist ? currentSubArtist.style : artist.style;
  const displayMessage = currentSubArtist ? currentSubArtist.message : artist.message;
  const displayEffects = currentSubArtist ? currentSubArtist.stageEffects : artist.stageEffects;
  const displaySongs = currentSubArtist ? currentSubArtist.songs : artist.songs;

  return (
    <div
      className={`sheet-overlay${closing ? ' is-closing' : ''} fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:p-4 bg-black/80 lg:bg-black/85 lg:backdrop-blur-md`}
      onClick={requestClose}
    >
      <div
        className="sheet-panel bg-[#15070c] lg:bg-[#15070c]/95 w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl border border-white/20 shadow-2xl overflow-hidden max-h-[88vh] lg:max-h-[92vh] flex flex-col"
        style={
          {
            boxShadow: `0 25px 80px -15px rgba(0,0,0,0.95), 0 0 40px ${artist.theme.glowSoft}`,
          } as React.CSSProperties
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" />
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${artist.theme.drawerBadgeClass}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> {artist.drawerHeaderBadge}
            </span>
            <span className="cheer-pill">❤️ {artist.cheerCount} cổ vũ</span>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Left Visual Column */}
          <div className="md:col-span-5 relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#17080e] via-[#0e0408] to-[#090205] flex flex-col items-center justify-between min-h-[240px] md:min-h-[280px] p-4">
            <div
              className="absolute inset-0 opacity-35 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 20%, ${artist.theme.glowSoft} 0%, transparent 70%)`,
              }}
            />
            {/* Wrapper ảnh có khoảng đệm phía trên an toàn để không bị che đầu trên mobile */}
            <div className="relative z-10 w-full flex-1 flex items-end justify-center min-h-[160px] pt-4 pb-1">
              <img
                src={artist.cutoutImage}
                alt={artist.name}
                className="max-h-44 sm:max-h-52 md:max-h-56 w-auto max-w-full object-contain object-bottom drop-shadow-[0_12px_25px_rgba(0,0,0,0.9)]"
              />
            </div>
            <div className="relative z-10 w-full text-center mt-2 pt-2 border-t border-white/10 shrink-0">
              <h3 className={`font-heading font-black text-lg uppercase ${artist.theme.titleColorClass}`}>
                {displayName}
              </h3>
              <p className="text-[11px] text-slate-300">{displayRole}</p>
            </div>
          </div>

          {/* Right Info & Tabs Column */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              {/* Duo Artist Switcher Tabs (e.g., tlinh vs Low G) */}
              {hasSubArtists && (
                <div className="mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1 mb-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Chọn nghệ sĩ trong thẻ đôi:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                    {artist.subArtists!.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubId(sub.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          selectedSubId === sub.id
                            ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{sub.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedSubId('all')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedSubId === 'all'
                          ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>Cả hai</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Content Tabs: Lời nhắn vs Danh sách bài hát */}
              <div className="bubble-tabs-nav">
                <button
                  type="button"
                  onClick={() => setContentTab('slogan')}
                  className={`bubble-tab-btn ${contentTab === 'slogan' ? 'is-active' : ''}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Lời nhắn
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab('setlist')}
                  className={`bubble-tab-btn ${contentTab === 'setlist' ? 'is-active' : ''}`}
                >
                  <Music className="w-3.5 h-3.5" /> Danh sách bài hát ({displaySongs.length})
                </button>
              </div>

              {contentTab === 'slogan' ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl border ${artist.theme.sloganBoxClass}`}>
                    <p className="text-xs sm:text-sm text-white italic font-medium leading-relaxed">
                      &ldquo;{displayMessage}&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{artist.description}</p>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">Thời lượng diễn</span>
                      <span className="text-white font-bold">{artist.duration}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">Phong cách</span>
                      <span className={`${artist.theme.titleColorClass} font-bold`}>
                        {displayStyle}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className={`flex items-center justify-between text-[11px] ${artist.theme.titleColorClass} font-semibold mb-2 pb-1.5 border-b border-white/10`}
                  >
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {artist.duration}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10">
                      {displayName} • {displaySongs.length} tiết mục
                    </span>
                  </div>
                  <div className="bubble-setlist-scroll space-y-1.5 mb-2.5">
                    {displaySongs.map((song) => (
                      <div key={song.number + song.title} className="setlist-item">
                        <span
                          className={`setlist-badge ${
                            song.isHighlight
                              ? 'bg-amber-500/40 text-amber-200'
                              : 'bg-white/15 text-white'
                          }`}
                        >
                          {song.number}
                        </span>
                        <div className="text-left">
                          <div
                            className={`text-xs font-bold ${
                              song.isHighlight ? 'text-amber-200' : 'text-white'
                            }`}
                          >
                            {song.title}{' '}
                            {song.performer && (
                              <span className="text-[10px] text-amber-300 font-normal">
                                ({song.performer})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-300 leading-tight">
                            {song.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[11px] ${artist.theme.titleColorClass} italic flex items-center gap-1.5 mt-3`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" /> {displayEffects}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBooking?.();
                }}
                className={`flex-1 py-3 px-5 rounded-xl bg-gradient-to-r ${artist.theme.ctaGradientClass} text-white text-xs font-bold text-center shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer`}
              >
                <Ticket className="w-4 h-4" />
                <span>{artist.ctaText}</span>
              </button>
              <button
                type="button"
                onClick={requestClose}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistModal;
