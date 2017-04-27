/* @flow weak */

'use strict';

import 'pixi.js';
import Board, {emptyBoard, boardFromMapFile, cellToPoint} from './board.js';
import type {Point} from './board.js';
import 'isomorphic-fetch';
import _ from 'lodash';
import nullthrows from 'nullthrows';

const VIEWPORT_WIDTH = 640;
const VIEWPORT_HEIGHT = 480;

let renderer = new PIXI.autoDetectRenderer(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
renderer.backgroundColor = 0x777777;
//renderer.autoResize = true;

if (document.body) {
  document.body.appendChild(renderer.view);
}

const interactionManager = renderer.plugins.interaction;

let dragData = {
  startCellX: null,
  startCellY: null,
  startX: null,
  startY: null,
  entityStartX: null,
  entityStaryY: null,
  entity: null,
  piece: null,
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
function makeFigureView(id: string, type: string, color: any, x: number, y: number) {
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
function makeFigure(id: string, type: string, color: number, x: number, y: number) {
  return {
    id,
    type,
    color,
    x,
    y,
  };
}

let selectedFigureID: ?string = null;
type Piece = {
  id: string;
  type: string;
  color: number;
  cellX: number;
  cellY: number;
  dragPosition: ?Point;
}
let figures = {};

function setupFigures() {
  const source = makeFigure(makeFigureID(), 'source', 0x0000FF, 2, 2);
  figures[source.id] = source;

  const target = makeFigure(makeFigureID(), 'target', 0xDD1122, 2, 3);
  figures[target.id] = target;

  _.times(4, (i) => {
    const fig = makeFigure(makeFigureID(), 'neutral', 0x333333, i, 0);
    figures[fig.id] = fig;
  });
}

function makeFigureLayer() {
  let layer = new PIXI.Container();
  _.each(figures, (figure, id) => {
    const view = makeFigureView(
      figure.id, figure.type, figure.color, figure.x, figure.y
    );
    if (figure.dragPosition) {
      view.x = figure.dragPosition.x;
      view.y = figure.dragPosition.y;
    }
    layer.addChild(view);
  });

  return layer;
}

let stage = null;
function render() {
  const mousePosition = interactionManager.mouse.global;

  const root = new PIXI.Container();

  const board = globalBoard;
  if (board) {
    root.addChild(getGridLayer(board));
    root.addChild(getEdgeLayer(board));
    root.addChild(makeFigureLayer());
    root.addChild(makeLineOfSightLayer(board, figures));
  }

  let mouseInfo = new PIXI.Text('Derp', new PIXI.TextStyle({
    fontSize: 12,
    stroke: '#00FF00',
    fill: '#00FF00',
  }));
  mouseInfo.text = `Mouse x: ${mousePosition.x} y: ${mousePosition.y}`;

  root.addChild(mouseInfo);
  stage = root;

  renderer.render(root);
}

interactionManager.on('mousemove', e => {
  if (dragData.piece) {
    dragData.piece.dragPosition = {
      x: dragData.entityStartX + (e.data.global.x - dragData.startX),
      y: dragData.entityStartY + (e.data.global.y - dragData.startY),
    };
  }
  render();
});
interactionManager.on('mousedown', e => {
  if (!e.currentTarget) {
    return;
  }
  if (dragData.entity) return;
  dragData.entity = e.target;
  dragData.piece = figures[e.target.id];
  dragData.entityStartX = e.target.x;
  dragData.entityStartY = e.target.y;
  dragData.startX = e.data.global.x;
  dragData.startY = e.data.global.y;
  dragData.startCellX = Math.floor(dragData.startX / SCALE);
  dragData.startCellY = Math.floor(dragData.startY / SCALE);
  console.log('down', e.data.getLocalPosition(stage));
  render();
});
interactionManager.on('mouseup', e => {
  const position = e.data.getLocalPosition(stage);
  console.log('up', position);
  if (dragData.entity) {
    console.log(dragData);
    const targetCellX = Math.floor(position.x / 50);
    const targetCellY = Math.floor(position.y / 50);
    dragData.entity.x = targetCellX * SCALE + SCALE/2;
    dragData.entity.y = targetCellY * SCALE + SCALE/2;
    dragData.entity = null;
    dragData.piece.dragPosition = null;
    dragData.piece.x = targetCellX;
    dragData.piece.y = targetCellY;
    dragData.piece = null;
  }
  updateBoardWithFigures(globalBoard, figures);
  updateLineOfSight(globalBoard, figures);
  render();
});

type ToolEnum = 'pointer';
type UIState = {
  currentTool: ToolEnum;
  availableTools: Array<ToolEnum>;
};

let uiState: UIState = {
  currentTool: 'pointer',
  availableTools: [],
};

function makeUILayer(state: UIState) {
  let layer = new PIXI.Container();

  return layer;
}

render();

let globalBoard = null;
function setBoard(board) {
  globalBoard = board;
  setupFigures();
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

let lastSourcePosition = null;
let lastTargetPosition = null;
let lastLineOfSightResult = null;

function updateLineOfSight(board: Board, figures) {
  let sourceX, sourceY, targetX, targetY;
  _.each(figures, (fig) => {
    if (fig.type === 'source') {
      sourceX = Math.floor(fig.x);
      sourceY = Math.floor(fig.y);
    } else if (fig.type === 'target') {
      targetX = Math.floor(fig.x);
      targetY = Math.floor(fig.y);
    }
  });

  console.log(sourceX, sourceY, targetX, targetY);
  let result = board.checkLineOfSight(sourceX, sourceY, targetX, targetY);
  console.log(result);
  lastLineOfSightResult = result;
  lastSourcePosition = {x: sourceX, y: sourceY};
  lastTargetPosition = {x: targetX, y: targetY};
}

function makeLineOfSightLayer(board: Board, figures) {
  const layer = new PIXI.Container();

  let sourceX, sourceY, targetX, targetY;

  const result = lastLineOfSightResult;
  if (result && result.hasLineOfSight) {
    const sourcePoint = cellToPoint(
      nullthrows(lastSourcePosition),
      result.sourceCorner,
    );
    const targetCellPoint = nullthrows(lastTargetPosition);
    const pointA = cellToPoint(targetCellPoint, result.targetCorners[0]);
    const pointB = cellToPoint(targetCellPoint, result.targetCorners[1]);
    layer.addChild(
      makeLine(sourcePoint.x, sourcePoint.y, pointA.x, pointA.y),
    );
    layer.addChild(
      makeLine(sourcePoint.x, sourcePoint.y, pointB.x, pointB.y),
    );
  }
  return layer;
}

const board = emptyBoard(10, 10);
setBoard(board);
board.printBoard();

/*
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
*/
