import Board, {boardFromRows} from './board';
import fs from 'mz/fs';

const contents = fs.readFileSync('derpy.map', {encoding: 'utf8'});
let rows = contents.split('\n');
rows = rows.filter(s => s.length > 0);
rows = rows.map(row => row.split(''));
const board = boardFromRows(rows);

const largeContents = fs.readFileSync('derpy_large.map', {encoding: 'utf8'});
rows = largeContents.split('\n');
rows = rows.filter(s => s.length > 0);
rows = rows.map(row => row.split(''));
const largeBoard = boardFromRows(rows);

test('large figures', () => {
  console.log('Read Map:');
  console.log(largeContents);
  console.log('Original board:');
  largeBoard.printBoard();
  console.log('Testing line of sight...');
  let checks = [
    [[{x: 0, y: 1}, {x: 1, y: 1}], [{x: 5, y: 0}, {x: 6, y: 0}]],
    [[{x: 5, y: 0}, {x: 6, y: 0}], [{x: 0, y: 1}, {x: 1, y: 1}]],
    [[{x: 5, y: 0}, {x: 6, y: 0}], [{x: 6, y: 3}, {x: 7, y: 3}]],
    [[{x: 6, y: 3}, {x: 7, y: 3}], [{x: 5, y: 0}, {x: 6, y: 0}]],
    [[{x: 6, y: 3}, {x: 7, y: 3}],
     [{x: 5, y: 0}, {x: 6, y: 0}],
     {ignoreFigures: true}],
    [[{x: 1, y: 0}], [{x: 6, y: 0}]],
    [[{x: 1, y: 0}], [{x: 6, y: 0}], {ignoreFigures: false, cellsToIgnore: [{x: 5, y: 0}]}],
    [[{x: 0, y: 2}], [{x: 6, y: 3}, {x: 7, y: 3}]],
    [[{x: 0, y: 2}], [{x: 6, y: 3}, {x: 7, y: 3}], {ignoreFigures: true}],
    [[{x: 6, y: 3}, {x: 7, y: 3}], [{x: 0, y: 2}]],
    [[{x: 6, y: 3}, {x: 7, y: 3}], [{x: 0, y: 2}], {ignoreFigures: true}],
    [[{x: 1, y: 0}], [{x: 0, y: 1}, {x: 1, y: 1}]],
    [[{x: 0, y: 1}, {x: 1, y: 1}], [{x: 1, y: 0}]],
  ];
  let expectedResults = [
    true,
    true,
    true,
    false,
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    false,
    false,
  ];
  let results = [];
  for (let i = 0; i < checks.length; i++) {
    let check = checks[i];
    let result = largeBoard.checkLineOfSightFigures(check[0], check[1], check[2]);
    largeBoard.printLineOfSightFiguresResult(check[0], check[1], result);
    console.log(result);
    expect(result.hasLineOfSight).toBe(expectedResults[i]);
  }
  // expect(2).toBe(2);
});

test('ignore figures', () => {
  const sourceX = 1;
  const sourceY = 0;
  const targetX = 1;
  const targetY = 2;
  expect(board.checkLineOfSight(sourceX, sourceY, targetX, targetY, {ignoreFigures: false}).hasLineOfSight).toBe(false);
  expect(board.checkLineOfSight(sourceX, sourceY, targetX, targetY, {ignoreFigures: true}).hasLineOfSight).toBe(true);

  expect(board.checkLineOfSight(3, 0, 5, 0, {ignoreFigures: false}).hasLineOfSight).toBe(false);
  expect(board.checkLineOfSight(3, 0, 5, 0, {ignoreFigures: true}).hasLineOfSight).toBe(false);
});


test('adjacency', () => {
  expect(board.areCellsAdjacent({x: 0, y: 0}, {x: 1, y: 1})).toBe(true);
  expect(board.areCellsAdjacent({x: 1, y: 0}, {x: 1, y: 1})).toBe(false);
  expect(board.areCellsAdjacent({x: 0, y: 0}, {x: 0, y: 1})).toBe(true);
  expect(board.areCellsAdjacent({x: 2, y: 0}, {x: 1, y: 2})).toBe(false);
  expect(board.areCellsAdjacent({x: 3, y: 3}, {x: 5, y: 3})).toBe(false);
  expect(board.areCellsAdjacent({x: 5, y: 0}, {x: 4, y: 0})).toBe(true);
  expect(board.areCellsAdjacent({x: 4, y: 0}, {x: 5, y: 1})).toBe(false);
  expect(board.areCellsAdjacent({x: 1, y: 3}, {x: 2, y: 3})).toBe(false);
  expect(board.areCellsAdjacent({x: 4, y: 2}, {x: 5, y: 3})).toBe(true);
  expect(board.areCellsAdjacent({x: 1, y: 1}, {x: 2, y: 0})).toBe(false);
});

test('small figures', () => {
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
