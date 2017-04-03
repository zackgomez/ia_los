import {gridCastRayArray} from './RayCast';

test('vertical line', () => {
  expect(gridCastRayArray(0, 0, 0, 5)).toEqual([
    {x:0, y:0},
    {x:0, y:1},
    {x:0, y:2},
    {x:0, y:3},
    {x:0, y:4},
  ]);

  expect(gridCastRayArray(0, 5, 0, 0)).toEqual([
    {x:0, y:4},
    {x:0, y:3},
    {x:0, y:2},
    {x:0, y:1},
    {x:0, y:0},
  ]);
});

test('horizontal lines', () => {
  expect(gridCastRayArray(0, 0, 5, 0)).toEqual([
    {x:0, y:0},
    {x:1, y:0},
    {x:2, y:0},
    {x:3, y:0},
    {x:4, y:0},
  ]);

  expect(gridCastRayArray(5, 0, 0, 0)).toEqual([
    {x:4, y:0},
    {x:3, y:0},
    {x:2, y:0},
    {x:1, y:0},
    {x:0, y:0},
  ]);
});

test('|slope| = 1', () => {
  expect(gridCastRayArray(0, 0, 5, 5)).toEqual([
    {x:0, y:0},
    {x:1, y:1},
    {x:2, y:2},
    {x:3, y:3},
    {x:4, y:4},
  ]);

  expect(gridCastRayArray(5, 5, 0, 0)).toEqual([
    {x:4, y:4},
    {x:3, y:3},
    {x:2, y:2},
    {x:1, y:1},
    {x:0, y:0},
  ]);

  expect(gridCastRayArray(0, 0, -5, 5)).toEqual([
    {x:-1, y:0},
    {x:-2, y:1},
    {x:-3, y:2},
    {x:-4, y:3},
    {x:-5, y:4},
  ]);

  expect(gridCastRayArray(-5, 5, 0, 0)).toEqual([
    {x:-5, y:4},
    {x:-4, y:3},
    {x:-3, y:2},
    {x:-2, y:1},
    {x:-1, y:0},
  ]);
});

test('misc slopes', () => {
  expect(gridCastRayArray(0, 0, 3, 1)).toEqual([
    {x:0, y:0},
    {x:1, y:0},
    {x:2, y:0},
  ]);

  expect(gridCastRayArray(0, 0, 2, 4)).toEqual([
    {x:0, y:0},
    {x:0, y:1},
    {x:1, y:2},
    {x:1, y:3},
  ]);
});
