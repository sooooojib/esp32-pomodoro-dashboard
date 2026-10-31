---
name: ai-productivity-analytics
description: >-
  Implement intelligent data analysis algorithms, client-side predictive forecasting, moving average
  trend detection, anomaly and slump identification, and automated AI tactical debrief generators.
  Use when adding smart insights, J.A.R.V.I.S. coaching, burnout warnings, or predictive telemetry to productivity charts.
---

# AI Productivity Analytics & Heuristic Intelligence

This skill provides mathematical formulas, algorithmic pipelines, and prompt structures for building automated AI analysis, smart anomaly detection, predictive forecasting, and tactical debrief generation into productivity dashboards.

## 1. Algorithmic Predictive Forecasting

### Day-of-Week Weighted Bayesian Prediction
Human productivity follows cyclical day-of-week routines. To predict tomorrow's expected focus volume:
1. Filter historical sessions matching target day-of-week ($D_{\text{target}}$) over the past $N$ weeks (typically 4–8 weeks).
2. Apply exponential recency weighting ($w_i = e^{-\lambda \cdot i}$) so recent weeks impact prediction more than older weeks.
3. Compute expected target range $[\mu - \sigma, \mu + \sigma]$:

```javascript
function predictNextDayVolume(workLogs, targetDayOfWeek) {
    const matchingDays = []; // array of total minutes for that day of week
    // Filter and compute daily sums
    // ...
    if (matchingDays.length === 0) return { predicted: 50, min: 25, max: 75, confidence: "LOW" };

    const weights = matchingDays.map((_, i) => Math.pow(0.85, matchingDays.length - 1 - i));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedSum = matchingDays.reduce((acc, val, i) => acc + val * weights[i], 0);
    const mean = Math.round(weightedSum / totalWeight);

    const variance = matchingDays.reduce((acc, val, i) => acc + weights[i] * Math.pow(val - mean, 2), 0) / totalWeight;
    const stdDev = Math.round(Math.sqrt(variance));

    return {
        predicted: mean,
        min: Math.max(0, mean - stdDev),
        max: mean + stdDev,
        confidence: matchingDays.length >= 4 ? "HIGH" : "MODERATE"
    };
}
```

---

## 2. Anomaly Detection (Combat Surges vs. Fatigue Slumps)

Detect when a day's output deviates significantly from baseline using standard score ($Z$-score):
$$Z = \frac{X - \mu}{\sigma}$$

* If $Z \ge +1.8$: Flag as **`[TACTICAL SURGE: PEAK COMBAT OUTPUT]`** (Crimson/Gold Starburst).
* If $Z \le -1.5$: Flag as **`[FATIGUE SLUMP: DISRUPTION DETECTED]`** (Cyan/Amber Alert).

---

## 3. Burnout Risk Index (Arc Reactor Overclock Monitor)

Compute a real-time **Burnout Risk Score** $\beta \in [0, 100]$ based on three indicators:
1. **Work-to-Rest Ratio ($R_{\text{wr}}$):** Ideal is $4:1$ (e.g. 100 mins work to 25 mins break). If $> 8:1$, score increases.
2. **Consecutive Days Without Rest ($D_{\text{consec}}$):** Working $> 6$ days without a zero or low-intensity recovery day.
3. **Night-Owl Strain ($P_{\text{night}}$):** Proportion of sessions logged between 00:00 and 05:00.

$$\beta = \min\left(100, \left(R_{\text{wr}} \times 20\right) + \left(D_{\text{consec}} \times 5\right) + \left(P_{\text{night}} \times 30\right)\right)$$

* $\beta < 40$: **Optimal Arc Reactor Stability** (Green).
* $40 \le \beta < 75$: **High Combat Load** (Amber).
* $\beta \ge 75$: **CRITICAL OVERCLOCK WARNING** (Flashing Crimson). Suggest mandatory 30-minute Shawarma Protocol break!

---

## 4. J.A.R.V.I.S. Tactical Debrief Generator Template

Client-side rule-based intelligence debriefing generates rich, narrative Marvel/S.H.I.E.L.D. commentary:

```javascript
function generateJarvisDebrief(metrics) {
    const { totalHours, streak, peakWindow, topHero, burnoutScore } = metrics;
    
    let toneStatus = "ALL SYSTEMS NOMINAL.";
    if (burnoutScore >= 75) {
        toneStatus = "CAUTION: SUIT SYSTEMS OVERHEATING. AUXILIARY POWER DEPLETED.";
    } else if (totalHours > 20) {
        toneStatus = "OPERATIONAL VELOCITY EXCEEDING AVENGERS BENCHMARK.";
    }

    return {
        headline: `TACTICAL DEBRIEF // LEVEL CLEARANCE SECURED`,
        status: toneStatus,
        points: [
            `Total combat displacement clocked at ${totalHours} hours with an active ${streak}-day frontline streak.`,
            `Prime neural throughput concentrated within the ${peakWindow} tactical window.`,
            `Primary tactical companion: ${topHero || 'Tony Stark'}. Suit efficiency rated at ${Math.round(100 - burnoutScore)}%.`
        ],
        actionDirective: burnoutScore >= 60 
            ? "Engage mandatory 15-minute Shawarma recharge before deploying next wave."
            : "Flight path clear. Engage Mission Alpha when ready."
    };
}
```

