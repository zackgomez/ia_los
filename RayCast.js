/* @flow */
import _ from 'lodash';

import type {Direction} from './board';
import type {EdgeDirection} from './board';


function findPointsEdgesCellsInRay(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): bool {
  return false;
}

/*
  visitorCell: (x: number, y: number) => ?T,
  visitorEdge: (x: number, y: number, dir: Direction) => ?T,
  visitorPoint: (x: number, y: number) => ?T,
*/
export function gridCastRay<T>(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  visitorCell: (x: number, y: number) => ?T,
  visitorEdge: (x: number, y: number, dir: EdgeDirection) => ?T,
  visitorPoint: (x: number, y: number) => ?T,
): ?T {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const x_inc = x1 === x0 ? 0 : ((x1 > x0) ? 1 : -1);
  const y_inc = y1 === y0 ? 0 : ((y1 > y0) ? 1 : -1);
  const x_offset = dx < 0 ? -1 : 0;
  const y_offset = dy < 0 ? -1 : 0;
  const diagonal = !(dx === 0 || dy === 0);

  for (let i = 0; i < Math.abs(dx); i++) {
    let x_del = x_inc * i;
    let y_del = y_inc * Math.floor(Math.abs(i * dy / dx));
    if (diagonal) {
      // intersection with cell
      const retCell = visitorCell(x0 + x_del + x_offset, y0 + y_del + y_offset);
      if (retCell !== null && retCell !== undefined) {
        return retCell;
      }
    }

    if ((i * dy) % dx) {
      // intersection with vertical edge
      const retEdge = visitorEdge(x0 + x_del, y0 + y_del + y_offset, 'Down');
      if (retEdge !== null && retEdge !== undefined) {
        return retEdge;
      }
    }
    else if (i !== 0) {
      // intersection with point
      const retPoint = visitorPoint(x0 + x_del, y0 + y_del);
      if (retPoint !== null && retPoint !== undefined) {
        return retPoint;
      }
    }
  }

  for (let j = 0; j < Math.abs(dy); j++) {
    let x_del = x_inc * Math.floor(Math.abs(j * dx / dy));
    let y_del = y_inc * j;
    if ((j * dx) % dy) {
      // intersection with horizontal edge
      const retEdge = visitorEdge(x0 + x_del + x_offset, y0 + y_del, 'Right');
      if (retEdge !== null && retEdge !== undefined) {
        return retEdge;
      }
      // intersection with cell
      const retCell = visitorCell(x0 + x_del + x_offset, y0 + y_del + y_offset);
      if (retCell !== null && retCell !== undefined) {
        return retCell;
      }
    }
    else if (j !== 0 && dx === 0) {
      // intersection with point
      const retPoint = visitorPoint(x0 + x_del, y0 + y_del);
      if (retPoint !== null && retPoint !== undefined) {
        return retPoint;
      }
    }
  }
}

export function gridCastRayArray(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): {
  cells: Array<{x: number, y: number}>, 
  edges: Array<{x: number, y: number, dir: EdgeDirection}>, 
  points: Array<{x: number, y: number}>,
} {
  let cells = [];
  let edges = [];
  let points = [];
  gridCastRay(x0, y0, x1, y1, 
    (x, y) => {cells.push({x, y});},
    (x, y, dir) => {edges.push({x, y, dir});},
    (x, y) => {points.push({x, y});},
  );
  return {cells, edges, points};
}


/*
export function gcd(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  while (true) {
    if (a < b) {
      let temp = a;
      a = b;
      b = temp;
    }
    const r = a % b;
    if (r === 0) return b;
    a = b;
    b = r;
  }
}




export function gridCastRay(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  visitor: (x: number, y: number) => ?T,
): ?T {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);

  const x_inc = x1 === x0 ? 0 : ((x1 > x0) ? 1 : -1);
  const y_inc = y1 === y0 ? 0 : ((y1 > y0) ? 1 : -1);

  let x = Math.floor(x0 + x_inc/2);
  let y = Math.floor(y0 + y_inc/2);
  let error = dx - dy;

  let n = dx + dy - gcd(dx, dy);
  for (; n > 0; n--) {
    if (x_inc > 0 && (x === x1)) {
      return;
    } else if (x_inc < 0 && (x < x1)) {
      return;
    }
    const ret = visitor(x, y);
    if (ret !== null && ret !== undefined) {
      return ret;
    }

    if (error === 0) {
      x = x + x_inc;
      y = y + y_inc;
      error = dx - dy;
    } else if (error > 0) {
      x = x + x_inc;
      error -= dy;
    } else {
      y = y + y_inc;
      error += dx;
    }
  }
}

export function gridCastRayArray(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<{x: number, y: number}> {
  let ret = [];
  gridCastRay(x0, y0, x1, y1, (x, y) => {
    ret.push({x, y});
  });
  return ret;
}
*/
