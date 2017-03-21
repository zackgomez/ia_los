/* @flow */
import fs from 'fs';

type Cell = 'Empty' | 'Blocking' | 'Source' | 'Target';

class Board {
  width: number;
  height: number;
  board: Array<Cell>;

  constructor() {
    this.height = 4;
    this.width = 4;
    this.board = [
      '-', '-', 'b', '-',
      '-', 'X', '-', '-',
      '-', '-', 'X', '-',
      '-', 'a', '-', '-',
    ].map(x => {return {'-': 'Empty', 'X': 'Blocking', 'a': 'Source', 'b': 'Target'}[x]});
  }

  get(x: number, y: number): Cell {
    return this.board[x + y * this.width];
  }
}


const board = new Board();

for (let y = 0; y < board.height; y++) {
  for (let x = 0; x < board.width; x++) {
    console.log(board.get(x, y));
  }
}
