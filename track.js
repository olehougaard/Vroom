/**
 * http://usejsdoc.org/
 */

module.exports = (() => {
	let position, vector, move, path, line, rectangle, track_from_string_array

	position = (x, y) => {
		x = x || 0
		y = y || 0
		const prototype = {
			north() {
				return position(x, y + 1)
			},
			south() {
				return position(x, y - 1)
			},
			east() {
				return position(x + 1, y)
			},
			west() {
				return position(x - 1, y)
			},
			minus(that) {
				return vector(x - that.x, y - that.y)
			},
			plus(v) {
				return position(x + v.dx, y + v.dy)
			},
			tile() {
				return rectangle(x, y, 1, 1)
			},
			to(that) {
				const p = position(x, y)
				return move(p, p.minus(that))
			},
			equals(that) {
				return that && x === that.x && y === that.y
			}
		}
		return Object.assign(Object.create(prototype), { x, y })
	}

	vector = (dx, dy) => {
		dx = dx || 0
		dy = dy || 0
		const prototype = {
			length() {
				return Math.sqrt(dx * dx + dy * dy);
			},
			plus(that) {
				return vector(dx + that.dx, dy + that.dy)
			},
			minus(that) {
				return vector(dx - that.dx, dy - that.dy)
			},
			multiply(t) {
				return vector(t * dx, t * dy)
			},
			dot(that) {
				return dx * that.dx + dy * that.dy
			},
			normal() {
				return vector(-dy, dx)
			},
			equals(that) {
				return that && that.dx === dx && that.dy === dy
			}
		}
		return Object.assign(Object.create(prototype), {dx, dy})
	}


	move = (origin, velocity) => {
		const prototype = {
			line() {
				var {x, y} = origin, {dx, dy} = velocity
				return line(x + 0.5, y + 0.5)(dx, dy)
			},
			equals(that) {
				return that && origin.equals(that.start) && velocity.equals(that.velocity)
			}
		}
		const mv = Object.create(prototype)
		mv.start = origin
		mv.velocity = velocity
		mv.end = origin.plus(velocity)
		return mv
	}

	path = (origin, ...velocities) => {
	  const last = (xs) => xs[xs.length - 1]
	  const end = (move, def) => move? move.end : def
	  return velocities.reduce((result, velocity) => result.concat(move(end(last(result)) || origin, velocity)), [])
	}

	line = (x, y) => (dx, dy) => {
		const length = () => Math.sqrt(dx * dx + dy * dy)
		const distance_to = p => {
			const unit_vector = vector(dx, dy).multiply(1/length())
			const relative_vector = position(p.x, p.y).minus(position(x, y))
			const relative_projected = unit_vector.multiply(relative_vector.dot(unit_vector))
			const vector_to_line = relative_vector.minus(relative_projected)
			return vector_to_line.length()
		}
		const prototype = {
			length() {
				return Math.sqrt(dx * dx + dy * dy)
			},
			distance_to,
			equals(that) {
				return that && x === that.x && y === that.y && dx === that.dx && dy === that.dy
			}
		}
		return Object.assign(Object.create(prototype), {x, y, dx, dy})
	}

	const collect = (xs) => (f) => (xs.map(f).filter(x => x !== null && x !== undefined && x !== false))

	rectangle = (x, y, w, h) => {
		const [ left, bottom, right, top ] = [ x, y, x + w, y + h ]
		const prototype = {
			intersects(line) {
				// Liang-Barsky
				const pq = [
					{p: -line.dx, q: line.x - left},
					{p:  line.dx, q: right - line.x},
					{p:  line.dy, q: top - line.y},
					{p:  -line.dy, q: line.y - bottom}]
				if (pq.some(({p, q}) => p === 0 && q <= 0)) {
					return false
				} else {
					const times = pq.map(({p, q}) => ({p, t: q / p}))
					const u1 = collect(times)(({p, t}) => (p < 0) && t).reduce((u, t) => Math.max(u, t), Number.NEGATIVE_INFINITY)
					const u2 = collect(times)(({p, t}) => (p > 0) && t).reduce((u, t) => Math.min(u, t), Number.POSITIVE_INFINITY)
					return u1 < u2 && 0 < u2 && u1 < 1
				}
			},
			equals(that) {
				return that && left === that.left && bottom === that.bottom && right === that.right && top === right.top
			}
		}
		return Object.assign(Object.create(prototype), { left, bottom, right, top, w, h })
	}

	const gen_seq = (gen) => (from, to, includeEnd) => {
		const forEach = (f) => {
			for(var i = from; includeEnd ? i <= to : i < to; i++) {
				f(gen(i), i)
			}
		}
		const reduce = (op, initial_value) => {
				if (initial_value === undefined) {
					return gen_seq(gen)(from + 1, to, includeEnd).reduce(op, from)
				} else {
					let acc = initial_value
					forEach((e, i) => { acc = op(acc, e, i) })
					return acc
				}
			}
		return {
			contains(i) {
				return from <= i && i <= to
			},
			forEach,
			reduce,
			map(f) {
				return reduce((a, e, i) => a.push(f(e, i)), [])
			},
			flatMap(f) {
				return reduce((a, e, i) => a.concat(f(e, i)), [])
			},
			filter(p) {
				return reduce((a, e, i) => p(e, i)? a.push(e, i) : a, [])
			},
			collect(f) {
				return reduce((a, e, i) => {
					const x = f(e, i)
					if (x !== null && x !== undefined && x !== false) { a.push(x) }
					return a
				}, [])
			}
		}
	}
	const range = gen_seq(i => i)

	const track = (size, on_track, finish_line) => {
		const affected_area = move => {
			const [x0, x1] = move.velocity.dx > 0 ? [ move.start.x, move.end.x] : [move.end.x, move.start.x]
			const [y0, y1] = move.velocity.dy > 0 ? [ move.start.y, move.end.y] : [move.end.y, move.start.y]
			return gen_seq(row => range(x0, x1, true))(y0, y1, true)
		}
		const range_x = range(0, size.width - 1)
		const range_y = range(0, size.height - 1)
		const in_bounds = p =>  range_x.contains(p.x) && range_y.contains(p.y) && on_track(p)
		const intersects = move => {
			if (!in_bounds(move.start) || !in_bounds(move.end)) { return true }
			const inadmissable_squares = affected_area(move).flatMap(
					(row, row_no) => row.collect(col_no => !in_bounds(position(col_no, row_no)) && rectangle(col_no, row_no, 1, 1)))
			return inadmissable_squares.some(sq => sq.intersects(move.line()))
		}
		return {
			size,
			finish_line,
			in_bounds,
			intersects,
			finish(move) {
				return move.velocity.length() > 0
				    && in_bounds(move.start)
				    && finish_line.some(p => p.tile().intersects(move.line()) && !intersects(move.start.to(p)))
			},
			is_connected(p0, p1) {
				const seen = new Set()
				const stack = []
				const hash = position => position.x * size.height + position.y
				const visit_nodes = (...ps) => {
					for(let p of ps.filter(p => in_bounds(p) && !seen.has(hash(p)))) {
						stack.push(p)
						seen.add(hash(p))
					}
				}
				visit_nodes(p0)
				while(stack.length > 0) {
					const p = stack.pop()
					if (p.equals(p1)) { return true }
					visit_nodes(p.north(), p.east(), p.south(), p.west())
				}
				return false
			}
		}
	}

	track_from_string_array = (track_spec, finish_positions) => {
		if (track_spec.length === 0) return track(p => false, [], { width: 0, height: 0 })
		const in_bounds = (p) => track_spec[track_spec.length - p.y - 1] && track_spec[track_spec.length - p.y - 1][p.x] === ' '
		return track({width: track_spec[0].length, height: track_spec.length}, in_bounds, finish_positions)
	}

	return {position, vector, move, path, line, rectangle, track, track_from_string_array}
})()
