'use strict';

import raycast from './RayCast.js';
import 'pixi.js';
import Board, {boardFromMapFile, cellToPoint} from './board.js';
import 'isomorphic-fetch';

const VIEWPORT_WIDTH = 640;
const VIEWPORT_HEIGHT = 480;

let renderer = new PIXI.autoDetectRenderer(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
renderer.backgroundColor = 0x777777;
//renderer.autoResize = true;

document.body.appendChild(renderer.view);

let stage = new PIXI.Container();

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

const SCALE = 50;

function getGridLayer(board) {
  const width = board.getWidth();
  const height = board.getHeight();
  const grid = new PIXI.Graphics();
  grid.lineStyle(2, 0x000000, 1);
  for (let x = 0; x <= width; x++) {
    grid.moveTo(x * SCALE, 0);
    grid.lineTo(x * SCALE, height * SCALE);
  }
  for (let y = 0; y <= height; y++) {
    grid.moveTo(0, y * SCALE);
    grid.lineTo(width * SCALE, y * SCALE);
  }
  return grid;
}

function getEdgeLayer(board) {
  let edgeGraphics = new PIXI.Graphics();
  edgeGraphics.lineStyle(4, 0xFF0000, 1);

  for (let x = 0; x < board.getWidth(); x++) {
    for (let y = 0; y < board.getHeight(); y++) {
      ['Down', 'Right'].forEach(dir => {
        if (board.getEdge(x, y, dir) === 'Clear') {
          return;
        }
        edgeGraphics.moveTo(SCALE * x, SCALE * y);
        edgeGraphics.lineTo(
          SCALE * (x + (dir === 'Right' ? 1 : 0)),
          SCALE * (y + (dir === 'Down' ? 1 : 0))
        );
      });
    }
  }

  return edgeGraphics;
}


let nextFigureID = 1;
function makeFigureID(): string {
  return 'id' + nextFigureID++;
}
function makeFigure(id: string, type: string, color: any, x: number, y: number) {
  let figure = new PIXI.Graphics();
  figure.beginFill(color);
  figure.drawCircle(0, 0, SCALE / 2);
  figure.endFill();
  figure.lineStyle(2, 0x000000, 1);
  figure.drawCircle(0, 0, SCALE / 2);
  figure.endFill();
  figure.x = x * SCALE + SCALE / 2;
  figure.y = y * SCALE + SCALE / 2;
  figure.interactive = true;

  figure.id = id;
  figure.type = type;

  return figure;
}

let figures = {};

function makeFigureLayer() {
  let layer = new PIXI.Container();
  // source
  const source = makeFigure(makeFigureID(), 'source', 0x0000FF, 2, 2);
  layer.addChild(source);
  figures[source.id] = source;

  const target = makeFigure(makeFigureID(), 'target', 0xDD1122, 2, 3);
  layer.addChild(target);
  figures[target.id] = target;

  _.times(4, (i) => {
    const fig = makeFigure(makeFigureID(), 'neutral', 0x333333, i, 0);
    layer.addChild(fig);
    figures[fig.id] = fig;
  });

  return layer;
}

let mouseInfo = new PIXI.Text('Derp', new PIXI.TextStyle({
  fontSize: 12,
  stroke: '#00FF00',
  fill: '#00FF00',
}));
stage.addChild(mouseInfo);

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
  updateBoardWithFigures(globalBoard, figures);
  updateLineOfSight(globalBoard, figures, lineOfSightViews);
  render();
});
interactionManager.on('rightdown', e => {
  e.stopPropagation();
  console.log('rightdown', e.data.getLocalPosition(stage));
  render();
});

render();

let globalBoard = null;
function setBoard(board) {
  globalBoard = board;
  stage.addChild(getGridLayer(board));
  stage.addChild(getEdgeLayer(board));
  stage.addChild(makeFigureLayer());
  stage.addChild(makeLineOfSightLayer());
}

function updateBoardWithFigures(board, figures) {
  board.clearBlocking();
  _.each(figures, (fig) => {
    if (fig.type === 'neutral') {
      const x = Math.floor(fig.x / SCALE);
      const y = Math.floor(fig.y / SCALE);
      globalBoard.setCell(x, y, 'Blocking');
    }
  });
  console.log('post figure update');
  board.printBoard();
}

let lineOfSightViews = {
  layer: null,
  lines: null,
};

function makeLineOfSightLayer() {
  const layer = new PIXI.Container();

  lineOfSightViews.layer = layer;
  lineOfSightViews.lines = [];

  return layer;
}

function makeLine(
  x0: number, y0: number,
  x1: number, y1: number,
) {
  let line = new PIXI.Graphics();
  line.lineStyle(2, 0xFFFFFF, 1);
  line.moveTo(x0 * SCALE, y0 * SCALE);
  line.lineTo(x1 * SCALE, y1 * SCALE);
  return line;
}

function updateLineOfSight(board, figures, lineOfSightViews) {
  let sourceX, sourceY, targetX, targetY;
  _.each(figures, (fig) => {
    if (fig.type === 'source') {
      sourceX = Math.floor(fig.x / SCALE);
      sourceY = Math.floor(fig.y / SCALE);
    } else if (fig.type === 'target') {
      targetX = Math.floor(fig.x / SCALE);
      targetY = Math.floor(fig.y / SCALE);
    }
  });
  console.log(sourceX, sourceY, targetX, targetY);
  let result = board.checkLineOfSight(sourceX, sourceY, targetX, targetY);
  console.log(result);

  _.each(lineOfSightViews.lines, (line) => {
    lineOfSightViews.layer.removeChild(line);
  });
  lineOfSightViews.lines = [];

  if (result.hasLineOfSight) {
    const sourcePoint = cellToPoint({x: sourceX, y: sourceY}, result.sourceCorner);
    const targetCellPoint = {x: targetX, y: targetY};
    const pointA = cellToPoint(targetCellPoint, result.targetCorners[0]);
    const pointB = cellToPoint(targetCellPoint, result.targetCorners[1]);
    lineOfSightViews.lines.push(
      makeLine(sourcePoint.x, sourcePoint.y, pointA.x, pointA.y),
    );
    lineOfSightViews.lines.push(
      makeLine(sourcePoint.x, sourcePoint.y, pointB.x, pointB.y),
    );
  }
  _.each(lineOfSightViews.lines, (line) => {
    lineOfSightViews.layer.addChild(line);
  });
}

fetch('/api/board').then(response => {
  if (!response.ok) {
    alert('Unable to fetch board');
  }
  return response.text();
}).then(text => {
  const board = boardFromMapFile(text);
  board.clearBlocking();
  board.printBoard();
  setBoard(board);
});
