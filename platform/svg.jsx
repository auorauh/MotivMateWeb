export function Svg({ width, height, children, style }) {
  return (
    <svg width={width} height={height} style={style}>
      {children}
    </svg>
  );
}

export function Circle(props) {
  return <circle {...props} />;
}

function cssSize(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) return `${value}px`;
  return value;
}

export function SvgXml({ xml, width, height, style }) {
  return (
    <div
      className="mm-svg"
      style={{ width: cssSize(width), height: cssSize(height), ...style }}
      dangerouslySetInnerHTML={{ __html: xml }}
    />
  );
}
