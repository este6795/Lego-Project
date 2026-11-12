function ColorPicker() {
  const colors = [
    "#C43D35",
    "#E7C34B",
    "#4864D7",
    "#5A9E61",
  ];

  return (
    <div className="color-picker">
      {colors.map((color) => (
        <button
          key={color}
          className="color-circle"
          style={{ backgroundColor: color }}
        ></button>
      ))}
    </div>
  );
}

export default ColorPicker;