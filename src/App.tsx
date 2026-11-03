import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Info, MapPin, MinusCircle } from 'lucide-react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import ArtistCard from './components/Lineup/ArtistCard';
import ArtistModal from './components/Lineup/ArtistModal';
import SeatMap from './components/Tickets/SeatMap';
import TicketSummary from './components/Tickets/TicketSummary';
import Perks from './components/Perks/Perks';
import Footer from './components/Footer/Footer';
import { ARTISTS } from './data/artists';
import { INITIAL_SEATS } from './data/seats';
import { TICKET_TIERS } from './data/tickets';
import { PERKS } from './data/perks';
import { Artist, Seat } from './types';

const MAX_SEATS = 5;

export function App() {
  // Quản lý state tập trung
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const [activeArtistKey, setActiveArtistKey] = useState<Artist['key'] | null>(null);
  const [seats, setSeats] = useState<Seat[]>(INITIAL_SEATS);
  const [heldTimeSeconds, setHeldTimeSeconds] = useState<number>(600);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'emerald' | 'rose' | 'amber' | 'purple' | 'slate';
    visible: boolean;
  }>({
    message: '',
    tone: 'rose',
    visible: false,
  });

  const showToast = useCallback(
    (
      message: string,
      tone: 'emerald' | 'rose' | 'amber' | 'purple' | 'slate' = 'rose'
    ) => {
      setToast({ message, tone, visible: true });
    },
    []
  );

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2600);
    return () => clearTimeout(timer);
  }, [toast.visible, toast.message]);

  // Responsive default spotlight on mobile/tablet
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    if (!mq.matches) {
      setActiveArtistKey('club');
    }
    const handleChange = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        setActiveArtistKey((prev) => prev ?? 'club');
      } else {
        setActiveArtistKey(null);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // 10-minute seat hold countdown
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setHeldTimeSeconds(600);
      return;
    }
    const interval = setInterval(() => {
      setHeldTimeSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSelectedSeats([]);
          showToast(
            'Hết thời gian giữ chỗ! Vui lòng chọn lại vị trí trên sơ đồ.',
            'amber'
          );
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSeats.length, showToast]);

  const handleSeatToggle = (seat: Seat) => {
    if (seat.tier === 'VIP') {
      showToast(
        'Khu vực Hạng VIP (500.000 đ) đã bán hết! Vui lòng chọn khu vực Vé Thường (250.000 đ).',
        'rose'
      );
      return;
    }
    if (seat.tier === 'GUEST') {
      showToast(
        'Khu vực dành riêng cho Khách Mời & Bàn điều khiển kỹ thuật (FOH).',
        'amber'
      );
      return;
    }
    if (seat.status === 'sold') {
      showToast(
        `Khu ${seat.label} đã kín chỗ! Bạn vui lòng chọn khu vực khác nhé.`,
        'amber'
      );
      return;
    }

    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);

    if (isAlreadySelected) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
      showToast(`Đã bỏ chọn khu ${seat.label}`, 'slate');
    } else {
      if (selectedSeats.length >= MAX_SEATS) {
        showToast(
          `Bạn chỉ có thể chọn tối đa ${MAX_SEATS} ghế trong một lần đặt vé!`,
          'amber'
        );
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
      showToast(
        `Đã chọn khu ${seat.label} • Vé Thường (250.000 đ)`,
        'emerald'
      );
    }
  };

  const handleQuickSelectStandard = () => {
    if (selectedSeats.length >= MAX_SEATS) {
      showToast(
        `Bạn đã chọn tối đa ${MAX_SEATS} ghế trong một lần đặt vé!`,
        'amber'
      );
      return;
    }

    const nextAvailable = seats.find(
      (s) =>
        s.tier === 'STANDARD' &&
        s.status === 'available' &&
        !selectedSeats.some((sel) => sel.id === s.id)
    );

    if (!nextAvailable) {
      showToast('Đã chọn hết các khu Vé Thường trên sơ đồ!', 'amber');
      return;
    }

    setSelectedSeats((prev) => [...prev, nextAvailable]);
    showToast(`Đã tự động chọn vé khu ${nextAvailable.label}!`, 'purple');
  };

  const handleConfirmBooking = () => {
    const bookedIds = selectedSeats.map((s) => s.id);
    setSeats((prev) =>
      prev.map((seat) =>
        bookedIds.includes(seat.id) ? { ...seat, status: 'sold' } : seat
      )
    );
    setSelectedSeats([]);
  };

  const row1Artists = ARTISTS.filter((a) => a.row === 1);
  const row2Artists = ARTISTS.filter((a) => a.row === 2);
  const row1HasSpotlight = row1Artists.some((a) => a.key === activeArtistKey);
  const row2HasSpotlight = row2Artists.some((a) => a.key === activeArtistKey);

  const renderToastIcon = () => {
    switch (toast.tone) {
      case 'emerald':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'amber':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'slate':
        return <MinusCircle className="w-4 h-4 text-slate-300" />;
      case 'purple':
        return <CheckCircle2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0709] text-[#F8F4F0] antialiased">
      {/* 1. NAVIGATION BAR */}
      <Header />

      {/* 2. HERO & ABOUT SECTION */}
      <Hero />

      {/* 3. INTERACTIVE EXPANDING 3D STAGE CARDS (LINE-UP NGHỆ SĨ) */}
      <section
        id="lineup"
        className="py-16 md:py-24 bg-gradient-to-b from-[#0C0709] via-[#14070C] to-[#0C0709] border-t border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-emerald-900/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/3 -translate-y-1/2 w-[500px] h-[350px] bg-rose-900/20 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          {/* Section Title Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-wine border border-rose-500/25 text-xs text-rose-300 font-bold tracking-widest uppercase mb-3 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>3D EXPANDING STAGE LINE-UP • TDN LIVE 2026</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black font-heading text-white tracking-tight">
              Line-Up Bùng Nổ Sân Khấu
            </h2>
            <p className="text-sm md:text-base text-slate-300 mt-2 max-w-2xl mx-auto font-normal">
              Rê chuột hoặc chạm vào từng thẻ sân khấu để mở rộng không gian{' '}
              <strong>Spotlight 3D</strong>, lắng nghe lời nhắn và khám phá danh sách tiết mục biểu diễn!
            </p>
          </div>

          {/* Quick Filter Pills Bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-7 flex-wrap relative z-20">
            <span className="text-xs text-slate-400 font-semibold mr-1 hidden sm:inline">
              Chọn sân khấu:
            </span>
            {ARTISTS.map((artist) => {
              const isPillActive = activeArtistKey === artist.key;
              return (
                <button
                  key={artist.key}
                  type="button"
                  onClick={() => {
                    if (activeArtistKey === artist.key) {
                      setActiveArtistKey(null);
                    } else {
                      setActiveArtistKey(artist.key);
                      setActiveArtist(artist);
                    }
                  }}
                  className={`quick-stage-pill px-4 py-2 rounded-full text-xs font-bold border border-white/15 transition flex items-center gap-2 ${
                    isPillActive
                      ? 'active glass-wine text-white'
                      : 'glass-card text-slate-300 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${artist.theme.dotColorClass}`} />
                  <span>{artist.name}</span>
                </button>
              );
            })}
          </div>

          {/* 5 THẺ SÂN KHẤU 3D POP-OUT MỞ RỘNG */}
          <div
            id="interactive-stage"
            onMouseLeave={() => {
              if (window.matchMedia('(min-width: 1024px)').matches) {
                setActiveArtistKey(null);
              }
            }}
            className={`stage-deck-wrapper select-none space-y-4 md:space-y-6${
              activeArtistKey ? ' stage-has-spotlight' : ''
            }`}
          >
            {/* HÀNG 1: 3 NGHỆ SĨ */}
            <div
              className={`expanding-stage-deck stage-deck-row stage-deck-row-3${
                row1HasSpotlight ? ' row-has-spotlight' : ''
              }`}
            >
              {row1Artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  isActive={activeArtistKey === artist.key}
                  onActivate={(key) => setActiveArtistKey(key)}
                  onToggle={(key) =>
                    setActiveArtistKey((prev) => (prev === key ? null : key))
                  }
                  onOpenModal={(a) => setActiveArtist(a)}
                />
              ))}
            </div>

            {/* HÀNG 2: 2 NGHỆ SĨ */}
            <div
              className={`expanding-stage-deck stage-deck-row stage-deck-row-2${
                row2HasSpotlight ? ' row-has-spotlight' : ''
              }`}
            >
              {row2Artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  isActive={activeArtistKey === artist.key}
                  onActivate={(key) => setActiveArtistKey(key)}
                  onToggle={(key) =>
                    setActiveArtistKey((prev) => (prev === key ? null : key))
                  }
                  onOpenModal={(a) => setActiveArtist(a)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ARTIST DETAIL POPUP MODAL */}
      <ArtistModal artist={activeArtist} onClose={() => setActiveArtist(null)} />

      {/* 4. KHU VỰC MUA VÉ (TICKET SECTION & SƠ ĐỒ CHỖ NGỒI) */}
      <section id="booking-section" className="py-20 relative overflow-hidden">
        <div className="absolute -top-32 right-10 w-96 h-96 bg-[#8E2032]/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400 block mb-1.5">
              CONCERT TICKETS &amp; STAGE SEATING • TRẦN ĐẠI NGHĨA
            </span>
            <h2 className="text-3xl md:text-5xl font-black font-heading text-white tracking-tight">
              Sơ Đồ Chỗ Ngồi &amp; Đặt Vé
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl mx-auto font-normal">
              Sơ đồ chỗ ngồi mới Sân trường THCS và THPT Trần Đại Nghĩa (20 Lý Tự Trọng, Q.1) xoay quanh khu vực Tượng đài trung tâm. Tổng số khách:{' '}
              <strong>~900 khán giả (Đa số Vé thường)</strong>.
            </p>
          </div>

          <div id="view-2d-container" className="max-w-4xl mx-auto">
            <div className="glass-card rounded-[36px] overflow-hidden border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative flex flex-col">
              {/* School Venue Banner */}
              <div className="venue-school-banner flex flex-col justify-between p-5 md:p-7">
                <div className="venue-school-overlay" />

                <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/40 flex items-center gap-1.5 shadow-lg">
                    <MapPin className="w-3 h-3 text-rose-400" /> SÂN TRƯỜNG 20 LÝ TỰ TRỌNG, Q.1, TP.HCM
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 shadow-lg">
                    <Calendar className="w-3 h-3 text-cyan-300" /> 17:00 – 21:30 • 07.06.2026
                  </span>
                </div>

                <div className="relative z-10 text-center">
                  <span className="text-[10px] md:text-xs font-extrabold tracking-widest uppercase text-rose-300 bg-rose-950/80 px-3 py-0.5 rounded-full border border-rose-500/30 inline-block mb-1">
                    TRƯỜNG THCS VÀ THPT TRẦN ĐẠI NGHĨA
                  </span>
                  <h3 className="text-xl md:text-3xl font-black font-heading text-white tracking-tight drop-shadow-md">
                    Lễ Hội Âm Nhạc Sân Trường &ldquo;ALO! TĐN XIN NGHE&rdquo;
                  </h3>
                  <p className="text-[11px] text-slate-300 italic hidden sm:block mt-0.5 drop-shadow">
                    &ldquo;Học để biết, học để làm, học để tự khẳng định mình, học để cùng chung sống&rdquo;
                  </p>
                </div>
              </div>

              {/* Interactive Courtyard Zone Map & Summary */}
              <div className="p-3 sm:p-6 md:p-8 bg-[#12080D]/90 flex flex-col items-center">
                <SeatMap
                  seats={seats}
                  selectedSeatIds={selectedSeats.map((s) => s.id)}
                  maxSeats={MAX_SEATS}
                  onSeatToggle={handleSeatToggle}
                />

                <div className="text-center text-xs sm:text-sm font-semibold text-slate-300 mt-3">
                  Sơ đồ chỗ ngồi mới • Tổng số khách:{' '}
                  <span className="text-amber-300 font-bold">~900 (Đa số Vé thường)</span>
                </div>

                {/* Legend Bar */}
                <div className="flex items-center justify-center gap-3 sm:gap-5 mt-5 py-2.5 px-4 sm:px-5 rounded-full bg-black/40 border border-white/10 text-[11px] text-slate-300 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-[#4CAEE3] border border-sky-200/50" />
                    <span>Vé Thường CAT / Stardom / Fanzone (250K)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    <span className="text-purple-300 font-semibold">Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-[#2E5CE6] border border-amber-400/70" />
                    <span className="text-rose-400 font-semibold">Hạng VIP / BVIP (Sold out)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-[#E07A16] border border-orange-300/40" />
                    <span className="text-slate-400">Khách mời / FOH</span>
                  </div>
                </div>

                <TicketSummary
                  selectedSeats={selectedSeats}
                  tiers={TICKET_TIERS}
                  maxSeats={MAX_SEATS}
                  heldTimeSeconds={heldTimeSeconds}
                  onQuickSelectStandard={handleQuickSelectStandard}
                  onConfirmBooking={handleConfirmBooking}
                  onNotify={showToast}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PERKS & MERCHANDISE */}
      <Perks perks={PERKS} />

      {/* 6. FOOTER */}
      <Footer />

      {/* TOAST NOTIFICATION */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-wine px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs text-white border border-white/20 transition-all duration-300 pointer-events-none ${
          toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
        }`}
      >
        {renderToastIcon()}
        <span className="font-medium">{toast.message}</span>
      </div>
    </div>
  );
}

export default App;
