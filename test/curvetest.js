const _test = require('tape')
const test = (description, test_function) => {
	const approximateDeepEqual = (actual, expected, tolerance) => {
		if (typeof actual === 'number') {
            const error = expected === 0? actual - expected : (actual - expected) / expected
			return Math.abs(error) < tolerance
		} else {
			return Object.getOwnPropertyNames(actual).every(n => approximateDeepEqual(actual[n], expected[n], tolerance))
		}
	}
	_test(description, (expect) => {
		expect.approximatelyEquals = (actual, expected, tolerance, message) => {
			if (!message) {
				message = tolerance
				tolerance = 1e-10
			}
            expect._assert(Math.abs(actual - expected) < tolerance, {
                message: message || 'Should be approximate',
                operator: 'approximateDeepEquals',
                actual, expected
            })
		}
		expect.approximateDeepEquals = (actual, expected, tolerance, message) => {
			if (!message) {
				message = tolerance
				tolerance = 1e-10
            }
            expect._assert(approximateDeepEqual(actual, expected, tolerance), {
                message: message || 'Should be approximate',
                operator: 'approximateDeepEquals',
                actual, expected
            })
		}
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
    { p: c => c.length > 0, msg: 'Curve must not be empty'},
    { p: c => c.reduce((count, _) => count + 1, 0) === c.length, msg: 'The length of the curve corresponds to the actual elements'},
    { p: c => c.every(p => c.distance_to(p) <= Math.sqrt(1/2)), msg: 'The elements in the curve are on the curve'},
    { p: c => increasing(c.map(p => p.minus(c.start()).length())), msg: 'The curve is increasing in distance from start'},
    { p: c => c.every(c.contains), msg: 'The elements of the curve are contained in the curve'},
    { p: c => c.contains(c.start()) && c.contains(c.end()), msg: 'start and end are contained in the curve'},
    { p: c => c.outer(2).every(c.is_left), msg: 'An outer curve is wholly to the left'},
    { p: c => c.inner(2).every(c.is_right), msg: 'An inner curve is wholly to the right'},
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
    curve_axioms.forEach(a => expect.true(a.p(horizontal), a.msg))
})

test('Diagonal line', expect => {
    expect.equals(diagonal.length, 3)
    curve_axioms.forEach(a => expect.true(a.p(diagonal), a.msg))
})

test('Vertical line', expect => {
    expect.equals(vertical.length, 3)
    curve_axioms.forEach(a => expect.true(a.p(vertical), a.msg))
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
    curve_axioms.forEach(a => expect.true(a.p(line), a.msg))
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

const negative_half_circle = curve.arc.negative(position(4, 0), 4, 4, Math.PI, 0)
const positive_half_circle = curve.arc.positive(position(4, 0), 4, 4, Math.PI, 0)
const ajar_half_circle = curve.arc.negative(position(4, 0), 4, 4, 3 * Math.PI / 4, 7 * Math.PI / 4)
const quarter_ellipse = curve.arc.negative(position(4, 0), 4, 2, Math.PI /2, 0)

test('Negative half circle hits the expected points', expect => {
    expect.approximateDeepEquals(negative_half_circle.start(), position(0, 0), 'Starts at the given start')
    expect.approximateDeepEquals(negative_half_circle.end(), position(8, 0), 'Ends at the given end')
    expect.true(negative_half_circle.contains(position(4, 4)), 'Top point is contained')
    expect.false(negative_half_circle.contains(position(4, 0)), 'Half circle does not pass through center')
    expect.false(negative_half_circle.contains(position(4, -4)), 'Bottom point is not contained')
})

test('Reverse half circle hits the expected points', expect => {
    expect.approximateDeepEquals(positive_half_circle.start(), position(0, 0), 'Starts at the given start')
    expect.approximateDeepEquals(positive_half_circle.end(), position(8, 0), 'Ends at the given end')
    expect.false(positive_half_circle.contains(position(4, 4)), 'Top point is not contained')
    expect.true(positive_half_circle.contains(position(4, -4)), 'Bottom point is contained')
})

test('ajar half circle hits the expected points', expect => {
    const sqrt1_2 = Math.sqrt(1/2)
    expect.approximateDeepEquals(ajar_half_circle.start(), position(4 - 4 * sqrt1_2, 4 * sqrt1_2), 'Starts at the given start')
    expect.approximateDeepEquals(ajar_half_circle.end(), position(4 + 4 * sqrt1_2, - 4 * sqrt1_2), 'Ends at the given end')
    expect.true(ajar_half_circle.contains(position(4*(1+sqrt1_2), 4 * sqrt1_2)), 'Top point is contained')
    expect.false(ajar_half_circle.contains(position(0, 0)), 'Early point is not contained')
    expect.true(ajar_half_circle.contains(position(8, 0)), '3/4 point is contained')
    expect.false(ajar_half_circle.contains(position(4, -4)), 'Late point is not contained')
})

test('quarter ellipse hits the expected points', expect => {
    expect.approximateDeepEquals(quarter_ellipse.start(), position(4, 2), 'Starts from vertical')
    expect.approximateDeepEquals(quarter_ellipse.end(), position(8, 0), 'Goes to horizontal')
    expect.false(quarter_ellipse.contains(position(0, 0)), 'Does not start from horizontal')
    expect.true(quarter_ellipse.contains(position(6, Math.sqrt(3))), 'Hits expected position at PI/3')
})

test('Negative half circle fullfills the axioms', expect => {
    curve_axioms.forEach(a => expect.true(a.p(negative_half_circle), a.msg))
})

test('Positive half circle fullfills the axioms', expect => {
    curve_axioms.forEach(a => expect.true(a.p(positive_half_circle), a.msg))
})

test('Ajar half circle fullfills the axioms', expect => {
    curve_axioms.forEach(a => expect.true(a.p(ajar_half_circle), a.msg))
})

test('Quarter ellipse fullfills the axioms', expect => {
    curve_axioms.forEach(a => expect.true(a.p(quarter_ellipse), a.msg))
})
