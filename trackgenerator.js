module.exports = (track, vector) => ({
    from_curve(size, curve, width) {
        const outer_curve = curve.displace(vector(0, width / 2))
        const inner_curve = curve.displace(vector(0, -width / 2))
        const the_track = track(size, p => outer_curve.is_right(p) && inner_curve.is_left(p), [])
        return { track: the_track }
    }
})