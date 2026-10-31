---
name: tactical-diagrams
description: >-
  Design and construct advanced data diagrams, polygonal radar/spider charts, 360-degree circadian
  clock dials, Sankey flow pipelines, state machine transition graphs, and telemetry oscilloscopes.
  Use when building complex diagrams, attribute power grids, circadian clocks, or flow funnels.
---

# Tactical Diagrams & Datagrams

This skill provides geometric mathematics, SVG path generation algorithms, and component patterns for constructing complex data diagrams such as radar polygons, circular clocks, drop-off funnels, and hardware signal waveforms.

## 1. Polar-to-Cartesian Geometry for Radar & Dial Charts

All circular and radar diagrams rely on translating polar coordinates (angle $\theta$, radius $r$) into Cartesian coordinates $(x, y)$ centered at $(c_x, c_y)$:

$$x = c_x + r \cdot \cos(\theta)$$
$$y = c_y + r \cdot \sin(\theta)$$

In computer graphics, screen $y$ increases downwards. For a clock where $0^\circ$ is top (12 o'clock) rotating clockwise:
$$\theta_{\text{radians}} = (\text{degrees} - 90) \times \frac{\pi}{180}$$

```javascript
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}
```

---

## 2. Spider / Radar Pentagon (Combat Attributes Power Grid)

### SVG Polygon Generation
For an $N$-attribute spider chart (e.g., $N=5$: Consistency, Endurance, Velocity, Discipline, Rhythm):
1. Distribute axes evenly: $\Delta\theta = \frac{360^\circ}{N}$.
2. Normalize each attribute score $S_i \in [0, 100]$ to radius $r_i = R_{\max} \times \frac{S_i}{100}$.
3. Generate point list and construct `<polygon points="..." />`.

```javascript
function generateRadarPolygon(centerX, centerY, maxRadius, scores) {
    const numPoints = scores.length;
    const angleStep = 360 / numPoints;
    
    const points = scores.map((score, i) => {
        const radius = (Math.max(5, Math.min(100, score)) / 100) * maxRadius;
        const pt = polarToCartesian(centerX, centerY, radius, i * angleStep);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');

    return `<polygon points="${points}" fill="rgba(250, 204, 21, 0.45)" stroke="#000" stroke-width="3" stroke-linejoin="round"/>`;
}
```

### Spider Web Grid Rings
Draw concentric polygon rings at 25%, 50%, 75%, and 100% radius with subtle dashed strokes to provide scale reference for the viewer.

---

## 3. 360° Circadian Chrono-Radar (24-Hour Circular Clock)

### SVG Arc Path Syntax
To draw an arc sector representing a focus session spanning from start hour $H_{\text{start}}$ to end hour $H_{\text{end}}$ on a 24-hour wheel:
* $\theta_{\text{start}} = \frac{H_{\text{start}}}{24} \times 360^\circ$
* $\theta_{\text{end}} = \frac{H_{\text{end}}}{24} \times 360^\circ$

```javascript
function describeArcSector(x, y, innerRadius, outerRadius, startAngle, endAngle) {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, arcSweep, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, arcSweep, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");
}
```

---

## 4. Pipeline & Wave Drop-off Funnel Diagrams

Visualizing conversion/drop-off across sequential stages (e.g. Mission Alpha ➔ Beta ➔ Gamma ➔ Delta):
1. **Nodes:** Distinct Neobrutalist blocks for each mission milestone.
2. **Connecting Connectors:** Tapered trapezoid SVG paths connecting stage $i$ to stage $i+1$, with stroke width proportional to retention rate.
3. **Drop-off Callout:** Small red pill badge below stage showing attrition: `▼ -14% DROP-OFF`.

---

## 5. Hardware Signal Oscilloscope Waveforms

For physical device integration (ESP32 Web Serial / BLE signals):
1. Generate real-time sine/step wave paths:
```javascript
function generateWaveformPath(samples, width, height) {
    const step = width / (samples.length - 1);
    const midY = height / 2;
    return samples.map((val, i) => {
        const x = i * step;
        const y = midY - (val * (height * 0.4));
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
}
```
2. Overlay glowing neon filters using SVG `<feGaussianBlur>` or retro CRT scanlines.

