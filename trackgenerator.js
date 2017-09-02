module.exports = (track, vector) => {
    const edge_tile = (position, track_size) => {
        const previous = () => {
            let p;
            if (position.x === 0)
                p = position.north()
            else if (position.y === 0)
                p = position.west()
            else if (position.x === track_size.width - 1)
                p = position.south()
            else
                p = position.east()
            return edge_tile(p, track_size)
        }
        const next = () => {
            let p;
            if (position.y === 0)
                p = position.east()
            else if (position.x === 0)
                p = position.south()
            else if (position.y === track_size.width - 1)
                p = position.west()
            else
                p = position.north()
            return edge_tile(p, track_size)
        }
        return { previous, next, position }
    }
    const from_curve = (size, curve, width) => {
        const outer_curve = curve.outer(width / 2)
        const inner_curve = curve.inner(width / 2)
        const inbounds = p => outer_curve.is_right(p) && inner_curve.is_left(p)
        const last_free = (p, next) => {
            while(inbounds(next(p).position)) p = next(p)
            return p
        }
        const take_while_on_track = start => next => {
            const positions = []
            for(let p = next(start); inbounds(p.position); p = next(p)) positions.push(p)
            return positions
        }
        const directions = [ p => p.previous(), p => p.next() ]
        const starting_positions = Array.prototype.concat.apply(
            [ edge_tile(curve.start(), size) ],
            directions.map ( take_while_on_track(edge_tile(curve.start(), size))))
        const finish_line = take_while_on_track(last_free(edge_tile(curve.end(), size), p => p.previous()))(p => p.next())
        const the_track = track(size, inbounds, finish_line.map(p => p.position))
        return { track: the_track, starting_positions: starting_positions.map(p => p.position) }
    }
    return {from_curve}
}