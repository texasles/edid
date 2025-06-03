// edid-widget.js
(function () {
  // Ensure html2canvas is ready
  let html2canvasReady = false;
  if (window.html2canvas) {
    html2canvasReady = true;
  } else {
    // If for any reason html2canvas isn't available immediately, you can wait
    window.addEventListener('html2canvas-ready', () => {
      html2canvasReady = true;
    });
  }

  // Helper to get elements
  function get(id) {
    return document.getElementById(id);
  }

  // Main EDID generation function
  function generate() {
    // Read user inputs
    const w = parseInt(get('width').value, 10);
    const h = parseInt(get('height').value, 10);
    const r = parseFloat(get('refresh').value);

    // Derived blanking values (example values; replace with your actual formulas)
    const hFront = Math.round(w / 64);
    const hSync  = Math.round(w / 32);
    const hBack  = Math.round(w / 64);
    const hTotal = w + hFront + hSync + hBack;

    const vFront = Math.round(h / 64);
    const vSync  = Math.round(h / 32);
    const vBack  = Math.round(h / 64);
    const vTotal = h + vFront + vSync + vBack;

    // Pixel clock in kHz
    const pixelClock = Math.round((hTotal * vTotal * r) / 1000 * 1000) / 1000;

    // Build the EDID array
    const edid = new Uint8Array(128);
    edid[0] = 0x00;
    edid[1] = 0xFF;
    edid[2] = 0xFF;
    edid[3] = 0xFF;
    edid[4] = 0xFF;
    edid[5] = 0xFF;
    edid[6] = 0xFF;
    edid[7] = 0x00;

    // Vendor/Product codes, version, etc. (example placeholders)
    edid[8] = 0x4C;
    edid[9] = 0x2D;
    edid[10] = 0x00;
    edid[11] = 0x00;
    edid[12] = 0x01;
    edid[13] = 0x03;
    edid[14] = 0x80;
    edid[15] = 0x1A;
    edid[16] = 0x17;
    edid[17] = 0x78;

    // Basic display parameters
    edid[18] = 0xEA;
    edid[19] = 0xEE;
    edid[20] = 0x8F;
    edid[21] = 0xA3;
    edid[22] = 0x54;
    edid[23] = 0x4C;
    edid[24] = 0x99;
    edid[25] = 0x26;
    edid[26] = 0x0F;
    edid[27] = 0x50;
    edid[28] = 0x54;
    edid[29] = 0xA0;
    edid[30] = 0x57;
    edid[31] = 0x00;
    edid[32] = 0x00;
    edid[33] = 0x00;
    edid[34] = 0x01;
    edid[35] = 0x01;
    edid[36] = 0x01;
    edid[37] = 0x01;
    edid[38] = 0x01;
    edid[39] = 0x01;
    edid[40] = 0x01;
    edid[41] = 0x01;
    edid[42] = 0x01;
    edid[43] = 0x01;
    edid[44] = 0x01;
    edid[45] = 0x01;
    edid[46] = 0x01;
    edid[47] = 0x01;
    edid[48] = 0x01;
    edid[49] = 0x01;
    edid[50] = 0x01;
    edid[51] = 0x01;
    edid[52] = 0x01;
    edid[53] = 0x01;
    edid[54] = 0x01;
    edid[55] = 0x01;
    edid[56] = 0x01;
    edid[57] = 0x01;
    edid[58] = 0x01;
    edid[59] = 0x01;
    edid[60] = 0x01;
    edid[61] = 0x01;
    edid[62] = 0x01;
    edid[63] = 0x01;

    // Fill in the detailed timing descriptor for our custom mode
    // Pixel clock (in 10 kHz units)
    const pixClockValue = Math.round(pixelClock / 10);
    edid[66] = pixClockValue & 0xFF;
    edid[67] = (pixClockValue >> 8) & 0xFF;
    // Horizontal active (lower 8 bits)
    edid[68] = w & 0xFF;
    // Horizontal blanking (lower 8 bits)
    edid[69] = (hTotal - w) & 0xFF;
    // Horizontal active/blanking (upper 4 bits each)
    edid[70] = ((w >> 8) << 4) | ((hTotal - w) >> 8);
    // Vertical active (lower 8 bits)
    edid[71] = h & 0xFF;
    // Vertical blanking (lower 8 bits)
    edid[72] = (vTotal - h) & 0xFF;
    // Vertical active/blanking (upper 4 bits each)
    edid[73] = ((h >> 8) << 4) | ((vTotal - h) >> 8);
    // Horizontal sync offset (lower 8 bits)
    edid[74] = hFront & 0xFF;
    // Horizontal sync pulse width (lower 8 bits)
    edid[75] = hSync & 0xFF;
    // Vertical sync offset/pulse width (packed into one byte)
    edid[76] = ((vFront & 0xF) << 4) | (vSync & 0xF);
    // Sync pulse width bits (packed)
    edid[77] = ((hFront >> 8) << 6) | ((hSync >> 8) << 4) | ((vFront >> 4) << 2) | ((vSync >> 4) << 0);
    // Horizontal image size (lower 8 bits, in mm or placeholder)
    edid[78] = (w / 10) & 0xFF;
    // Vertical image size (lower 8 bits, in mm or placeholder)
    edid[79] = (h / 10) & 0xFF;
    // Image size bits (upper 4 bits each)
    edid[80] = ((w / 10) >> 8) << 4 | ((h / 10) >> 8);
    // Horizontal border (usually 0)
    edid[81] = 0;
    // Vertical border (usually 0)
    edid[82] = 0;
    // Flags: digital separate sync, etc. (example: 0x18 for digital)
    edid[83] = 0x18;

    // Compute checksum
    let sum = 0;
    for (let i = 0; i < 127; i++) sum += edid[i];
    edid[127] = (256 - (sum % 256)) % 256;

    // Offer EDID binary for download
    const binBlob = new Blob([edid], { type: 'application/octet-stream' });
    const binURL  = URL.createObjectURL(binBlob);
    const binLink = get('edid-download');
    if (binLink) {
      binLink.href     = binURL;
      binLink.download = `EDID_${w}x${h}_${r.toFixed(2)}.bin`;
      binLink.style.display = 'block';
    }

    // Offer JPEG screenshot of results
    if (!html2canvasReady) {
      console.warn('html2canvas not loaded; JPEG export unavailable');
      return;
    }
    html2canvas(get('edid-results')).then((canvas) => {
      const imgLink = get('edid-download-img');
      imgLink.href     = canvas.toDataURL('image/jpeg', 0.9);
      imgLink.download = `${w}x${h} edid settings.jpg`;
      imgLink.style.display = 'block';
    });
  }

  // Wire up button
  get('edid-gen-btn').addEventListener('click', generate);
})();
