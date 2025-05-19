// edid-widget.js
(function() {
  let container = document.getElementById('edid-calculator');
  if (!container) {
    container = document.createElement('div');
    container.id = 'edid-calculator';
    document.body.appendChild(container);
  }

  const style = document.createElement('style');
  style.textContent = `
    #edid-calculator { font-family: Arial,sans-serif; background:#f5f5f5; padding:1rem; border-radius:6px; max-width:600px; margin:auto; }
    #edid-calculator label { display:block; margin:0.75rem 0 0.25rem; font-weight:bold; }
    #edid-calculator input, #edid-calculator select, #edid-gen-btn { width:100%; padding:0.5rem; font-size:1rem; }
    #edid-gen-btn { margin-top:1rem; cursor:pointer; }
    #edid-results { display:none; margin-top:1.5rem; background:#fff; padding:1rem; border-radius:4px; line-height:1.4; }
    #edid-results span { font-weight:bold; }
    #edid-download, #edid-download-img { display:none; margin-top:1rem; text-align:center; width:100%; }
  `;
  container.appendChild(style);

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
      <div><span>Cable Rec:</span> <span id="edid-cable"></span></div>
    </div>

    <a id="edid-download" href="#" download="custom.edid.bin">⬇️ Download EDID .bin</a>
    <a id="edid-download-img" href="#" download="edid-info.jpg">⬇️ Download Info as JPEG</a>
  `;

  function generate() {
    // gather inputs
    const w  = +document.getElementById('edid-width').value;
    const h  = +document.getElementById('edid-height').value;
    const r  = +document.getElementById('edid-refresh').value;
    const rb = document.getElementById('edid-rb').checked;

    // timing calc (CVT-RB vs CVT)
    const hFront = rb ? 48 : Math.round((w * 0.2) / 3);
    const hSync  = rb ? 32 : 44;
    const hBack  = rb ? 80 : Math.round(w * 0.2) - hFront - hSync;
    const hTotal = w + hFront + hSync + hBack;
    const vFront = rb ? 3 : 3;
    const vSync  = rb ? 5 : 5;
    const vBack  = rb ? 36 : 36;
    const vTotal = h + vFront + vSync + vBack;

    const pclk = (hTotal * vTotal * r) / 1e6;         // MHz
    const dr   = (pclk * 24) / 1000;                  // Gbps

    // cable rec
    let cable = dr <= 4.95 ? "HDMI1.2/SL-DVI"
              : dr <= 10.2 ? "HDMI1.4/DL-DVI"
              : dr <= 18   ? "HDMI2.0/DP1.2"
              : dr <= 25.92? "DP1.4"
              :               "DP2.0+";

    // populate
    document.getElementById('edid-hTotal').textContent = hTotal;
    document.getElementById('edid-hFront').textContent = hFront;
    document.getElementById('edid-hSync').textContent  = hSync;
    document.getElementById('edid-hActive').textContent= w;
    document.getElementById('edid-vTotal').textContent = vTotal;
    document.getElementById('edid-vFront').textContent = vFront;
    document.getElementById('edid-vSync').textContent  = vSync;
    document.getElementById('edid-vActive').textContent= h;
    document.getElementById('edid-pclk').textContent    = pclk.toFixed(2);
    document.getElementById('edid-dr').textContent      = dr.toFixed(2);
    document.getElementById('edid-cable').textContent   = cable;
    document.getElementById('edid-results').style.display = 'block';

    // build EDID .bin (omitted for brevity – same as before)
    const edid = new Uint8Array(128).fill(0);
    /* … EDID header + DTD code … */
    // [Use the same binary generation you already have]

    // hook up .bin download
    const blob = new Blob([edid], {type:'application/octet-stream'});
    const url  = URL.createObjectURL(blob);
    const binLink = document.getElementById('edid-download');
    binLink.href = url;

    // snapshot JPEG
    const resultsElem = document.getElementById('edid-results');
    html2canvas(resultsElem).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const imgLink = document.getElementById('edid-download-img');
      imgLink.href = imgData;
      imgLink.style.display = 'block';
    });

    // also show .bin link
    binLink.style.display = 'block';
  }

  document.getElementById('edid-gen-btn').addEventListener('click', generate);
})();
