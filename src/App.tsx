import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Info,
  MapPin,
  MinusCircle,
  Ticket,
} from 'lucide-react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import ArtistCard from './components/Lineup/ArtistCard';
import ArtistModal from './components/Lineup/ArtistModal';
import Perks from './components/Perks/Perks';
import Footer from './components/Footer/Footer';
import BookingPage from './pages/BookingPage';
import { ARTISTS } from './data/artists';
import { INITIAL_SEATS } from './data/seats';
import { TICKET_TIERS } from './data/tickets';
import { PERKS } from './data/perks';
import { Artist, Seat } from './types';

const MAX_SEATS = 5;

type Page = 'home' | 'booking';

function getPageFromHash(): Page {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('/dat-ve') || hash.includes('/booking')) {
    return 'booking';
  }
  return 'home';
}

export function App() {
  // Quản lý trang hiện tại (Trang chủ hoặc Trang con chọn ghế)
  const [currentPage, setCurrentPage] = useState<Page>(getPageFromHash);

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

  // Lắng nghe thay đổi URL Hash để chuyển trang mượt mà
  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setCurrentPage(page);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateTo = (page: Page) => {
    if (page === 'booking') {
      window.location.hash = '#/dat-ve';
    } else {
      window.location.hash = '#/';
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Đếm ngược 10 phút giữ chỗ
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
      {currentPage === 'booking' ? (
        /* =========================================================
           TRANG CON RIÊNG BIỆT: SƠ ĐỒ CHỖ NGỒI 2D & ĐẶT VÉ (#/dat-ve)
           Có Pop-up Modal từ bước Điền thông tin -> VietQR -> E-Ticket
           ========================================================= */
        <BookingPage
          seats={seats}
          selectedSeats={selectedSeats}
          tiers={TICKET_TIERS}
          maxSeats={MAX_SEATS}
          heldTimeSeconds={heldTimeSeconds}
          onSeatToggle={handleSeatToggle}
          onQuickSelectStandard={handleQuickSelectStandard}
          onConfirmBooking={handleConfirmBooking}
          onNotify={showToast}
          onBackToHome={() => navigateTo('home')}
        />
      ) : (
        /* =========================================================
           TRANG CHỦ ĐẦY ĐỦ (LANDING PAGE)
           ========================================================= */
        <>
          {/* 1. NAVIGATION BAR */}
          <Header onOpenBooking={() => navigateTo('booking')} />

          {/* 2. HERO & ABOUT SECTION */}
          <Hero onOpenBooking={() => navigateTo('booking')} />

          {/* 3. INTERACTIVE EXPANDING 3D STAGE CARDS (LINE-UP NGHỆ SĨ) */}
          <section
            id="lineup"
            className="py-16 md:py-24 bg-gradient-to-b from-[#0C0709] via-[#14070C] to-[#0C0709] border-t border-white/5 relative overflow-hidden"
          >
            <div
              className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[480px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(6, 78, 59, 0.22) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute top-1/2 right-1/4 translate-x-1/3 -translate-y-1/2 w-[650px] h-[480px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(136, 19, 55, 0.26) 0%, transparent 70%)',
              }}
            />

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
                      className={`quick-stage-pill px-4 py-2 rounded-full text-xs font-bold border border-white/15 transition flex items-center gap-2 cursor-pointer ${
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
                      onOpenBooking={() => navigateTo('booking')}
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
                      onOpenBooking={() => navigateTo('booking')}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ARTIST DETAIL POPUP MODAL */}
          <ArtistModal
            artist={activeArtist}
            onClose={() => setActiveArtist(null)}
            onOpenBooking={() => navigateTo('booking')}
          />

          {/* 4. KHU VỰC GIỚI THIỆU SƠ ĐỒ CHỖ NGỒI (TEASER CHUYỂN SANG TRANG CON #/dat-ve) */}
          <section id="booking-preview" className="py-20 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-[#8E2032]/25 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
              <div className="glass-card rounded-[36px] p-6 sm:p-10 border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.95)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-rose-500/20 via-transparent to-transparent blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Cột trái (7 cột): Giới thiệu & Kêu gọi đặt vé */}
                  <div className="lg:col-span-7 text-center lg:text-left">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3 shadow-sm">
                      <Ticket className="w-3.5 h-3.5" /> SƠ ĐỒ CHỖ NGỒI &amp; ĐẶT VÉ TRỰC TUYẾN
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black font-heading text-white tracking-tight leading-tight mb-3">
                      Chọn Vị Trí Đẹp Nhất &amp; Đặt Vé Ngay
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                      Sơ đồ chỗ ngồi 2D được bố trí trực quan quanh Tượng đài trung tâm Sân trường THCS &amp; THPT Trần Đại Nghĩa (20 Lý Tự Trọng, Q.1). Hãy mở trang chọn chỗ để trực tiếp chọn khu ghế CAT, Stardom hoặc Fanzone và giữ chỗ!
                    </p>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
                      <div className="flex items-center gap-2 p-2.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                        <span className="text-slate-400">Hạng vé:</span>
                        <span className="font-bold text-white">Vé Thường (CAT, Stardom, Fanzone)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                        <span className="text-slate-400">Giá vé:</span>
                        <span className="font-black font-mono text-amber-300 text-sm">250,000 đ</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => navigateTo('booking')}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#8E2032] via-[#A8243A] to-[#D93853] hover:from-[#A8243A] hover:to-[#E54865] font-bold text-white text-sm shadow-xl shadow-[#8E2032]/40 transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Mở Sơ Đồ &amp; Đặt Vé Trực Tuyến</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] text-slate-400">
                        &bull; Giữ chỗ 10 phút &amp; Gửi vé qua Email
                      </span>
                    </div>
                  </div>

                  {/* Cột phải (5 cột): Banner minh họa Sân trường */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <div
                      onClick={() => navigateTo('booking')}
                      className="w-full rounded-2xl overflow-hidden border border-white/20 shadow-xl group cursor-pointer relative bg-black/50 p-2"
                    >
                      <div
                        className="h-48 sm:h-56 rounded-xl bg-cover bg-center relative overflow-hidden transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: "url('/assets/truong-tdn.jpg')" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-12 h-12 rounded-full bg-[#8E2032]/90 border border-white/30 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-2">
                            <MapPin className="w-6 h-6 text-amber-300" />
                          </div>
                          <span className="text-xs font-black font-heading text-white uppercase tracking-wider">
                            Sân Trường 20 Lý Tự Trọng
                          </span>
                          <span className="text-[11px] text-rose-300 font-bold mt-1 inline-flex items-center gap-1">
                            Nhấp để vào trang chọn ghế &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2.5 text-center">
                      Quy mô: <strong>~900 khách</strong> &bull; Quét VietQR nhận vé E-Ticket
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. PERKS & MERCHANDISE */}
          <Perks perks={PERKS} />

          {/* 6. FOOTER */}
          <Footer onOpenBooking={() => navigateTo('booking')} />
        </>
      )}

      {/* TOAST NOTIFICATION (Hiển thị chung cho cả 2 trang) */}
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
