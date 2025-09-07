import React from 'react';
import { PersonalityTraits } from '../../types';

interface RadarChartProps {
  data: PersonalityTraits;
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const size = 300;
  const center = size / 2;
  const labels = [
    "الانفتاح",
    "الضمير",
    "الانبساط",
    "القبول",
    "العصابية",
  ];
  const numSides = labels.length;
  const angleSlice = (Math.PI * 2) / numSides;

  const getPoint = (value: number, index: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const radius = (value / 100) * (center * 0.8); // 80% of center for padding
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const dataPoints = Object.values(data).map((value, i) => {
    const point = getPoint(value, i);
    return `${point.x},${point.y}`;
  }).join(' ');

  const axisPoints = labels.map((_, i) => {
    const point = getPoint(100, i);
    return { x: point.x, y: point.y };
  });

  const levelPoints = (level: number) => {
     return labels.map((_, i) => {
        const point = getPoint(level, i);
        return `${point.x},${point.y}`;
     }).join(' ');
  }

  const labelPoints = labels.map((_, i) => {
    const point = getPoint(115, i); // Position labels outside the max radius
    return {
      x: point.x,
      y: point.y,
      text: labels[i],
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background concentric polygons */}
      {[25, 50, 75, 100].map(level => (
        <polygon
          key={level}
          points={levelPoints(level)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />
      ))}

      {/* Radial axes */}
      {axisPoints.map((point, i) => (
        <line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPoints}
        fill="rgba(52, 211, 153, 0.4)"
        stroke="#34D399"
        strokeWidth="2"
      />
      
       {/* Data points circles */}
      {Object.values(data).map((value, i) => {
          const { x, y } = getPoint(value, i);
          return <circle key={`point-${i}`} cx={x} cy={y} r="4" fill="#34D399" />;
      })}

      {/* Labels */}
      {labelPoints.map((point, i) => (
        <text
          key={`label-${i}`}
          x={point.x}
          y={point.y}
          fill="white"
          fontSize="12"
          fontWeight="bold"
          textAnchor={
            point.x < center - 10 ? 'end' : point.x > center + 10 ? 'start' : 'middle'
          }
          dominantBaseline="middle"
        >
          {point.text}
        </text>
      ))}
    </svg>
  );
};

export default RadarChart;