// =========================================================
// ALO! TĐN XIN NGHE - JAVASCRIPT APPLICATION LOGIC
// Interactive Layered Poster Spotlight & School Courtyard Seat Booking
// Trường THCS và THPT Trần Đại Nghĩa • 20 Lý Tự Trọng, Q.1, TP.HCM
// =========================================================

// ---------------------------------------------------------
// 1. INTERACTIVE EXPANDING 3D STAGE CARDS CONTROLLER
// ---------------------------------------------------------
const STAGE_ARTISTS = {
  club: {
    name: "M Music Club",
    glowColor: "rgba(16, 185, 129, 0.45)"
  },
  linh: {
    name: "Phương Mỹ Chi",
    glowColor: "rgba(34, 211, 238, 0.45)"
  },
  long: {
    name: "HIEUTHUHAI",
    glowColor: "rgba(245, 158, 11, 0.45)"
  },
  vibe: {
    name: "TLINH & LOW G",
    glowColor: "rgba(244, 63, 94, 0.45)"
  },
  dalab: {
    name: "Nhóm nhạc Dalab",
    glowColor: "rgba(168, 85, 247, 0.45)"
  }
};

const interactiveStage = document.getElementById('interactive-stage');
const layeredArtists = document.querySelectorAll('.layered-artist');
const quickStagePills = document.querySelectorAll('.quick-stage-pill');
const desktopStageMQ = window.matchMedia('(min-width: 1024px)');

let activeArtistKey = null;

function activateArtistSpotlight(key, options = {}) {
  if (!STAGE_ARTISTS[key] || !interactiveStage) return;
  activeArtistKey = key;

  // 1. Kích hoạt trạng thái stage
  interactiveStage.classList.add('stage-has-spotlight');

  // 2. Mở rộng thẻ nghệ sĩ được chọn, thu gọn nhẹ các thẻ còn lại
  let targetCardEl = null;
  layeredArtists.forEach(artistEl => {
    if (artistEl.getAttribute('data-artist-key') === key) {
      artistEl.classList.add('is-active');
      targetCardEl = artistEl;
    } else {
      artistEl.classList.remove('is-active');
    }
  });

  // Đánh dấu row-has-spotlight cho hàng chứa thẻ active
  document.querySelectorAll('.stage-deck-row').forEach(row => {
    row.classList.remove('row-has-spotlight');
  });
  if (targetCardEl) {
    const parentRow = targetCardEl.closest('.stage-deck-row');
    if (parentRow) parentRow.classList.add('row-has-spotlight');
  }

  // 3. Đồng bộ nút chạm nhanh
  quickStagePills.forEach(pill => {
    if (pill.getAttribute('data-quick-spotlight') === key) {
      pill.classList.add('active', 'glass-wine', 'text-white');
      pill.classList.remove('glass-card', 'text-slate-300');
    } else {
      pill.classList.remove('active', 'glass-wine', 'text-white');
      pill.classList.add('glass-card', 'text-slate-300');
    }
  });

  // 4. Trên mobile/tablet, nếu bấm từ thanh Quick Pill thì cuộn mượt tới thẻ đó
  if (options.scrollIntoView && targetCardEl && !desktopStageMQ.matches) {
    setTimeout(() => {
      targetCardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }
}

function deactivateArtistSpotlight() {
  activeArtistKey = null;
  if (!interactiveStage) return;
  interactiveStage.classList.remove('stage-has-spotlight');
  document.querySelectorAll('.stage-deck-row').forEach(row => {
    row.classList.remove('row-has-spotlight');
  });
  layeredArtists.forEach(el => el.classList.remove('is-active'));
  quickStagePills.forEach(pill => {
    pill.classList.remove('active', 'glass-wine', 'text-white');
    pill.classList.add('glass-card', 'text-slate-300');
  });
}

// Bắt sự kiện Hover (Desktop) & Click/Tap (Desktop + Mobile) cho từng thẻ sân khấu
let hoverIntentTimer = null;
let leaveIntentTimer = null;

layeredArtists.forEach(artistEl => {
  const key = artistEl.getAttribute('data-artist-key');

  // Rê chuột trên Desktop: Mở rộng thẻ mượt mà với Hover Intent nhẹ chống giật khi lướt nhanh
  artistEl.addEventListener('mouseenter', () => {
    if (desktopStageMQ.matches) {
      if (leaveIntentTimer) {
        clearTimeout(leaveIntentTimer);
        leaveIntentTimer = null;
      }
      if (hoverIntentTimer) {
        clearTimeout(hoverIntentTimer);
      }
      hoverIntentTimer = setTimeout(() => {
        activateArtistSpotlight(key);
      }, 65);
    }
  });

  // Chạm/Click: Toggle đóng/mở thẻ
  artistEl.addEventListener('click', (e) => {
    // Không đóng thẻ nếu người dùng bấm vào nút mua vé, tab hoặc vùng chi tiết đang mở
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.artist-detail-drawer')) {
      return;
    }
    if (hoverIntentTimer) {
      clearTimeout(hoverIntentTimer);
      hoverIntentTimer = null;
    }
    if (activeArtistKey === key) {
      deactivateArtistSpotlight();
    } else {
      activateArtistSpotlight(key);
    }
  });
});

// Khi rời chuột ra khỏi khu vực 4 thẻ trên Desktop: Trở về trạng thái cân bằng 4 cột
if (interactiveStage) {
  interactiveStage.addEventListener('mouseleave', () => {
    if (desktopStageMQ.matches) {
      if (hoverIntentTimer) {
        clearTimeout(hoverIntentTimer);
        hoverIntentTimer = null;
      }
      leaveIntentTimer = setTimeout(() => {
        deactivateArtistSpotlight();
      }, 90);
    }
  });
}

// Gán sự kiện cho hàng nút Quick Pills chọn sân khấu
quickStagePills.forEach(pill => {
  const key = pill.getAttribute('data-quick-spotlight');
  pill.addEventListener('click', () => {
    if (activeArtistKey === key) {
      deactivateArtistSpotlight();
    } else {
      activateArtistSpotlight(key, { scrollIntoView: true });
    }
  });
});

// Đồng bộ khi xoay màn hình hoặc bật/tắt chế độ Responsive Mobile trên trình duyệt
desktopStageMQ.addEventListener('change', () => {
  if (!desktopStageMQ.matches && !activeArtistKey) {
    activateArtistSpotlight('club');
  } else if (desktopStageMQ.matches) {
    deactivateArtistSpotlight();
  }
});

// Mặc định trên Mobile mở sẵn thẻ M Music Club để nổi bật CLB trường ngay từ đầu, Desktop hiện đều 4 cột
if (!desktopStageMQ.matches) {
  activateArtistSpotlight('club');
} else {
  deactivateArtistSpotlight();
}

// ---------------------------------------------------------
// 1B. NÚT CHUYỂN ĐỔI TAB POP-UP: LỜI NHẮN VS TIẾT MỤC (SETLIST)
// ---------------------------------------------------------
document.querySelectorAll('.bubble-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // Không trigger đóng pop-up hay spotlight
    const targetTab = btn.getAttribute('data-tab-target');
    const bubble = btn.closest('.artist-speech-bubble');
    if (!bubble) return;

    // Cập nhật trạng thái active trên các nút tab trong pop-up này
    bubble.querySelectorAll('.bubble-tab-btn').forEach(b => {
      if (b === btn) {
        b.classList.add('is-active');
      } else {
        b.classList.remove('is-active');
      }
    });

    // Chuyển đổi nội dung giữa panel Lời nhắn và panel Tiết mục
    const sloganPanel = bubble.querySelector('.bubble-panel-slogan');
    const setlistPanel = bubble.querySelector('.bubble-panel-setlist');

    if (targetTab === 'setlist') {
      if (sloganPanel) sloganPanel.classList.add('hidden');
      if (setlistPanel) setlistPanel.classList.remove('hidden');
    } else {
      if (sloganPanel) sloganPanel.classList.remove('hidden');
      if (setlistPanel) setlistPanel.classList.add('hidden');
    }

    if (window.lucide && typeof lucide.createIcons === 'function') {
      try {
        lucide.createIcons({ root: bubble });
      } catch (e) {
        lucide.createIcons();
      }
    }
  });
});

// ---------------------------------------------------------
// 2. CẤU HÌNH SƠ ĐỒ MỚI SÂN TRƯỜNG XOAY QUANH TƯỢNG ĐÀI (2 HẠNG VÉ)
// ---------------------------------------------------------
// - Vé Thường (250.000 đ - MỞ BÁN): Toàn bộ khu CAT 1–30, STARDOM L/R, FANZONE L/R
// - Hạng VIP (500.000 đ - ĐÃ BÁN HẾT): Khu VIP, BVIP & Dải VIP hai cánh
// - Khu vực Khách mời & FOH: Dành riêng cho BTC & Đại biểu
// ---------------------------------------------------------

const PRE_TAKEN_2D = new Set([]);
const seat2DElements = new Map();
const selectableZoneOrder = [];

const state = {
  selectedSeats: new Map(), // zoneId -> { seatId, label, price, tier }
  orderCode: 'TDN' + Math.floor(100000 + Math.random() * 900000),
  isModalOpen: false,
  heldTimeSeconds: 600,
  heldTimerInterval: null
};

// Cấu trúc dữ liệu đúng 100% bố cục sơ đồ mới
const UPPER_LEFT_CATS = [
  { id: 'CAT 15 L (H1)', top: 'CAT 15', sub: 'L' },
  { id: 'CAT 4 L (H1)', top: 'CAT 4', sub: 'L' },
  { id: 'CAT 1 L', top: 'CAT 1', sub: 'L' },
  { id: 'CAT 9 L (H2)', top: 'CAT 9', sub: 'L' },
  { id: 'CAT 2 L', top: 'CAT 2', sub: 'L' },
  { id: 'CAT 5 L (H2)', top: 'CAT 5', sub: 'L' },
  { id: 'CAT 15 L (H3)', top: 'CAT 15', sub: 'L' },
  { id: 'CAT 7 L', top: 'CAT 7', sub: 'L' },
  { id: 'CAT 8 L', top: 'CAT 8', sub: 'L' },
  { id: 'CAT 9 L (H4)', top: 'CAT 9', sub: 'L' },
  { id: 'CAT 4 L (H4)', top: 'CAT 4', sub: 'L' },
  { id: 'CAT 5 L (H4)', top: 'CAT 5', sub: 'L' }
];

const UPPER_CENTER_STANDING = [
  { id: 'STARDOM L', top: 'STARDOM', sub: 'L', variant: 'zone-stardom' },
  { id: 'STARDOM R', top: 'STARDOM', sub: 'R', variant: 'zone-stardom' },
  { id: 'FANZONE L/R', top: 'FANZONE', sub: 'L/R', variant: 'zone-fanzone' },
  { id: 'FANZONE R', top: 'FANZONE', sub: 'R', variant: 'zone-fanzone' }
];

const UPPER_RIGHT_CATS = [
  { id: 'CAT 1 R', top: 'CAT 1', sub: 'R' },
  { id: 'CAT 9 R (H1)', top: 'CAT 9', sub: 'R' },
  { id: 'CAT 12 R', top: 'CAT 12', sub: 'R' },
  { id: 'CAT 6 R', top: 'CAT 6', sub: 'R' },
  { id: 'CAT 8 R (H2)', top: 'CAT 8', sub: 'R' },
  { id: 'CAT 11 R', top: 'CAT 11', sub: 'R' },
  { id: 'CAT 2 R', top: 'CAT 2', sub: 'R' },
  { id: 'CAT 8 R (H3)', top: 'CAT 8', sub: 'R' },
  { id: 'CAT 10 R', top: 'CAT 10', sub: 'R' },
  { id: 'CAT 4 R', top: 'CAT 4', sub: 'R' },
  { id: 'CAT 8 R (H4)', top: 'CAT 8', sub: 'R' },
  { id: 'CAT 9 R (H4)', top: 'CAT 9', sub: 'R' }
];

const MID_LEFT_CATS = [
  { id: 'CAT 17 L1', top: 'CAT 17', sub: 'L1' },
  { id: 'CAT 18 L2', top: 'CAT 18', sub: 'L2' },
  { id: 'CAT 21 L1', top: 'CAT 21', sub: 'L1' },
  { id: 'CAT 22 L2 (H2)', top: 'CAT 22', sub: 'L2' },
  { id: 'CAT 21 L3', top: 'CAT 21', sub: 'L3' },
  { id: 'CAT 22 L4', top: 'CAT 22', sub: 'L4' },
  { id: 'CAT 23 L4', top: 'CAT 23', sub: 'L4' },
  { id: 'CAT 22 L2 (H4)', top: 'CAT 22', sub: 'L2' }
];

const MID_CENTER_AROUND_STATUE = [
  { id: 'CAT 17', top: 'CAT 17', sub: '' },
  { id: 'CAT 18', top: 'CAT 18', sub: '' },
  { id: 'CAT 19 L', top: 'CAT 19', sub: 'L' },
  { id: 'CAT 20 R', top: 'CAT 20', sub: 'R' }
];

const MID_RIGHT_CATS = [
  { id: 'CAT 21 RT', top: 'CAT 21', sub: 'RT' },
  { id: 'CAT 20 R3', top: 'CAT 20', sub: 'R3' },
  { id: 'CAT 24 R1', top: 'CAT 24', sub: 'R1' },
  { id: 'CAT 25 R2', top: 'CAT 25', sub: 'R2' },
  { id: 'CAT 26 R1', top: 'CAT 26', sub: 'R1' },
  { id: 'CAT 25 R3', top: 'CAT 25', sub: 'R3' },
  { id: 'CAT 27 R3', top: 'CAT 27', sub: 'R3' },
  { id: 'CAT 28 R4', top: 'CAT 28', sub: 'R4' }
];

// ---------------------------------------------------------
// 3. KHỞI TẠO SƠ ĐỒ SÂN TRƯỜNG MỚI (COURTYARD ZONE MAP)
// ---------------------------------------------------------
function createZoneBtn({ id, top, sub = '', variant = 'zone-cat', tier = 'STANDARD', price = 250000 }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('data-seat-id', id);
  btn.setAttribute('data-tier', tier);
  btn.setAttribute('data-price', price);

  const isStandard = tier === 'STANDARD';
  const isTaken = PRE_TAKEN_2D.has(id);

  btn.className = `map-zone-btn ${variant}${isStandard && !isTaken ? ' is-selectable' : ''}${isTaken ? ' is-taken' : ''}`;

  if (tier === 'VIP') {
    btn.title = `Khu ${id} • Hạng VIP (500.000 đ) — ĐÃ BÁN HẾT`;
  } else if (tier === 'GUEST') {
    btn.title = `${id} • Khu vực dành riêng cho Khách Mời & Kỹ Thuật (FOH)`;
  } else if (isTaken) {
    btn.title = `Khu ${id} • Đã kín chỗ`;
  } else {
    btn.title = `Chọn khu ${id} • Vé Thường (250.000 đ)`;
  }

  if (sub) {
    btn.innerHTML = `<span>${top}</span><span>${sub}</span>`;
  } else if (top) {
    btn.innerHTML = `<span>${top}</span>`;
  }

  btn.addEventListener('click', () => {
    handleZoneClick({ id, top, sub, tier, price });
  });

  if (isStandard) {
    seat2DElements.set(id, btn);
    selectableZoneOrder.push({ id, label: id, price, tier });
  }

  return btn;
}

function init2DSeatMatrix() {
  const container = document.getElementById('seat-matrix-container');
  if (!container) return;

  container.innerHTML = '';
  seat2DElements.clear();
  selectableZoneOrder.length = 0;

  const board = document.createElement('div');
  board.className = 'courtyard-map-board';

  // 1. HÀNG TRÊN CÙNG: LCD | LCD/LM | STAGE | LCD/LM | LCD
  const stageRow = document.createElement('div');
  stageRow.className = 'map-stage-row';
  stageRow.innerHTML = `
    <div class="map-lcd-box">LCD</div>
    <div class="map-lcd-box">LCD/LM</div>
    <div class="map-stage-main">STAGE</div>
    <div class="map-lcd-box">LCD/LM</div>
    <div class="map-lcd-box">LCD</div>
  `;
  board.appendChild(stageRow);

  // 2. KHU VỰC PHÍA TRƯỚC SÂN KHẤU (UPPER SECTION)
  const upperSection = document.createElement('div');
  upperSection.className = 'map-upper-section';

  // Cột VIP hồng rìa trái (4 ô)
  const leftVipCol = document.createElement('div');
  leftVipCol.className = 'map-side-vip-col';
  for (let i = 1; i <= 4; i++) {
    leftVipCol.appendChild(createZoneBtn({
      id: `VIP L${i}`,
      top: '',
      variant: 'zone-vip-pink',
      tier: 'VIP',
      price: 500000
    }));
  }
  upperSection.appendChild(leftVipCol);

  // Lưới CAT 3x4 bên trái
  const leftUpperCats = document.createElement('div');
  leftUpperCats.className = 'map-upper-cat-grid';
  UPPER_LEFT_CATS.forEach(item => {
    leftUpperCats.appendChild(createZoneBtn({
      ...item,
      variant: 'zone-cat-front',
      tier: 'STANDARD',
      price: 250000
    }));
  });
  upperSection.appendChild(leftUpperCats);

  // Khu đứng trung tâm: STARDOM L/R & FANZONE L/R
  const centerStanding = document.createElement('div');
  centerStanding.className = 'map-upper-center-standing';
  UPPER_CENTER_STANDING.forEach(item => {
    centerStanding.appendChild(createZoneBtn({
      ...item,
      tier: 'STANDARD',
      price: 250000
    }));
  });
  upperSection.appendChild(centerStanding);

  // Lưới CAT 3x4 bên phải
  const rightUpperCats = document.createElement('div');
  rightUpperCats.className = 'map-upper-cat-grid';
  UPPER_RIGHT_CATS.forEach(item => {
    rightUpperCats.appendChild(createZoneBtn({
      ...item,
      variant: 'zone-cat-front',
      tier: 'STANDARD',
      price: 250000
    }));
  });
  upperSection.appendChild(rightUpperCats);

  // Cột VIP hồng rìa phải (4 ô)
  const rightVipCol = document.createElement('div');
  rightVipCol.className = 'map-side-vip-col';
  for (let i = 1; i <= 4; i++) {
    rightVipCol.appendChild(createZoneBtn({
      id: `VIP R${i}`,
      top: '',
      variant: 'zone-vip-pink',
      tier: 'VIP',
      price: 500000
    }));
  }
  upperSection.appendChild(rightVipCol);

  board.appendChild(upperSection);

  // 3. KHU VỰC GIỮA SÂN TRƯỜNG XOAY QUANH TƯỢNG ĐÀI (MIDDLE SECTION)
  const middleSection = document.createElement('div');
  middleSection.className = 'map-middle-section';

  // Cánh trái 2x4
  const midLeftGrid = document.createElement('div');
  midLeftGrid.className = 'map-mid-wing-grid';
  MID_LEFT_CATS.forEach(item => {
    midLeftGrid.appendChild(createZoneBtn({
      ...item,
      variant: 'zone-cat',
      tier: 'STANDARD',
      price: 250000
    }));
  });
  middleSection.appendChild(midLeftGrid);

  // Khu trung tâm 2x2 bao quanh TƯỢNG
  const midCenterWrap = document.createElement('div');
  midCenterWrap.className = 'map-mid-center-wrap';
  MID_CENTER_AROUND_STATUE.forEach(item => {
    midCenterWrap.appendChild(createZoneBtn({
      ...item,
      variant: 'zone-cat-tall',
      tier: 'STANDARD',
      price: 250000
    }));
  });

  // Đảo Tượng Đài ở chính giữa
  const statueIsland = document.createElement('div');
  statueIsland.className = 'map-statue-island';
  statueIsland.innerHTML = `
    <svg viewBox="0 0 64 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Bệ tượng -->
      <rect x="16" y="64" width="32" height="7" rx="2" fill="#E7DFD5" stroke="#4A453F" stroke-width="2"/>
      <path d="M21 46H43L46 64H18L21 46Z" fill="#E7DFD5" stroke="#4A453F" stroke-width="2" stroke-linejoin="round"/>
      <line x1="26" y1="51" x2="25" y2="61" stroke="#4A453F" stroke-width="1.5"/>
      <line x1="32" y1="51" x2="32" y2="61" stroke="#4A453F" stroke-width="1.5"/>
      <line x1="38" y1="51" x2="39" y2="61" stroke="#4A453F" stroke-width="1.5"/>
      <!-- Thân tượng -->
      <path d="M22 46V30C22 26 26 24 32 24C38 24 42 26 42 30V46" fill="#E7DFD5" stroke="#4A453F" stroke-width="2"/>
      <!-- Tay giơ cuốn sách / ngọn đuốc -->
      <path d="M22 31L13 24L16 19L24 26" fill="#E7DFD5" stroke="#4A453F" stroke-width="2" stroke-linejoin="round"/>
      <rect x="9" y="14" width="8" height="6" rx="1" transform="rotate(-18 9 14)" fill="#D6CEC2" stroke="#4A453F" stroke-width="1.6"/>
      <path d="M42 31L49 36L45 41L39 36" fill="#E7DFD5" stroke="#4A453F" stroke-width="2" stroke-linejoin="round"/>
      <!-- Đầu tượng -->
      <circle cx="32" cy="15" r="6.5" fill="#E7DFD5" stroke="#4A453F" stroke-width="2"/>
    </svg>
    <span class="map-statue-label">tượng</span>
  `;
  midCenterWrap.appendChild(statueIsland);
  middleSection.appendChild(midCenterWrap);

  // Cánh phải 2x4
  const midRightGrid = document.createElement('div');
  midRightGrid.className = 'map-mid-wing-grid';
  MID_RIGHT_CATS.forEach(item => {
    midRightGrid.appendChild(createZoneBtn({
      ...item,
      variant: 'zone-cat',
      tier: 'STANDARD',
      price: 250000
    }));
  });
  middleSection.appendChild(midRightGrid);

  board.appendChild(middleSection);

  // 4. KHU VỰC PHÍA SAU (LOWER SECTION: 3 HÀNG x 6 CỘT)
  const lowerSection = document.createElement('div');
  lowerSection.className = 'map-lower-section';

  // Hàng dưới 1: [BVIP | VIP] | CAT 23 | CAT 24 | CAT 25 | CAT 26 | [VIP | BVIP]
  const lowerRow1 = document.createElement('div');
  lowerRow1.className = 'map-lower-row';

  const leftVipPair = document.createElement('div');
  leftVipPair.className = 'map-vip-pair';
  leftVipPair.appendChild(createZoneBtn({ id: 'BVIP L', top: 'BVIP', variant: 'zone-bvip', tier: 'VIP', price: 500000 }));
  leftVipPair.appendChild(createZoneBtn({ id: 'VIP L', top: 'VIP', variant: 'zone-vip', tier: 'VIP', price: 500000 }));
  lowerRow1.appendChild(leftVipPair);

  ['CAT 23', 'CAT 24', 'CAT 25', 'CAT 26'].forEach(code => {
    lowerRow1.appendChild(createZoneBtn({
      id: `${code} (H1)`,
      top: code,
      variant: 'zone-cat',
      tier: 'STANDARD',
      price: 250000
    }));
  });

  const rightVipPair = document.createElement('div');
  rightVipPair.className = 'map-vip-pair';
  rightVipPair.appendChild(createZoneBtn({ id: 'VIP R', top: 'VIP', variant: 'zone-vip', tier: 'VIP', price: 500000 }));
  rightVipPair.appendChild(createZoneBtn({ id: 'BVIP R', top: 'BVIP', variant: 'zone-bvip', tier: 'VIP', price: 500000 }));
  lowerRow1.appendChild(rightVipPair);

  lowerSection.appendChild(lowerRow1);

  // Hàng dưới 2: [Trống] | CAT 25 | CAT 26 | CAT 27 | CAT 28 | [Trống]
  const lowerRow2 = document.createElement('div');
  lowerRow2.className = 'map-lower-row';
  const emptyL2 = document.createElement('div');
  emptyL2.className = 'map-zone-btn zone-empty';
  lowerRow2.appendChild(emptyL2);

  ['CAT 25', 'CAT 26', 'CAT 27', 'CAT 28'].forEach(code => {
    lowerRow2.appendChild(createZoneBtn({
      id: `${code} (H2)`,
      top: code,
      variant: 'zone-cat',
      tier: 'STANDARD',
      price: 250000
    }));
  });

  const emptyR2 = document.createElement('div');
  emptyR2.className = 'map-zone-btn zone-empty';
  lowerRow2.appendChild(emptyR2);
  lowerSection.appendChild(lowerRow2);

  // Hàng dưới 3: [Trống] | CAT 27 | CAT 28 | CAT 29 | CAT 30 | [Trống]
  const lowerRow3 = document.createElement('div');
  lowerRow3.className = 'map-lower-row';
  const emptyL3 = document.createElement('div');
  emptyL3.className = 'map-zone-btn zone-empty';
  lowerRow3.appendChild(emptyL3);

  ['CAT 27', 'CAT 28', 'CAT 29', 'CAT 30'].forEach(code => {
    lowerRow3.appendChild(createZoneBtn({
      id: code,
      top: code,
      variant: 'zone-cat',
      tier: 'STANDARD',
      price: 250000
    }));
  });

  const emptyR3 = document.createElement('div');
  emptyR3.className = 'map-zone-btn zone-empty';
  lowerRow3.appendChild(emptyR3);
  lowerSection.appendChild(lowerRow3);

  board.appendChild(lowerSection);

  // 5. HÀNG CUỐI CÙNG: KHÁCH MỜI | FOH | KHÁCH MỜI
  const bottomRow = document.createElement('div');
  bottomRow.className = 'map-bottom-row';
  bottomRow.appendChild(createZoneBtn({ id: 'KHÁCH MỜI TRÁI', top: 'KHÁCH MỜI', variant: 'zone-guest', tier: 'GUEST', price: 0 }));
  bottomRow.appendChild(createZoneBtn({ id: 'FOH', top: 'FOH', variant: 'zone-foh', tier: 'GUEST', price: 0 }));
  bottomRow.appendChild(createZoneBtn({ id: 'KHÁCH MỜI PHẢI', top: 'KHÁCH MỜI', variant: 'zone-guest', tier: 'GUEST', price: 0 }));
  board.appendChild(bottomRow);

  container.appendChild(board);
  updateSelectionUI();
}

function handleZoneClick(zone) {
  // 1. Nếu là khu VIP / BVIP (Đã bán hết)
  if (zone.tier === 'VIP') {
    showToast('Khu vực Hạng VIP (500.000 đ) đã bán hết! Vui lòng chọn khu vực Vé Thường (250.000 đ).', 'alert-circle', 'text-rose-400');
    return;
  }

  // 2. Nếu là khu Khách Mời hoặc FOH
  if (zone.tier === 'GUEST') {
    showToast('Khu vực dành riêng cho Khách Mời & Bàn điều khiển kỹ thuật (FOH).', 'info', 'text-amber-400');
    return;
  }

  // 3. Nếu khu đã bán hết
  if (PRE_TAKEN_2D.has(zone.id)) {
    showToast(`Khu ${zone.id} đã kín chỗ! Bạn vui lòng chọn khu vực khác nhé.`, 'user-x', 'text-amber-400');
    return;
  }

  // 4. Toggle chọn vé tại khu vực này
  if (state.selectedSeats.has(zone.id)) {
    state.selectedSeats.delete(zone.id);
    showToast(`Đã bỏ chọn khu ${zone.id}`, 'minus-circle', 'text-slate-300');
  } else {
    state.selectedSeats.set(zone.id, {
      seatId: zone.id,
      price: zone.price,
      tier: zone.tier
    });
    showToast(`Đã chọn khu ${zone.id} • Vé Thường (250.000 đ)`, 'check-circle-2', 'text-emerald-400');
  }

  updateSelectionUI();
}

// ---------------------------------------------------------
// 4. CẬP NHẬT GIAO DIỆN CHỌN KHU VỰC, THANH GIỮ CHỖ & TỔNG TIỀN
// ---------------------------------------------------------
const selectedSeatsLabelEl = document.getElementById('selected-seats-label');
const selectedSeatsDescEl = document.getElementById('selected-seats-desc');
const seatTotalPriceEl = document.getElementById('seat-total-price');
const btnContinueCheckout = document.getElementById('btn-continue-checkout');
const seatsHeldTimerEl = document.getElementById('seats-held-timer');

function updateSelectionUI() {
  seat2DElements.forEach((btn, zoneId) => {
    if (PRE_TAKEN_2D.has(zoneId)) {
      btn.classList.remove('is-selected', 'is-selectable');
      btn.classList.add('is-taken');
      return;
    }

    if (state.selectedSeats.has(zoneId)) {
      btn.classList.add('is-selected');
    } else {
      btn.classList.remove('is-selected');
    }
  });

  const count = state.selectedSeats.size;

  if (count === 0) {
    if (selectedSeatsLabelEl) selectedSeatsLabelEl.textContent = 'Chưa chọn khu vực / vé nào';
    if (selectedSeatsDescEl) selectedSeatsDescEl.textContent = 'Nhấp vào khu CAT, Stardom hoặc Fanzone bất kỳ trên sơ đồ để giữ chỗ';
    if (seatTotalPriceEl) seatTotalPriceEl.textContent = '0 đ';
    if (btnContinueCheckout) btnContinueCheckout.disabled = true;
    stopHeldTimer();
  } else {
    const seatList = Array.from(state.selectedSeats.keys());
    const total = count * 250000;

    const seatsStr = seatList.join(', ');
    if (selectedSeatsLabelEl) selectedSeatsLabelEl.innerHTML = `<span class="text-purple-300 font-extrabold">${count} vé</span> • ${seatsStr}`;
    if (selectedSeatsDescEl) selectedSeatsDescEl.textContent = `Vé Thường • 250.000 đ / vé • Đã bao gồm trọn bộ Perks`;
    if (seatTotalPriceEl) seatTotalPriceEl.textContent = formatVND(total);
    if (btnContinueCheckout) btnContinueCheckout.disabled = false;

    startHeldTimer();
  }
}

// Đồng hồ đếm ngược giữ chỗ (10 phút)
function startHeldTimer() {
  if (state.heldTimerInterval) return;
  state.heldTimeSeconds = 600;

  state.heldTimerInterval = setInterval(() => {
    state.heldTimeSeconds--;
    if (state.heldTimeSeconds <= 0) {
      stopHeldTimer();
      state.selectedSeats.clear();
      updateSelectionUI();
      showToast('Hết thời gian giữ chỗ! Vui lòng chọn lại vị trí trên sơ đồ.', 'clock', 'text-amber-400');
      return;
    }

    const mins = Math.floor(state.heldTimeSeconds / 60);
    const secs = state.heldTimeSeconds % 60;
    if (seatsHeldTimerEl) {
      seatsHeldTimerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

function stopHeldTimer() {
  if (state.heldTimerInterval) {
    clearInterval(state.heldTimerInterval);
    state.heldTimerInterval = null;
  }
  if (seatsHeldTimerEl) seatsHeldTimerEl.textContent = '09:59';
}

// ---------------------------------------------------------
// 5. NÚT CHỌN NHANH 1 VÉ THƯỜNG (QUICK SELECT)
// ---------------------------------------------------------
const btnQuickSelectStd = document.getElementById('btn-quick-select-std');
if (btnQuickSelectStd) {
  btnQuickSelectStd.addEventListener('click', () => {
    for (const item of selectableZoneOrder) {
      if (!PRE_TAKEN_2D.has(item.id) && !state.selectedSeats.has(item.id)) {
        state.selectedSeats.set(item.id, {
          seatId: item.id,
          price: item.price,
          tier: item.tier
        });
        updateSelectionUI();
        showToast(`Đã tự động chọn vé khu ${item.id}!`, 'sparkles', 'text-purple-300');
        return;
      }
    }
    showToast('Đã chọn hết các khu Vé Thường trên sơ đồ!', 'alert-triangle', 'text-amber-400');
  });
}

// ---------------------------------------------------------
// 6. QUY TRÌNH THANH TOÁN QR & XUẤT VÉ ĐIỆN TỬ E-TICKET
// ---------------------------------------------------------
const modalCheckout = document.getElementById('modal-checkout');
const btnCloseCheckout = document.getElementById('btn-close-checkout');
const btnSimulateSuccess = document.getElementById('btn-simulate-success');
const orderCodeDisplay = document.getElementById('order-code-display');
const modalTotalDisplay = document.getElementById('modal-total-display');
const transferContent = document.getElementById('transfer-content');
const qrImage = document.getElementById('qr-image');
const checkoutCountdownTimer = document.getElementById('countdown-timer');

let checkoutCountdownInterval = null;

if (btnContinueCheckout) {
  btnContinueCheckout.addEventListener('click', () => {
    if (state.selectedSeats.size === 0) return;

    state.isModalOpen = true;
    const orderCode = 'TDN' + Math.floor(100000 + Math.random() * 900000);
    state.orderCode = orderCode;

    const total = state.selectedSeats.size * 250000;

    if (orderCodeDisplay) orderCodeDisplay.textContent = `#${orderCode}`;
    if (modalTotalDisplay) modalTotalDisplay.textContent = formatVND(total);
    if (transferContent) transferContent.textContent = `${orderCode} XIN NGHE`;

    // Sinh mã QR VietQR tự động
    const bankId = 'MB';
    const accountNo = '888866669999';
    const template = 'compact2';
    const description = encodeURIComponent(`${orderCode} XIN NGHE`);
    if (qrImage) {
      qrImage.src = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${total}&addInfo=${description}&accountName=ALO%20TDN%20XIN%20NGHE`;
      qrImage.onerror = () => {
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`PAYMENT:${orderCode}:${total}:MB888866669999`)}`;
      };
    }

    startCheckoutTimer(10 * 60);
    if (modalCheckout) modalCheckout.classList.remove('hidden');
  });
}

function closeCheckoutModal() {
  if (modalCheckout) modalCheckout.classList.add('hidden');
  state.isModalOpen = false;
  if (checkoutCountdownInterval) clearInterval(checkoutCountdownInterval);
}

if (btnCloseCheckout) {
  btnCloseCheckout.addEventListener('click', closeCheckoutModal);
}

function startCheckoutTimer(duration) {
  let timer = duration;
  if (checkoutCountdownInterval) clearInterval(checkoutCountdownInterval);

  checkoutCountdownInterval = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    if (checkoutCountdownTimer) {
      checkoutCountdownTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    if (--timer < 0) {
      clearInterval(checkoutCountdownInterval);
      showToast('Hết thời gian thanh toán! Vui lòng thực hiện lại.', 'clock', 'text-amber-400');
      closeCheckoutModal();
    }
  }, 1000);
}

// ---------------------------------------------------------
// 7. MODAL VÉ ĐIỆN TỬ E-TICKET (PHONG CÁCH SCREEN 3 - ẢNH 1)
// ---------------------------------------------------------
const modalTicket = document.getElementById('modal-ticket');
const btnCloseTicket = document.getElementById('btn-close-ticket');
const btnSaveTicket = document.getElementById('btn-save-ticket');
const btnShareTicket = document.getElementById('btn-share-ticket');
const ticketSeatsContainer = document.getElementById('ticket-seats-container');
const ticketSeatCount = document.getElementById('ticket-seat-count');
const ticketCode = document.getElementById('ticket-code');
const ticketTotalPaid = document.getElementById('ticket-total-paid');
const ticketQrImg = document.getElementById('ticket-qr-img');

if (btnSimulateSuccess) {
  btnSimulateSuccess.addEventListener('click', () => {
    closeCheckoutModal();
    state.isModalOpen = true;

    // Pháo hoa ăn mừng rực rỡ
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#EC4899', '#E11D48', '#F59E0B', '#10B981', '#FAF5F0']
      });
    }

    const seatIds = Array.from(state.selectedSeats.keys());
    const total = seatIds.length * 250000;

    // Đánh dấu các ghế vừa mua thành Đã Bán trên sơ đồ
    seatIds.forEach(sid => {
      PRE_TAKEN_2D.add(sid);
    });

    if (ticketSeatsContainer) {
      ticketSeatsContainer.textContent = seatIds.map(s => `Khu ${s}`).join(', ') || 'Khu CAT 17';
    }
    if (ticketSeatCount) ticketSeatCount.textContent = `${seatIds.length} vé`;
    if (ticketCode) ticketCode.textContent = `#${state.orderCode}`;
    if (ticketTotalPaid) ticketTotalPaid.textContent = `Đã thanh toán: ${formatVND(total)}`;

    if (ticketQrImg) {
      ticketQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`TDN-CONCERT:${state.orderCode}:${seatIds.join(',')}:${total}`)}`;
    }

    if (modalTicket) modalTicket.classList.remove('hidden');

    // Xóa giỏ ghế đã chọn và cập nhật lại sơ đồ
    state.selectedSeats.clear();
    stopHeldTimer();
    init2DSeatMatrix();

    showToast('Xác nhận thành công! Vé E-Ticket của bạn đã sẵn sàng.', 'check-circle-2', 'text-purple-400');
  });
}

if (btnCloseTicket) {
  btnCloseTicket.addEventListener('click', () => {
    if (modalTicket) modalTicket.classList.add('hidden');
    state.isModalOpen = false;
  });
}

if (btnSaveTicket) {
  btnSaveTicket.addEventListener('click', () => {
    showToast('Đã lưu vé vào Apple Wallet / Google Wallet thành công! 🎟️', 'bookmark', 'text-purple-300');
  });
}

if (btnShareTicket) {
  btnShareTicket.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('Đã sao chép liên kết chia sẻ vé concert thành công! 📋', 'share-2', 'text-rose-400');
  });
}

// ---------------------------------------------------------
// 8. TOAST NOTIFICATION & TIỆN ÍCH
// ---------------------------------------------------------
const toastEl = document.getElementById('toast');
const toastMsgEl = document.getElementById('toast-message');
const toastIconEl = document.getElementById('toast-icon');
const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

let toastTimeout = null;

function showToast(message, iconName = 'info', colorClass = 'text-rose-400') {
  if (!toastEl || !toastMsgEl || !toastIconEl) return;

  toastMsgEl.textContent = message;
  toastIconEl.className = colorClass;
  toastIconEl.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4"></i>`;

  if (window.lucide && typeof lucide.createIcons === 'function') {
    try {
      lucide.createIcons({ root: toastIconEl });
    } catch (e) {
      lucide.createIcons();
    }
  }

  toastEl.classList.remove('-translate-y-20', 'opacity-0');
  toastEl.classList.add('translate-y-0', 'opacity-100');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.add('-translate-y-20', 'opacity-0');
    toastEl.classList.remove('translate-y-0', 'opacity-100');
  }, 2600);
}

function formatVND(number) {
  return vndFormatter.format(number);
}

// Khởi chạy khi load trang
init2DSeatMatrix();
lucide.createIcons();
