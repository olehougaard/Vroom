/**
 * http://usejsdoc.org/
 */

const generic_equals = (values) => (that) => {
	return that && Object.getOwnPropertyNames(values).reduce((eq, key) => eq && (values[key].equals? values[key].equals(that[key]) : values[key] === that[key]), true)
}

const derive = (proto, ...mixins) => Object.assign(Object.create(proto), ...mixins)

const value_object = (values, prototype) => {
	const comparable = { equals: generic_equals(values) }
	const proto = derive(comparable, prototype || Object.prototype)
	return derive(proto, values)
}

module.exports = (() => {
	let position, vector, move, path, line, rectangle, track_from_string_array

	position = (x, y) => value_object({x: x || 0, y: y || 0}, {
		north() {
			return position(this.x, this.y + 1)
		},
		south() {
			return position(this.x, this.y - 1)
		},
		east() {
			return position(this.x + 1, this.y)
		},
		west() {
			return position(this.x - 1, this.y)
		},
		minus(that) {
			return vector(this.x - that.x, this.y - that.y)
		},
		plus(v) {
			return position(this.x + v.dx, this.y + v.dy)
		},
		tile() {
			return rectangle(this.x, this.y, 1, 1)
		},
		to(p) {
			return move(this, p.minus(this))
		}
	})

	vector = (dx, dy) => value_object({dx: dx || 0, dy: dy || 0}, {
		length() {
			return Math.sqrt(this.dx * this.dx + this.dy * this.dy)
		},
		plus(that) {
			return vector(this.dx + that.dx, this.dy + that.dy)
		},
		multiply(t) {
			return vector(this.dx * t, this.dy * t)
		},
		dot(that) {
			return this.dx * that.dx + this.dy * that.dy
		},
		normal() {
			return vector(-this.dy, this.dx)
		}
	})


	move = (origin, velocity) => value_object({start: origin, velocity: velocity, end: origin.plus(velocity)}, {
		line() {
				var {x, y} = origin, {dx, dy} = velocity
				return line(x + 0.5, y + 0.5)(dx, dy)
			},
		is_move: true
	})

	path = (origin, ...velocities) => {
	  const last = (xs) => xs[xs.length - 1]
	  const end = (move, def) => move? move.end : def
	  return velocities.reduce((result, velocity) => result.concat(move(end(last(result)) || origin, velocity)), [])
	}

	line = (x, y) => (dx, dy) => value_object({x, y, dx, dy}, {
		length() { return Math.sqrt(dx * dx + dy * dy) }
	})

	const collect = (xs) => (f) => (xs.map(f).filter(x => x !== null && x !== undefined && x !== false))

	rectangle = (x, y, w, h) => value_object({left: x, bottom: y, right: x + w, top: y + h, w, h}, {
		intersects(line) {
			// Liang-Barsky
			const pq = [
				{p: -line.dx, q: line.x - this.left},
				{p:  line.dx, q: this.right - line.x},
				{p:  line.dy, q: this.top - line.y},
				{p:  -line.dy, q: line.y - this.bottom}]
			if (pq.some(({p, q}) => p === 0 && q <= 0)) {
			  return false
			} else {
				const times = pq.map(({p, q}) => ({p, t: q / p}))
				const u1 = collect(times)(({p, t}) => (p < 0) && t).reduce((u, t) => Math.max(u, t), Number.NEGATIVE_INFINITY)
				const u2 = collect(times)(({p, t}) => (p > 0) && t).reduce((u, t) => Math.min(u, t), Number.POSITIVE_INFINITY)
				return u1 < u2 && 0 < u2 && u1 < 1
			}
		}
	})

	const gen_seq = (gen) => (from, to, includeEnd) => ({
		contains(i) {
			return from <= i && i <= to
		},
		forEach(f) {
			for(var i = from; includeEnd ? i <= to : i < to; i++) {
				f(gen(i), i)
			}
		},
		reduce(op, initial_value) {
			if (initial_value === undefined) {
				return gen_seq(gen)(from + 1, to, includeEnd).reduce(op, from)
			} else {
				let acc = initial_value
				this.forEach((e, i) => { acc = op(acc, e, i) })
				return acc
			}
		},
		map(f) {
			return this.reduce((a, e, i) => a.push(f(e, i)), [])
		},
		flatMap(f) {
			return this.reduce((a, e, i) => a.concat(f(e, i)), [])
		},
		filter(p) {
			return this.reduce((a, e, i) => p(e, i)? a.push(e, i) : a, [])
		},
		collect(f) {
			return this.reduce((a, e, i) => {
				const x = f(e, i)
				if (x !== null && x !== undefined && x !== false) { a.push(x) }
				return a
			}, [])
		}
	})
	const range = gen_seq(i => i)

	const track = (size, in_bounds, finish_line) => {
		const affected_area = move => {
			const [x0, x1] = move.velocity.dx > 0 ? [ move.start.x, move.end.x] : [move.end.x, move.start.x]
			const [y0, y1] = move.velocity.dy > 0 ? [ move.start.y, move.end.y] : [move.end.y, move.start.y]
			return gen_seq(row => range(x0, x1, true))(y0, y1, true)
		}
		const range_x = range(0, size.width - 1)
		const range_y = range(0, size.height - 1)
		return {
			size,
			finish_line,
			in_bounds(p) {
				return range_x.contains(p.x) && range_y.contains(p.y) && in_bounds(p)
			},
			intersects(move) {
				if (!this.in_bounds(move.start) || !this.in_bounds(move.end)) { return true }
				const inadmissable_squares = affected_area(move).flatMap(
						(row, row_no) => row.collect(col_no => !this.in_bounds(position(col_no, row_no)) && rectangle(col_no, row_no, 1, 1)))
				return inadmissable_squares.some(sq => sq.intersects(move.line()))
			},
			finish(move) {
				return move.velocity.length() > 0
				    && this.in_bounds(move.start)
				    && finish_line.some(p => p.tile().intersects(move.line()) && !this.intersects(move.start.to(p)))
			},
			is_connected(p0, p1) {
				const seen = new Set()
				const stack = []
				const hash = position => position.x * size.height + position.y
				const visit_nodes = (...ps) => {
					for(let p of ps.filter(p => this.in_bounds(p) && !seen.has(hash(p)))) {
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
