// edid-widget.js
(function() {
  const container = document.getElementById('edid-calculator') || document.body;
  container.style.minHeight = '600px';

  let html2canvasReady = false;
  const loader = document.createElement('script');
  loader.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  loader.onload = () => { html2canvasReady = true; };
  document.head.appendChild(loader);

  const get = id => document.getElementById(id);

  get('edid-gen-btn').addEventListener('click', () => {
    const w = +get('edid-width').value;
    const h = +get('edid-height').value;
    const r = +get('edid-refresh').value;
    const rb = get('edid-rb').checked;

    const hFront = rb ? 48 : Math.floor((w * 0.2) / 3);
    const hSync = rb ? 32 : 44;
    const hBack = rb ? 80 : Math.floor(w * 0.2) - hFront - hSync;
    const hTotal = w + hFront + hSync + hBack;

    const vFront = 3, vSync = 5, vBack = 36;
    const vTotal = h + vFront + vSync + vBack;

    const pclk = (hTotal * vTotal * r) / 1e6;
    const dr = (pclk * 24) / 1000;

    const hPol = rb ? '+' : '-';
    const vPol = rb ? '+' : '-';

    const signalType = pclk < 165 ? 'Single Link' : (pclk < 330 ? 'Dual Link' : '4K');

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

    get('edid-results').style.display = 'block';
    get('edid-warning').style.display = dr > 25.92 ? 'block' : 'none';

    const edid = new Uint8Array(128).fill(0);
    edid.set([0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00], 0);
    edid.set([0x4C, 0x2D], 8);
    edid[16] = 1;
    edid[17] = 4;

    const D = 54;
    const clk10k = Math.round(pclk * 100);
    edid[D] = clk10k & 0xFF;
    edid[D + 1] = (clk10k >> 8) & 0xFF;
    edid[D + 2] = w & 0xFF;
    edid[D + 3] = (hTotal - w) & 0xFF;
    edid[D + 4] = ((w >> 8) & 0xF) << 4 | ((hTotal - w) >> 8) & 0xF;
    edid[D + 5] = h & 0xFF;
    edid[D + 6] = (vTotal - h) & 0xFF;
    edid[D + 7] = ((h >> 8) & 0xF) << 4 | ((vTotal - h) >> 8) & 0xF;
    edid[D + 8] = hFront & 0xFF;
    edid[D + 9] = hSync & 0xFF;
    edid[D + 10] = ((hSync >> 8) & 0x3) << 6 | ((hFront >> 8) & 0x3) << 4;
    edid[D + 11] = vFront & 0xFF;
    edid[D + 12] = vSync & 0xFF;
    edid[D + 13] = ((vSync >> 4) & 0xF) << 4 | ((vFront >> 4) & 0xF);
    edid[D + 17] = 0x1E;

    let sum = 0;
    for (let i = 0; i < 127; i++) sum += edid[i];
    edid[127] = (256 - (sum % 256)) % 256;

    const binBlob = new Blob([edid], { type: 'application/octet-stream' });
    const binURL = URL.createObjectURL(binBlob);
    const binLink = get('edid-download');
    binLink.href = binURL;
    binLink.download = `EDID_${w}x${h}_${r.toFixed(2)}.bin`;
    binLink.style.display = 'block';

    if (!html2canvasReady) return;
    html2canvas(get('edid-results')).then(canvas => {
      const imgLink = get('edid-download-img');
      imgLink.href = canvas.toDataURL('image/jpeg', 0.9);
      imgLink.download = `${w}x${h} edid settings.jpg`;
      imgLink.style.display = 'block';
    });
  });
})();
