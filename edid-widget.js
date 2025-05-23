// edid-widget.js
(function() {
  // 1) Ensure a container exists
  let container = document.getElementById('edid-calculator');
  if (!container) {
    container = document.createElement('div');
    container.id = 'edid-calculator';
    document.body.appendChild(container);
  }
  // Allow scrolling if Carrd crops the widget
  // container.style.minHeight = '600px';

  // 2) Scoped styles
  const style = document.createElement('style');
  style.textContent = `
    #edid-calculator { background: #171A1C; font-family: Arial, sans-serif; padding: 1rem; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #00FFC2; color: #fff; }
    #edid-calculator label { display: block; margin: 0.75rem 0 0.25rem; font-weight: bold; }
    #edid-calculator input {background: none;}    
    #edid-calculator input, #edid-calculator button { width: 100%; padding: 0.5rem; font-size: 1rem; box-sizing: border-box; }
    #edid-calculator button { color: #171A1C; margin-top: 1rem; cursor: pointer; background: #00FFC2; }
    #edid-calculator #edid-results { display: none; margin-top: 1.5rem;  padding: 1rem; border-radius: 4px; line-height: 1.4; overflow: auto; border: 1px solid #00FFC2;}
    #edid-calculator #edid-results span { font-weight: bold; }
    #edid-calculator #edid-warning { display: none; margin-top: 1rem; padding: 0.75rem; background: #fff3cd; color: #856404; border: 1px solid #ffeeba; border-radius: 4px; }
    #edid-calculator #edid-download, #edid-calculator #edid-download-img { display: none; margin-top: 1rem; text-align: center; width: 100%; }
  `;
  container.appendChild(style);

  // 3) HTML UI
  container.innerHTML += `
    <h2>EDID Calculator</h2>
    <label>Width (px)<input id="edid-width" type="number" value="1920"></label>
    <label>Height (px)<input id="edid-height" type="number" value="1080"></label>
    <label>Refresh (Hz)<input id="edid-refresh" type="number" step="0.01" value="60"></label>
    <label><input id="edid-rb" type="checkbox" checked> Reduced Blanking</label>
    <button id="edid-gen-btn">Generate EDID</button>

    <div id="edid-results">
      <div><span>H Total:</span> <span id="edid-hTotal"></span> px</div>
      <div><span>H Front Porch:</span> <span id="edid-hFront"></span> px</div>
      <div><span>H Sync:</span> <span id="edid-hSync"></span> px</div>
      <div><span>H Active:</span> <span id="edid-hActive"></span> px</div>
      <hr>
      <div><span>V Total:</span> <span id="edid-vTotal"></span> lines</div>
      <div><span>V Front Porch:</span> <span id="edid-vFront"></span> lines</div>
      <div><span>V Sync:</span> <span id="edid-vSync"></span> lines</div>
      <div><span>V Active:</span> <span id="edid-vActive"></span> lines</div>
      <hr>
      <div><span>Pixel Clock:</span> <span id="edid-pclk"></span> MHz</div>
      <div><span>Data Rate:</span> <span id="edid-dr"></span> Gbps</div>
      <div><span>Signal Type:</span> <span id="edid-signalType"></span></div>
    </div>

    <div id="edid-warning">⚠️ Warning: Data rate exceeds DP 1.4 maximum (25.92 Gbps). Consider DP 2.0 or compression.</div>
    <a id="edid-download" href="#" download="custom.edid.bin">⬇️ Download EDID .bin</a>
    <a id="edid-download-img" href="#" download="edid-info.jpg">⬇️ Download Info as JPEG</a>
  `;

  // 4) Load html2canvas dynamically
  let html2canvasReady = false;
  const loader = document.createElement('script');
  loader.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  loader.onload = () => { html2canvasReady = true; };
  loader.onerror = () => { console.error('Failed to load html2canvas'); };
  document.head.appendChild(loader);

  // 5) Generate function
  function generate() {
    // Read inputs
    const w  = +container.querySelector('#edid-width').value;
    const h  = +container.querySelector('#edid-height').value;
    const r  = +container.querySelector('#edid-refresh').value;
    const rb = container.querySelector('#edid-rb').checked;

    // Horizontal timings
    const hFront = rb ? 48 : Math.floor((w * 0.2) / 3);
    const hSync  = rb ? 32 : 44;
    const hBack  = rb ? 80 : Math.floor(w * 0.2) - hFront - hSync;
    const hTotal = w + hFront + hSync + hBack;
    // Vertical timings
    const vFront = 3, vSync = 5, vBack = 36;
    const vTotal = h + vFront + vSync + vBack;

    // Pixel clock (MHz) and data rate (Gbps)
    const pclk = (hTotal * vTotal * r) / 1e6;
    const dr   = (pclk * 24) / 1000;

    // Determine signal type
    let signalType;
    if (pclk < 165) signalType = 'Single Link';
    else if (pclk < 330) signalType = 'Dual Link';
    else signalType = '4K';

    // Populate results
    container.querySelector('#edid-hTotal').textContent    = hTotal;
    container.querySelector('#edid-hFront').textContent    = hFront;
    container.querySelector('#edid-hSync').textContent     = hSync;
    container.querySelector('#edid-hActive').textContent   = w;
    container.querySelector('#edid-vTotal').textContent    = vTotal;
    container.querySelector('#edid-vFront').textContent    = vFront;
    container.querySelector('#edid-vSync').textContent     = vSync;
    container.querySelector('#edid-vActive').textContent   = h;
    container.querySelector('#edid-pclk').textContent      = pclk.toFixed(2);
    container.querySelector('#edid-dr').textContent        = dr.toFixed(2);
    container.querySelector('#edid-signalType').textContent= signalType;
    container.querySelector('#edid-results').style.display = 'block';

    // Show warning if data rate exceeds DP1.4
    const warning = container.querySelector('#edid-warning');
    warning.style.display = dr > 25.92 ? 'block' : 'none';

    // Generate EDID binary
    const edid = new Uint8Array(128).fill(0);
    edid.set([0x00,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0x00], 0);
    edid.set([0x4C,0x2D], 8);
    edid[16] = 1; edid[17] = 4;
    const D = 54;
    const clk10k = Math.round(pclk * 100);
    edid[D]    =  clk10k & 0xFF;
    edid[D+1]  = (clk10k >> 8) & 0xFF;
    edid[D+2]  =  w & 0xFF;
    edid[D+3]  = (hTotal - w) & 0xFF;
    edid[D+4]  = ((w >> 8) & 0xF) << 4 | (((hTotal - w) >> 8) & 0xF);
    edid[D+5]  =  h & 0xFF;
    edid[D+6]  = (vTotal - h) & 0xFF;
    edid[D+7]  = ((h >> 8) & 0xF) << 4 | (((vTotal - h) >> 8) & 0xF);
    edid[D+8]  =  hFront & 0xFF;
    edid[D+9]  =  hSync  & 0xFF;
    edid[D+10] = ((hSync >> 8) & 0x3) << 6 | ((hFront >> 8) & 0x3) << 4;
    edid[D+11] =  vFront & 0xFF;
    edid[D+12] =  vSync  & 0xFF;
    edid[D+13] = ((vSync >> 4) & 0xF) << 4 | ((vFront >> 4) & 0xF);
    edid[D+17] = 0x1E;
    let sum = 0; for (let i = 0; i < 127; i++) sum += edid[i];
    edid[127] = (256 - (sum % 256)) % 256;

    const binBlob = new Blob([edid], {type: 'application/octet-stream'});
    const binURL  = URL.createObjectURL(binBlob);
    const binLink = container.querySelector('#edid-download');
    binLink.href = binURL;
    binLink.download = `EDID_${w}x${h}_${r.toFixed(2)}.bin`;
    binLink.style.display = 'block';

    // JPEG export
    if (!html2canvasReady) {
      console.warn('html2canvas not loaded');
      return;
    }
    html2canvas(container.querySelector('#edid-results'))
      .then(canvas => {
        const imgLink = container.querySelector('#edid-download-img');
        imgLink.href = canvas.toDataURL('image/jpeg', 0.9);
        imgLink.download = `${w}x${h} edid settings.jpg`;
        imgLink.style.display = 'block';
      })
      .catch(err => console.error('html2canvas error:', err));
  }

  // 6) Wire up
  container.querySelector('#edid-gen-btn').addEventListener('click', generate);
})();
