// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('drawing');
canvas.isDrawingMode = true;
canvas.freeDrawingBrush.width = 3;
canvas.freeDrawingBrush.color = document.getElementById('brushColor').value;

// Update brush color when picker changes
document.getElementById('brushColor').addEventListener('change', function() {
  canvas.freeDrawingBrush.color = this.value;
});

// Add reflective text on canvas button
document.getElementById('addReflectionToCanvas').addEventListener('click', function() {
  const reflection = document.getElementById('reflectionText').value.trim();
  if (!reflection) return alert("Please enter some reflection text first.");
  const text = new fabric.Text(reflection, {
    left: 50,
    top: 50,
    fill: '#000',
    fontSize: 20,
    backgroundColor: '#fefcbf',
    padding: 4,
    cornerStyle: 'circle',
    selectable: true
  });
  canvas.add(text);
});

// Variables to hold prompts and user responses
let prompts = [];
let currentPrompt = 0;
const responses = [];

// Load prompts from prompts.json (adjust path if needed)
fetch('media/prompts.json')
  .then(response => response.json())
  .then(data => {
    prompts = data;
    // Try to load saved responses from localStorage
    const saved = localStorage.getItem('drawaloudResponses');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.forEach((r, i) => responses[i] = r);
    }
    updatePrompt();
  })
  .catch(error => {
    console.error('Failed to load prompts:', error);
  });

// Update UI with current prompt and load saved canvas/reflection if any
function updatePrompt() {
  if (!prompts.length) return;
  const p = prompts[currentPrompt];
  document.getElementById('promptTitle').innerText = p.title || '';
  document.getElementById('promptDescription').innerText = p.description || '';

  // Show prompt image or hide
  const promptImage = document.getElementById('promptImage');
  if (p.image) {
    promptImage.src = p.image;
    promptImage.style.display = 'block';
  } else {
    promptImage.style.display = 'none';
  }

  // Clear canvas and set drawing mode
  canvas.clear();
  canvas.isDrawingMode = !!p.allowDraw;

  // Load saved response if exists
  const resp = responses[currentPrompt];
  if (resp) {
    document.getElementById('reflectionText').value = resp.reflection || '';
    document.getElementById('snomedConfirm').checked = !!resp.snomedConfirmed;
    document.getElementById('dateInput').value = resp.date || '';
    if (resp.canvas) {
      canvas.loadFromJSON(resp.canvas, () => {
        canvas.renderAll();
      });
    }
  } else {
    document.getElementById('reflectionText').value = '';
    document.getElementById('snomedConfirm').checked = false;
    document.getElementById('dateInput').value = '';
  }

  drawTimeline();
}

// Save current prompt’s canvas, reflection, SNOMED confirm, and date
function saveCurrentResponse() {
  const reflection = document.getElementById('reflectionText').value.trim();
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

  // Auto-save to localStorage
  localStorage.setItem('drawaloudResponses', JSON.stringify(responses));
}

// Canvas utility functions
function clearCanvas() {
  canvas.clear();
}

function undoLast() {
  const objs = canvas.getObjects();
  if (objs.length > 0) {
    canvas.remove(objs[objs.length - 1]);
  }
}

// Download current canvas as PNG
function downloadImage() {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const link = document.createElement('a');
  link.download = `stage-${currentPrompt + 1}.png`;
  link.href = dataURL;
  link.click();
}

// Export responses as FHIR QuestionnaireResponse JSON
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
        { valueBoolean: r.snomedConfirmed },
        ...(r.date ? [{ valueDate: r.date }] : [])
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

// Draw timeline with D3 showing prompt titles, dates, and reflections
function drawTimeline() {
  const svg = d3.select('#timeline');
  svg.selectAll('*').remove();

  const width = +svg.attr('width');
  const height = +svg.attr('height');

  const stages = prompts.map((p, i) => ({
    index: i,
    label: p.title,
    reflection: responses[i]?.reflection || '',
    date: responses[i]?.date || ''
  }));

  if (!stages.length) return;

  // x scale evenly spaced by index
  const x = d3.scalePoint()
    .domain(stages.map(d => d.index))
    .range([50, width - 50]);

  // Circles for each stage
  svg.selectAll('circle')
    .data(stages)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.index))
    .attr('cy', height / 2)
    .attr('r', 12)
    .attr('fill', (d, i) => {
      if (i < currentPrompt) return '#88b04b';    // Past green
      if (i === currentPrompt) return '#f7b733'; // Current orange
      return '#a0a0a0';                          // Future gray
    });

  // Labels below circles
  svg.selectAll('text.label')
    .data(stages)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.index))
    .attr('y', height / 2 + 30)
    .attr('text-anchor', 'middle')
    .attr('font-weight', d => d.index === currentPrompt ? '700' : '400')
    .attr('fill', d => d.index === currentPrompt ? '#f7b733' : '#333')
    .text(d => d.label);

  // Reflection + date below labels, smaller font
  svg.selectAll('text.reflection')
    .data(stages)
    .enter()
    .append('text')
    .attr('class', 'reflection')
    .attr('x', d => x(d.index))
    .attr('y', height / 2 + 50)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8em')
    .attr('fill', '#555')
    .text(d => {
      let parts = [];
      if (d.date) parts.push(d.date);
      if (d.reflection) parts.push(d.reflection);
      return parts.join(' | ');
    });
}

// Image upload for prompt image overlay on canvas
document.getElementById('uploadPromptImage').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const imgObj = new Image();
    imgObj.src = evt.target.result;
    imgObj.onload = function() {
      const fabricImg = new fabric.Image(imgObj, {
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: true
      });
      canvas.add(fabricImg);
      saveCurrentResponse();
    };
  };
  reader.readAsDataURL(file);
});

// Auto-save on canvas changes
canvas.on('object:added', () => saveCurrentResponse());
canvas.on('object:modified', () => saveCurrentResponse());
canvas.on('object:removed', () => saveCurrentResponse());

// Attach navigation functions to global scope for buttons
window.prevPrompt = function() {
  if (currentPrompt > 0) {
    saveCurrentResponse();
    currentPrompt--;
    updatePrompt();
  }
};

window.nextPrompt = function() {
  if (currentPrompt < prompts.length - 1) {
    saveCurrentResponse();
    currentPrompt++;
    updatePrompt();
  }
};
