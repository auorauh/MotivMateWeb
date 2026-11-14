function TabSlide({ dir, style, children }) {
  const className = dir > 0 ? 'mm-tab-from-right' : dir < 0 ? 'mm-tab-from-left' : undefined;
  return (
    <div className="mm-tab-clip">
      <div className={className} style={style}>
        {children}
      </div>
    </div>
  );
}

export default TabSlide;
