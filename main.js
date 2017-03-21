/* @flow */
import fs from 'mz/fs';
import _ from 'lodash';

type Cell = 'Empty' | 'Blocking' | 'Source' | 'Target';

class Board {
  width: number;
  height: number;
  board: Array<Cell>;

  constructor(width: number, height: number, board: Array<Cell>) {
    this.height = height;
    this.width = width;
    this.board = board;
  }

  get(x: number, y: number): Cell {
    return this.board[x + y * this.width];
  }
}

async function main() {
  if (process.argv.length <= 2) {
    console.log(`Usage: ${process.argv[1]} mapfile`);
    process.exit(-1);
  }
  const filename = process.argv[2];

  const contents = await fs.readFile(filename, {encoding: 'utf8'});
  console.log('Read Map:');
  console.log(contents);
  let rows = contents.split('\n');
  rows = rows.filter(s => s.length > 0);

  if (rows.length === 0) {
    console.log('map has no rows');
    process.exit(-1);
  }

  const height = rows.length;
  const width = rows[0].length;
  const valid_rows = rows.every(row => {
    return row.length === width;
  });
  if (!valid_rows) {
    console.log('invalid row');
  }

  const input_to_cell_map = {
    '-': 'Empty',
    'X': 'Blocking',
    'a': 'Source',
    'b': 'Target',
  };

  const raw_board = _.flatten(rows.map(row => row.split(''))).map(x => {
    const ret = input_to_cell_map[x];
    if (!ret) {
      throw new Error(`bad input: '${x}'`);
    }
    return ret;
  });

  const board = new Board(width, height, raw_board);
}

main().catch(e => {
  console.log(e);
  throw e;
});
