/**
 * http://usejsdoc.org/
 */

const _test = require('tape')
const test = (description, test_function) => {
	_test(description, (expect) => {
		test_function(expect)
		expect.end()
	})
}
const { position, vector, move, path, track_from_string_array, line, rectangle } = require('../track.js')

test('default position', expect => {
	expect.deepEqual(position(), {x: 0, y: 0}, 'default position is (0, 0)')
})

test('assigned position', expect => {
	const p = position(3, 7)
	expect.deepEquals(position(3, 7), {x:3, y:7}, 'initialization okay')
})

test('different positions are different', expect => {
	expect.notDeepEqual(position(1, 2), position(1, 3), 'y1 != y2')
	expect.notDeepEqual(position(1, 2), position(2, 2), 'x1 != x2')
})

test('equal positions', expect => {
	expect.true(position(3, 7).equals(position(3, 7)), 'Equal positions test equal')
	expect.false(position(7, 3).equals(position(3, 7)), 'Unequal positions test not equal')
	expect.false(position(1, 0).equals(position(7, 0)), 'Equal test all attributes')
	expect.false(position().equals(undefined), 'Defined doesn\'t equals undefined')
})

test('directions', expect => {
	const p = position(3, 7)
	expect.deepEquals(p.north(), position(3, 8), 'North is 1 up')
	expect.deepEquals(p.south(), position(3, 6), 'South is 1 down')
	expect.deepEquals(p.east(),  position(4, 7), 'East is 1 right')
	expect.deepEquals(p.west(),  position(2, 7), 'West is 1 left')
})


test('null vector', expect => {
	expect.deepEquals(vector(), {dx: 0, dy: 0}, 'null vector is (0, 0)')
})

test('assigned vector', expect => {
	expect.deepEquals(vector(3, 4), {dx: 3, dy: 4}, 'Initialization uses parameters')
})

test('length', expect => {
	expect.equals(vector().length(), 0, 'null vector has zero length')
	expect.equals(vector(3, 4).length(), 5, 'length is computed with pythagoras')
})

test('vector addition', expect => {
	expect.deepEquals(vector(2, 3).plus(vector(1, 1)), vector(3, 4), 'Vector addition works like mathematical definition')
})

test('vector multiplication', expect => {
	expect.deepEquals(vector(2, 3).multiply(2), vector(4, 6), 'multiply is by coordinate')
})

test('dot product', expect => {
	expect.equals(vector(2, 3).dot(vector(4, -2)), 2)
})

test('rotate', expect => {
	expect.deepEquals(vector(2, 3).normal(), vector(-3, 2), 'Rotate left')
})

test('velocity between positions', expect => {
	expect.deepEquals(position(7, 3).minus(position(2, 5)), vector(5, -2), 'minus is subtraction by coordinates.')
})

test('position at the end of a velocity', expect => {
	expect.deepEquals(position(2, 5).plus(vector(5, -2)), position(7, 3), 'plus is addition by coordinates.')
})

test('move create', expect => {
	expect.deepEquals(move(position(2, 5), vector(5, -2)).start, position(2, 5), 'start is the first argument to factory')
	expect.deepEquals(move(position(2, 5), vector(5, -2)).velocity, vector(5, -2), 'velocity is the second argument to factory')
	expect.deepEquals(move(position(2, 5), vector(5, -2)).end, position(7, 3), 'end is the the result of moving velocity from start')
})

test('path', expect => {
	expect.deepEquals(path(position(2, 5), vector(1, 0), vector(2, -3), vector(), vector(9, 9)),
	   [move(position(2, 5), vector(1, 0)),
	    move(position(3, 5), vector(2, -3)),
		move(position(5, 2), vector()),
		move(position(5, 2), vector(9, 9))
	   ], 'path starts at position and follows the vectors')
})

test('line', expect => {
	expect.deepEquals(line(2, 3)(1, -1), {x: 2, y: 3, dx: 1, dy: -1}, 'create line')
})

test('line length', expect => {
	expect.equals(line(0, 0)(3,4).length(), 5, 'line length is Pythagoras')
})

test('move.line()', expect => {
	expect.deepEquals(move(position(2, 5), vector(5, -2)).line(), line(2.5, 5.5)(5, -2), 'moves are from center of square to center of square')
})

test('rectangle', expect => {
	expect.deepEquals(rectangle(2, 5, 1, 2), {left: 2, bottom: 5, right: 3, top: 7, w: 1, h: 2}, 'create rectangle')
})

test('rectangle.intersects()', (expect) => {
	const rect = rectangle(1, 1, 1, 1)
	expect.false(rect.intersects(line(0, 0)(0, 0)), '0-vector outside rectangle doesn\'t intersect')
	expect.true(rect.intersects(line(1.5, 1.5)(0, 0)), '0-vector inside rectangle intersects')
	expect.false(rect.intersects(line(1, 1)(0, 0)), '0-vector on boundary doesn\'t intersect')
	expect.true(rect.intersects(line(0.1, 0.2)(2.5, 2.5)), 'line segment through rectangle intersects')
	expect.true(rect.intersects(line(1.2, 1.2)(0.5, 0.5)), 'line segment in rectangle intersects')
	expect.true(rect.intersects(line(0.1, 1.2)(2.5, 0)), 'horizontal line segment through rectangle intersects')
	expect.true(rect.intersects(line(0.1, 0.2)(1, 1)), 'line segment ending in rectangle intersects')
	expect.true(rect.intersects(line(1.1, 1.2)(1, 1)), 'line segment starting in rectangle intersects')
	expect.false(rect.intersects(line(0.1, 0.2)(0.5, 0.5)), 'line segment ending before rectangle doesn\'t intersect')
	expect.false(rect.intersects(line(2.1, 2.2)(1, 1)), 'line segment starting after rectangle doesn\'t intersect')
	expect.false(rect.intersects(line(0, 1.2)(2.5, 2.5)), 'line segment missing rectangle doesn\'t intersect')
	expect.false(rect.intersects(line(0, 1)(2.5, 2.5)), 'line segment clipping rectangle doesn\'t intersect')
	expect.false(rect.intersects(line(0, 0)(1, 1)), 'line segment ending on rectangle doesn\'t intersect')
	expect.false(rect.intersects(line(2, 2)(1, 1)), 'line segment starting on rectangle doesn\'t intersect')
	expect.false(rect.intersects(line(0, 1)(2.5, 0)), 'parallel line segment clipping rectangle doesn\'t intersect')
})

test('position.bounds()', expect => {
	expect.deepEquals(position(2, 5).tile(), rectangle(2, 5, 1, 1), 'positions are lower left of a 1x1 game tile')
})

const track_spec = [
	'XXXXXXXXXX',
	'XXX    XXX',
	'XX      XX',
	'X   XX   X',
	'X  XXXX  X'
]
const the_track = track_from_string_array(track_spec.slice(), [position(7, 0), position(8, 0)])

test('array size', expect => {
	const {width, height} = the_track.size
	expect.equals(width, track_spec[0].length)
	expect.equals(height, track_spec.length)
})

test('array out of bounds', expect => {
	expect.false(the_track.in_bounds(position(-1, -1)), 'out of the array is out of bounds')
	expect.false(the_track.in_bounds(position(10, 6)), 'out of the array is out of bounds')
})

test('track non-destructive', expect => {
	var other = track_spec.slice()
	track_from_string_array(other, [position(7, 0), position(8, 0)])
	expect.deepEquals(other, track_spec, 'input is unchanged')
})

test('in bounds', expect => {
	expect.true(the_track.in_bounds(position(1, 0)), 'Spaces are inbounds')
})

test('out of bounds', expect => {
	expect.false(the_track.in_bounds(position(0, 1)), 'Xs are out of bounds')
})

test('intersects', expect => {
	expect.false(the_track.intersects(move(position(1, 0), vector())), 'Staying on the track doesn\'t intersect')
	expect.true(the_track.intersects(move(position(0, 1), vector())), 'Staying out of the track intersects')
	expect.false(the_track.intersects(move(position(1, 0), vector(0, 1))), 'Moving to neighbouring open positions doesn\'t intersect')
	expect.true(the_track.intersects(move(position(1, 0), vector(-1, 1))), 'Moving out of the track intersects')
	expect.false(the_track.intersects(move(position(1, 0), vector(3, 3))), 'Moving through spaces doesn\'t intersect')
	expect.false(the_track.intersects(move(position(2, 0), vector(3, 3))), 'Just touching out of bounds doesn\'t intersect')
	expect.true(the_track.intersects(move(position(2, 0), vector(5, 0))), 'Moving from track to track intersects when going through out of bounds')
	expect.true(the_track.intersects(move(position(), vector(-1, -1))), 'Moving further of the track intersects')
})

test('reaches goal', expect => {
	expect.false(the_track.finish(move(position(7, 0), vector())), 'You need to move to finish')
	expect.true(the_track.finish(move(position(7, 1), vector(0, -1))), 'Moving to the finish line finishes')
	expect.true(the_track.finish(move(position(7, 1), vector(0, -2))), 'Moving through the finish line finishes')
	expect.false(the_track.finish(move(position(7, 2), vector(0, -1))), 'Moving short of the the finish line doesn\'t finish')
	expect.false(the_track.finish(move(position(8, 2), vector(0, -2))), 'Moving from out of bounds doesn\'t finish')
	expect.false(the_track.finish(move(position(3, 2), vector(5, -3))), 'Moving through out of bounds doesn\'t finish')
})

const disconnected_track_spec = [
	'XXXXXXXXXX',
	'XXXX XXXXX',
	'XXX XXXXXX',
	'X   XX   X',
	'X  XXXX  X'
]
const disconnected_track = track_from_string_array(disconnected_track_spec)

test('connected', expect => {
	expect.true(the_track.is_connected(position(1, 0), position(1, 0)), 'A position on the track is connected to itself.')
	expect.false(the_track.is_connected(position(0, 1), position(0, 1)), 'A position outside the track is connect to nothing')
	expect.true(the_track.is_connected(position(1, 0), position(7, 0)), 'Two positions are connected if there is a non-direct path between them')
	expect.false(disconnected_track.is_connected(position(1, 0), position(7, 0)), 'Two positions cannot connect through out-of-bounds')
	expect.true(disconnected_track.is_connected(position(1, 0), position(3, 2)), 'Two positions can connect vertically even with width 1')
	expect.false(disconnected_track.is_connected(position(1, 0), position(3, 4)), 'Two positions cannot connect diagonally only')
})
