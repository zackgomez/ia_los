import Board, {boardFromRows} from './board';
import fs from 'mz/fs';

const contents = fs.readFileSync('derpy.map', {encoding: 'utf8'});
let rows = contents.split('\n');
rows = rows.filter(s => s.length > 0);

rows = rows.map(row => row.split(''));
const board = boardFromRows(rows);

test('blocked edges', () => {
  console.log('Read Map:');
  console.log(contents);
  console.log('Original board:');
  board.printBoard();
  console.log('Testing line of sight...');
  let checks = [
    [5, 1, 5, 3],
    [5, 3, 5, 1],
    [5, 3, 0, 2],
    [0, 2, 5, 3],
    [1, 1, 2, 0],
    [2, 0, 1, 1],
    [4, 0, 5, 0],
    [5, 0, 4, 0],
    [4, 0, 5, 1],
    [5, 1, 4, 0],
    [0, 1, 5, 1],
    [5, 1, 0, 1],
    [4, 2, 0, 1],
    [0, 1, 4, 2],
    [0, 0, 1, 1],
    [1, 1, 0, 0],
    [0, 0, 5, 1],
    [5, 1, 0, 0],
  ];
  let expectedResults = [
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    true,
    false,
    false,
  ];
  let results = [];
  for (let i = 0; i < checks.length; i++) {
    let check = checks[i];
    let result = board.checkLineOfSight(check[0], check[1], check[2], check[3]);
    board.printLineOfSightResult(check[0], check[1], check[2], check[3], result);
    console.log(result);
    expect(result.hasLineOfSight).toBe(expectedResults[i]);
  }
});

test('ignore figures', () => {
  const sourceX = 1;
  const sourceY = 0;
  const targetX = 1;
  const targetY = 2;
  expect(board.checkLineOfSight(sourceX, sourceY, targetX, targetY, {ignoreFigures: false}).hasLineOfSight).toBe(false);
  expect(board.checkLineOfSight(sourceX, sourceY, targetX, targetY, {ignoreFigures: true}).hasLineOfSight).toBe(true);
});
