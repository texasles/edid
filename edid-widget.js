// edid-widget.js
(function() {
  const c = document.getElementById('edid-calculator') || document.body;
  c.style.minHeight = '600px';

  let hcReady = false;
  const loader = document.createElement('script');
  loader.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  loader.onload = () => { hcReady = true; };
  document.head.appendChild(loader);

  document.getElementById('edid-gen-btn').addEventListener('click', () => {
    const w  = +document.getElementById('edid-width').value;
    const h  = +document.getElementById('edid-height').value;
    const r  = +document.getElementById('edid-refresh').value;
    const rb = document.getElementById('edid-rb').checked;

    const hFront = rb ? 48 : Math.floor((w*0.2)/3);
    const hSync  = rb ? 32 : 44;
    const hBack  = rb ? 80 : Math.floor(w*0.2) - hFront - hSync;
    const hTotal = w + hFront + hSync + hBack;
    const vFront = 3, vSync = 5, vBack = 36;
    const vTotal = h + vFront + vSync + vBack;

    const pclk = (hTotal * vTotal * r)/1e6;
    const dr   = (pclk * 24)/1000;

    // Estimate polarity: based on blanking ratio (CVT style)
    const hPol = rb ? '+' : '-';
    const vPol = rb ? '+' : '-';

    let sig = pclk < 165 ? 'Single Link'
            : pclk < 330 ? 'Dual Link'
            :               '4K';

    document.getElementById('edid-hTotal').textContent = hTotal;
    document.getElementById('edid-hFront').textContent = hFront;
    document.getElementById('edid-hActive').textContent = w;
    document.getElementById('edid-hSync').textContent = hSync;
    document.getElementById('edid-hPol').textContent = hPol;
    document.getElementById('edid-vTotal').textContent = vTotal;
    document.getElementById('edid-vFront').textContent = vFront;
    document.getElementById('edid-vActive').textContent = h;
    document.getElementById('edid-vSync').textContent = vSync;
    document.getElementById('edid-vPol').textContent = vPol;
    document.getElementById('edid-pclk').textContent = pclk.toFixed(2);
    document.getElementById('edid-dr').textContent = dr.toFixed(2);
    document.getElementById('edid-signalType').textContent = sig;
    document.getElementById('edid-results').style.display = 'block';

    const warning = document.getElementById('edid-warning');
    warning.style.display = dr > 25.92 ? 'block' : 'none';

    const edid = new Uint8Array(128).fill(0);
    edid.set([0,255,255,255,255,255,255,0],0);
    edid.set([0x4C,0x2D],8);
    edid[16]=1; edid[17]=4;
    const D = 54, clk10 = Math.round(pclk*100);
    edid[D]=clk10&0xFF; edid[D+1]=(clk10>>8)&0xFF;
    edid[D+2]=w&0xFF; edid[D+3]=(hTotal-w)&0xFF;
    edid[D+4]=((w>>8)&0xF)<<4|(((hTotal-w)>>8)&0xF);
    edid[D+5]=h&0xFF; edid[D+6]=(vTotal-h)&0xFF;
    edid[D+7]=((h>>8)&0xF)<<4|(((vTotal-h)>>8)&0xF);
    edid[D+8]=hFront; edid[D+9]=hSync;
    edid[D+10]=((hSync>>8)&3)<<6|((hFront>>8)&3)<<4;
    edid[D+11]=vFront; edid[D+12]=vSync;
    edid[D+13]=((vSync>>4)&0xF)<<4|((vFront>>4)&0xF);
    edid[D+17]=0x1E;
    let s=0; for(let i=0;i<127;i++) s+=edid[i];
    edid[127]=(256-(s%256))%256;

    const binURL = URL.createObjectURL(new Blob([edid],{type:'application/octet-stream'}));
    const binLink = document.getElementById('edid-download');
    binLink.href = binURL;
    binLink.download = `EDID_${w}x${h}_${r.toFixed(2)}.bin`;
    binLink.style.display = 'block';

    if (!hcReady) return;
    html2canvas(document.getElementById('edid-results')).then(canvas=>{
      const imgLink = document.getElementById('edid-download-img');
      imgLink.href = canvas.toDataURL('image/jpeg',0.9);
      imgLink.download = `${w}x${h} edid settings.jpg`;
      imgLink.style.display = 'block';
    });
  });
})();
