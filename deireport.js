(function () {
  'use strict';

  /* ---------------------------------------------------------------
     EDIT ME: Source data for the representation chart, straight from
     the aggregated 2020 EEO-1 filings cited in the report.
     --------------------------------------------------------------- */
  var repData = [
    { level: 'Senior Management', black: 3.6, hispanic: 4.7, native: 0.3 },
    { level: 'Middle Management', black: 7.7, hispanic: 9.2, native: 0.4 },
    { level: 'Overall Workforce', black: 15.1, hispanic: 16.0, native: 0.6 },
  ];
  var GROUP_COLOR = { black: '#433787', hispanic: '#007010', native: '#6c7a79' };
  var GROUP_LABEL = { black: 'Black', hispanic: 'Hispanic', native: 'Native American' };

  /* ---------- Stat counters (Background section) ---------- */
  function formatStat(card, raw) {
    if (card.dataset.static) return card.dataset.static;
    var n = Math.round(raw);
    var s = card.dataset.comma ? n.toLocaleString('en-US') : String(n);
    return s + (card.dataset.suffix || '');
  }
  function animateStat(card) {
    if (card.dataset.static) return;
    var display = card.querySelector('.stat-display');
    var target = parseFloat(card.dataset.target || '0');
    var start = performance.now();
    var dur = 1200;
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      display.textContent = formatStat(card, target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function initStatCounters() {
    var cards = document.querySelectorAll('.stat-card');
    if (!cards.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    cards.forEach(function (card) { io.observe(card); });
  }

  /* ---------- Representation chart: grouped horizontal bars ----------
     Built with D3, matching the site's data-viz language: JetBrains
     Mono axis labels, hairline gridlines, bars that grow in on scroll
     rather than a static image. Native American bars are near-zero at
     this scale, so (as in the source report) that value is shown as a
     label rather than an invisible sliver of a bar. */
  function initRepresentationChart() {
    var svgEl = document.getElementById('rep-chart-svg');
    if (!svgEl || typeof d3 === 'undefined') return;

    var svg = d3.select(svgEl);
    var margin = { top: 10, right: 60, bottom: 30, left: 150 };
    var groupKeys = ['black', 'hispanic', 'native'];
    var barHeight = 14, barGap = 4, rowGap = 34;

    function layout() {
      svg.selectAll('*').remove();
      var rect = svgEl.getBoundingClientRect();
      var W = Math.max(320, rect.width);
      var rowBlock = groupKeys.length * (barHeight + barGap) + rowGap;
      var H = margin.top + margin.bottom + repData.length * rowBlock;
      svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

      var innerW = W - margin.left - margin.right;
      var x = d3.scaleLinear().domain([0, 20]).range([0, innerW]);
      var ticks = x.ticks(4);

      var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // gridlines
      g.append('g').selectAll('line')
        .data(ticks).join('line')
        .attr('x1', function (t) { return x(t); }).attr('x2', function (t) { return x(t); })
        .attr('y1', 0).attr('y2', H - margin.top - margin.bottom)
        .attr('stroke', 'rgba(13,50,38,0.25)').attr('stroke-width', 1);

      g.append('g').selectAll('text.tick-label')
        .data(ticks).join('text')
        .attr('class', 'tick-label')
        .attr('x', function (t) { return x(t); })
        .attr('y', H - margin.top - margin.bottom + 18)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'JetBrains Mono', monospace")
        .attr('font-size', 10)
        // .attr('fill', '#0d3226')
        .text(function (t) { return t + '%'; });

      repData.forEach(function (row, ri) {
        var rowY = ri * rowBlock;
        var rowG = g.append('g').attr('transform', 'translate(0,' + rowY + ')');

        rowG.append('text')
          .attr('x', -16).attr('y', (groupKeys.length * (barHeight + barGap)) / 2 + 3)
          .attr('text-anchor', 'end')
          .attr('font-family', "'Inter', sans-serif")
          .attr('font-weight', 500)
          .attr('font-size', 13)
          .attr('fill', '#0d3226')
          .text(row.level);

        groupKeys.forEach(function (key, gi) {
          var y = gi * (barHeight + barGap);
          var val = row[key];
          var isNative = key === 'native';
          var barW = isNative ? 0 : x(val);

          var bar = rowG.append('rect')
            .attr('x', 0).attr('y', y)
            .attr('height', barHeight)
            .attr('rx', 3)
            .attr('fill', GROUP_COLOR[key])
            .attr('width', 0);

          bar.transition().delay(ri * 90 + gi * 60).duration(700)
            .ease(d3.easeCubicOut)
            .attr('width', Math.max(barW, isNative ? 0 : 2));

          var label = rowG.append('text')
            .attr('x', isNative ? 6 : barW + 8)
            .attr('y', y + barHeight - 3)
            .attr('font-family', "'JetBrains Mono', monospace")
            .attr('font-size', 11)
            .attr('fill', '#0d3226')
            .attr('opacity', 0)
            .text(val + '%');

          label.transition().delay(ri * 90 + gi * 60 + 300).duration(400)
            .attr('opacity', 1);
        });
      });
    }

    layout();
    window.addEventListener('resize', function () {
      clearTimeout(svgEl._resizeT);
      svgEl._resizeT = setTimeout(layout, 150);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStatCounters();
    initRepresentationChart();
  });
})();
