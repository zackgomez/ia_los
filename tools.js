/* @flow */
'use strict';

import _ from 'lodash';
import nullthrows from 'nullthrows';

import {cellToPoint} from './board.js';
import type Board, {Cell, Point, LineOfSightResult, EdgeDirection, Edge} from './board.js';
import type {Piece, PieceMap} from './Piece.js';
import {makeButton} from './UIUtils.js';

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
  viewWidth: number;
  viewHeight: number;

  cellPositionFromEvent: (e: any) => Point;
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
  onRightDown(event: any, state: UIState, context: ToolContext): UIState {
    return state;
  }
  onRightUp(event: any, state: UIState, context: ToolContext): UIState {
    return state;
  }

  showFigureLayer(state: UIState, context: ToolContext): bool {
    return true;
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


type TerrainSubtool = 'Cell' | 'Edge';

export class TerrainTool extends Tool {
  selectedSubtool_: TerrainSubtool = 'Cell';
  dragging_: boolean = false;
  dragCellType_: ?Cell = null;
  dragEdgeType_: ?Edge = null;

  cellType_: Cell = 'OutOfBounds';
  candidateCell_: ?Point;

  edgeType_: Edge = 'Wall';
  candidateEdge_: ?[Point, EdgeDirection];

  getName(): string {
    return 'Terrain';
  }

  setCellIfPossible(board: Board, cellPosition: Point, cell: Cell): bool {
    if (board.isValidCell(cellPosition.x, cellPosition.y)) {
      if (board.getCell(cellPosition.x, cellPosition.y) !== cell) {
        board.setCell(cellPosition.x, cellPosition.y, cell);
      }
      return true;
    }
    return false;
  }

  affectedEdgeFromEvent(event: any, context: ToolContext): ?[Point, EdgeDirection] {
    let x = event.data.global.x / context.SCALE;
    let y = event.data.global.y / context.SCALE;
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const xFrac = x - cellX;
    const yFrac = y - cellY;

    const THRESHOLD = 0.25;

    const point = {x: cellX, y: cellY};

    let candidates = [
      [[{x: cellX, y: cellY}, 'Down'], xFrac], // Left
      [[{x: cellX + 1, y: cellY}, 'Down'], 1 - xFrac], // Right
      [[{x: cellX, y: cellY}, 'Right'], yFrac], // Top
      [[{x: cellX, y: cellY + 1}, 'Right'], 1 - yFrac], // Bottom
    ]

    const [bestRet, bestDist] = _.maxBy(candidates, ([ret, dist]) => -dist);
    if (bestDist > THRESHOLD) {
      return null;
    }

    if (!context.board.isValidEdge(bestRet[0].x, bestRet[0].y, bestRet[1])) {
      return null;
    }

    return bestRet;
  }
  candidateCellFromEvent(event: any, context: ToolContext): ?Point {
    const point = context.cellPositionFromEvent(event);
    if (context.board.isValidCell(point.x, point.y)) {
      return point;
    }
    return null;
  }

  onMouseDown(event: any, state: UIState, context: ToolContext): UIState {
    const cellPosition = context.cellPositionFromEvent(event);
    const board = context.board;

    if (!board.isValidCell(cellPosition.x, cellPosition.y)) {
      return state;
    }

    switch(this.selectedSubtool_) {
    case 'Cell':
      if (!this.candidateCell_) {
        return state;
      }
      this.dragCellType_ = this.cellType_;
      break;

    case 'Edge':
      if (!this.candidateEdge_) {
        return state;
      }
      this.dragEdgeType_ = this.edgeType_;
      break;
    }

    this.dragging_ = true;
    this.writeIfPossible(context);

    state.needsRender = true;
    return state;
  }
  writeIfPossible(context: ToolContext): void {
    if (!this.dragging_) {
      return;
    }
    switch(this.selectedSubtool_) {
    case 'Cell':
      if (this.candidateCell_) {
        this.setCellIfPossible(
          context.board,
          this.candidateCell_,
          nullthrows(this.dragCellType_),
        );
      }
      break;

    case 'Edge':
      if (this.candidateEdge_) {
        const [{x, y}, dir] = this.candidateEdge_;
        context.board.setEdge(x, y, dir, nullthrows(this.dragEdgeType_));
      }
      break;
    }
  }
  onMouseMove(event: any, state: UIState, context: ToolContext): UIState {
    state.needsRender = true;
    switch(this.selectedSubtool_) {
    case 'Cell':
      this.candidateEdge_ = null;
      this.candidateCell_ = this.candidateCellFromEvent(event, context);
      break;
    case 'Edge':
      this.candidateEdge_ = this.affectedEdgeFromEvent(event, context);
      this.candidateCell_ = null;
      break;
    }

    this.writeIfPossible(context);

    return state;
  }
  endDragging_(): void {
    this.dragging_ = false;
    this.dragCellType_ = null;
    this.dragEdgeType_ = null;
  }
  onMouseUp(event: any, state: UIState, context: ToolContext): UIState {
    this.endDragging_();
    return state;
  }
  onRightDown(event: any, state: UIState, context: ToolContext): UIState {
    if (this.dragging_) {
      return state;
    }
    if (this.selectedSubtool_ === 'Cell') {
      this.dragCellType_ = 'Empty';
      const updated = this.setCellIfPossible(
        context.board,
        context.cellPositionFromEvent(event),
        this.cellType_,
      )
    } else if (this.selectedSubtool_ === 'Edge') {
      this.dragEdgeType_ = 'Clear';
    }
    this.dragging_ = true;
    state.needsRender = true;
    return state;
  }
  onRightUp(event: any, state: UIState, context: ToolContext): UIState {
    this.endDragging_();
    return state;
  }

  showFigureLayer(state: UIState, context: ToolContext): bool {
    return false;
  }
  renderLayer(state: UIState, context: ToolContext): any {
    const layer = new PIXI.Container();

    const BUTTON_SIZE = {
      width: 50,
      height: 30,
    };
    const PADDING = 10;
    let x = context.viewWidth - PADDING - BUTTON_SIZE.width;
    let y = context.viewHeight - PADDING - BUTTON_SIZE.height;

    const BUTTONS = ['Edge', 'Cell'];
    BUTTONS.forEach(title => {
      const button = makeButton(
        title,
        BUTTON_SIZE,
        {},
        () => {
          this.selectedSubtool_ = title;
        },
      );
      button.x = x;
      button.y = y;
      layer.addChild(button);
      y -= PADDING - BUTTON_SIZE.height;
    });

    const candidateEdge = this.candidateEdge_;
    if (candidateEdge) {
      let edgeOverlay = new PIXI.Graphics();
      edgeOverlay.lineStyle(6, 0x4444EE, 0.8);
      const [xdir, ydir] = (candidateEdge[1] === 'Down') ? [0, 1] : [1, 0];
      edgeOverlay.moveTo(
        context.SCALE * candidateEdge[0].x,
        context.SCALE * candidateEdge[0].y,
      );
      edgeOverlay.lineTo(
        context.SCALE * (candidateEdge[0].x + xdir),
        context.SCALE * (candidateEdge[0].y + ydir),
      );
      layer.addChild(edgeOverlay);
    }
    const candidateCell = this.candidateCell_;
    if (candidateCell) {
      let cellOverlay = new PIXI.Graphics();
      cellOverlay.beginFill(0x4444EE, 0.5);
      cellOverlay.drawRect(
        context.SCALE * candidateCell.x,
        context.SCALE * candidateCell.y,
        context.SCALE,
        context.SCALE,
      );
      cellOverlay.endFill();
      layer.addChild(cellOverlay);
    }

    return layer;
  }
};



export function getToolDefinitions(): Array<Tool> {
  return [
    new PointerTool(),
    new TerrainTool(),
  ];
}
