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

  // Main generate function
  function generate() {
    // Read values
    const w = +get('edid-width').value;
    const h = +get('edid-height').value;
    const r = +get('edid-refresh').value;
    const rb = get('edid-rb').checked;

    // CVT-RB or CVT-STDporch
    const hFront = rb ? 48 : Math.floor((w * 0.2) / 3);
    const hSync = rb ? 32 : 44;
    const hBack = rb ? 80 : Math.floor(w * 0.2) - hFront - hSync;
    const hTotal = w + hFront + hSync + hBack;

    const vFront = 3,
      vSync = 5,
      vBack = 36;
    const vTotal = h + vFront + vSync + vBack;

    // Pixel clock (MHz) and data rate (Gbps)
    const pclk = (hTotal * vTotal * r) / 1e6;
    const dr = (pclk * 24) / 1000;

    // Sync polarity: “+” for CVT-RB, “–” otherwise
    const hPol = rb ? '+' : '-';
    const vPol = rb ? '+' : '-';

    // Determine signal type
    let signalType;
    if (pclk < 165) signalType = 'Single Link';
    else if (pclk < 330) signalType = 'Dual Link';
    else signalType = '4K';

    // Populate results in DOM
    get('edid-hTotal').textContent = hTotal;
    get('edid-hFront').textContent = hFront;
    get('edid-hActive').textContent = w;
    get('edid-hSync').textContent = hSync;
    get('edid-hPol').textContent = hPol;

    get('edid-vTotal').textContent = vTotal;
    get('edid-vFront').textContent = vFront;
    get('edid-vActive').textContent = h;
    get('edid-vSync').textContent = vSync;
    get('edid-vPol').textContent = vPol;

    get('edid-pclk').textContent = pclk.toFixed(2);
    get('edid-dr').textContent = dr.toFixed(2);
    get('edid-signalType').textContent = signalType;

    // Show the results container and warning if needed
    get('edid-results').style.display = 'block';
    get('edid-warning').style.display = dr > 25.92 ? 'block' : 'none';

    // Build EDID binary (128 bytes)
    const edid = new Uint8Array(128).fill(0);
    // EDID header
    edid.set([0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00], 0);
    // Placeholder manufacturer code
    edid.set([0x4C, 0x2D], 8);
    // Version & revision
    edid[16] = 1;
    edid[17] = 4;
    // Digital display, size, gamma, etc.
    edid[18] = 0x90; // Digital
    edid[19] = 61; // Max H size (cm)
    edid[20] = 35; // Max V size (cm)
    edid[21] = 0x78; // Gamma
    edid[22] = 0x0A; // Feature support

    // Compute detailed timing descriptor (DTD) bytes
    const packetStart = 54;
    const pixelClock10k = Math.round(pclk * 100);
    edid[packetStart + 0] = pixelClock10k & 0xFF;
    edid[packetStart + 1] = (pixelClock10k >> 8) & 0xFF;
    edid[packetStart + 2] = w & 0xFF;
    const hBlank = hFront + hSync + hBack;
    edid[packetStart + 3] = hBlank & 0xFF;
    edid[packetStart + 4] =
      ((w >> 8) & 0xF) << 4 | ((hBlank >> 8) & 0xF);
    edid[packetStart + 5] = h & 0xFF;
    const vBlank = vFront + vSync + vBack;
    edid[packetStart + 6] = vBlank & 0xFF;
    edid[packetStart + 7] =
      ((h >> 8) & 0xF) << 4 | ((vBlank >> 8) & 0xF);
    edid[packetStart + 8] = hFront & 0xFF;
    edid[packetStart + 9] = hSync & 0xFF;
    edid[packetStart + 10] =
      ((hSync >> 8) & 0x3) << 6 | ((hFront >> 8) & 0x3) << 4;
    edid[packetStart + 11] = vFront & 0xFF;
    edid[packetStart + 12] = vSync & 0xFF;
    edid[packetStart + 13] =
      ((vSync >> 4) & 0xF) << 4 | ((vFront >> 4) & 0xF);
    // +H / +V sync flags
    edid[packetStart + 14] = 0x00;
    edid[packetStart + 15] = 0x18;
    edid[packetStart + 16] = 0x00;
    edid[packetStart + 17] = 0x00;

    // Monitor name descriptor (just padding / placeholder)
    // (bytes 72–89; type tag = 0xFC for monitor name, followed by ASCII)
    const name = 'BrowntownEDID';
    edid.set([0x00, 0x00, 0x00, 0xFC, 0x00], 72);
    for (let i = 0; i < 13; i++) {
      edid[72 + 5 + i] = i < name.length
        ? name.charCodeAt(i)
        : 0x20; // space padding
    }

    // Zero out the rest of descriptor block area (bytes 90–125)
    for (let i = 90; i < 126; i++) {
      edid[i] = 0x00;
    }

    // Compute checksum
    let sum = 0;
    for (let i = 0; i < 127; i++) sum += edid[i];
    edid[127] = (256 - (sum % 256)) % 256;

    // Offer EDID binary for download
    const binBlob = new Blob([edid], {
      type: 'application/octet-stream',
    });
    const binURL = URL.createObjectURL(binBlob);
    const binLink = get('edid-download');
    binLink.href = binURL;
    binLink.download = `EDID_${w}x${h}_${r.toFixed(
      2
    )}.bin`;
    binLink.style.display = 'block';

    // Offer JPEG screenshot of results
    if (!html2canvasReady) {
      console.warn(
        'html2canvas not loaded; JPEG export unavailable'
      );
      return;
    }
    html2canvas(get('edid-results')).then((canvas) => {
      const imgLink = get('edid-download-img');
      imgLink.href = canvas.toDataURL('image/jpeg', 0.9);
      imgLink.download = `${w}x${h} edid settings.jpg`;
      imgLink.style.display = 'block';
    });
  }

  // Wire up button
  get('edid-gen-btn').addEventListener('click', generate);
})();
