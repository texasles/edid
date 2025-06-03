// edid-widget.js
window.addEventListener('DOMContentLoaded', () => {
  // Helper to grab an element by ID
  function get(id) {
    return document.getElementById(id);
  }

  // Main “Generate EDID” function
  function generate() {
    console.log('▶️ generate() called');

    // 1) Fetch inputs
    const wField  = get('edid-width');
    const hField  = get('edid-height');
    const rField  = get('edid-refresh');
    const rbField = get('edid-rb');

    if (!wField || !hField || !rField || !rbField) {
      console.error('❌ Missing one or more input elements.');
      return;
    }

    const w = parseInt(wField.value, 10);
    const h = parseInt(hField.value, 10);
    const r = parseFloat(rField.value);

    if (isNaN(w) || isNaN(h) || isNaN(r)) {
      console.warn('⚠️ Invalid width/height/refresh values.');
      return;
    }

    // If checked → use CVT-RB; if unchecked → use standard CVT
    const useReduced = rbField.checked;

    // 2) Compute blanking & totals
    let hFront, hSync, hBack, hTotal;
    let vFront, vSync, vBack, vTotal;

    if (useReduced) {
      // CVT-RB (reduced blanking)
      hFront = Math.round(w / 64);
      hSync  = Math.round(w / 32);
      hBack  = Math.round(w / 64);
      hTotal = w + hFront + hSync + hBack;

      vFront = Math.round(h / 64);
      vSync  = Math.round(h / 32);
      vBack  = Math.round(h / 64);
      vTotal = h + vFront + vSync + vBack;
    } else {
      // Standard CVT (larger blanking intervals).
      // Adjust these formulas as needed for your exact standard-blanking math:
      hFront = Math.round(w / 50);
      hSync  = Math.round(w / 25);
      hBack  = Math.round(w / 50);
      hTotal = w + hFront + hSync + hBack;

      vFront = Math.round(h / 50);
      vSync  = Math.round(h / 25);
      vBack  = Math.round(h / 50);
      vTotal = h + vFront + vSync + vBack;
    }

    // 3) Pixel clock in kHz (rounded to three decimals)
    const pixelClock = Math.round((hTotal * vTotal * r) / 1000 * 1000) / 1000;

    // 4) Prepare values for on-page display
    const pclkMHz      = (pixelClock / 1000).toFixed(3);
    const dataRateGbps = ((pixelClock * 24) / 1000).toFixed(3);
    const signalType   = useReduced ? 'CVT-RB' : 'CVT';

    // 5) Populate all <span id="edid-…"> inside #edid-results
    const spanMap = {
      hTotal:   hTotal,
      hFront:   hFront,
      hActive:  w,
      hSync:    hSync,
      hPol:     '+',       // always positive polarity

      vTotal:   vTotal,
      vFront:   vFront,
      vActive:  h,
      vSync:    vSync,
      vPol:     '+',

      pclk:       pclkMHz,
      dr:         dataRateGbps,
      signalType: signalType
    };

    Object.entries(spanMap).forEach(([key, val]) => {
      const el = get(`edid-${key}`);
      if (el) {
        el.textContent = val;
      } else {
        console.warn(`⚠️ <span id="edid-${key}"> not found.`);
      }
    });

    // 6) Build the 128-byte EDID block (still needed for completeness)
    const edid = new Uint8Array(128);
    // Header
    edid[0] = 0x00; edid[1] = 0xFF; edid[2] = 0xFF; edid[3] = 0xFF;
    edid[4] = 0xFF; edid[5] = 0xFF; edid[6] = 0xFF; edid[7] = 0x00;

    // Vendor/Product & version (example placeholders)
    edid[8]  = 0x4C; edid[9]  = 0x2D; edid[10] = 0x00; edid[11] = 0x00;
    edid[12] = 0x01; edid[13] = 0x03; edid[14] = 0x80; edid[15] = 0x1A;
    edid[16] = 0x17; edid[17] = 0x78;

    // Basic display parameters (example placeholders)
    edid[18] = 0xEA; edid[19] = 0xEE; edid[20] = 0x8F; edid[21] = 0xA3;
    edid[22] = 0x54; edid[23] = 0x4C; edid[24] = 0x99; edid[25] = 0x26;
    edid[26] = 0x0F; edid[27] = 0x50; edid[28] = 0x54; edid[29] = 0xA0;
    edid[30] = 0x57; edid[31] = 0x00; edid[32] = 0x00; edid[33] = 0x00;
    edid[34] = 0x01; edid[35] = 0x01; edid[36] = 0x01; edid[37] = 0x01;
    edid[38] = 0x01; edid[39] = 0x01; edid[40] = 0x01; edid[41] = 0x01;
    edid[42] = 0x01; edid[43] = 0x01; edid[44] = 0x01; edid[45] = 0x01;
    edid[46] = 0x01; edid[47] = 0x01; edid[48] = 0x01; edid[49] = 0x01;
    edid[50] = 0x01; edid[51] = 0x01; edid[52] = 0x01; edid[53] = 0x01;
    edid[54] = 0x01; edid[55] = 0x01; edid[56] = 0x01; edid[57] = 0x01;
    edid[58] = 0x01; edid[59] = 0x01; edid[60] = 0x01; edid[61] = 0x01;
    edid[62] = 0x01; edid[63] = 0x01;

    // Detailed Timing Descriptor
    const pixClockValue = Math.round(pixelClock / 10);
    edid[66] = pixClockValue & 0xFF;
    edid[67] = (pixClockValue >> 8) & 0xFF;

    edid[68] = w & 0xFF;
    edid[69] = (hTotal - w) & 0xFF;
    edid[70] = ((w >> 8) << 4) | ((hTotal - w) >> 8);

    edid[71] = h & 0xFF;
    edid[72] = (vTotal - h) & 0xFF;
    edid[73] = ((h >> 8) << 4) | ((vTotal - h) >> 8);

    edid[74] = hFront & 0xFF;
    edid[75] = hSync & 0xFF;
    edid[76] = ((vFront & 0xF) << 4) | (vSync & 0xF);
    edid[77] = ((hFront >> 8) << 6) | ((hSync >> 8) << 4) | ((vFront >> 4) << 2) | ((vSync >> 4));

    edid[78] = Math.floor(w / 10) & 0xFF;
    edid[79] = Math.floor(h / 10) & 0xFF;
    edid[80] = (((Math.floor(w / 10) >> 8) << 4) | ((Math.floor(h / 10) >> 8) & 0xF));

    edid[81] = 0;
    edid[82] = 0;

    edid[83] = 0x18; // digital separate sync, positive H & V

    // Compute checksum
    let sum = 0;
    for (let i = 0; i < 127; i++) {
      sum += edid[i];
    }
    edid[127] = (256 - (sum % 256)) % 256;

    // 7) Only generate the JPEG of #edid-results
    const resultsDiv = get('edid-results');
    if (!resultsDiv) {
      console.error('❌ Missing <div id="edid-results">.');
      return;
    }
    if (typeof html2canvas !== 'function') {
      console.warn('⚠️ html2canvas not loaded; JPEG export disabled.');
      return;
    }

    html2canvas(resultsDiv)
      .then(canvas => {
        const imgLink = get('edid-download-img');
        if (!imgLink) {
          console.warn('⚠️ <a id="edid-download-img"> is missing.');
          return;
        }
        imgLink.href     = canvas.toDataURL('image/jpeg', 0.9);
        imgLink.download = `${w}x${h} edid settings.jpg`;
        imgLink.style.display = 'block';
        console.log('✅ JPEG link enabled');
      })
      .catch(err => {
        console.error('❌ html2canvas error:', err);
      });
  }

  // 8) Wire up the “Generate EDID” button
  const btn = get('edid-gen-btn');
  if (btn) {
    btn.addEventListener('click', generate);
    console.log('➡️ “Generate EDID” button listening for clicks.');
  } else {
    console.error('❌ <button id="edid-gen-btn"> not found.');
  }
});
