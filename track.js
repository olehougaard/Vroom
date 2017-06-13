/**
 * http://usejsdoc.org/
 */

const generic_equals = (values) => (that) => {
	return that && Object.getOwnPropertyNames(values).reduce((eq, key) => eq && (values[key].equals? values[key].equals(that[key]) : values[key] === that[key]), true);
};

const value_object = (values, prototype) => {
	prototype = prototype || Object.prototype;
	const properties = {};
	Object.getOwnPropertyNames(values).forEach((key) => {
		properties[key] = { value: values[key], enumerable: true, writable: false };
	});
	properties.equals = {value: generic_equals(values), enumerable: false, writable: false};
	const obj = Object.create(prototype, properties);
	return obj;
};

module.exports = (() => {
	let position, vector, move, path, line, rectangle, track;

	position = (x, y) => value_object({x: x||0, y: y|| 0}, {
		north() {
			return position(this.x, this.y + 1);
		},
		south() {
			return position(this.x, this.y - 1);
		},
		east() {
			return position(this.x + 1, this.y);
		},
		west() {
			return position(this.x - 1, this.y);
		},
		minus(that) {
			return vector(this.x - that.x, this.y - that.y);
		},
		plus(v) {
			return position(this.x + v.dx, this.y + v.dy);
		},
		tile() {
			return rectangle(this.x, this.y, 1, 1);
		},
		to(p) {
			return move(this)(p.minus(this));
		}
	});

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
		rotleft() {
			return vector(-this.dy, this.dx)
		},
		rotright() {
			return vector(this.dy, -this.dx)
		}
	});


	move = (origin) => (velocity) => value_object({start: origin, velocity: velocity, end: origin.plus(velocity)}, {
		line() {
				var {x, y} = origin, {dx, dy} = velocity;
				return line(x + 0.5, y + 0.5)(dx, dy);
			},
		is_move: true
	});

	path = (origin, ...velocities) => {
	  const last = (xs) => xs[xs.length - 1]
	  const end = (move, def) => move? move.end : def
	  return velocities.reduce((result, velocity) => result.concat(move(end(last(result)) || origin)(velocity)), []);
	}

	line = (x, y) => (dx, dy) => value_object({x, y, dx, dy}, {
		length() { return Math.sqrt(dx * dx + dy * dy); }
	});

	const collect = (xs) => (f) => (xs.map(f).filter(x => x !== null && x !== undefined && x !== false));

	rectangle = (x, y, w, h) => value_object({left: x, bottom: y, right: x + w, top: y + h, w, h}, {
		intersects(line) {
			// Liang-Barsky
			const pq = [
				{p: -line.dx, q: line.x - this.left},
				{p:  line.dx, q: this.right - line.x},
				{p:  line.dy, q: this.top - line.y},
				{p:  -line.dy, q: line.y - this.bottom}];
			if (pq.some(({p, q}) => p === 0 && q <= 0)) {
			  return false;
			} else {
				const times = pq.map(({p, q}) => ({p, t: q / p}));
				const u1 = collect(times)(({p, t}) => (p < 0) && t).reduce((u, t) => Math.max(u, t), Number.NEGATIVE_INFINITY);
				const u2 = collect(times)(({p, t}) => (p > 0) && t).reduce((u, t) => Math.min(u, t), Number.POSITIVE_INFINITY);
				return u1 < u2 && 0 < u2 && u1 < 1;
			}
		}
	});

	const gen_seq = (gen) => (from, to, includeEnd) => ({
		forEach(f) {
			for(var i = from; includeEnd ? i <= to : i < to; i++) {
				f(gen(i), i);
			}
		},
		reduce(op, initial_value) {
			if (initial_value === undefined) {
				return gen_seq(gen)(from + 1, to, includeEnd).reduce(op, from);
			} else {
				let acc = initial_value;
				this.forEach((e, i) => { acc = op(acc, e, i); });
				return acc;
			}
		},
		map(f) {
			return this.reduce((a, e, i) => a.push(f(e, i)), []);
		},
		flatMap(f) {
			return this.reduce((a, e, i) => a.concat(f(e, i)), []);
		},
		filter(p) {
			return this.reduce((a, e, i) => p(e, i)? a.push(e, i) : a, []);
		},
		collect(f) {
			return this.reduce((a, e, i) => {
				const x = f(e, i);
				if (x !== null && x !== undefined && x !== false) { a.push(x); }
				return a;
			}, []);
		}
	});
	const range = gen_seq(i => i);

	track = (track_spec, finish_positions) => {
		const the_track = track_spec.map(row=>(row.split('').map(p=>p === ' '))).reverse()
		const finish_line = finish_positions || []
		const affected_area = move => {
			const [x0, x1] = move.velocity.dx > 0 ? [ move.start.x, move.end.x] : [move.end.x, move.start.x];
			const [y0, y1] = move.velocity.dy > 0 ? [ move.start.y, move.end.y] : [move.end.y, move.start.y];
			return gen_seq(row => range(x0, x1, true))(y0, y1, true);
		};
		const [width, height] = track_spec.length === 0? [0, 0] : [track_spec[0].length, track_spec.length]
		return {
			size: { width, height },
			finish_line: finish_line,
			in_bounds(p) {
				return the_track[p.y] && the_track[p.y][p.x];
			},
			intersects(move) {
				if (!this.in_bounds(move.start) || !this.in_bounds(move.end)) { return true; }
				const inadmissable_squares = affected_area(move).flatMap(
						(row, row_no) => row.collect(col_no => !the_track[row_no][col_no] && rectangle(col_no, row_no, 1, 1)));
				return inadmissable_squares.some(sq => sq.intersects(move.line()));
			},
			finish(move) {
				return move.velocity.length() > 0
				    && this.in_bounds(move.start)
				    && finish_line.some(p => p.tile().intersects(move.line()) && !this.intersects(move.start.to(p)));
			},
			is_connected(p0, p1) {
				const seen = new Set();
				const stack = [];
				const hash = position => position.x * the_track.length + position.y;
				const visit_nodes = (...ps) => {
					for(let p of ps.filter(p => this.in_bounds(p) && !seen.has(hash(p)))) {
						stack.push(p);
						seen.add(hash(p));
					}
				};
				visit_nodes(p0);
				while(stack.length > 0) {
					const p = stack.pop();
					if (p.equals(p1)) { return true; }
					visit_nodes(p.north(), p.east(), p.south(), p.west());
				}
				return false;
			}
		};
	};

	return {position, vector, move, path, line, rectangle, track};
})();
