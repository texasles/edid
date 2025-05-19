// edid-widget.js
(function() {
  // 1) Container
  let container = document.getElementById('edid-calculator');
  if (!container) {
    container = document.createElement('div');
    container.id = 'edid-calculator';
    document.body.appendChild(container);
  }

  // 2) Scoped styles
  const style = document.createElement('style');
  style.textContent = `
    #edid-calculator { font-family:Arial,sans-serif; background:#f5f5f5; padding:1rem; border-radius:6px; max-width:600px; margin:auto; }
    #edid-calculator label { display:block; margin:0.75rem 0 0.25rem; font-weight:bold; }
    #edid-calculator input, #edid-calculator select, #edid-gen-btn { width:100%; padding:0.5rem; font-size:1rem; box-sizing:border-box; }
    #edid-gen-btn { margin-top:1rem; cursor:pointer; }
    #edid-results { display:none; margin-top:1.5rem; background:#fff; padding:1rem; border-radius:4px; line-height:1.4; }
    #edid-results span { font-weight:bold; }
    #edid-download, #edid-download-img { display:none; margin-top:1rem; text-align:center; width:100%; }
  `;
  container.appendChild(style);

  // 3) UI
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

  // 4) Logic
  function generate() {
    const w  = +document.getElementById('edid-width').value;
    const h  = +document.getElementById('edid-height').value;
    const r  = +document.getElementById('edid-refresh').value;
    const rb = document.getElementById('edid-rb').checked;

    // CVT vs CVT-RB
    const hFront = rb ? 48 : Math.floor((w*0.2)/3);
    const hSync  = rb ? 32 : 44;
    const hBack  = rb ? 80 : Math.floor(w*0.2) - hFront - hSync;
    const hTotal = w + hFront + hSync + hBack;

    const vFront = 3, vSync = 5, vBack = 36;
    const vTotal = h + vFront + vSync + vBack;

    const pclk = (hTotal * vTotal * r)/1e6;       // MHz
    const dr   = (pclk * 24)/1000;                 // Gbps

    let cable;
    if      (dr <= 4.95)  cable = "HDMI1.2 / SL-DVI";
    else if (dr <= 10.2)  cable = "HDMI1.4 / DL-DVI";
    else if (dr <= 18)    cable = "HDMI2.0 / DP1.2";
    else if (dr <= 25.92) cable = "DP1.4";
    else                  cable = "DP2.0+";

    // Populate results
    document.getElementById('edid-hTotal').textContent  = hTotal;
    document.getElementById('edid-hFront').textContent  = hFront;
    document.getElementById('edid-hSync').textContent   = hSync;
    document.getElementById('edid-hActive').textContent = w;
    document.getElementById('edid-vTotal').textContent  = vTotal;
    document.getElementById('edid-vFront').textContent  = vFront;
    document.getElementById('edid-vSync').textContent   = vSync;
    document.getElementById('edid-vActive').textContent = h;
    document.getElementById('edid-pclk').textContent    = pclk.toFixed(2);
    document.getElementById('edid-dr').textContent      = dr.toFixed(2);
    document.getElementById('edid-cable').textContent   = cable;
    document.getElementById('edid-results').style.display = 'block';

    // --- EDID binary generation ---
    const edid = new Uint8Array(128).fill(0);
    edid.set([0x00,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0x00], 0);
    edid.set([0x4C,0x2D], 8);
    edid[16]=1; edid[17]=4;
    const D = 54;
    const clk10k = Math.round(pclk*100);
    edid[D]   =  clk10k & 0xFF;
    edid[D+1] = (clk10k>>8)&0xFF;
    edid[D+2] =  w &0xFF;
    edid[D+3] = (hTotal-w)&0xFF;
    edid[D+4] = ((w>>8)&0xF)<<4 | (((hTotal-w)>>8)&0xF);
    edid[D+5] =  h &0xFF;
    edid[D+6] = (vTotal-h)&0xFF;
    edid[D+7] = ((h>>8)&0xF)<<4 | (((vTotal-h)>>8)&0xF);
    edid[D+8] =  hFront;
    edid[D+9] =  hSync;
    edid[D+10]= ((hSync>>8)&0x3)<<6 | ((hFront>>8)&0x3)<<4;
    edid[D+11]=  vFront;
    edid[D+12]=  vSync;
    edid[D+13]= ((vSync>>4)&0xF)<<4 | ((vFront>>4)&0xF);
    edid[D+17]= 0x1E;
    let sum=0; for(let i=0;i<127;i++) sum+=edid[i];
    edid[127] = (256 - (sum%256))%256;

    const binURL = URL.createObjectURL(new Blob([edid],{type:'application/octet-stream'}));
    const binLink = document.getElementById('edid-download');
    binLink.href = binURL;
    binLink.download = `EDID_${w}x${h}_${r.toFixed(2)}.bin`;
    binLink.style.display = 'block';

    // --- JPEG export ---
    html2canvas(document.getElementById('edid-results')).then(canvas=>{
      const imgData = canvas.toDataURL('image/jpeg',0.9);
      const imgLink = document.getElementById('edid-download-img');
      imgLink.href = imgData;
      imgLink.style.display = 'block';
    });
  }

  document.getElementById('edid-gen-btn').addEventListener('click', generate);
})();
