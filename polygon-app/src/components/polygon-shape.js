class PolygonShape extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const size = 100;
    const numPoints = Math.floor(Math.random() * 5) + 3;
    const points = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 * i) / numPoints;
      const radius = size / 2 * (0.5 + Math.random() * 0.5);
      const x = size / 2 + Math.cos(angle) * radius;
      const y = size / 2 + Math.sin(angle) * radius;
      points.push(`${x},${y}`);
    }

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'darkred');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.appendChild(polygon);

    this.shadowRoot.appendChild(svg);

    this.setAttribute('draggable', 'true');
    this.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', this.outerHTML);
    });
  }
}

export { PolygonShape };
customElements.define('polygon-shape', PolygonShape);
