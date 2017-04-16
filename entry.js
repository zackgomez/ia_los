'use strict';

import raycast from './RayCast.js';
import 'pixi.js';

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
stage.addChild(figure);

renderer.render(stage);
