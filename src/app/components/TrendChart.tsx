import type { StudentReportTrendPoint } from '@/app/types';

type TrendChartProps = {
  data: StudentReportTrendPoint[];
  height?: number;
};

const normalizePoints = (data: StudentReportTrendPoint[], width: number, height: number) => {
  if (data.length === 0) {
    return '';
  }

  const maxValue = Math.max(...data.map((point) => point.nota), 1);
  const minValue = Math.min(...data.map((point) => point.nota), 0);
  const range = maxValue - minValue || 1;

  return data
    .map((point, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const normalized = (point.nota - minValue) / range;
      const y = height - normalized * height;
      return `${x},${y}`;
    })
    .join(' ');
};

export default function TrendChart({ data, height = 160 }: TrendChartProps) {
  const width = Math.max(data.length * 60, 240);
  const points = normalizePoints(data, width, height - 20);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} role="img" aria-label="Tendencia de calificaciones">
        <defs>
          <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f2937" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#1f2937" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={width} height={height} fill="#f9fafb" rx={12} />
        <g transform="translate(20,10)">
          <polyline
            fill="none"
            stroke="#111827"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
          <polyline
            fill="url(#trendGradient)"
            stroke="none"
            points={`${points} ${width - 40},${height - 20} 0,${height - 20}`}
          />
          {data.map((point, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * (width - 40);
            const maxValue = Math.max(...data.map((item) => item.nota), 1);
            const minValue = Math.min(...data.map((item) => item.nota), 0);
            const range = maxValue - minValue || 1;
            const normalized = (point.nota - minValue) / range;
            const y = (height - 20) - normalized * (height - 20);
            return (
              <g key={point.periodo} transform={`translate(${x},${y})`}>
                <circle r={4} fill="#1f2937" />
                <text x={0} y={-8} fontSize={10} textAnchor="middle" fill="#1f2937">
                  {point.nota.toFixed(1)}
                </text>
                <text x={0} y={30} fontSize={11} textAnchor="middle" fill="#6b7280">
                  {point.periodo}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

