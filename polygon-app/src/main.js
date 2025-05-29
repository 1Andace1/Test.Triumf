import './style.css';
import './components/polygon-shape.js';
import './components/polygon-canvas.js';

const canvas = document.querySelector('polygon-canvas');
document.getElementById('create').onclick = () => canvas.createPolygons();
document.getElementById('save').onclick = () => canvas.saveToStorage();
document.getElementById('clear').onclick = () => canvas.clearStorage();
