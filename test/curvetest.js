const _test = require('tape');
const test = (description, test_function) => {
	_test(description, (expect) => {
		test_function(expect);
		expect.end();
	});
};
test.skip = _test.skip
const { position } = require('../track.js')
const curve = require('../curve.js')(position)

const shortest_line = curve.line(position(0, 0), position(0, 0))
const horizontal_line = curve.line(position(0, 0), position(2, 0))
const diagonal_line = curve.line(position(0, 0), position(2, 2))
const vertical_line = curve.line(position(0, 0), position(0, 2))

test('Shortest line', expect => {
    expect.equals(shortest_line.length, 1, 'shortest line has 1 member');
    expect.true(shortest_line.contains(position(0, 0)), 'shortest line contains it position');
    expect.false(shortest_line.contains(position(1, 1)), 'shortest line contains no other positions');
    expect.deepEquals(shortest_line[0], position(0, 0), 'shortest line contains its member');
    expect.notEqual(shortest_line[Symbol.iterator], undefined, 'line is an iterable')
    const shortest_iterator = shortest_line[Symbol.iterator]()
    expect.deepEquals(shortest_iterator.next(), {done: false, value: position(0, 0)}, 'line is an iterable')
    expect.true(shortest_iterator.next().done, 'line is an iterable')
})

test('Horizontal line', expect => {
    expect.equals(horizontal_line.length, 3);
    expect.deepEquals(horizontal_line[1], position(1, 0))
    expect.deepEquals(horizontal_line[2], position(2, 0))
    expect.true(horizontal_line.every(p => horizontal_line.contains(p)))
})

test('Diagonal line', expect => {
    expect.equals(diagonal_line.length, 3);
    expect.deepEquals(diagonal_line[0], position(0, 0))
    expect.deepEquals(diagonal_line[1], position(1, 1))
    expect.deepEquals(diagonal_line[2], position(2, 2))
    expect.true(diagonal_line.every(p => diagonal_line.contains(p)))
})

test('Vertical line', expect => {
    expect.equals(vertical_line.length, 3);
    expect.deepEquals(vertical_line[0], position(0, 0))
    expect.deepEquals(vertical_line[1], position(0, 1))
    expect.deepEquals(vertical_line[2], position(0, 2))
    expect.true(vertical_line.every(p => vertical_line.contains(p)))
})

test('Left/right', expect => {
    expect.false(shortest_line.is_left(position(1, 1)));
    expect.false(shortest_line.is_right(position(1, 1)));
    expect.true(horizontal_line.is_left(position(1, 1)));
    expect.false(horizontal_line.is_right(position(1, 1)));
    expect.false(horizontal_line.is_left(position(1, -1)));
    expect.true(horizontal_line.is_right(position(1, -1)));
    expect.false(horizontal_line.is_left(position(3, -1)));
    expect.false(horizontal_line.is_right(position(3, -1)));
    expect.false(curve.line(position(2, 0), position(0, 0)).is_left(position(1, 1)));
    expect.true(curve.line(position(2, 0), position(0, 0)).is_right(position(1, 1)));
    expect.true(curve.line(position(2, 0), position(0, 0)).is_left(position(1, -1)));
    expect.false(curve.line(position(2, 0), position(0, 0)).is_right(position(1, -1)));
})