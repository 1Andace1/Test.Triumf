class PolygonShape extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');

    const polygon = document.createElementNS(svgNS, 'polygon');
    const points = this.generateRandomPoints();
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', this.randomColor());

    svg.appendChild(polygon);
    shadow.appendChild(svg);
  }

  generateRandomPoints() {
    const count = Math.floor(Math.random() * 5) + 3;
    const centerX = 50;
    const centerY = 50;
    const radius = 30;
    const points = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  randomColor() {
    return `hsl(${Math.random() * 360}, 70%, 60%)`;
  }
}

customElements.define('polygon-shape', PolygonShape);
