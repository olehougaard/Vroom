module.exports = (track, vector) => ({
    from_curve(size, curve, width) {
        const outer_curve = curve.displace(vector(0, width / 2))
        const inner_curve = curve.displace(vector(0, -width / 2))
        const inbounds = p => outer_curve.is_right(p) && inner_curve.is_left(p)
        const last_free = (p, next) => {
            while(inbounds(next(p))) p = next(p)
            return p
        }
        const take_until = (p, next) => {
            const positions = []
            for(; inbounds(p); p = next(p)) positions.push(p)
            return positions
        }
        const starting_positions = take_until(last_free(curve.start(), p => p.south()), p => p.north())
        const the_track = track(size, inbounds, take_until(last_free(curve.end(), p => p.south()), p => p.north()))
        return { track: the_track, starting_positions }
    }
})