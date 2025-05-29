import { PolygonShape } from './polygon-shape.js';

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
        }
        .buffer, .work {
          background: #2c2c2c;
          border: 1px solid #999;
          min-height: 150px;
          position: relative;
        }
        .work {
          height: 300px;
          overflow: hidden;
        }
        svg.grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
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

    this.work.addEventListener('dragover', (e) => e.preventDefault());
    this.buffer.addEventListener('dragover', (e) => e.preventDefault());

    this.work.addEventListener('drop', (e) => this.onDrop(e, this.work));
    this.buffer.addEventListener('drop', (e) => this.onDrop(e, this.buffer));

    this.loadFromStorage();
    this.setupZoomPan();
    this.drawGrid();
  }

  createPolygons() {
    const count = Math.floor(Math.random() * 16) + 5;
    this.buffer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const poly = new PolygonShape();
      this.buffer.appendChild(poly);
    }
  }

  onDrop(event, target) {
    event.preventDefault();
    const html = event.dataTransfer.getData('text/plain');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const newElem = temp.firstElementChild;
    newElem.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', newElem.outerHTML);
    });
    target.appendChild(newElem);
  }

  saveToStorage() {
    const buffer = Array.from(this.buffer.children).map(el => el.outerHTML);
    const work = Array.from(this.work.querySelectorAll('polygon-shape')).map(el => el.outerHTML);
    localStorage.setItem('polygonAppData', JSON.stringify({ buffer, work }));
  }

  loadFromStorage() {
    const saved = localStorage.getItem('polygonAppData');
    if (saved) {
      const { buffer, work } = JSON.parse(saved);
      this.buffer.innerHTML = buffer.join('');
      this.work.innerHTML = '<svg class="grid" id="grid"></svg>' + work.join('');
      this.grid = this.shadowRoot.getElementById('grid');
      this.drawGrid();

      this.shadowRoot.querySelectorAll('polygon-shape').forEach(el => {
        el.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', el.outerHTML);
        });
      });
    }
  }

  clearStorage() {
    localStorage.removeItem('polygonAppData');
    this.buffer.innerHTML = '';
    const svg = this.work.querySelector('.grid');
    this.work.innerHTML = '';
    this.work.appendChild(svg);
  }

  setupZoomPan() {
    this.work.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      this.scale *= delta;
      this.applyTransform();
      this.drawGrid();
    });

    this.work.addEventListener('mousedown', (e) => {
      this.isPanning = true;
      this.startPan = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => this.isPanning = false);
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

  applyTransform() {
    this.work.querySelectorAll('polygon-shape').forEach(el => {
      el.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      el.style.transformOrigin = '0 0';
    });
  }

  drawGrid() {
    const step = 10;
    const grid = this.grid;
    grid.innerHTML = '';

    const width = this.work.clientWidth;
    const height = this.work.clientHeight;

    for (let i = 0; i <= width / step; i++) {
      const x = i * step * this.scale + this.offsetX;

      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', x);
      vLine.setAttribute('y1', 0);
      vLine.setAttribute('x2', x);
      vLine.setAttribute('y2', height);
      vLine.setAttribute('stroke', 'gray');
      vLine.setAttribute('stroke-width', 0.5);
      grid.appendChild(vLine);
    }

    for (let i = 0; i <= height / step; i++) {
      const y = i * step * this.scale + this.offsetY;

      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', 0);
      hLine.setAttribute('y1', y);
      hLine.setAttribute('x2', width);
      hLine.setAttribute('y2', y);
      hLine.setAttribute('stroke', 'gray');
      hLine.setAttribute('stroke-width', 0.5);
      grid.appendChild(hLine);
    }
  }
}

customElements.define('polygon-canvas', PolygonCanvas);
