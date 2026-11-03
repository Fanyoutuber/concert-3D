import React, { useState, useRef } from 'react';
import {
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Maximize2,
  MessageSquare,
  Music,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { Artist } from '../../types';

export interface ArtistCardProps {
  artist: Artist;
  isActive: boolean;
  onActivate: (key: Artist['key']) => void;
  onToggle: (key: Artist['key']) => void;
  onOpenModal?: (artist: Artist) => void;
  onOpenBooking?: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  isActive,
  onActivate,
  onToggle,
  onOpenModal,
  onOpenBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'slogan' | 'setlist'>('slogan');
  const [selectedSubArtistId, setSelectedSubArtistId] = useState<string>(
    artist.subArtists?.[0]?.id ?? 'all'
  );
  const cardRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    if (!window.matchMedia('(min-width: 1024px) and (hover: hover)').matches) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const normX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
      const normY = Math.max(-1, Math.min(1, (y - centerY) / centerY));

      const rotateX = normY * -3.5;
      const rotateY = normX * 3.5;

      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      rafRef.current = null;
    });
  };

  const handleMouseEnter = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      onActivate(artist.key);
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (cardRef.current) {
      cardRef.current.style.transform = '';
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('a') ||
      target.closest('button') ||
      target.closest('.artist-detail-drawer')
    ) {
      return;
    }
    // Mobile/tablet: mở bottom-sheet thay vì mở rộng thẻ (tránh reflow gây giật)
    if (onOpenModal && !window.matchMedia('(min-width: 1024px)').matches) {
      onOpenModal(artist);
      return;
    }
    onToggle(artist.key);
  };

  const activeSubArtist =
    artist.subArtists && selectedSubArtistId !== 'all'
      ? artist.subArtists.find((sub) => sub.id === selectedSubArtistId)
      : undefined;

  const displayedMessage = activeSubArtist ? activeSubArtist.message : artist.message;
  const displayedStyle = activeSubArtist ? activeSubArtist.style : artist.style;
  const displayedEffects = activeSubArtist ? activeSubArtist.stageEffects : artist.stageEffects;
  const displayedSongs = activeSubArtist ? activeSubArtist.songs : artist.songs;

  const renderDrawerIcon = () => {
    if (artist.key === 'club') return <Users className="w-3.5 h-3.5" />;
    if (artist.key === 'long') return <Crown className="w-3.5 h-3.5" />;
    if (artist.key === 'vibe') return <Flame className="w-3.5 h-3.5" />;
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  const badgeColorMap: Record<Artist['theme']['accentColorName'], string> = {
    emerald: 'bg-emerald-500/30 text-emerald-200',
    cyan: 'bg-cyan-500/30 text-cyan-200',
    amber: 'bg-amber-500/30 text-amber-200',
    rose: 'bg-rose-500/30 text-rose-200',
    purple: 'bg-purple-500/30 text-purple-200',
  };

  const textDescriptionColorMap: Record<Artist['theme']['accentColorName'], string> = {
    emerald: 'text-emerald-200/90',
    cyan: 'text-cyan-200/90',
    amber: 'text-amber-200/90',
    rose: 'text-rose-200/90',
    purple: 'text-purple-200/90',
  };

  return (
    <article
      ref={cardRef}
      data-artist-key={artist.key}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className={`layered-artist stage-artist-card artist-card-${artist.key}${
        isActive ? ' is-active' : ''
      }`}
      style={
        {
          '--artist-glow': artist.theme.glowColor,
          '--artist-glow-soft': artist.theme.glowSoft,
          '--border-glow': artist.theme.borderGlow,
          '--card-bg-tint': artist.theme.cardBgTint,
        } as React.CSSProperties
      }
    >
      <div className="stage-card-inner">
        {/* Left / Visual Stage Pane */}
        <div className="artist-visual-pane">
          {/* Subtle Stage Backdrop */}
          <div className="stage-card-backdrop">
            <img
              src={artist.backdropImage}
              alt=""
              className={`w-full h-full object-cover ${
                artist.backdropPosition ?? 'object-center'
              } opacity-20`}
              loading="lazy"
              decoding="async"
            />
            <div className="stage-card-backdrop-overlay" />
          </div>

          {/* Overhead Conical Spotlight Beam */}
          <div className="card-spotlight-cone" />

          {/* Top Floating Meta Badges */}
          <div className="card-top-badges">
            <span className={`role-pill ${artist.theme.rolePillClass}`}>
              <span
                className={`w-1.5 h-1.5 rounded-full ${artist.theme.dotColorClass} animate-pulse`}
              />
              {artist.roleBadge}
            </span>
            <span className="cheer-pill">❤️ {artist.cheerCount}</span>
          </div>

          {/* 3D Pedestal Ring at Feet */}
          <div className="stage-pedestal-ring" />

          {/* Cutout Image Wrapper */}
          <div className="artist-img-wrapper">
            <img
              src={artist.cutoutImage}
              alt={artist.name}
              className="artist-cutout-img"
              draggable={false}
              decoding="async"
            />
          </div>

          {/* Bottom Stage Nameplate & Collapsed Summary */}
          <div className="card-bottom-info">
            <div className="artist-nameplate-box">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span
                  className={`w-2 h-2 rounded-full ${artist.theme.dotColorClass} animate-pulse shrink-0`}
                />
                <h3 className={`artist-stage-title ${artist.theme.titleColorClass}`}>
                  {artist.name}
                </h3>
              </div>
              <p className="artist-stage-subtitle">{artist.subtitle}</p>
            </div>

            <div className="card-collapsed-hint">
              <span className={`hint-tag ${artist.theme.hintTagClass}`}>
                {artist.hintIcon === 'flame' ? (
                  <Flame className="w-3 h-3" />
                ) : (
                  <Music className="w-3 h-3" />
                )}{' '}
                {artist.hintTagText}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenModal) {
                    onOpenModal(artist);
                  } else {
                    onToggle(artist.key);
                  }
                }}
                className={`hint-action ${artist.theme.titleColorClass} cursor-pointer hover:opacity-100 flex items-center gap-1`}
              >
                <span className="hidden lg:inline">Chi tiết</span>
                <span className="lg:hidden">Xem Setlist &amp; Lời nhắn</span>
                <ChevronRight className="w-3.5 h-3.5 hint-chevron" />
              </button>
            </div>
          </div>
        </div>

        {/* Right / Expandable Detail Drawer */}
        <div
          className="artist-speech-bubble artist-detail-drawer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-content-inner">
            <div className="drawer-body-pad">
              <div className="flex items-center justify-between gap-2 mb-2.5">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${artist.theme.drawerBadgeClass}`}
              >
                {renderDrawerIcon()} {artist.drawerHeaderBadge}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] ${artist.theme.titleColorClass} font-mono font-semibold`}
                >
                  ❤️ {artist.cheerCount} cổ vũ
                </span>
                {onOpenModal && (
                  <button
                    type="button"
                    onClick={() => onOpenModal(artist)}
                    title="Mở cửa sổ chi tiết"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-artist selector for Duo card (TLINH & LOW G) */}
            {artist.subArtists && artist.subArtists.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2.5 bg-black/40 p-1 rounded-xl border border-white/10">
                {artist.subArtists.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubArtistId(sub.id)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition ${
                      selectedSubArtistId === sub.id
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedSubArtistId('all')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition ${
                    selectedSubArtistId === 'all'
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cả hai
                </button>
              </div>
            )}

            {/* Tab Switcher: Lời nhắn vs Tiết mục */}
            <div className="bubble-tabs-nav">
              <button
                type="button"
                onClick={() => setActiveTab('slogan')}
                className={`bubble-tab-btn ${activeTab === 'slogan' ? 'is-active' : ''}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Lời nhắn
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('setlist')}
                className={`bubble-tab-btn ${activeTab === 'setlist' ? 'is-active' : ''}`}
              >
                <Music className="w-3.5 h-3.5" /> Tiết mục ({displayedSongs.length})
              </button>
            </div>

            {/* Slogan Panel */}
            {activeTab === 'slogan' ? (
              <div className="bubble-panel bubble-panel-slogan">
                <div className={`p-3.5 rounded-2xl border mb-3 ${artist.theme.sloganBoxClass}`}>
                  <p className="text-xs md:text-sm text-white italic font-medium leading-relaxed">
                    &ldquo;{displayedMessage}&rdquo;
                  </p>
                </div>
                <p
                  className={`text-xs ${
                    textDescriptionColorMap[artist.theme.accentColorName]
                  } leading-relaxed mb-3`}
                >
                  {artist.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px]">Thời lượng diễn</span>
                    <span className="text-white font-bold">{artist.duration}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[10px]">Phong cách</span>
                    <span className={`${artist.theme.titleColorClass} font-bold`}>
                      {displayedStyle}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Setlist Panel */
              <div className="bubble-panel bubble-panel-setlist">
                <div
                  className={`flex items-center justify-between text-[11px] ${artist.theme.titleColorClass} font-semibold mb-2 pb-1.5 border-b border-white/10`}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 20–25 phút trình diễn
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10">
                    {activeSubArtist
                      ? `${activeSubArtist.name} (${displayedSongs.length} bài)`
                      : artist.setlistHeaderBadge}
                  </span>
                </div>
                <div className="bubble-setlist-scroll space-y-1.5 mb-2.5">
                  {displayedSongs.map((song) => (
                    <div key={song.number + song.title} className="setlist-item">
                      <span
                        className={`setlist-badge ${
                          song.isHighlight
                            ? 'bg-amber-500/40 text-amber-200'
                            : badgeColorMap[artist.theme.accentColorName]
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
                <div
                  className={`text-[10px] ${artist.theme.titleColorClass} italic flex items-center gap-1.5 mb-2`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" /> {displayedEffects}
                </div>
              </div>
            )}

            <div className="pt-2.5 mt-auto border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenBooking) {
                    onOpenBooking();
                  } else {
                    window.location.hash = '#/dat-ve';
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r ${artist.theme.ctaGradientClass} text-white text-xs font-bold text-center shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                <Ticket className="w-4 h-4" /> {artist.ctaText}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArtistCard;
