// app.js
//set up fabric.js
const canvas = new fabric.Canvas('drawing');
canvas.isDrawingMode = true;
canvas.freeDrawingBrush.width = 3;
canvas.freeDrawingBrush.color = document.getElementById('brushColor').value;

document.getElementById('brushColor').addEventListener('change', function() {
  canvas.freeDrawingBrush.color = this.value;
});

document.getElementById('addReflectionToCanvas').addEventListener('click', function() {
  const reflection = document.getElementById('reflectionText').value;
  const text = new fabric.Text(reflection, {
    left: 50,
    top: 50,
    fill: '#000',
    fontSize: 20,
    backgroundColor: '#fefcbf',
    padding: 4,
    cornerStyle: 'circle'
  });
  canvas.add(text);
});

// Load prompts from external JSON file (prompts.json)
let prompts = [];
let currentPrompt = 0;
const responses = [];

fetch('prompts.json')
  .then(response => response.json())
  .then(data => {
    prompts = data;
    updatePrompt();
  })
  .catch(error => {
    console.error('Failed to load prompts:', error);
  });

function updatePrompt() {
  if (!prompts.length) return;
  const p = prompts[currentPrompt];
  document.getElementById('promptTitle').innerText = p.title;
  document.getElementById('promptDescription').innerText = p.description;
  canvas.isDrawingMode = p.allowDraw;
  canvas.clear();
  document.getElementById('reflectionText').value = '';
  document.getElementById('snomedConfirm').checked = false;

  // Load prompt image if available
  const promptImage = document.getElementById('promptImage');
  if (p.image) {
    promptImage.src = p.image;
    promptImage.style.display = 'block';
  } else {
    promptImage.style.display = 'none';
  }

  drawTimeline();
}

function prevPrompt() {
  if (currentPrompt > 0) saveCurrentResponse();
  if (currentPrompt > 0) currentPrompt--;
  updatePrompt();
}

function nextPrompt() {
  saveCurrentResponse();
  if (currentPrompt < prompts.length - 1) currentPrompt++;
  updatePrompt();
}

function saveCurrentResponse() {
  const reflection = document.getElementById('reflectionText').value;
  const snomedConfirmed = document.getElementById('snomedConfirm').checked;
  const json = canvas.toJSON();
  const dateInput = document.getElementById('dateInput');
  const date = dateInput ? dateInput.value : '';

  responses[currentPrompt] = {
    prompt: prompts[currentPrompt].title,
    reflection,
    snomedConfirmed,
    date,
    canvas: json
  };
}

function downloadImage() {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const link = document.createElement('a');
  link.download = `stage-${currentPrompt + 1}.png`;
  link.href = dataURL;
  link.click();
}

function clearCanvas() {
  canvas.clear();
}

function undoLast() {
  const objs = canvas.getObjects();
  if (objs.length > 0) {
    canvas.remove(objs[objs.length - 1]);
  }
}

function exportFHIR() {
  saveCurrentResponse();
  const fhir = {
    resourceType: "QuestionnaireResponse",
    status: "completed",
    item: responses.map((r, i) => ({
      linkId: `q${i + 1}`,
      text: r.prompt,
      answer: [
        { valueString: r.reflection },
        { valueString: JSON.stringify(r.canvas) },
        { valueBoolean: r.snomedConfirmed }
      ]
    }))
  };

  const blob = new Blob([JSON.stringify(fhir, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'questionnaire_response.json';
  link.href = url;
  link.click();
}

function drawTimeline() {
  const svg = d3.select('#timeline');
  svg.selectAll('*').remove();
  const width = +svg.attr('width');
  const height = +svg.attr('height');
  const stages = prompts.map((p, i) => ({ index: i, label: p.title }));

  const x = d3.scalePoint()
    .domain(stages.map(d => d.index))
    .range([50, width - 50]);

  svg.selectAll('circle')
    .data(stages)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.index))
    .attr('cy', height / 2)
    .attr('r', 8)
    .attr('fill', '#69b3a2');

  svg.selectAll('text')
    .data(stages)
    .enter()
    .append('text')
    .attr('x', d => x(d.index))
    .attr('y', height / 2 + 20)
    .attr('text-anchor', 'middle')
    .text(d => `L${d.index + 1}`);
}
