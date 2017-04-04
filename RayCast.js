
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
