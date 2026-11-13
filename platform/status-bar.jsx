export function StatusBar({ style, background }) {
  if (typeof document !== 'undefined') {
    const color = background || (style === 'light' ? '#0e1111' : '#fff9ef');
    document.documentElement.style.colorScheme = style === 'light' ? 'dark' : 'light';
    document.documentElement.style.background = color;
    document.body.style.background = color;
    const root = document.getElementById('root');
    if (root) root.style.background = color;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }
  return null;
}
