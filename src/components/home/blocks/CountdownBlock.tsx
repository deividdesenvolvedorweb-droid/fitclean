import { useState, useEffect } from "react";

interface CountdownBlockProps {
  config: Record<string, any>;
}

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownBlock({ config }: CountdownBlockProps) {
  const targetDate = config.target_date || new Date(Date.now() + 86400000 * 3).toISOString();
  const [time, setTime] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const labelColor = config.label_color;
  const numberColor = config.number_color;
  const bgColor = config.box_bg_color;

  const units = [
    { value: time.days, label: config.label_days || "Dias" },
    { value: time.hours, label: config.label_hours || "Horas" },
    { value: time.minutes, label: config.label_minutes || "Min" },
    { value: time.seconds, label: config.label_seconds || "Seg" },
  ];

  return (
    <div className="py-6 text-center">
      {config.heading && (
        <h3 className="text-xl font-bold mb-4">{config.heading}</h3>
      )}
      <div className="flex items-center justify-center gap-3">
        {units.map((u, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center rounded-lg min-w-[70px] py-3 px-2"
            style={{ backgroundColor: bgColor || "hsl(var(--muted))" }}
          >
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color: numberColor || undefined }}
            >
              {String(u.value).padStart(2, "0")}
            </span>
            <span
              className="text-xs uppercase tracking-wider mt-1"
              style={{ color: labelColor || "hsl(var(--muted-foreground))" }}
            >
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
