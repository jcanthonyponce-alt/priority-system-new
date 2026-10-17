export default function Donut({ high, medium, low, label = "To do" }) {
  const total = high + medium + low;
  const r = 52;
  const c = 2 * Math.PI * r;
  const parts = [
    { name: "high", value: high, color: "var(--high-main)" },
    { name: "medium", value: medium, color: "var(--med-main)" },
    { name: "low", value: low, color: "var(--low-main)" },
  ];
  let offset = 0;

  return (
    <svg viewBox="0 0 140 140" className="donut">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="18" />
      {total > 0 &&
        parts
          .filter((p) => p.value > 0)
          .map((p) => {
            const len = (p.value / total) * c;
            const circle = (
              <circle
                key={p.name}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth="18"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += len;
            return circle;
          })}
      <text x="70" y="70" textAnchor="middle" className="donut-num">
        {total}
      </text>
      <text x="70" y="90" textAnchor="middle" className="donut-label">
        {label}
      </text>
    </svg>
  );
}