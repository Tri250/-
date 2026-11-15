// assets/charts.js — Android Battery Master v2.0.0-alpha.8 完成度报告图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var warn = style.getPropertyValue('--warn').trim() || '#b7791f';

  var FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';

  function baseAxis() {
    return {
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontFamily: FONT, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, opacity: 0.6 } }
    };
  }

  // --- Chart 1: 六大功能域完成度（横向条形） ---
  var el1 = document.getElementById('chart-domains');
  if (el1) {
    var c1 = echarts.init(el1, null, { renderer: 'svg' });
    var domains = ['遥测采集层', '核心指标（12 项）', '健康度引擎', '硬件信息解析', 'UI 四 Tab 与设计体系', 'Web 演示端', '工程质量与 CI/CD'];
    var vals = [100, 98, 100, 100, 100, 100, 100];
    c1.setOption({
      animation: false,
      grid: { left: 170, right: 70, top: 20, bottom: 30 },
      tooltip: {
        trigger: 'item', appendToBody: true,
        formatter: '{b}<br/>代码实现完成度：{c}%'
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
          return {
            value: v,
            itemStyle: { color: v >= 100 ? accent : accent2, borderRadius: [0, 6, 6, 0] }
          };
        }),
        barWidth: 18,
        label: {
          show: true, position: 'right',
          formatter: '{c}%',
          color: ink, fontFamily: 'JetBrainsMono, monospace', fontWeight: 700, fontSize: 12
        }
      }]
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  // --- Chart 2: 12 项核心指标完成度（横向条形） ---
  var el2 = document.getElementById('chart-metrics');
  if (el2) {
    var c2 = echarts.init(el2, null, { renderer: 'svg' });
    var metrics = [
      '01 电池健康度', '02 剩余电量', '03 电池当前容量', '04 电池设计容量',
      '05 电量百分比', '06 电池状态', '07 电池温度', '08 电池健康状况',
      '09 电芯电压', '10 充放电循环', '11 瞬时电流', '12 完全充满时的容量'
    ];
    var mvals = [95, 100, 100, 100, 100, 100, 100, 100, 90, 100, 90, 100];
    c2.setOption({
      animation: false,
      grid: { left: 168, right: 70, top: 16, bottom: 34 },
      tooltip: {
        trigger: 'item', appendToBody: true,
        formatter: function (p) {
          var name = metrics[p.dataIndex];
          var note = mvals[p.dataIndex] === 100 ? '已完成' : '待真机回归';
          return name + '<br/>完成度：' + p.value + '%（' + note + '）';
        }
      },
      xAxis: Object.assign(baseAxis(), { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: muted, fontSize: 12 } }),
      yAxis: Object.assign(baseAxis(), {
        type: 'category', data: metrics,
        axisLabel: { color: ink, fontSize: 12, fontFamily: FONT },
        splitLine: { show: false }
      }),
      series: [{
        type: 'bar',
        data: mvals.map(function (v) {
          var col = v >= 100 ? accent : warn;
          return { value: v, itemStyle: { color: col, borderRadius: [0, 6, 6, 0] } };
        }),
        barWidth: 15,
        label: {
          show: true, position: 'right',
          formatter: '{c}%',
          color: ink, fontFamily: 'JetBrainsMono, monospace', fontWeight: 700, fontSize: 11.5
        },
        markLine: {
          symbol: 'none', silent: true,
          lineStyle: { color: warn, type: 'dashed', width: 1 },
          label: { formatter: '待真机回归线 90%', color: warn, fontSize: 11, fontFamily: FONT },
          data: [{ xAxis: 90 }]
        }
      }]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }

  // --- Chart 3: 六维能力雷达 ---
  var el3 = document.getElementById('chart-radar');
  if (el3) {
    var c3 = echarts.init(el3, null, { renderer: 'svg' });
    c3.setOption({
      animation: false,
      tooltip: { appendToBody: true },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 12, fontFamily: FONT }, itemWidth: 14 },
      radar: {
        indicator: [
          { name: '功能实现', max: 100 },
          { name: '数据真实性口径', max: 100 },
          { name: '测试覆盖', max: 100 },
          { name: '真机验证置信度', max: 100 },
          { name: '性能与兼容性', max: 100 },
          { name: '版本成熟度', max: 100 }
        ],
        radius: '62%',
        axisName: { color: ink, fontSize: 12, fontFamily: FONT },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { areaStyle: { color: ['transparent', 'rgba(14,159,110,0.03)'] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        data: [
          {
            name: 'v2.0.0-alpha.8',
            value: [100, 100, 100, 85, 95, 70],
            lineStyle: { color: accent, width: 2.5 },
            itemStyle: { color: accent },
            areaStyle: { color: 'rgba(14,159,110,0.16)' },
            label: { show: true, color: ink, fontFamily: 'JetBrainsMono, monospace', fontSize: 11, fontWeight: 700 }
          }
        ]
      }]
    });
    window.addEventListener('resize', function () { c3.resize(); });
  }

  // --- Chart 4: 回归测试用例数演进（折线） ---
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
        name: '回归用例数',
        type: 'line',
        data: [106, 109, 119, 132, 141, 151, 158],
        lineStyle: { color: accent2, width: 2.5 },
        itemStyle: { color: accent2 },
        symbolSize: 8,
        areaStyle: { color: 'rgba(14,165,233,0.10)' },
        label: {
          show: true, position: 'top',
          color: ink, fontFamily: 'JetBrainsMono, monospace', fontSize: 11, fontWeight: 700
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
