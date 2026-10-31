---
name: interactive-charts
description: >-
  Design and implement high-performance, interactive bar charts, line charts, dual-axis graphs,
  cumulative area curves, and sparklines using pure SVG, HTML5 Canvas, and Neobrutalist design systems.
  Use whenever creating, improving, or customizing bar charts, line graphs, trendlines, or volume drilldowns.
---

# Interactive Charts & Telemetry Visualizations

This skill provides production-grade architectural patterns, mathematical formulas, and UI blueprints for building custom SVG-based and Canvas-based charts with interactive hover inspection, dual-axis comparisons, and neobrutalist comic styling.

## 1. Mathematical Foundations for Custom SVG Charts

When building charts from scratch without bloated third-party libraries, always normalize data into coordinate space.

### Linear Normalization
To map any data value $V \in [0, V_{\max}]$ into an SVG container of height $H$:
$$y_{\text{svg}} = H - \left(\frac{V}{V_{\text{ceiling}}} \times H\right)$$
* Always compute a clean, human-readable $V_{\text{ceiling}}$ (e.g. rounded up to the nearest multiple of 25, 50, or 60).
* Ensure zero values retain a minimum bar height (e.g. 2–4px) or clear base dot so users know the column is active.

### Dynamic Ceiling Calculation
```javascript
function calculateAxisCeiling(maxValue, step = 25, minCeiling = 100) {
    if (maxValue <= 0) return minCeiling;
    return Math.max(minCeiling, Math.ceil(maxValue / step) * step);
}
```

---

## 2. Bar Chart Architecture & Inspection Patterns

### Responsive SVG Container Pattern
```html
<div class="relative w-full overflow-hidden bg-[#F7F5EE] border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000]">
  <!-- Dynamic Inspection Bar / HUD Callout -->
  <div id="chart-inspect-callout" class="p-2.5 bg-amber-50 border-2 border-black rounded-lg font-mono text-xs font-bold text-black flex items-center justify-between mb-3">
    <span id="chart-inspect-text">HOVER BARS TO AUDIT TELEMETRY</span>
    <span id="chart-inspect-badge" class="bg-black text-[#FACC15] px-2 py-0.5 rounded border border-black text-[10px]">STANDBY</span>
  </div>

  <!-- Chart Track with Y-Scale and Flex Bars -->
  <div class="flex items-stretch gap-2.5 w-full">
    <!-- Y-Axis Labels -->
    <div class="flex flex-col justify-between items-end pb-6 text-[9px] font-mono font-bold text-zinc-500 w-8 shrink-0 select-none">
      <span id="scale-top">100m</span>
      <span id="scale-mid">50m</span>
      <span id="scale-base">0m</span>
    </div>
    <!-- Bars Container -->
    <div id="bars-track" class="flex-1 flex items-end justify-between gap-1.5 h-36 pt-3 px-1 relative z-10">
      <!-- Injected Bars -->
    </div>
  </div>
</div>
```

### Staggered GSAP Bar Entrance
```javascript
if (typeof gsap !== 'undefined') {
    gsap.fromTo(".chart-bar-fill", 
        { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.5, stagger: 0.04, ease: "power2.out" }
    );
}
```

---

## 3. High-Fidelity SVG Line Chart Engineering

### Smooth Bezier Spline Generation
To avoid harsh polygonal corners, convert discrete points $(x_i, y_i)$ into a smooth Catmull-Rom or cubic Bezier spline path:

```javascript
function generateSmoothPath(points) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
}
```

### Area Fill Gradient
Always close the path back to the baseline $(X_{\max}, H) \to (X_0, H) \to Z$ to apply a neobrutalist translucent tint or gradient fill underneath the curve:
```javascript
const areaPath = `${smoothStrokePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
```

---

## 4. Dual-Track Comparison (This Week vs. Last Week)

1. **Current Period Line:** Solid 3px high-contrast stroke (`#FACC15` or `#E11D48`) with black border and circular data node points.
2. **Benchmark / Ghost Line:** 2px dashed stroke (`#94A3B8`, `stroke-dasharray="4 4"`).
3. **Delta Calculation:**
   $$\Delta\% = \frac{\text{Current} - \text{Benchmark}}{\text{Benchmark}} \times 100$$
4. Display a dynamic status badge:
   * Positive: `▲ +24% AHEAD OF LAST WEEK'S CADENCE` (Emerald)
   * Negative: `▼ -12% DEFICIT DETECTED` (Rose)

---

## 5. Neobrutalist Chart Styling Directives

- **Borders:** All card containers must use `border-3 border-black` or `border-2 border-black`.
- **Hard Shadows:** Use offset solid drop shadows `shadow-[3px_3px_0px_#000]` or `shadow-[4px_4px_0px_#000]`.
- **Typography:** Headings in bold comic typography (`font-comic font-black tracking-wide uppercase`); numbers, dates, and scales in monospace (`font-mono font-bold`).
- **Interactive Tooltips:** Instant hover triggers on mouseenter/mouseleave with clear touch event support.

