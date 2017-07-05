const tape = require('tape')
const test = (description, test_function) => {
	tape(description, (expect) => {
		test_function(expect)
		if (!expect._plan) expect.end()
	})
}
test.skip = tape.skip

const {position, move, track, vector} = require('../track.js')
const trackgenerator = require('../trackgenerator.js')(track, vector)
const curve = require('../curve.js')

test('Straight line', expect => {
    const line = curve.straight(position(0, 3), position(10, 8))
    const width = 4
    const size = { width: 11, height: 11 }
    const { track, starting_positions } = trackgenerator.from_curve(size, line, width)
    expect.deepEquals(track.size, size, 'Obeys size')
    expect.true(track.in_bounds(position(0, 3)))
    expect.true(track.in_bounds(position(10, 8)))
    expect.false(track.intersects(move(position(0, 3), vector(10, 5))), 'The original line is free')
    expect.deepEquals(starting_positions, [position(0, 1), position(0, 2), position(0, 3), position(0, 4), position(0, 5)])
    expect.true(track.finish(move(position(9, 8), vector(1, 0))))
})
