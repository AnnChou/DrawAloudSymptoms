// Fabric.js Setup
const canvas = new fabric.Canvas('drawing');
canvas.isDrawingMode = true;
canvas.freeDrawingBrush.color = document.getElementById("brushColor").value;
canvas.freeDrawingBrush.width = 2;

// Prompt definitions with SNOMED-CT codes
const PROMPTS = [
  { id: "grounding", label: "Grounding (pause, no drawing)", snomed: "28770003" },
  { id: "landmark1", label: "First Health Landmark – Recall Feeling", snomed: "225444004" },
  { id: "landmark2", label: "Second Health Landmark – Current Feeling", snomed: "289908002" },
  { id: "optimal", label: "Optimal State – What I Wish For", snomed: "225358003" }
];

// Will be filled from prompts.md
const promptDescriptions = {};
let currentPromptIndex = 0;

const strokeData = [];

// Load prompts descriptions from markdown file
async function loadPrompts() {
  try {
    const res = await fetch('media/prompts.md');
    const text = await res.text();

    const sections = text.split('## ').slice(1);
    sections.forEach(section => {
      const [key, ...descLines] = section.split('\n');
      promptDescriptions[key.trim()] = descLines.filter(line => line.trim()).join(' ').trim();
    });

    updatePromptDescription(currentPromptIndex);
  } catch (e) {
    console.warn('Failed to load prompts.md', e);
    updatePromptDescription(currentPromptIndex);
  }
}

function updatePromptDescription(index) {
  const promptId = PROMPTS[index].id;
  const desc = promptDescriptions[promptId] || PROMPTS[index].label;
  const descEl = document.getElementById('promptDescription');
  if (descEl) descEl.textContent = desc;
}

function setPrompt(index) {
  if (index < 0 || index >= PROMPTS.length) return;
  currentPromptIndex = index;

  const titleEl = document.getElementById('promptTitle');
  if (titleEl) titleEl.textContent = `Stage ${index + 1}: ${PROMPTS[index].label}`;

  updatePromptDescription(index);

  // Change brush color per prompt (optional)
  // Example colors per prompt index:
  const colors = ['#444444', '#d9534f', '#f0ad4e', '#5bc0de'];
  const color = colors[index] || '#000000';
  canvas.freeDrawingBrush.color = color;
  document.getElementById('brushColor').value = color;
}

canvas.on('path:created', function(opt) {
  const timestamp = new Date();
  const path = opt.path;
  path.set({ timestamp });

  strokeData.push({
    time: timestamp,
    label: PROMPTS[currentPromptIndex].label,
    promptId: PROMPTS[currentPromptIndex].id,
    snomed: PROMPTS[currentPromptIndex].snomed
  });

  updateTimeline();
});

document.getElementById("brushColor").addEventListener("change", (e) => {
  canvas.freeDrawingBrush.color = e.target.value;
});

// Undo last stroke
function undoLast() {
  if (canvas._objects.length === 0) return;
  canvas.remove(canvas._objects[canvas._objects.length - 1]);
  strokeData.pop();
  updateTimeline();
}

// Clear entire canvas and stroke data
function clearCanvas() {
  canvas.clear();
  strokeData.length = 0;
  updateTimeline();
}

// Navigate prompts
function nextPrompt() {
  if (currentPromptIndex < PROMPTS.length - 1) {
    setPrompt(currentPromptIndex + 1);
  }
}
function prevPrompt() {
  if (currentPromptIndex > 0) {
    setPrompt(currentPromptIndex - 1);
  }
}

// Attach navigation to buttons (make sure buttons exist in HTML)
document.getElementById('nextPromptBtn')?.addEventListener('click', nextPrompt);
document.getElementById('prevPromptBtn')?.addEventListener('click', prevPrompt);

// Download canvas as PNG image
function downloadImage() {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'drawing.png';
  a.click();
}

// Export drawing & reflection as HL7 FHIR QuestionnaireResponse JSON
function exportFHIR() {
  // Group strokes by promptId
  const grouped = {};
  strokeData.forEach(d => {
    if (!grouped[d.promptId]) grouped[d.promptId] = [];
    grouped[d.promptId].push(d);
  });

  const answers = Object.entries(grouped).map(([key, strokes]) => {
    const prompt = PROMPTS.find(p => p.id === key);
    return {
      linkId: key,
      text: prompt.label,
      answer: strokes.map(s => ({
        valueString: `Drawn at ${s.time.toISOString()}`,
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/condition-code",
            valueCoding: {
              system: "http://snomed.info/sct",
              code: s.snomed,
              display: prompt.label
            }
          }
        ]
      }))
    };
  });

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

// Update timeline visualization with D3.js
function updateTimeline() {
  const svg = d3.select("#timeline");
  svg.selectAll("*").remove();

  if (strokeData.length === 0) return;

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
    .attr("fill", d => {
      const i = PROMPTS.findIndex(p => p.id === d.promptId);
      return d3.schemeCategory10[i % 10];
    })
    .append("title")
    .text(d => `${d.label} @ ${d.time.toLocaleTimeString()}`);
}

// Expose some functions globally for HTML button handlers
window.downloadImage = downloadImage;
window.exportFHIR = exportFHIR;
window.undoLast = undoLast;
window.clearCanvas = clearCanvas;
window.nextPrompt = nextPrompt;
window.prevPrompt = prevPrompt;

// Initialize first prompt and load prompts descriptions
setPrompt(0);
loadPrompts();
