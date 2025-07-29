// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('drawing');
canvas.isDrawingMode = true;
canvas.freeDrawingBrush.width = 3;
canvas.freeDrawingBrush.color = '#000000';

const brushButtons = document.querySelectorAll('.brushColor');
brushButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.getAttribute('data-color');
    canvas.freeDrawingBrush.color = color;
    document.getElementById('brushColor').value = color;
  });
});

document.getElementById('brushColor').addEventListener('input', (e) => {
  canvas.freeDrawingBrush.color = e.target.value;
});

document.getElementById('addReflectionToCanvas').addEventListener('click', () => {
  const text = document.getElementById('reflectionText').value.trim();
  if (!text) {
    alert('Please enter reflection text first.');
    return;
  }
  const fabricText = new fabric.Text(text, {
    left: 50,
    top: 50,
    fill: '#000',
    fontSize: 20,
    backgroundColor: '#fefcbf',
    padding: 4,
    selectable: true
  });
  canvas.add(fabricText);
});

// Prompt data and responses
let prompts = [];
let currentPromptIndex = 0;
let responses = [];

// Load prompts from JSON
fetch('prompts.json')
  .then(r => r.json())
  .then(data => {
    prompts = data;
    loadResponsesFromStorage();
    showPrompt(currentPromptIndex);
  })
  .catch(e => console.error('Failed to load prompts:', e));

function loadResponsesFromStorage() {
  const saved = localStorage.getItem('drawaloudResponses');
  if (saved) {
    responses = JSON.parse(saved);
  }
}

function saveCurrentResponse() {
  const reflection = document.getElementById('reflectionText').value.trim();
  const date = document.getElementById('dateInput').value;
  const snomedConfirmed = document.getElementById('snomedConfirm').checked;
  const jsonCanvas = canvas.toJSON();

  responses[currentPromptIndex] = {
    reflection,
    date,
    snomedConfirmed,
    canvas: jsonCanvas
  };

  localStorage.setItem('drawaloudResponses', JSON.stringify(responses));
}

function showPrompt(idx) {
  if (idx < 0 || idx >= prompts.length) return;

  currentPromptIndex = idx;
  const p = prompts[idx];

  document.getElementById('promptTitle').innerText = p.title;
  document.getElementById('promptDescription').innerText = p.description;

  const img = document.getElementById('pr
