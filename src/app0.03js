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

// Load prompts from prompts.json
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

  // Show prompt image or clear
  const promptImage = document.getElementById('promptImage');
  if (p.image) {
    promptImage.src = p.image;
    promptImage.style.display = 'block';
  } else {
    promptImage.style.display = 'none';
  }

  // Clear current canvas and inputs
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

// Navigate to previous prompt
function prevPrompt() {
  if (currentPrompt > 0) {
    saveCurrentResponse();
    currentPrompt--;
    updatePrompt();
  }
}

// Navigate to next prompt
function nextPrompt() {
  if (currentPrompt < prompts.length - 1) {
    saveCurrentResponse();
    currentPrompt++;
    updatePrompt();
  }
}

// Save current prompt's canvas, reflection, SNOMED confirmation, and date
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
    canvas.remove(objs[obj]()
