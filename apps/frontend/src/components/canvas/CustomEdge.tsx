import { getBezierPath, EdgeProps } from 'reactflow';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      {/* Edge path with gradient */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={selected ? 3 : 2}
        stroke={selected ? '#3b82f6' : 'url(#edge-gradient)'}
        fill="none"
        style={{
          strokeDasharray: 8,
          animation: 'flow 1s linear infinite',
        }}
      />

      {/* Animated flow indicator */}
      <circle r="4" fill="#3b82f6">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>

      {/* Edge label (optional) - positioned via SVG text for now */}
      {data?.label && (
        <text
          x={labelX}
          y={labelY}
          className="edge-label"
          style={{
            fontSize: '12px',
            fill: 'rgba(255, 255, 255, 0.9)',
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            pointerEvents: 'all',
          }}
        >
          <tspan className="glass px-2 py-1 rounded-lg">
            {data.label}
          </tspan>
        </text>
      )}
    </g>
  );
}
