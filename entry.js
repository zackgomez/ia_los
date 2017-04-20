'use strict';

import raycast from './RayCast.js';
import 'pixi.js';
import Board, {boardFromRows} from './board.js';

const WIDTH = 640;
const HEIGHT = 480;

let renderer = new PIXI.autoDetectRenderer(WIDTH, HEIGHT);
renderer.backgroundColor = 0x777777;
//renderer.autoResize = true;

document.body.appendChild(renderer.view);

let stage = new PIXI.Container();

let grid = new PIXI.Graphics();
grid.lineStyle(2, 0x000000, 1);
for (let x = 0; x <= WIDTH; x += 50) {
  grid.moveTo(x, 0);
  grid.lineTo(x, HEIGHT);
}
for (let y = 0; y <= HEIGHT; y += 50) {
  grid.moveTo(0, y);
  grid.lineTo(WIDTH, y);
}
stage.addChild(grid);


let figure = new PIXI.Graphics();
figure.beginFill(0x9966FF);
figure.drawCircle(0, 0, 25);
figure.endFill();
figure.lineStyle(2, 0x000000, 1);
figure.drawCircle(0, 0, 25);
figure.endFill();
figure.x = 75;
figure.y = 75;
figure.interactive = true;
stage.addChild(figure);

let mouseInfo = new PIXI.Text('Derp', new PIXI.TextStyle({
  fontSize: 12,
  stroke: '#00FF00',
  fill: '#00FF00',
}));
stage.addChild(mouseInfo);

const interactionManager = renderer.plugins.interaction;

let dragData = {
  startCellX: null,
  startCellY: null,
  startX: null,
  startY: null,
  entityStartX: null,
  entityStaryY: null,
  entity: null,
};

function render() {
  const mousePosition = interactionManager.mouse.global;

  mouseInfo.text = `Mouse x: ${mousePosition.x} y: ${mousePosition.y}`;

  renderer.render(stage);
}

interactionManager.on('pointermove', e => {
  //console.log('move', e.data.getLocalPosition(stage));
  if (dragData.entity) {
    dragData.entity.x = dragData.entityStartX + (e.data.global.x - dragData.startX);
    dragData.entity.y = dragData.entityStartY + (e.data.global.y - dragData.startY);
  }
  render();
});
interactionManager.on('pointerdown', e => {
  if (!e.currentTarget) {
    return;
  }
  if (dragData.entity) return;
  dragData.entity = e.target;
  dragData.entityStartX = e.target.x;
  dragData.entityStartY = e.target.y;
  dragData.startX = e.data.global.x;
  dragData.startY = e.data.global.y;
  dragData.startCellX = Math.floor(dragData.startX / 50);
  dragData.startCellY = Math.floor(dragData.startY / 50);
  console.log('down', e.data.getLocalPosition(stage));
  render();
});
interactionManager.on('pointerup', e => {
  const position = e.data.getLocalPosition(stage);
  console.log('up', position);
  if (dragData.entity) {
    console.log(dragData);
    const targetCellX = Math.floor(position.x / 50);
    const targetCellY = Math.floor(position.y / 50);
    dragData.entity.x = targetCellX * 50 + 25;
    dragData.entity.y = targetCellY * 50 + 25;
    dragData.entity = null;
  }
  render();
});
interactionManager.on('rightdown', e => {
  e.stopPropagation();
  console.log('rightdown', e.data.getLocalPosition(stage));
  render();
});

render();
