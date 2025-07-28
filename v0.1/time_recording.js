const drawingData = [];

svg.on("mouseup", () => {
  const timestamp = Date.now();
  const pathData = currentLine.attr("d");
  drawingData.push({ timestamp, pathData });
});
