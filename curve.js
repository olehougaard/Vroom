module.exports = ((position) => {
    // Transforms vec into coordinates of the system (base.dx, base.dy)
    const transform = base => vec => ({ u: base.dot(vec) / base.dot(base), v : (vec.rotright().dot(base)) / base.dot(base) })
    return {
        line: (from, to) => {
            const geometric_length = Math.floor(to.minus(from).length())
            const unit = to.minus(from).multiply(1 / geometric_length)
            const line = Array.apply(null, Array(geometric_length + 1)).map((_, i) => from.plus(unit.multiply(i)))
            Object.assign(line, {
                length:  geometric_length + 1,
                contains(position) {
                    return this.some(p => p.equals(position))
                },
                is_left(position) {
                    const t = transform(to.minus(from))(position.minus(from))
                    return 0 <= t.u && t.u <= 1 && t.v > 0
                },
                is_right(position) {
                    const t = transform(to.minus(from))(position.minus(from))
                    return 0 <= t.u && t.u <= 1 && t.v < 0
                }
            })   
            return line;
        }
    }
})
