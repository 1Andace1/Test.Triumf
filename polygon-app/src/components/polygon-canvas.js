import './polygon-shape.js';

class PolygonCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isPanning = false;
    this.startPan = { x: 0, y: 0 };

    this.shadowRoot.innerHTML = `
      <style>
        .zones {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: calc(100vh - 60px);
        }
        .buffer, .work {
          border: 1px solid #999;
          min-height: 150px;
          position: relative;
          padding: 10px;
        }
        .buffer {
          background: #f7f7f7;
          border: 1px dashed #ccc;
          flex: 1;
        }
        .work {
          background: #2c2c2c;
          height: 300px;
          overflow: hidden;
          flex: 2;
        }
        svg.grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        polygon-shape {
          transition: transform 0.1s;
          cursor: grab;
          position: absolute;
        }
        polygon-shape:active {
          cursor: grabbing;
        }
        .highlight {
          border: 2px solid yellow !important;
          background: #3a3a3a !important;
        }
      </style>
      <div class="zones">
        <div class="buffer zone" id="buffer"></div>
        <div class="work zone" id="work">
          <svg class="grid" id="grid" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.buffer = this.shadowRoot.getElementById('buffer');
    this.work = this.shadowRoot.getElementById('work');
    this.grid = this.shadowRoot.getElementById('grid');

    this.setupEventListeners();
    this.loadFromStorage();
    this.drawGrid();
  }

  setupEventListeners() {
    this.work.addEventListener('dragover', (e) => e.preventDefault());
    this.buffer.addEventListener('dragover', (e) => e.preventDefault());

    this.work.addEventListener('dragenter', (e) => this.highlightDropZone(e));
    this.work.addEventListener('dragleave', (e) => this.unhighlightDropZone(e));
    this.buffer.addEventListener('dragenter', (e) => this.highlightDropZone(e));
    this.buffer.addEventListener('dragleave', (e) => this.unhighlightDropZone(e));

    this.work.addEventListener('drop', (e) => this.onDrop(e, this.work));
    this.buffer.addEventListener('drop', (e) => this.onDrop(e, this.buffer));

    this.work.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      this.scale *= delta;
      this.applyTransform();
      this.drawGrid();
    });

    this.work.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isPanning = true;
        this.startPan = { x: e.clientX, y: e.clientY };
        this.work.style.cursor = 'grabbing';
      }
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.work.style.cursor = '';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      const dx = e.clientX - this.startPan.x;
      const dy = e.clientY - this.startPan.y;
      this.startPan = { x: e.clientX, y: e.clientY };
      this.offsetX += dx;
      this.offsetY += dy;
      this.applyTransform();
      this.drawGrid();
    });
  }

  createPolygons() {
    const count = Math.floor(Math.random() * 16) + 5;
    this.buffer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const poly = document.createElement('polygon-shape');
      poly.setAttribute('draggable', 'true');
      poly.id = `poly-${Date.now()}-${i}`;
      poly.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', poly.outerHTML);
        poly.setAttribute('data-original-id', poly.id);
      });
      this.buffer.appendChild(poly);
    }
  }

  highlightDropZone(e) {
    e.preventDefault();
    e.currentTarget.classList.add('highlight');
  }

  unhighlightDropZone(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('highlight');
  }

  onDrop(event, target) {
    event.preventDefault();
    this.unhighlightDropZone({ currentTarget: target, preventDefault: () => {} });

    const html = event.dataTransfer.getData('text/plain');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const newElem = temp.firstElementChild;

    if (target === this.work) {
      const rect = this.work.getBoundingClientRect();
      const x = (event.clientX - rect.left - this.offsetX) / this.scale;
      const y = (event.clientY - rect.top - this.offsetY) / this.scale;

      newElem.style.position = 'absolute';
      newElem.style.left = `${x}px`;
      newElem.style.top = `${y}px`;
      newElem.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      newElem.style.transformOrigin = '0 0';
    }

    const originalId = newElem.getAttribute('data-original-id');
    if (originalId) {
      const original = this.shadowRoot.getElementById(originalId);
      if (original) original.remove();
    } else {
      newElem.setAttribute('data-original-id', `poly-${Date.now()}`);
    }

    newElem.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', newElem.outerHTML);
      newElem.setAttribute('data-original-id', newElem.id);
    });

    target.appendChild(newElem);
    this.saveToStorage();
  }

  saveToStorage() {
    const buffer = Array.from(this.buffer.children).map(el => el.outerHTML);
    const work = Array.from(this.work.querySelectorAll('polygon-shape')).map(el => {
      const clone = el.cloneNode(true);
      clone.style.transform = '';
      return clone.outerHTML;
    });
    localStorage.setItem('polygonAppData', JSON.stringify({ buffer, work }));
  }

  loadFromStorage() {
    const saved = localStorage.getItem('polygonAppData');
    if (saved) {
      const { buffer, work } = JSON.parse(saved);
      this.buffer.innerHTML = buffer.join('');
      this.work.innerHTML = '<svg class="grid" id="grid"></svg>' + work.join('');
      this.grid = this.shadowRoot.getElementById('grid');

      this.shadowRoot.querySelectorAll('polygon-shape').forEach(el => {
        el.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', el.outerHTML);
          el.setAttribute('data-original-id', el.id);
        });

        if (el.parentElement === this.work) {
          el.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
          el.style.transformOrigin = '0 0';
        }
      });
    }
  }

  clearStorage() {
    localStorage.removeItem('polygonAppData');
    this.buffer.innerHTML = '';
    this.work.innerHTML = '<svg class="grid" id="grid"></svg>';
    this.grid = this.shadowRoot.getElementById('grid');
  }

  applyTransform() {
    this.work.querySelectorAll('polygon-shape').forEach(el => {
      el.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    });
  }

  drawGrid() {
    const step = 50;
    const grid = this.grid;
    grid.innerHTML = '';

    const width = this.work.clientWidth;
    const height = this.work.clientHeight;

    const startX = -this.offsetX % step;
    const startY = -this.offsetY % step;

    for (let x = startX; x < width; x += step) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', height);
      line.setAttribute('stroke', '#444');
      line.setAttribute('stroke-width', '1');
      grid.appendChild(line);
    }

    for (let y = startY; y < height; y += step) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#444');
      line.setAttribute('stroke-width', '1');
      grid.appendChild(line);
    }
  }
}

customElements.define('polygon-canvas', PolygonCanvas);
