(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- count-up numbers ----
  function fmt(n, dec) { return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  function countUp(el) {
    var end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    if (reduce) { el.textContent = pre + fmt(end, dec) + suf; return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(end * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---- donuts ----
  function fillDonut(svg) {
    var c = svg.querySelector('.val'); if (!c) return;
    var r = +c.getAttribute('r'), len = 2 * Math.PI * r, v = parseFloat(svg.dataset.value) / 100;
    c.style.strokeDasharray = (len * v) + ' ' + len;
  }

  function activate(el) {
    el.classList.add('in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    if (el.matches('[data-count]')) countUp(el);
    el.querySelectorAll('svg.donut').forEach(fillDonut);
  }

  // measure path lengths for line drawing
  document.querySelectorAll('.draw').forEach(function (p) {
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (e) {}
  });

  var targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(activate);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  // ---- flip cards ----
  document.addEventListener('click', function (e) {
    var f = e.target.closest('.flip'); if (!f) return;
    f.classList.toggle('on');
    f.setAttribute('aria-pressed', f.classList.contains('on'));
  });
  document.querySelectorAll('[data-flip-all]').forEach(function (b) {
    b.addEventListener('click', function () {
      var scope = document.getElementById(b.dataset.flipAll);
      var cards = scope.querySelectorAll('.flip');
      var anyOff = Array.prototype.some.call(cards, function (c) { return !c.classList.contains('on'); });
      cards.forEach(function (c) { c.classList.toggle('on', anyOff); c.setAttribute('aria-pressed', anyOff); });
      b.textContent = anyOff ? b.dataset.labelOff : b.dataset.labelOn;
    });
  });

  // ---- tabs ----
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var btns = box.querySelectorAll('[role="tab"]'), panels = box.querySelectorAll('[role="tabpanel"]');
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x, j) { x.setAttribute('aria-selected', j === i); x.tabIndex = j === i ? 0 : -1; });
        panels.forEach(function (p, j) { p.hidden = j !== i; });
      });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { var n = (i + k + btns.length) % btns.length; btns[n].click(); btns[n].focus(); }
      });
    });
  });

  // ---- lightbox ----
  var lb = document.createElement('div');
  lb.className = 'lightbox'; lb.hidden = true;
  lb.innerHTML = '<span class="cap"></span><button class="close" type="button">Close</button><img alt="">';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.cap');
  function open(src, cap) {
    lbImg.src = src; lbImg.alt = cap || ''; lbCap.textContent = cap || '';
    lb.hidden = false; document.body.style.overflow = 'hidden'; lb.scrollTop = 0; lb.querySelector('.close').focus();
  }
  function close() { lb.hidden = true; lbImg.removeAttribute('src'); document.body.style.overflow = ''; }
  lb.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  document.addEventListener('click', function (e) {
    var z = e.target.closest('[data-zoom]'); if (!z) return;
    var img = z.querySelector('img');
    open(z.dataset.zoom || (img && img.src), z.dataset.cap || (img && img.alt) || z.getAttribute('aria-label'));
  });

  // ---- copy email ----
  var cb = document.getElementById('copyBtn'), em = document.getElementById('email');
  if (cb && em) cb.addEventListener('click', function () {
    function done() { cb.textContent = 'Copied'; setTimeout(function () { cb.textContent = 'Copy email'; }, 1600); }
    function fallback() { var r = document.createRange(); r.selectNodeContents(em); var s = getSelection(); s.removeAllRanges(); s.addRange(r); cb.textContent = 'Selected'; }
    try { navigator.clipboard.writeText(em.textContent).then(done, fallback); } catch (e) { fallback(); }
  });
})();
