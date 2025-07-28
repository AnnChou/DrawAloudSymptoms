// Fabric.js Setup
const canvas = new fabric.Canvas('drawing');
canvas.isDrawingMode = true;
canvas.freeDrawingBrush.color = document.getElementById("brushColor").value;
canvas.freeDrawingBrush.width = 2;

document.getElementById("brushColor").addEventListener("change", (e) => {
  canvas.freeDrawingBrush.color = e.target.value;
});

const strokeData = [];
canvas.on('path:created', function(opt) {
  const timestamp = new Date();
  const path = opt.path;
  path.set({ timestamp });
  strokeData.push({ time: timestamp, label: `Stroke ${strokeData.length + 1}` });
  updateTimeline();
});

function downloadImage() {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'drawing.png';
  a.click();
}

function exportFHIR() {
  const answers = strokeData.map((d, i) => ({
    linkId: `stage-${i+1}`,
    text: d.label,
    answer: [{ valueString: `Drawn at ${d.time.toISOString()}` }]
  }));

  const reflectionText = document.getElementById("reflectionText").value;
  if (reflectionText) {
    answers.push({
      linkId: "reflection",
      text: "Reflection Words",
      answer: [{ valueString: reflectionText }]
    });
  }

  const response = {
    resourceType: "QuestionnaireResponse",
    status: "completed",
    authored: new Date().toISOString(),
    item: answers
  };

  const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "questionnaire_response.json";
  a.click();
}

function updateTimeline() {
  const svg = d3.select("#timeline");
  svg.selectAll("*").remove();

  const times = strokeData.map(d => d.time);
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  const x = d3.scaleTime()
    .domain(d3.extent(times))
    .range([margin.left, width - margin.right]);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%H:%M:%S")));

  svg.selectAll("circle")
    .data(strokeData)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.time))
    .attr("cy", height / 2)
    .attr("r", 6)
    .attr("fill", "steelblue")
    .append("title")
    .text(d => `${d.label} @ ${d.time.toLocaleTimeString()}`);
}
