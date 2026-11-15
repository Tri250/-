// assets/charts.js — Android Battery Master v2.0.0-alpha.8 · GA 口径完成度报告
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var warn = style.getPropertyValue('--warn').trim() || '#b7791f';
  var danger = style.getPropertyValue('--danger').trim() || '#c2410c';

  var FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
  var MONO = 'JetBrainsMono, monospace';

  function baseAxis() {
    return {
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontFamily: FONT, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, opacity: 0.6 } }
    };
  }

  // --- 图 1：七大功能域「代码实现」完成度（参考维度） ---
  var el1 = document.getElementById('chart-domains');
  if (el1) {
    var c1 = echarts.init(el1, null, { renderer: 'svg' });
    var domains = ['遥测采集层', '核心指标（12 项）', '健康度引擎', '硬件信息解析', 'UI 四 Tab 与设计体系', 'Web 演示端', '工程质量与 CI/CD'];
    var vals = [100, 98, 100, 100, 100, 100, 100];
    c1.setOption({
      animation: false,
      grid: { left: 178, right: 70, top: 20, bottom: 30 },
      tooltip: {
        trigger: 'item', appendToBody: true,
        formatter: '{b}<br/>代码实现完成度：{c}%<br/><span style="color:#888">注：非 GA 交付口径</span>'
      },
      xAxis: Object.assign(baseAxis(), { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: muted, fontSize: 12 } }),
      yAxis: Object.assign(baseAxis(), {
        type: 'category', data: domains,
        axisLabel: { color: ink, fontSize: 12.5, fontFamily: FONT },
        splitLine: { show: false }
      }),
      series: [{
        type: 'bar',
        data: vals.map(function (v) {
          return { value: v, itemStyle: { color: v >= 100 ? accent : accent2, borderRadius: [0, 6, 6, 0], opacity: 0.55 } };
        }),
        barWidth: 18,
        label: {
          show: true, position: 'right', formatter: '{c}%',
          color: muted, fontFamily: MONO, fontWeight: 700, fontSize: 12
        }
      }]
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  // --- 图 2：GA 六大交付维度完成度（加权 49%） ---
  var elGa = document.getElementById('chart-ga');
  if (elGa) {
    var cGa = echarts.init(elGa, null, { renderer: 'svg' });
    var dims = ['功能完整性', '真机兼容性验证', '版本成熟度', '发布合规', '质量保障', '文档与用户支持'];
    var weights = [25, 20, 15, 15, 15, 10];
    var scores = [80, 30, 30, 45, 55, 40];
    cGa.setOption({
      animation: false,
      grid: { left: 150, right: 190, top: 20, bottom: 34 },
      tooltip: {
        trigger: 'item', appendToBody: true,
        formatter: function (p) {
          var i = p.dataIndex;
          return dims[i] + '<br/>GA 完成度：<b>' + scores[i] + '%</b><br/>权重：' + weights[i] + '%<br/>加权贡献：' + (scores[i] * weights[i] / 100).toFixed(1) + ' 分';
        }
      },
      xAxis: Object.assign(baseAxis(), { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: muted, fontSize: 12 } }),
      yAxis: Object.assign(baseAxis(), {
        type: 'category', data: dims,
        axisLabel: { color: ink, fontSize: 12.5, fontFamily: FONT },
        splitLine: { show: false }
      }),
      series: [{
        type: 'bar',
        data: scores.map(function (v, i) {
          var col = v >= 70 ? accent : (v >= 45 ? warn : danger);
          return {
            value: v,
            itemStyle: { color: col, borderRadius: [0, 6, 6, 0] },
            label: {
              show: true, position: 'right',
              formatter: '{c}%  · 权重 ' + weights[i] + '%',
              color: muted, fontFamily: FONT, fontSize: 11.5
            }
          };
        }),
        barWidth: 20,
        markLine: {
          symbol: 'none', silent: true,
          lineStyle: { color: danger, type: 'dashed', width: 1.2 },
          label: { formatter: '加权综合 49%', color: danger, fontSize: 11, fontFamily: FONT },
          data: [{ xAxis: 49.5 }]
        }
      }]
    });
    window.addEventListener('resize', function () { cGa.resize(); });
  }

  // --- 图 3：12 项核心指标 · 代码实现 vs GA 完成度 ---
  var el2 = document.getElementById('chart-metrics');
  if (el2) {
    var c2 = echarts.init(el2, null, { renderer: 'svg' });
    var metrics = [
      '01 电池健康度', '02 剩余电量', '03 电池当前容量', '04 电池设计容量',
      '05 电量百分比', '06 电池状态', '07 电池温度', '08 电池健康状况',
      '09 电芯电压', '10 充放电循环', '11 瞬时电流', '12 完全充满时的容量'
    ];
    var codeVals = [95, 100, 100, 100, 100, 100, 100, 100, 90, 100, 90, 100];
    var gaVals = [70, 85, 70, 85, 90, 90, 90, 90, 55, 80, 55, 80];
    c2.setOption({
      animation: false,
      legend: {
        top: 0, right: 0, itemWidth: 14,
        textStyle: { color: muted, fontSize: 12, fontFamily: FONT },
        data: ['代码实现', 'GA 完成度']
      },
      grid: { left: 168, right: 66, top: 34, bottom: 34 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true },
      xAxis: Object.assign(baseAxis(), { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: muted, fontSize: 12 } }),
      yAxis: Object.assign(baseAxis(), {
        type: 'category', data: metrics,
        axisLabel: { color: ink, fontSize: 12, fontFamily: FONT },
        splitLine: { show: false }
      }),
      series: [
        {
          name: '代码实现', type: 'bar', barWidth: 9, barGap: '20%',
          data: codeVals,
          itemStyle: { color: accent2 + '55', borderRadius: [0, 3, 3, 0] },
          label: { show: false }
        },
        {
          name: 'GA 完成度', type: 'bar', barWidth: 9,
          data: gaVals.map(function (v) {
            var col = v >= 85 ? accent : (v >= 70 ? warn : danger);
            return { value: v, itemStyle: { color: col, borderRadius: [0, 3, 3, 0] } };
          }),
          label: {
            show: true, position: 'right', formatter: '{c}%',
            color: ink, fontFamily: MONO, fontWeight: 700, fontSize: 11
          }
        }
      ]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }

  // --- 图 4：GA 六维能力雷达 ---
  var el3 = document.getElementById('chart-radar');
  if (el3) {
    var c3 = echarts.init(el3, null, { renderer: 'svg' });
    c3.setOption({
      animation: false,
      tooltip: { appendToBody: true },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 12, fontFamily: FONT }, itemWidth: 14 },
      radar: {
        indicator: [
          { name: '功能完整性', max: 100 },
          { name: '真机兼容性', max: 100 },
          { name: '版本成熟度', max: 100 },
          { name: '发布合规', max: 100 },
          { name: '质量保障', max: 100 },
          { name: '文档支持', max: 100 }
        ],
        radius: '62%',
        axisName: { color: ink, fontSize: 12, fontFamily: FONT },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: ['transparent', 'rgba(14,159,110,0.03)'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [{
          name: 'GA 六维（综合 49%）',
          value: [80, 30, 30, 45, 55, 40],
          lineStyle: { color: danger, width: 2.5 },
          itemStyle: { color: danger },
          areaStyle: { color: 'rgba(194,65,12,0.14)' },
          label: { show: true, color: ink, fontFamily: MONO, fontSize: 11, fontWeight: 700 }
        }]
      }]
    });
    window.addEventListener('resize', function () { c3.resize(); });
  }

  // --- 图 5：回归测试用例数演进 ---
  var el4 = document.getElementById('chart-tests');
  if (el4) {
    var c4 = echarts.init(el4, null, { renderer: 'svg' });
    c4.setOption({
      animation: false,
      grid: { left: 55, right: 30, top: 40, bottom: 60 },
      tooltip: { trigger: 'axis', appendToBody: true },
      xAxis: Object.assign(baseAxis(), {
        type: 'category',
        data: ['alpha.2', 'alpha.3', 'alpha.4', 'alpha.5', 'alpha.6', 'alpha.7', 'alpha.8'],
        axisLabel: { color: muted, fontSize: 11.5, fontFamily: FONT, rotate: 30 },
        boundaryGap: false
      }),
      yAxis: Object.assign(baseAxis(), { type: 'value', min: 100, max: 165 }),
      series: [{
        name: '回归用例数（JVM/Robolectric）',
        type: 'line',
        data: [106, 109, 119, 132, 141, 151, 158],
        lineStyle: { color: accent2, width: 2.5 },
        itemStyle: { color: accent2 },
        symbolSize: 8,
        areaStyle: { color: 'rgba(14,165,233,0.10)' },
        label: {
          show: true, position: 'top',
          color: ink, fontFamily: MONO, fontSize: 11, fontWeight: 700
        }
      }]
    });
    window.addEventListener('resize', function () { c4.resize(); });
  }

  // --- Mermaid 初始化 ---
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      themeVariables: {
        fontFamily: FONT,
        primaryColor: bg2,
        primaryTextColor: ink,
        primaryBorderColor: accent,
        lineColor: muted,
        fontSize: '13px'
      },
      flowchart: { curve: 'basis' }
    });
  }
})();
