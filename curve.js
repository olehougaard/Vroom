module.exports = ((position) => {
    // Transforms vec into coordinates of the system (base.dx, base.dy)
    const transform = base => vec => ({ u: base.dot(vec) / base.dot(base), v : vec.dot(base.normal()) / base.dot(base) })
    const line = (from, to) => {
            const geometric_length = Math.floor(to.minus(from).length())
            const unit = to.minus(from).multiply(1 / geometric_length)
            const index_to_position = (i) => {
                const {x, y} = from.plus(unit.multiply(i))
                return position(Math.round(x), Math.round(y))
            }
            const the_line = Array.apply(null, Array(geometric_length + 1)).map((_, i) => index_to_position(i))
            const relative = (p) => transform(to.minus(from))(p.minus(from))
            Object.assign(the_line, {
                length:  geometric_length + 1,
                contains(position) {
                    return this.some(p => p.equals(position))
                },
                is_left(position) {
                    return relative(position).v >= 0
                },
                is_right(position) {
                    return relative(position).v <= 0
                },
                next_to(position) {
                  const t = relative(position)
                  return 0 <= t.u && t.u <= 1  
                },
                is_before(position) {
                  return relative(position).u < 0  
                },
                is_after(position) {
                  return relative(position).u > 1  
                },
                start() {
                    return from
                },
                end() {
                    return to
                },
                bounding_box: { 
                    x: Math.min(from.x, to.x), 
                    y: Math.min(from.y, to.y), 
                    width: Math.abs(from.x - to.x),
                    height: Math.abs(from.y - to.y)
                },
                displace(vector) {
                    return line(from.plus(vector), to.plus(vector))
                }
            })   
            return the_line
        }
    return {
        line
    }
})
