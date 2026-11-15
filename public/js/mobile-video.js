(function () {
  var mq = window.matchMedia('(max-width: 900px), (pointer: coarse)');
  if (!mq.matches) return;
  var N = 180, DUR = 20.02;
  var stage = document.getElementById('stage');
  var video = document.getElementById('cam');
  if (!stage || !video) return;
  video.style.display = 'none';
  var c = document.createElement('canvas');
  c.id = 'cam-canvas';
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.2s ease';
  stage.insertBefore(c, stage.firstChild);
  var ctx = c.getContext('2d');
  var imgs = [], loaded = 0, last = -1, shown = false, cur = 0;
  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(window.innerWidth * d);
    c.height = Math.round(window.innerHeight * d);
    last = -1;
  }
  function draw(t) {
    var idx = Math.max(0, Math.min(N - 1, Math.round(t * (N - 1))));
    if (idx === last) return;
    var im = imgs[idx];
    if (!im || !im.complete || !im.naturalWidth) return;
    last = idx;
    var W = c.width, H = c.height;
    var k = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    var dw = im.naturalWidth * k, dh = im.naturalHeight * k;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }
  for (var i = 0; i < N; i++) {
    var im = new Image();
    im.decoding = 'async';
    im.onload = (function (k) {
      return function () {
        loaded++;
        if (k === 0) draw(0);
        if (!shown && loaded >= 3) { shown = true; c.style.opacity = '1'; }
      };
    })(i);
    im.src = '/frames/bg-' + String(i + 1).padStart(3, '0') + '.webp';
    imgs.push(im);
  }
  setTimeout(function () { if (!shown) { shown = true; c.style.opacity = '1'; } }, 2500);
  size();
  window.addEventListener('resize', size);
  function prog() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(1, Math.max(0, window.scrollY / max));
  }
  function tick() {
    cur += (prog() - cur) * 0.12;
    draw(cur);
    requestAnimationFrame(tick);
  }
  tick();
})();
