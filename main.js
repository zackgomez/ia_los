/* @flow */
import fs from 'mz/fs';
import _ from 'lodash';

import Board, {boardFromRows} from './board';
import type {Cell} from './board';

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

  rows = rows.map(row => row.split(''));
  const board = boardFromRows(rows);
}
main().catch(e => {
  console.error(e);
  process.exit(-1);
});
