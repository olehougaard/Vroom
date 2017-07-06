const _test = require('tape')
const test = (description, test_function) => {
	_test(description, (expect) => {
		test_function(expect)
		expect.end()
	})
}
test.skip = _test.skip
const { position, vector } = require('../track.js')
const curve = require('../curve.js')

const neighbors = a => a.map((e, i) => [e, a[i + 1]]).filter(pair => pair[1])
const increasing = a => neighbors(a).every(([fst, snd]) => fst <= snd)

const curve_axioms = [
    c => c.every(p => c.distance_to(p) <= Math.sqrt(1/2)),
    c => increasing(c.map(p => p.minus(c.start()).length())),
    c => c.every(c.contains),
    c => c.contains(c.start()) && c.contains(c.end()),
    c => c.outer(2).every(c.is_left),
    c => c.inner(2).every(c.is_right),
]

const shortest = curve.straight(position(0, 0), position(0, 0))
const horizontal = curve.straight(position(0, 0), position(2, 0))
const diagonal = curve.straight(position(0, 0), position(2, 2))
const vertical = curve.straight(position(0, 0), position(0, 2))

test('Shortest line', expect => {
    expect.equals(shortest.length, 1, 'shortest line has 1 member')
    expect.true(shortest.contains(position(0, 0)), 'shortest line contains it position')
    expect.false(shortest.contains(position(1, 1)), 'shortest line contains no other positions')
    expect.deepEquals(shortest[0], position(0, 0), 'shortest line contains its member')
    expect.notEqual(shortest[Symbol.iterator], undefined, 'line is an iterable')
    const shortest_iterator = shortest[Symbol.iterator]()
    expect.deepEquals(shortest_iterator.next(), {done: false, value: position(0, 0)}, 'line is an iterable')
    expect.true(shortest_iterator.next().done, 'line is an iterable')
})

test('Horizontal line', expect => {
    expect.equals(horizontal.length, 3)
    expect.true(curve_axioms.every(a => a(horizontal)))
})

test('Diagonal line', expect => {
    expect.equals(diagonal.length, 3)
    expect.true(curve_axioms.every(a => a(diagonal)))
})

test('Vertical line', expect => {
    expect.equals(vertical.length, 3)
    expect.true(curve_axioms.every(a => a(vertical)))
})

test('Left/right', expect => {
    expect.false(shortest.is_left(position(1, 1)))
    expect.false(shortest.is_right(position(1, 1)))
    expect.true(horizontal.is_left(position(1, 1)))
    expect.false(horizontal.is_right(position(1, 1)))
    expect.false(horizontal.is_left(position(1, -1)))
    expect.true(horizontal.is_right(position(1, -1)))
    expect.false(horizontal.is_left(position(3, -1)))
    expect.true(horizontal.is_right(position(3, -1)))
    expect.false(curve.straight(position(2, 0), position(0, 0)).is_left(position(1, 1)))
    expect.true(curve.straight(position(2, 0), position(0, 0)).is_right(position(1, 1)))
    expect.true(curve.straight(position(2, 0), position(0, 0)).is_left(position(1, -1)))
    expect.false(curve.straight(position(2, 0), position(0, 0)).is_right(position(1, -1)))
})

test('next_to', expect => {
    expect.false(shortest.next_to(position(1, 1)))
    expect.true(horizontal.next_to(position(1, 1)))
    expect.true(horizontal.next_to(position(1, -1)))
    expect.false(horizontal.next_to(position(3, -1)))
    expect.true(curve.straight(position(2, 0), position(0, 0)).next_to(position(1, 1)))
    expect.true(curve.straight(position(2, 0), position(0, 0)).next_to(position(1, -1)))
})

test('before/after', expect => {
    expect.false(shortest.is_before(position(1, 1)))
    expect.false(shortest.is_after(position(1, 1)))
    expect.false(horizontal.is_before(position(1, 1)))
    expect.false(horizontal.is_after(position(1, 1)))
    expect.false(horizontal.is_before(position(1, -1)))
    expect.false(horizontal.is_after(position(1, -1)))
    expect.false(horizontal.is_before(position(3, -1)))
    expect.true(horizontal.is_after(position(3, -1)))
    expect.false(curve.straight(position(2, 0), position(0, 0)).is_before(position(1, 1)))
    expect.false(curve.straight(position(2, 0), position(0, 0)).is_after(position(1, 1)))
})

test('bounding rectangle', expect => {
    expect.deepEquals(diagonal.bounding_box, { x: 0, y: 0, width: 2, height: 2})
    expect.deepEquals(curve.straight(position(2, 0), position(6, -3)).bounding_box, { x: 2, y: -3, width: 4, height: 3})
})

test('angled line', expect => {
    const line = curve.straight(position(0, 0), position(4, 2))
    expect.true(curve_axioms.every(a => a(line)))    
})

test('lines have defined start and end', expect => {
    const line = curve.straight(position(0, 0), position(4, 2))
    expect.deepEquals(line.start(), position(0, 0))
    expect.deepEquals(line.end(), position(4, 2))
})

test('(straight) displace moves in parallel', expect => {
    const line = curve.straight(position(0, 0), position(4, 2))
    const expected = curve.straight(position(0, 1), position(4, 3))
    expect.deepEquals(line.displace(vector(0, 1)).length, expected.length)
    expect.true(line.displace(vector(0, 1)).every((e, i) => e.equals(expected[i])))
})

test('half circle hits the expected points', expect => {
    const half_circle = curve.arc(position(0, 0), Math.PI / 2, position(8, 0), 3 * Math.PI / 2)
    expect.deepEquals(position(0, 0), half_circle.start(), 'Starts at the given start')
    expect.deepEquals(position(8, 0), half_circle.end(), 'Ends at the given end')
    expect.true(half_circle.contains(position(4, 4)), 'Top point is contained')
    expect.false(half_circle.contains(position(4, 0)), 'Half circle does not pass through center')
    expect.false(half_circle.contains(position(4, -4)), 'Bottom point is not contained')
})

test('Reverse half circle hits the expected points', expect => {
    const half_circle = curve.arc(position(0, 0), 3 * Math.PI / 2, position(8, 0), Math.PI / 2)
    expect.false(half_circle.contains(position(4, 4)), 'Top point is not contained')
    expect.true(half_circle.contains(position(4, -4)), 'Bottom point is contained')
})

test('ajar half circle hits the expected points', expect => {
    const sqrt1_2 = Math.sqrt(1/2)
    const half_circle = curve.arc(position(4 * (1-sqrt1_2), 4*sqrt1_2), Math.PI / 4, position(4*(1+sqrt1_2), -4 * sqrt1_2), 5 * Math.PI / 4)
    expect.true(half_circle.contains(position(4*(1+sqrt1_2), 4 * sqrt1_2)), 'Top point is contained')
    expect.false(half_circle.contains(position(0, 0)), 'Early point is not contained')
    expect.true(half_circle.contains(position(8, 0)), '3/4 point is contained')
    expect.false(half_circle.contains(position(4, -4)), 'Late point is not contained')
})

