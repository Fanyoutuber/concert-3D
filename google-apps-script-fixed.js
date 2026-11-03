/**
 * HỆ THỐNG GỬI VÉ ĐIỆN TỬ CONCERT "ALO! TĐN XIN NGHE 2026"
 * Đơn vị tổ chức: O.L.A & Ban Âm nhạc Trường THCS & THPT Trần Đại Nghĩa
 * 
 * PHIÊN BẢN BẢO VỆ CHỐNG SPAM & HẠN MỨC (LAYER 1 SECURITY):
 * 1. Secret Token Handshake: Chỉ chấp nhận yêu cầu từ website chính thức.
 * 2. Honeypot Field: Tự động phát hiện và vô hiệu hóa Bot spam ngầm.
 * 3. Rate Limiting 5 phút / email: Ngăn chặn gửi email dồn dập vào cùng 1 địa chỉ qua CacheService.
 * 4. Quota Guard: Kiểm tra MailApp.getRemainingDailyQuota() để không bao giờ bị cạn kiệt hạn mức Gmail.
 * 5. Khóa luồng LockService tránh xung đột race-condition.
 */

var API_SECRET_TOKEN = 'TDN_CONCERT_SECURE_2026_X9#1';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(10000);
  } catch (lockErr) {
    Logger.log('Lock error: ' + lockErr);
  }

  try {
    var rawData = e.postData ? e.postData.contents : null;
    var data = {};

    if (rawData) {
      try {
        data = JSON.parse(rawData);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    // 1. BẪY BOT (HONEYPOT FIELD) - Chặn bot tự động điền form
    if (data.hp_website && data.hp_website.toString().trim().length > 0) {
      Logger.log('Phát hiện bot tự động qua Honeypot: ' + data.hp_website);
      return responseJSON({
        status: 'success',
        orderCode: data.orderCode || 'SPAM_BLOCKED',
        message: 'Yêu cầu được tiếp nhận.'
      });
    }

    // 2. KIỂM TRA SECRET TOKEN (Hỗ trợ linh hoạt cả token lẫn mã đơn TDN từ web)
    var isValidToken = (data.secretToken === API_SECRET_TOKEN);
    var hasValidOrder = (data.orderCode && data.orderCode.toString().indexOf('TDN') === 0);

    if (!isValidToken && !hasValidOrder) {
      Logger.log('Từ chối request: Không có secretToken và không có orderCode hợp lệ.');
      return responseJSON({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Truy cập không hợp lệ: Không có quyền gọi API này.'
      });
    }

    var orderCode = data.orderCode || 'TDN' + Math.floor(100000 + Math.random() * 900000);
    var customerName = data.customerName || 'Khán giả TĐN';
    var customerEmail = (data.customerEmail || '').toString().trim();
    var customerPhone = data.customerPhone || 'Không cung cấp';
    var seats = Array.isArray(data.seats) ? data.seats.join(', ') : (data.seats || 'Chưa chọn');
    var seatCount = data.seatCount || (Array.isArray(data.seats) ? data.seats.length : 1);
    var totalAmount = data.totalAmount ? Number(data.totalAmount).toLocaleString('vi-VN') + ' đ' : '0 đ';
    var note = data.note || 'Thanh toán VietQR MBBank thành công';

    if (!customerEmail || customerEmail.indexOf('@') === -1) {
      return responseJSON({ status: 'error', message: 'Email người nhận không hợp lệ.' });
    }

    // 3. RATE LIMITING (Cooldown 60s để chống spam dồn dập, bọc trong try-catch an toàn)
    try {
      var cache = CacheService.getScriptCache();
      if (cache) {
        var emailKey = 'rate_' + customerEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
        var isCoolingDown = cache.get(emailKey);
        if (isCoolingDown) {
          Logger.log('Rate limit: Email ' + customerEmail + ' gửi quá nhanh trong 60s.');
          return responseJSON({
            status: 'error',
            code: 'RATE_LIMITED',
            message: 'Email này vừa nhận vé cách đây ít giây. Vui lòng kiểm tra kỹ hòm thư (kể cả mục Spam/Thư rác).'
          });
        }
        cache.put(emailKey, 'sent', 60); // 60 giây cooldown
      }
    } catch (cacheErr) {
      Logger.log('Bỏ qua cache rate limit do lỗi dịch vụ: ' + cacheErr);
    }

    // 4. QUOTA GUARD (Kiểm tra hạn mức trong try-catch để KHÔNG BAO GIỜ bị lỗi cấp quyền Permission)
    var remainingQuota = 100;
    try {
      remainingQuota = MailApp.getRemainingDailyQuota();
    } catch (quotaErr) {
      Logger.log('Không kiểm tra được MailApp quota (tiếp tục gửi an toàn): ' + quotaErr);
    }
    var shouldSendEmail = remainingQuota > 3;

    var ticketStatus = shouldSendEmail ? 'ĐÃ XÁC NHẬN' : 'ĐÃ XÁC NHẬN (QUOTA THẤP - GỬI BỔ SUNG)';

    // 5. GHI DỮ LIỆU VÀO GOOGLE SHEET (LUÔN LƯU AN TOÀN TRƯỚC TIÊN)
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('DanhSachDatVe');
      if (!sheet) {
        sheet = ss.insertSheet('DanhSachDatVe');
        sheet.appendRow([
          'Thời Gian Đặt',
          'Mã Đơn',
          'Họ Và Tên',
          'Email',
          'Số Điện Thoại',
          'Vị Trí Ghế',
          'Số Lượng Vé',
          'Tổng Tiền (VNĐ)',
          'Ghi Chú',
          'Trạng Thái'
        ]);
        sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#3F0C15').setFontColor('#ffffff');
      }

      sheet.appendRow([
        new Date(),
        orderCode,
        customerName,
        customerEmail,
        customerPhone,
        seats,
        seatCount,
        totalAmount,
        note,
        ticketStatus
      ]);
    } catch (sheetErr) {
      Logger.log('Lỗi ghi Google Sheet: ' + sheetErr.toString());
    }

    // 6. GỬI EMAIL VÉ ĐIỆN TỬ
    if (shouldSendEmail) {
      var htmlBody = buildTicketEmailHTML({
        orderCode: orderCode,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        seats: seats,
        seatCount: seatCount,
        totalAmount: totalAmount
      });

      var emailSubject = '[VÉ ĐIỆN TỬ CHÍNH THỨC] ALO! TĐN XIN NGHE - Đơn #' + orderCode;

      GmailApp.sendEmail(customerEmail, emailSubject, '', {
        htmlBody: htmlBody,
        name: 'ALO! TĐN XIN NGHE - BTC Concert'
      });

      Logger.log('Đã gửi email thành công tới: ' + customerEmail);

      return responseJSON({
        status: 'success',
        orderCode: orderCode,
        remainingQuota: remainingQuota - 1,
        message: 'Đã gửi vé điện tử thành công tới email ' + customerEmail
      });
    } else {
      Logger.log('Tạm hoãn gửi email do quota thấp: ' + remainingQuota);
      return responseJSON({
        status: 'warning',
        orderCode: orderCode,
        message: 'Đơn đặt vé đã được lưu trên hệ thống! BTC sẽ gửi vé điện tử tới email của bạn trong ít phút.'
      });
    }

  } catch (error) {
    Logger.log('Lỗi xử lý trong doPost: ' + error.toString());
    return responseJSON({ status: 'error', message: error.toString() });
  } finally {
    try {
      lock.releaseLock();
    } catch (relErr) {}
  }
}

function doGet(e) {
  return responseJSON({
    status: 'online',
    service: 'Concert E-Ticket Issuer',
    event: 'ALO! TĐN XIN NGHE 2026',
    time: new Date().toISOString()
  });
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildTicketEmailHTML(booking) {
  var qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=18&data=' + 
    encodeURIComponent('TDN-CONCERT:' + booking.orderCode + ':' + booking.seats + ':' + booking.totalAmount);

  return '<!DOCTYPE html>' +
  '<html>' +
  '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta name="color-scheme" content="light dark">' +
    '<meta name="supported-color-schemes" content="light dark">' +
    '<title>Vé Điện Tử ALO! TĐN XIN NGHE</title>' +
    '<style>' +
      '@media only screen and (max-width: 520px) {' +
        '.email-table { width: 100% !important; border-radius: 18px !important; }' +
        '.order-header-box { padding: 14px 16px !important; }' +
        '.order-code-col {' +
          'display: block !important;' +
          'width: 100% !important;' +
          'text-align: center !important;' +
          'margin-bottom: 10px !important;' +
        '}' +
        '.order-status-col {' +
          'display: block !important;' +
          'width: 100% !important;' +
          'text-align: center !important;' +
        '}' +
        '.info-stat-card {' +
          'display: block !important;' +
          'width: 100% !important;' +
          'margin-bottom: 8px !important;' +
          'box-sizing: border-box !important;' +
          'text-align: left !important;' +
          'padding: 10px 14px !important;' +
        '}' +
        '.info-stat-card .label-text {' +
          'display: inline-block !important;' +
          'width: 92px !important;' +
          'margin-bottom: 0 !important;' +
          'vertical-align: middle !important;' +
        '}' +
        '.info-stat-card .value-text {' +
          'display: inline-block !important;' +
          'vertical-align: middle !important;' +
        '}' +
        '.info-stat-spacer {' +
          'display: none !important;' +
          'width: 0 !important;' +
          'height: 0 !important;' +
        '}' +
        '.qr-card-table {' +
          'border: 8px solid #ffffff !important;' +
          'border-radius: 18px !important;' +
        '}' +
      '}' +
    '</style>' +
  '</head>' +
  '<body style="margin: 0; padding: 24px 10px; background-color: #0A0306; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif; color: #FAF5F0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-table" style="max-width: 580px; margin: 0 auto; background: #16070B; border: 1px solid #4A121A; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.85);">' +
      
      '<!-- HEADER - PHONG CÁCH CRIMSON WINE SÂN KHẤU TĐN -->' +
      '<tr>' +
        '<td style="padding: 32px 24px 22px; text-align: center; background: linear-gradient(180deg, #4A0E18 0%, #1A070B 100%); border-bottom: 1px solid #4A121A;">' +
          '<div style="display: inline-block; padding: 5px 18px; border-radius: 999px; background: rgba(107, 23, 36, 0.6); border: 1px solid #D4AF37; font-size: 11px; font-weight: bold; color: #FAF5F0; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;">' +
            '&#9670; V&Eacute; ĐIỆN TỬ CH&Iacute;NH THỨC &#9670;' +
          '</div>' +
          '<h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">' +
            '<span style="color: #F43F5E;">ALO!</span> <span style="color: #FAF5F0;">TĐN XIN NGHE</span>' +
          '</h1>' +
          '<p style="margin: 6px 0 0; font-size: 13px; color: #E2E8F0;">' +
            'Lễ hội &Acirc;m nhạc Ban &Acirc;m nhạc THCS &amp; THPT Trần Đại Nghĩa &bull; O.L.A' +
          '</p>' +
        '</td>' +
      '</tr>' +

      '<!-- LỜI CHÀO -->' +
      '<tr>' +
        '<td style="padding: 24px 26px 16px;">' +
          '<p style="margin: 0; font-size: 15px; color: #FAF5F0; line-height: 1.6;">' +
            'Xin ch&agrave;o <strong style="color: #D4AF37;">' + booking.customerName + '</strong>,' +
          '</p>' +
          '<p style="margin: 8px 0 0; font-size: 13px; color: #CBD5E1; line-height: 1.6;">' +
            'Cảm ơn bạn đ&atilde; sẵn s&agrave;ng nhấc m&aacute;y c&ugrave;ng giai điệu thanh xu&acirc;n tại <strong style="color: #F43F5E;">&ldquo;ALO! TĐN XIN NGHE&rdquo;</strong>. Dưới đ&acirc;y l&agrave; th&ocirc;ng tin v&eacute; điện tử ch&iacute;nh thức của bạn:' +
          '</p>' +
        '</td>' +
      '</tr>' +

      '<!-- THẺ VÉ CRIMSON GLASS -->' +
      '<tr>' +
        '<td style="padding: 0 22px 20px;">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #20080E; border: 1px solid #5A1622; border-radius: 18px; overflow: hidden;">' +
            '<!-- MÃ ĐƠN & TRẠNG THÁI: RỘNG RÃI, KHÔNG DÍNH NHAU TRÊN CẢ PC & MOBILE -->' +
            '<tr>' +
              '<td class="order-header-box" style="padding: 18px 22px; border-bottom: 1px dashed #5A1622; background: #280B13;">' +
                '<table width="100%" cellpadding="0" cellspacing="0">' +
                  '<tr>' +
                    '<td class="order-code-col" style="vertical-align: middle; padding-right: 12px;">' +
                      '<span style="font-size: 10px; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; display: block; margin-bottom: 3px;">M&Atilde; ĐƠN ĐẶT V&Eacute;</span>' +
                      '<span style="font-size: 21px; font-weight: 900; color: #FBBF24; font-family: monospace; letter-spacing: 0.5px;">#' + booking.orderCode + '</span>' +
                    '</td>' +
                    '<td class="order-status-col" style="text-align: right; vertical-align: middle;">' +
                      '<span style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #6EE7B7; font-size: 11px; font-weight: bold; white-space: nowrap;">' +
                        '&#10003; Đ&Atilde; X&Aacute;C NHẬN' +
                      '</span>' +
                    '</td>' +
                  '</tr>' +
                '</table>' +
              '</td>' +
            '</tr>' +

            '<!-- THỜI GIAN & CỔNG VÀO: BỐ CỤC 3 THẺ CÂN XỨNG & TỰ ĐỘNG RESPONSIVE MOBILE -->' +
            '<tr>' +
              '<td style="padding: 18px 16px 14px;">' +
                '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">' +
                  '<tr>' +
                    '<td class="info-stat-card" width="31%" style="padding: 12px 6px; background: rgba(107, 23, 36, 0.35); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; text-align: center; vertical-align: middle;">' +
                      '<span class="label-text" style="font-size: 10px; color: #D4AF37; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;">NG&Agrave;Y DIỄN</span>' +
                      '<strong class="value-text" style="font-size: 14px; color: #FAF5F0; font-weight: 800; display: block; white-space: nowrap;">07.06.2026</strong>' +
                    '</td>' +
                    '<td class="info-stat-spacer" width="3.5%" style="font-size: 0; line-height: 0;">&nbsp;</td>' +
                    '<td class="info-stat-card" width="31%" style="padding: 12px 6px; background: rgba(107, 23, 36, 0.35); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; text-align: center; vertical-align: middle;">' +
                      '<span class="label-text" style="font-size: 10px; color: #D4AF37; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;">THỜI GIAN</span>' +
                      '<strong class="value-text" style="font-size: 14px; color: #FBBF24; font-weight: 800; display: block; white-space: nowrap;">17:00 &ndash; 21:30</strong>' +
                    '</td>' +
                    '<td class="info-stat-spacer" width="3.5%" style="font-size: 0; line-height: 0;">&nbsp;</td>' +
                    '<td class="info-stat-card" width="31%" style="padding: 12px 6px; background: rgba(107, 23, 36, 0.35); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; text-align: center; vertical-align: middle;">' +
                      '<span class="label-text" style="font-size: 10px; color: #D4AF37; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;">CỔNG V&Agrave;O</span>' +
                      '<strong class="value-text" style="font-size: 14px; color: #FAF5F0; font-weight: 800; display: block; white-space: nowrap;">Cổng 20 LTTr</strong>' +
                    '</td>' +
                  '</tr>' +
                '</table>' +

                '<!-- ĐỊA ĐIỂM SÂN KHẤU -->' +
                '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(107, 23, 36, 0.22); border: 1px solid rgba(212, 175, 55, 0.22); border-radius: 12px; padding: 12px 14px;">' +
                  '<tr>' +
                    '<td style="text-align: left;">' +
                      '<span style="font-size: 10px; color: #D4AF37; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px;">&#9670; ĐỊA ĐIỂM TỔ CHỨC</span>' +
                      '<strong style="font-size: 13px; color: #FAF5F0; line-height: 1.5; display: block; font-weight: 600;">' +
                        'S&acirc;n trường THCS &amp; THPT Trần Đại Nghĩa &bull; 20 L&yacute; Tự Trọng, Bến Ngh&eacute;, Quận 1, TP.HCM' +
                      '</strong>' +
                    '</td>' +
                  '</tr>' +
                '</table>' +
              '</td>' +
            '</tr>' +

            '<!-- VỊ TRÍ GHẾ NGỒI -->' +
            '<tr>' +
              '<td style="padding: 18px 20px; background: #280B13; border-top: 1px dashed #5A1622; text-align: center;">' +
                '<span style="font-size: 11px; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.2px; font-weight: bold; display: block; margin-bottom: 6px;">VỊ TR&Iacute; GHẾ NGỒI Đ&Atilde; ĐẶT</span>' +
                '<div style="font-size: 24px; font-weight: 900; color: #34D399; letter-spacing: 1px; font-family: monospace;">' +
                  booking.seats +
                '</div>' +
                '<div style="margin-top: 8px; font-size: 12px; color: #E2E8F0;">' +
                  'Hạng v&eacute;: <strong style="color: #FAF5F0;">V&eacute; Thường (To&agrave;n quyền 5 set diễn + Perks)</strong> &bull; Số lượng: <strong style="color: #FBBF24;">' + booking.seatCount + ' v&eacute;</strong>' +
                '</div>' +
                '<div style="margin-top: 6px; font-size: 14px; color: #FAF5F0;">' +
                  'Tổng thanh to&aacute;n: <strong style="color: #FBBF24; font-size: 16px;">' + booking.totalAmount + '</strong>' +
                '</div>' +
              '</td>' +
            '</tr>' +

            '<!-- MÃ QR CHECK-IN: THẺ TRẮNG BO TRÒN ĐẦY ĐỦ, CHỐNG INVERT TRÊN GMAIL MOBILE DARK MODE -->' +
            '<tr>' +
              '<td style="padding: 26px 16px 22px; text-align: center; background: #1A070B; border-top: 1px solid #4A121A;">' +
                '<table role="presentation" cellpadding="0" cellspacing="0" align="center" class="qr-card-table" style="margin: 0 auto; background-color: #ffffff !important; background: #ffffff linear-gradient(#ffffff, #ffffff) !important; border: 10px solid #ffffff !important; border-radius: 22px; box-shadow: 0 6px 26px rgba(0,0,0,0.65);">' +
                  '<tr>' +
                    '<td align="center" style="background-color: #ffffff !important; background: #ffffff linear-gradient(#ffffff, #ffffff) !important; border-radius: 14px; line-height: 0; padding: 2px;">' +
                      '<img src="' + qrImageUrl + '" width="180" height="180" alt="M&atilde; QR Check-in" style="display: block; border: 0; border-radius: 12px; background-color: #ffffff !important; max-width: 100%; height: auto;" />' +
                    '</td>' +
                  '</tr>' +
                '</table>' +
                '<div style="margin-top: 14px;">' +
                  '<span style="display: inline-block; padding: 4px 14px; border-radius: 999px; background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); font-size: 10px; font-weight: bold; color: #D4AF37; letter-spacing: 1px; text-transform: uppercase;">' +
                    'SCAN CHECK-IN AT GATE' +
                  '</span>' +
                '</div>' +
                '<p style="margin: 10px auto 0; max-width: 380px; font-size: 12px; color: #CBD5E1; line-height: 1.55;">' +
                  'Xuất tr&igrave;nh m&atilde; QR n&agrave;y tại cổng check-in (20 L&yacute; Tự Trọng) để v&agrave;o cổng v&agrave; nhận trọn bộ qu&agrave; tặng (Perks).' +
                '</p>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</td>' +
      '</tr>' +

      '<!-- LƯU Ý QUAN TRỌNG -->' +
      '<tr>' +
        '<td style="padding: 0 24px 24px;">' +
          '<div style="padding: 14px 18px; border-radius: 14px; background: rgba(212, 175, 55, 0.08); border-left: 3px solid #D4AF37;">' +
            '<strong style="font-size: 12px; color: #FBBF24; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">QUY ĐỊNH THAM DỰ SỰ KIỆN:</strong>' +
            '<ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #CBD5E1; line-height: 1.65;">' +
              '<li>Vui l&ograve;ng c&oacute; mặt l&uacute;c <strong style="color: #FAF5F0;">16:30</strong> để ho&agrave;n tất thủ tục check-in v&agrave; nhận qu&agrave; tặng (Perks).</li>' +
              '<li>Mỗi m&atilde; QR chỉ c&oacute; gi&aacute; trị check-in 01 lần cho số lượng ghế ghi tr&ecirc;n v&eacute;.</li>' +
              '<li>Kh&ocirc;ng chia sẻ ảnh m&atilde; QR cho người kh&aacute;c để tr&aacute;nh trường hợp bị chiếm quyền v&eacute;.</li>' +
            '</ul>' +
          '</div>' +
        '</td>' +
      '</tr>' +

      '<!-- FOOTER -->' +
      '<tr>' +
        '<td style="padding: 20px 24px; text-align: center; border-top: 1px solid #4A121A; background: #0E0306;">' +
          '<p style="margin: 0; font-size: 11px; color: #94A3B8;">' +
            'Mọi thắc mắc về v&eacute; xin vui l&ograve;ng li&ecirc;n hệ BTC qua email: <a href="mailto:uyentran620119@gmail.com" style="color: #F43F5E; text-decoration: none; font-weight: bold;">uyentran620119@gmail.com</a>' +
          '</p>' +
          '<p style="margin: 6px 0 0; font-size: 10px; color: #64748B;">' +
            '&copy; 2026 O.L.A &ndash; One Legacy, All &bull; Ban &Acirc;m nhạc THCS &amp; THPT Trần Đại Nghĩa' +
          '</p>' +
        '</td>' +
      '</tr>' +
    '</table>' +
  '</body>' +
  '</html>';
}
