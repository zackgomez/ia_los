import Board from './board';

export function resizeBoard(
  board: Board,
  width: number,
  height: number,
): Board {
  const cells = _.times(width * height, (i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    if (x == width - 1 || y == width - 1) {
      return 'Empty';
    }
    return board.getCell(x, y);
  });
  const getEdges = (direction) => {
    return _.times(width * height, (i) => {
      const x = i % width;
      const y = Math.floor(i / width);

      if (x >= board.getWidth() || y >= board.getHeight()) {
        return 'Clear';
      }
      return board.getEdge(x, y, direction);
    });
  };
  return new Board(
    width,
    height,
    cells,
    getEdges('Right'),
    getEdges('Down'),
  );
}
