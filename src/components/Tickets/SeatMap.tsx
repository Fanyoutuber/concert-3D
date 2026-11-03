import React from 'react';
import { Seat, SeatZoneSection } from '../../types';

export interface SeatMapProps {
  seats: Seat[];
  selectedSeatIds: string[];
  maxSeats?: number;
  onSeatToggle: (seat: Seat) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  maxSeats = 5,
  onSeatToggle,
}) => {
  const getSeatsBySection = (section: SeatZoneSection): Seat[] =>
    seats.filter((seat) => seat.section === section);

  const renderZoneButton = (seat: Seat) => {
    const isStandard = seat.tier === 'STANDARD';
    const isSold = seat.status === 'sold';
    const isSelected = selectedSeatIds.includes(seat.id) || seat.status === 'selected';

    let titleText = `Chọn khu ${seat.label} • Vé Thường (${seat.price.toLocaleString('vi-VN')} đ)`;
    if (seat.tier === 'VIP') {
      titleText = `Khu ${seat.label} • Hạng VIP (500.000 đ) — ĐÃ BÁN HẾT`;
    } else if (seat.tier === 'GUEST') {
      titleText = `${seat.label} • Khu vực dành riêng cho Khách Mời & Kỹ Thuật (FOH)`;
    } else if (isSold) {
      titleText = `Khu ${seat.label} • Đã kín chỗ`;
    } else if (!isSelected && selectedSeatIds.length >= maxSeats) {
      titleText = `Đã đạt giới hạn tối đa ${maxSeats} ghế trong một lần đặt`;
    }

    const classNames = [
      'map-zone-btn',
      seat.variant,
      isStandard && !isSold ? 'is-selectable' : '',
      isSold && isStandard ? 'is-taken' : '',
      isSelected ? 'is-selected' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        key={seat.id}
        type="button"
        data-seat-id={seat.id}
        data-tier={seat.tier}
        data-price={seat.price}
        title={titleText}
        onClick={() => onSeatToggle(seat)}
        className={classNames}
      >
        {seat.topLabel && <span>{seat.topLabel}</span>}
        {seat.subLabel && <span>{seat.subLabel}</span>}
      </button>
    );
  };

  return (
    <div id="seat-matrix-container" className="w-full max-w-2xl mx-auto overflow-x-auto custom-scrollbar">
      <div className="courtyard-map-board min-w-[320px]">
        {/* 1. HÀNG TRÊN CÙNG: LCD | LCD/LM | STAGE | LCD/LM | LCD */}
        <div className="map-stage-row">
          <div className="map-lcd-box">LCD</div>
          <div className="map-lcd-box">LCD/LM</div>
          <div className="map-stage-main">STAGE</div>
          <div className="map-lcd-box">LCD/LM</div>
          <div className="map-lcd-box">LCD</div>
        </div>

        {/* 2. KHU VỰC PHÍA TRƯỚC SÂN KHẤU (UPPER SECTION) */}
        <div className="map-upper-section">
          {/* Cột VIP hồng rìa trái (4 ô) */}
          <div className="map-side-vip-col">
            {getSeatsBySection('upper-left-vip').map(renderZoneButton)}
          </div>

          {/* Lưới CAT 3x4 bên trái */}
          <div className="map-upper-cat-grid">
            {getSeatsBySection('upper-left-cat').map(renderZoneButton)}
          </div>

          {/* Khu đứng trung tâm: STARDOM L/R & FANZONE L/R */}
          <div className="map-upper-center-standing">
            {getSeatsBySection('upper-center-standing').map(renderZoneButton)}
          </div>

          {/* Lưới CAT 3x4 bên phải */}
          <div className="map-upper-cat-grid">
            {getSeatsBySection('upper-right-cat').map(renderZoneButton)}
          </div>

          {/* Cột VIP hồng rìa phải (4 ô) */}
          <div className="map-side-vip-col">
            {getSeatsBySection('upper-right-vip').map(renderZoneButton)}
          </div>
        </div>

        {/* 3. KHU VỰC GIỮA SÂN TRƯỜNG XOAY QUANH TƯỢNG ĐÀI (MIDDLE SECTION) */}
        <div className="map-middle-section">
          {/* Cánh trái 2x4 */}
          <div className="map-mid-wing-grid">
            {getSeatsBySection('mid-left-cat').map(renderZoneButton)}
          </div>

          {/* Khu trung tâm 2x2 bao quanh TƯỢNG */}
          <div className="map-mid-center-wrap">
            {getSeatsBySection('mid-center-statue').map(renderZoneButton)}

            {/* Đảo Tượng Đài ở chính giữa */}
            <div className="map-statue-island">
              <svg viewBox="0 0 64 76" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect
                  x="16"
                  y="64"
                  width="32"
                  height="7"
                  rx="2"
                  fill="#E7DFD5"
                  stroke="#4A453F"
                  strokeWidth="2"
                />
                <path
                  d="M21 46H43L46 64H18L21 46Z"
                  fill="#E7DFD5"
                  stroke="#4A453F"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <line x1="26" y1="51" x2="25" y2="61" stroke="#4A453F" strokeWidth="1.5" />
                <line x1="32" y1="51" x2="32" y2="61" stroke="#4A453F" strokeWidth="1.5" />
                <line x1="38" y1="51" x2="39" y2="61" stroke="#4A453F" strokeWidth="1.5" />
                <path
                  d="M22 46V30C22 26 26 24 32 24C38 24 42 26 42 30V46"
                  fill="#E7DFD5"
                  stroke="#4A453F"
                  strokeWidth="2"
                />
                <path
                  d="M22 31L13 24L16 19L24 26"
                  fill="#E7DFD5"
                  stroke="#4A453F"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <rect
                  x="9"
                  y="14"
                  width="8"
                  height="6"
                  rx="1"
                  transform="rotate(-18 9 14)"
                  fill="#D6CEC2"
                  stroke="#4A453F"
                  strokeWidth="1.6"
                />
                <path
                  d="M42 31L49 36L45 41L39 36"
                  fill="#E7DFD5"
                  stroke="#4A453F"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="32" cy="15" r="6.5" fill="#E7DFD5" stroke="#4A453F" strokeWidth="2" />
              </svg>
              <span className="map-statue-label">tượng</span>
            </div>
          </div>

          {/* Cánh phải 2x4 */}
          <div className="map-mid-wing-grid">
            {getSeatsBySection('mid-right-cat').map(renderZoneButton)}
          </div>
        </div>

        {/* 4. KHU VỰC PHÍA SAU (LOWER SECTION: 3 HÀNG x 6 CỘT) */}
        <div className="map-lower-section">
          {/* Hàng dưới 1 */}
          <div className="map-lower-row">
            <div className="map-vip-pair">
              {getSeatsBySection('lower-row-1-left-vip').map(renderZoneButton)}
            </div>
            {getSeatsBySection('lower-row-1-cat').map(renderZoneButton)}
            <div className="map-vip-pair">
              {getSeatsBySection('lower-row-1-right-vip').map(renderZoneButton)}
            </div>
          </div>

          {/* Hàng dưới 2 */}
          <div className="map-lower-row">
            <div className="map-zone-btn zone-empty" />
            {getSeatsBySection('lower-row-2-cat').map(renderZoneButton)}
            <div className="map-zone-btn zone-empty" />
          </div>

          {/* Hàng dưới 3 */}
          <div className="map-lower-row">
            <div className="map-zone-btn zone-empty" />
            {getSeatsBySection('lower-row-3-cat').map(renderZoneButton)}
            <div className="map-zone-btn zone-empty" />
          </div>
        </div>

        {/* 5. HÀNG CUỐI CÙNG: KHÁCH MỜI | FOH | KHÁCH MỜI */}
        <div className="map-bottom-row">
          {getSeatsBySection('bottom-guest-foh').map(renderZoneButton)}
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
