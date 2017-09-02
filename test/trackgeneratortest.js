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

const set_equals = ( a1, a2 ) => {
    return a1.length === a2.length
        && a1.every( e => a2.some( e2 => e.equals(e2)))
}

test('Straight line', expect => {
    const line = curve.straight(position(0, 3), position(10, 8))
    const width = 4
    const size = { width: 11, height: 11 }
    const { track, starting_positions } = trackgenerator.from_curve(size, line, width)
    expect.deepEquals(track.size, size, 'Obeys size')
    expect.true(track.in_bounds(position(0, 3)), 'Curve start is on track') 
    expect.true(track.in_bounds(position(10, 8)), 'Curve end is on track')
    expect.false(
        track.intersects(move(position(0, 3), vector(10, 5))), 
        'The original line is free')
    expect.true(set_equals(
        starting_positions, 
        [1, 2, 3, 4, 5].map(y => position(0, y))),
        'Starting positions along the western edge')
    expect.true(track.finish(move(position(9, 8), vector(1, 0))))
})

test('Corner to corner', expect => {
    const line = curve.straight(position(0, 0), position(10, 10))
    const width = 4
    const size = { width: 11, height: 11 }
    const { track, starting_positions } = trackgenerator.from_curve(size, line, width)
    expect.true(set_equals(
        starting_positions,
        [ position(0, 2), position(0, 1), position(0, 0), position(1, 0), position(2, 0) ]),
        'Starting positions around a corner are ')
})

test('Arc', expect => {
    const { track, starting_positions } = trackgenerator.from_curve({width: 21, height: 21}, curve.arc.negative(position(11, 0), 6, 16, Math.PI, 0), 6)
    expect.true(track.in_bounds(position(2, 0)))
    expect.false(track.in_bounds(position(1, 0)))
    expect.false(track.in_bounds(position(1, 4)))
})