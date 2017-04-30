/* @flow weak */

'use strict';

import 'pixi.js';
import Board, {emptyBoard, boardFromMapFile, cellToPoint} from './board.js';
import type {Point} from './board.js';
import 'isomorphic-fetch';
import _ from 'lodash';
import nullthrows from 'nullthrows';

import type {ToolEnum, UIState, Tool, ToolContext} from './tools.js';
import {getToolDefinitions} from './tools.js';
import type {Piece} from './Piece.js';

const VIEWPORT_WIDTH = 640;
const VIEWPORT_HEIGHT = 480;

let renderer = new PIXI.autoDetectRenderer(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
renderer.backgroundColor = 0x777777;
//renderer.autoResize = true;

if (document.body) {
  document.body.appendChild(renderer.view);
}

const interactionManager = renderer.plugins.interaction;

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
function makeFigure(
  id: string,
  type: string,
  color: number,
  cellX: number,
  cellY: number,
): Piece {
  return {
    id,
    type,
    color,
    cellX,
    cellY,
    dragPosition: null,
  };
}

let figures: {[key: string]: Piece} = {};

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
      figure.id, figure.type, figure.color, figure.cellX, figure.cellY
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
  uiState.needsRender = false;
  const mousePosition = interactionManager.mouse.global;

  const root = new PIXI.Container();

  const board = globalBoard;
  if (board) {
    root.addChild(getGridLayer(board));
    root.addChild(getEdgeLayer(board));
    root.addChild(makeFigureLayer());
    root.addChild(makeUILayer(uiState));
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

function getToolContext(): ToolContext {
  return {
    figures,
    SCALE,
    board: globalBoard,
  };
}

function renderIfNecessary(): void {
  if (uiState.needsRender) {
    render();
  }
}

interactionManager.on('mousemove', e => {
  uiState = uiState.currentTool.onMouseMove(e, uiState, getToolContext());
  renderIfNecessary();
});
interactionManager.on('mousedown', e => {
  uiState = uiState.currentTool.onMouseDown(e, uiState, getToolContext());
  renderIfNecessary();
});
interactionManager.on('mouseup', e => {
  uiState = uiState.currentTool.onMouseUp(e, uiState, getToolContext());
  renderIfNecessary();
});


const allTools = getToolDefinitions();

let uiState: UIState = {
  currentTool: allTools[0],
  availableTools: allTools,
  needsRender: true,
};

function setCurrentTool(newTool: Tool): void {
  uiState.currentTool = newTool;
  uiState.needsRender = true;
  renderIfNecessary();
}

function makeUILayer(state: UIState) {
  let layer = new PIXI.Container();

  layer.addChild(
    uiState.currentTool.renderLayer(uiState, getToolContext()),
  );

  let x = 10;
  let y = 10;
  const BUTTON_DIM = 30;

  state.availableTools.forEach((tool) => {
    const selected = tool === state.currentTool;
    const style = {
      align: 'center',
      fontSize: 16,
      fill: selected ? '#00FF00' : '#FFFFFF',
    }
    let button = new PIXI.Text(tool.getName(), style);
    button.x = x;
    button.y = y;
    y += BUTTON_DIM;
    button.interactive = true;
    button.buttonMode = true;
    button.on('pointerdown', () => {
      setCurrentTool(tool);
    });
    layer.addChild(button);
  });

  return layer;
}

let globalBoard = null;
function setBoard(board) {
  globalBoard = board;
  setupFigures();
}

(() => {
  const board = emptyBoard(10, 10);
  setBoard(board);
  board.printBoard();
  render();
})();

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
