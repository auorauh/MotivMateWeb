export function StatusBar({ style }) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.colorScheme = style === 'light' ? 'dark' : 'light';
  }
  return null;
}
