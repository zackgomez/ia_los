import Board, {boardFromRows} from './board';
import fs from 'mz/fs';

test('blocked edges', () => {
  const contents = fs.readFileSync('derpy.map', {encoding: 'utf8'});
  console.log('Read Map:');
  console.log(contents);
  let rows = contents.split('\n');
  rows = rows.filter(s => s.length > 0);

  rows = rows.map(row => row.split(''));
  const board = boardFromRows(rows);
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
  ];
  let results = [];
  for (let i = 0; i < checks.length; i++) {
    let check = checks[i];
    let result = board.checkLineOfSight(check[0], check[1], check[2], check[3]);
    board.printLineOfSightResult(check[0], check[1], check[2], check[3], result);
    console.log(result);
    results.push(result);
  }

  expect(results.every((s, i) => s.hasLineOfSight === expectedResults[i])).toBe(true);
});

/*test('board edges', () => {
  let board = new Board(2, 2, ['Empty', 'Empty', 'Empty', 'Empty']);

  expect(board.getEdge(0, 0, 'Down')).toBe('Blocked');
  expect(board.getEdge(0, 1, 'Down')).toBe('Blocked');
  expect(board.getEdge(2, 0, 'Down')).toBe('Blocked');
  expect(board.getEdge(2, 1, 'Down')).toBe('Blocked');

  expect(board.getEdge(0, 0, 'Right')).toBe('Blocked');
  expect(board.getEdge(1, 0, 'Right')).toBe('Blocked');
  expect(board.getEdge(0, 2, 'Right')).toBe('Blocked');
  expect(board.getEdge(1, 2, 'Right')).toBe('Blocked');
});

test('disconnected by diagonal blockers', () => {
  let board = new Board(2, 2, ['Empty', 'Blocking', 'Blocking', 'Empty']);

  expect(board.areCellsConnected(0, 0, 1, 1)).toBe(false);
  expect(board.areCellsConnected(1, 1, 0, 0)).toBe(false);
});

test('connected with one blocked edge', () => {
  let board = new Board(2, 2, ['Empty', 'Empty', 'Blocking', 'Empty']);

  // diagonal
  expect(board.areCellsConnected(0, 0, 1, 1)).toBe(true);
  expect(board.areCellsConnected(1, 1, 0, 0)).toBe(true);

  // horizontal
  expect(board.areCellsConnected(0, 0, 1, 0)).toBe(true);
  expect(board.areCellsConnected(1, 0, 0, 0)).toBe(true);

  // vertical
  expect(board.areCellsConnected(1, 0, 1, 1)).toBe(true);
  expect(board.areCellsConnected(1, 1, 1, 0)).toBe(true);
});

test('disconnected by horizontal wall', () => {
  let board = new Board(2, 2, ['Empty', 'Empty', 'Blocking', 'Blocking']);
  expect(board.areCellsConnected(0, 0, 1, 1)).toBe(false);
  expect(board.areCellsConnected(1, 1, 0, 0)).toBe(false);
});
*/