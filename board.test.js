import Board from './board';

test('blocked edges', () => {
  let board = new Board(2, 2, ['Empty', 'Empty', 'Blocking', 'Empty']);

  expect(board.getEdge(0, 1, 'Down')).toBe('Blocked');
  expect(board.getEdge(0, 1, 'Right')).toBe('Blocked');

  expect(board.getEdge(1, 1, 'Down')).toBe('Blocked');
  expect(board.getEdge(1, 1, 'Right')).toBe('Clear');

  expect(board.getEdge(0, 2, 'Right')).toBe('Blocked');
});

test('board edges', () => {
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
