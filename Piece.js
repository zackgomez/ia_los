/* @flow */
'use strict';

import type {Point} from './board.js';

export type Piece = {
  id: string;
  type: string;
  color: number;
  cellX: number;
  cellY: number;
  dragPosition: ?Point;
}

export type PieceMap = {
  [key: string]: Piece;
}
