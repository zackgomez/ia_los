/* @flow */
'use strict';

import _ from 'lodash';
import nullthrows from 'nullthrows';

import {cellToPoint} from './board.js';
import type Board, {Point, LineOfSightResult} from './board.js';
import type {Piece, PieceMap} from './Piece.js';

export type ToolEnum = 'pointer' | 'terrain';

declare var PIXI: any;

export type UIState = {
  currentTool: Tool;
  availableTools: Array<Tool>;
  needsRender: boolean;
};

export type ToolContext = {
  board: Board,
  figures: {[key: string]: Piece};
  SCALE: number;
}

export class Tool {
  getName(): string {
    throw new Error('unimplemented');
  }
  onMouseDown(event: any, state: UIState, context: ToolContext): UIState {
    return state;
  }
  onMouseMove(event: any, state: UIState, context: ToolContext): UIState {
    return state;
  }
  onMouseUp(event: any, state: UIState, context: ToolContext): UIState {
    return state;
  }

  renderLayer(state: UIState, context: ToolContext): any {
    return null;
  }
};

export class PointerTool extends Tool {
  dragData_ : ?{
    startCellX: number,
    startCellY: number,
    startX: number,
    startY: number,
    entityStartX: number,
    entityStartY: number,
    entity: any;
    piece: Piece;
  };
  lastSourcePosition_: ?Point;
  lastTargetPosition_: ?Point;
  lastLineOfSightResult_: ?LineOfSightResult;
  constructor() {
    super();

    this.dragData_ = null;
  }
  getName(): string {
    return 'Pointer';
  }
  onMouseDown(e: any, state: UIState, context: ToolContext): UIState {
    if (!e.currentTarget) {
      return state;
    }
    if (this.dragData_) {
      return state;
    }
    const piece = context.figures[e.target.id];
    if (!piece) {
      return state;
    }

    const startX = e.data.global.x;
    const startY = e.data.global.y;
    const dragData = {
      entity: e.target,
      piece,
      entityStartX: e.target.x,
      entityStartY: e.target.y,
      startX,
      startY,
      startCellX: piece.cellX,
      startCellY: piece.cellY,
    };
    this.dragData_ = dragData;
    state.needsRender = true;
    return state;
  }
  onMouseMove(e: any, state: UIState, context: ToolContext): UIState {
    const dragData = this.dragData_;
    if (!dragData) {
      return state;
    }
    dragData.piece.dragPosition = {
      x: dragData.entityStartX + (e.data.global.x - dragData.startX),
      y: dragData.entityStartY + (e.data.global.y - dragData.startY),
    };
    state.needsRender = true;
    return state;
  }
  onMouseUp(e: any, state: UIState, context: ToolContext): UIState {
    const dragData = this.dragData_;
    if (!dragData) {
      return state;
    }

    const position = e.data.global;
    const targetCellX = Math.floor(position.x / context.SCALE);
    const targetCellY = Math.floor(position.y / context.SCALE);

    dragData.piece.cellX = targetCellX;
    dragData.piece.cellY = targetCellY;
    dragData.piece.dragPosition = null;

    updateBoardWithFigures(context.board, context.figures);
    this.updateLineOfSight(context.board, context.figures);

    this.dragData_ = null;
    state.needsRender = true;

    return state;
  }
  makeLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    scale: number,
  ): any {
    let line = new PIXI.Graphics();
    line.lineStyle(2, 0xFFFFFF, 1);
    line.moveTo(x0 * scale, y0 * scale);
    line.lineTo(x1 * scale, y1 * scale);
    return line;
  }
  renderLayer(state: UIState, context: ToolContext): any {
    const layer = new PIXI.Container();

    let sourceX, sourceY, targetX, targetY;

    const result = this.lastLineOfSightResult_;
    if (result && result.hasLineOfSight) {
      const sourcePoint = cellToPoint(
        nullthrows(this.lastSourcePosition_),
        nullthrows(result.sourceCorner),
      );
      const targetCellPoint = nullthrows(this.lastTargetPosition_);
      const targetCorners = nullthrows(result.targetCorners);
      const pointA = cellToPoint(targetCellPoint, targetCorners[0]);
      const pointB = cellToPoint(targetCellPoint, targetCorners[1]);
      layer.addChild(
        this.makeLine(sourcePoint.x, sourcePoint.y, pointA.x, pointA.y, context.SCALE),
      );
      layer.addChild(
        this.makeLine(sourcePoint.x, sourcePoint.y, pointB.x, pointB.y, context.SCALE),
      );
    }
    return layer;
  }

  updateLineOfSight(board: Board, figures: PieceMap): void {
    let sourceX, sourceY, targetX, targetY;
    _.each(figures, (fig) => {
      if (fig.type === 'source') {
        sourceX = Math.floor(fig.cellX);
        sourceY = Math.floor(fig.cellY);
      } else if (fig.type === 'target') {
        targetX = Math.floor(fig.cellX);
        targetY = Math.floor(fig.cellY);
      }
    });

    sourceX = nullthrows(sourceX);
    sourceY = nullthrows(sourceY);
    targetX = nullthrows(targetX);
    targetY = nullthrows(targetY);

    let result = board.checkLineOfSight(sourceX, sourceY, targetX, targetY);
    this.lastLineOfSightResult_ = result;
    this.lastSourcePosition_ = {x: sourceX, y: sourceY};
    this.lastTargetPosition_ = {x: targetX, y: targetY};
  }
}

function updateBoardWithFigures(board: Board, figures: PieceMap) {
  board.clearBlocking();
  _.each(figures, (fig) => {
    if (fig.type === 'neutral') {
      board.setCell(fig.cellX, fig.cellY, 'Blocking');
    }
  });
  board.printBoard();
}



export function getToolDefinitions(): Array<Tool> {
  return [
    new PointerTool(),
  ];
}
