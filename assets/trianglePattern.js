const COLORS = ['#444', '#AAA', '#DDD', '#999', '#FFF', '#666', '#222', '#000'];
const TRI_W = 32;
const TRI_H = 26;
const COLS = 8;
const ROWS = 6;

function colorAt(col, row, which) {
  return COLORS[(col * 3 + row * 5 + which * 7) % COLORS.length];
}

function points(list) {
  return list.map(([x, y]) => `${x} ${y}`).join(' ');
}

function triangles() {
  const tw = COLS * TRI_W;
  const polys = [];

  function add(pts, fill) {
    const xs = pts.map(([x]) => x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const shifts = [0];
    if (minX < 0) shifts.push(tw);
    if (maxX > tw) shifts.push(-tw);
    shifts.forEach((shift) => {
      const shifted = pts.map(([x, y]) => [x + shift, y]);
      polys.push(`<polygon fill="${fill}" points="${points(shifted)}"/>`);
    });
  }

  for (let row = 0; row < ROWS; row += 1) {
    const y0 = row * TRI_H;
    const y1 = y0 + TRI_H;
    const odd = row % 2 === 1;
    for (let col = 0; col < COLS; col += 1) {
      const x0 = col * TRI_W + (odd ? TRI_W / 2 : 0);
      const x1 = x0 + TRI_W / 2;
      const x2 = x0 + TRI_W;
      if (!odd) {
        add([[x0, y0], [x2, y0], [x1, y1]], colorAt(col, row, 0));
        add([[x1, y1], [x2 + TRI_W / 2, y1], [x2, y0]], colorAt(col, row, 1));
      } else {
        add([[x0, y0], [x2, y0], [x1, y1]], colorAt(col, row, 0));
        add([[x0, y0], [x0 - TRI_W / 2, y1], [x1, y1]], colorAt(col, row, 1));
      }
    }
  }

  return { width: tw, height: ROWS * TRI_H, markup: polys.join('') };
}

const TILE = triangles();

function dataUri(opacity) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE.width}" height="${TILE.height}"><g fill-opacity="${opacity}">${TILE.markup}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const LIGHT_IMAGE = dataUri(0.05);
const DARK_IMAGE = dataUri(0.04);
const SIZE = `${TILE.width}px ${TILE.height}px`;

export function TriangleBackground({ dark }) {
  return (
    <div
      aria-hidden="true"
      className="mm-tri-bg"
      style={{
        backgroundColor: dark ? '#0e1111' : '#fff9ef',
        backgroundImage: dark ? DARK_IMAGE : LIGHT_IMAGE,
        backgroundSize: SIZE,
      }}
    />
  );
}
