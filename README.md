# Draw-Aloud Symptom Synthesis Tool

A web-based sketching app for guided health reflection through drawing and journaling. Users move through four timed health prompts — grounding, past state, current state, and optimal wish — with expressive drawing, reflection words, and a visual timeline.

Built using **Fabric.js** (freehand sketching) and **D3.js** (stroke timeline), this tool supports export to **HL7 FHIR QuestionnaireResponse** and image formats.

---

## ✨ Features

- 🎨 Freehand canvas using Fabric.js
- ⏱️ Stroke timeline visualization with D3.js
- 🧠 4 guided health reflection stages:
  1. Grounding (pause, no drawing)
  2. First Health Landmark (past)
  3. Second Health Landmark (present)
  4. Optimal Wish (desired)
- ✍️ Text input for reflection words
- 🎚️ Brush color selection (per stage)
- 💾 Export:
  - PNG image of drawing
  - Timeline metadata as JSON
  - FHIR `QuestionnaireResponse` resource

---

## 🏗️ Project Structure

```plaintext
├── /src/                 # HTML, JS, and core logic
│   └── index.html
│   └── app.js
├── /media/               # Sample prompts, drawings, word reflections
│   └── prompts.md
│   └── example-output.png
├── /docs/                # FHIR example output and form mappings
│   └── questionnaire_response.json
│   └── fhir-schema-notes.md
├── LICENSE               # MIT License for source code
├── LICENSE-media.txt     # CC BY-NC-ND 4.0 for media/prompts
└── README.md

---
## live demo
[https://annchou.github.io/DrawAloudSymptoms/src/](https://annchou.github.io/DrawAloudSymptoms/src/)
