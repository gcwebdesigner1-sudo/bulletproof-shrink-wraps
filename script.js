(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  var dock = document.getElementById('dock');
  var areaPhoto = document.querySelector('.area-photo');
  var quote = document.getElementById('quote');
  var tabList = document.getElementById('tabs');
  var tabLinks = Array.prototype.slice.call(tabList.querySelectorAll('a'));
  var ticking = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ramp(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- process: the wrap goes on as you scroll ---------- */
  var track = document.querySelector('.process-track');
  var film = document.getElementById('film');
  var filmEdge = document.getElementById('film-edge');
  var wrinkle = document.getElementById('wrinkle-map');
  var heat = document.getElementById('heat');
  var finish = document.querySelector('.finish');
  var steps = document.querySelectorAll('.step');

  // outline of the film, stern low -> over the top -> bow -> back along the band
  var taut = [[140,244],[138,206],[172,176],[260,140],[350,118],[410,110],[480,116],[570,150],[650,188],[690,206],[676,228],[560,250],[400,260],[260,254]];
  var loose = [[122,330],[112,222],[160,150],[255,118],[350,92],[415,84],[490,96],[585,126],[680,160],[722,214],[716,312],[560,326],[400,332],[250,330]];

  function closedPath(pts) {
    var n = pts.length, d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }

  var lastStep = -1;
  function drawProcess(t) {
    var mix = ease(ramp(t, 0.48, 0.72));
    var pts = loose.map(function (p, i) { return [p[0] + (taut[i][0] - p[0]) * mix, p[1] + (taut[i][1] - p[1]) * mix]; });
    var d = closedPath(pts);
    var show = ramp(t, 0.22, 0.34);
    film.setAttribute('d', d);
    filmEdge.setAttribute('d', d);
    film.setAttribute('opacity', (show * 0.97).toFixed(3));
    filmEdge.setAttribute('opacity', (show * mix).toFixed(3));
    film.setAttribute('transform', 'translate(0 ' + ((1 - show) * -40).toFixed(1) + ')');
    wrinkle.setAttribute('scale', (2 + 16 * (1 - mix)).toFixed(1));

    // heat gun glow travels along the top while the film tightens
    var h = ramp(t, 0.46, 0.74);
    if (h > 0 && h < 1) {
      var f = 2 + h * 7, i = Math.floor(f), k = f - i;
      var a = pts[i], b = pts[i + 1];
      heat.setAttribute('cx', (a[0] + (b[0] - a[0]) * k).toFixed(1));
      heat.setAttribute('cy', (a[1] + (b[1] - a[1]) * k - 6).toFixed(1));
      heat.setAttribute('opacity', (Math.sin(h * Math.PI) * 0.75).toFixed(2));
    } else {
      heat.setAttribute('opacity', '0');
    }
    finish.setAttribute('opacity', ramp(t, 0.78, 0.9).toFixed(3));

    var s = t < 0.22 ? 0 : t < 0.46 ? 1 : t < 0.76 ? 2 : 3;
    if (s !== lastStep) {
      steps.forEach(function (el, j) { el.classList.toggle('is-on', j === s); });
      lastStep = s;
    }
  }

  function processProgress() {
    var r = track.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return clamp(-r.top / span, 0, 1);
  }

  /* ---------- scroll loop ---------- */
  function onScroll() {
    var y = window.scrollY;
    var h = window.innerHeight;
    if (!reduce) hero.style.setProperty('--p', clamp(y / h, 0, 1).toFixed(4));
    nav.classList.toggle('solid', y > h * 0.6);
    if (y < h * 0.4) {
      tabLinks.forEach(function (a) { a.classList.remove('active'); });
      if (tabList.scrollLeft > 0) tabList.scrollLeft = 0;
    }
    var nearQuote = quote.getBoundingClientRect().top < h * 0.8;
    dock.classList.toggle('show', y > h * 0.75 && !nearQuote);
    if (!reduce && areaPhoto) {
      var r = areaPhoto.getBoundingClientRect();
      areaPhoto.style.setProperty('--mp', (clamp((h - r.top) / (h + r.height), 0, 1) * 2 - 1).toFixed(3));
    }
    if (!reduce) drawProcess(processProgress());
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- active tab ---------- */
  var sections = tabLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var tabIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      tabLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('active', on);
        if (on && window.innerWidth <= 1180) {
          tabList.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { if (s) tabIO.observe(s); });

  /* ---------- services: sticky photo follows the row in the middle of the screen ---------- */
  var stageImgs = document.querySelectorAll('.svc-stage img');
  var svcs = document.querySelectorAll('.svc');
  var svcIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var key = e.target.getAttribute('data-key');
      svcs.forEach(function (s) { s.classList.toggle('is-active', s === e.target); });
      stageImgs.forEach(function (img) { img.classList.toggle('on', img.getAttribute('data-key') === key); });
    });
  }, { rootMargin: '-48% 0px -48% 0px' });
  svcs.forEach(function (s) { svcIO.observe(s); });
  if (svcs[0]) svcs[0].classList.add('is-active');

  /* ---------- price estimate ---------- */
  var typeBtns = document.querySelectorAll('.calc-types button');
  var len = document.getElementById('len');
  var lenOut = document.getElementById('len-out');
  var price = document.getElementById('calc-price');
  var rate = 24;
  function updatePrice() {
    var ft = +len.value;
    lenOut.textContent = ft + ' ft';
    price.textContent = '$' + (ft * rate).toLocaleString('en-US');
  }
  typeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      rate = +b.getAttribute('data-rate');
      typeBtns.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      updatePrice();
    });
  });
  len.addEventListener('input', updatePrice);
  updatePrice();

  /* ---------- quote form: opens a text (phone) or email (computer) ---------- */
  var form = document.getElementById('quote-form');
  var err = document.getElementById('form-err');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (n) { return (form.elements[n].value || '').trim(); };
    if (!v('name') || !v('phone')) { err.hidden = false; (v('name') ? form.elements.phone : form.elements.name).focus(); return; }
    err.hidden = true;
    var lines = [
      'Hi Chris, I found you online and want a shrink wrap quote.',
      'Name: ' + v('name'),
      'Phone: ' + v('phone'),
      'Wrapping: ' + v('what') + (v('length') ? ', ' + v('length') + ' ft' : ''),
      'For: ' + v('for')
    ];
    if (v('details')) lines.push('Details: ' + v('details'));
    var body = lines.join('\n');
    var touch = window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (touch) {
      window.location.href = 'sms:+12084469327?&body=' + encodeURIComponent(body);
    } else {
      window.location.href = 'mailto:bulletproofshrinkwraps@gmail.com?subject=' + encodeURIComponent('Shrink wrap quote request') + '&body=' + encodeURIComponent(body);
    }
  });

  /* ---------- light reveal on a few blocks only ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var rvEls = document.querySelectorAll('.services-intro, .quotes blockquote, .rating, .area-copy, .quote-call, .quote-form, .calc');
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    rvEls.forEach(function (el) { el.classList.add('rv'); rvIO.observe(el); });
  }

  if (reduce) drawProcess(1);
  onScroll();
})();
