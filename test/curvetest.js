const _test = require('tape')
const test = (description, test_function) => {
	_test(description, (expect) => {
		test_function(expect)
		expect.end()
	})
}
test.skip = _test.skip
const { position, vector } = require('../track.js')
const curve = require('../curve.js')(position)

const shortest_line = curve.line(position(0, 0), position(0, 0))
const horizontal_line = curve.line(position(0, 0), position(2, 0))
const diagonal_line = curve.line(position(0, 0), position(2, 2))
const vertical_line = curve.line(position(0, 0), position(0, 2))

test('Shortest line', expect => {
    expect.equals(shortest_line.length, 1, 'shortest line has 1 member')
    expect.true(shortest_line.contains(position(0, 0)), 'shortest line contains it position')
    expect.false(shortest_line.contains(position(1, 1)), 'shortest line contains no other positions')
    expect.deepEquals(shortest_line[0], position(0, 0), 'shortest line contains its member')
    expect.notEqual(shortest_line[Symbol.iterator], undefined, 'line is an iterable')
    const shortest_iterator = shortest_line[Symbol.iterator]()
    expect.deepEquals(shortest_iterator.next(), {done: false, value: position(0, 0)}, 'line is an iterable')
    expect.true(shortest_iterator.next().done, 'line is an iterable')
})

test('Horizontal line', expect => {
    expect.equals(horizontal_line.length, 3)
    expect.deepEquals(horizontal_line[1], position(1, 0))
    expect.deepEquals(horizontal_line[2], position(2, 0))
    expect.true(horizontal_line.every(p => horizontal_line.contains(p)))
})

test('Diagonal line', expect => {
    expect.equals(diagonal_line.length, 3)
    expect.deepEquals(diagonal_line[0], position(0, 0))
    expect.deepEquals(diagonal_line[1], position(1, 1))
    expect.deepEquals(diagonal_line[2], position(2, 2))
    expect.true(diagonal_line.every(p => diagonal_line.contains(p)))
})

test('Vertical line', expect => {
    expect.equals(vertical_line.length, 3)
    expect.deepEquals(vertical_line[0], position(0, 0))
    expect.deepEquals(vertical_line[1], position(0, 1))
    expect.deepEquals(vertical_line[2], position(0, 2))
    expect.true(vertical_line.every(p => vertical_line.contains(p)))
})

test('Left/right', expect => {
    expect.false(shortest_line.is_left(position(1, 1)))
    expect.false(shortest_line.is_right(position(1, 1)))
    expect.true(horizontal_line.is_left(position(1, 1)))
    expect.false(horizontal_line.is_right(position(1, 1)))
    expect.false(horizontal_line.is_left(position(1, -1)))
    expect.true(horizontal_line.is_right(position(1, -1)))
    expect.false(horizontal_line.is_left(position(3, -1)))
    expect.true(horizontal_line.is_right(position(3, -1)))
    expect.false(curve.line(position(2, 0), position(0, 0)).is_left(position(1, 1)))
    expect.true(curve.line(position(2, 0), position(0, 0)).is_right(position(1, 1)))
    expect.true(curve.line(position(2, 0), position(0, 0)).is_left(position(1, -1)))
    expect.false(curve.line(position(2, 0), position(0, 0)).is_right(position(1, -1)))
})

test('next_to', expect => {
    expect.false(shortest_line.next_to(position(1, 1)))
    expect.true(horizontal_line.next_to(position(1, 1)))
    expect.true(horizontal_line.next_to(position(1, -1)))
    expect.false(horizontal_line.next_to(position(3, -1)))
    expect.true(curve.line(position(2, 0), position(0, 0)).next_to(position(1, 1)))
    expect.true(curve.line(position(2, 0), position(0, 0)).next_to(position(1, -1)))
})

test('before/after', expect => {
    expect.false(shortest_line.is_before(position(1, 1)))
    expect.false(shortest_line.is_after(position(1, 1)))
    expect.false(horizontal_line.is_before(position(1, 1)))
    expect.false(horizontal_line.is_after(position(1, 1)))
    expect.false(horizontal_line.is_before(position(1, -1)))
    expect.false(horizontal_line.is_after(position(1, -1)))
    expect.false(horizontal_line.is_before(position(3, -1)))
    expect.true(horizontal_line.is_after(position(3, -1)))
    expect.false(curve.line(position(2, 0), position(0, 0)).is_before(position(1, 1)))
    expect.false(curve.line(position(2, 0), position(0, 0)).is_after(position(1, 1)))
})

test('bounding rectangle', expect => {
    expect.deepEquals(diagonal_line.bounding_box, { x: 0, y: 0, width: 2, height: 2})
    expect.deepEquals(curve.line(position(2, 0), position(6, -3)).bounding_box, { x: 2, y: -3, width: 4, height: 3})
})

test('angled line', expect => {
    const line = curve.line(position(0, 0), position(4, 2))
    expect.deepEquals(line[0], position(0, 0))
    expect.deepEquals(line[1], position(1, 1))
    expect.deepEquals(line[2], position(2, 1))
    expect.deepEquals(line[3], position(3, 2))
    expect.deepEquals(line[4], position(4, 2))
})

test('displace', expect => {
    const line = curve.line(position(0, 0), position(4, 2))
    const expected = curve.line(position(0, 1), position(4, 3))
    expect.deepEquals(line.displace(vector(0, 1)).length, expected.length)
    expect.true(line.displace(vector(0, 1)).every((e, i) => e.equals(expected[i])))
})

test('lines have defined start and end', expect => {
    const line = curve.line(position(0, 0), position(4, 2))
    expect.deepEquals(line.start(), position(0, 0))
    expect.deepEquals(line.end(), position(4, 2))
})
