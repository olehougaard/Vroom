const {position} = require('./track.js')

module.exports = (runner) => (track_gen) => {
    const range = (size) => Array(...Array(size)).map((_, i) => i)
    const keys = 
        [ [ '7', '8', '9' ],
          [ '4', '5', '6' ],
          [ '1', '2', '3' ] ]
    const keymap = keys
        .map((r, i) => r.map((k, j) => ({ dx: j - 1, dy: 1 - i, k })))
        .reduce((flat, a) => flat.concat(a), [])
        .reduce((map, {dx, dy, k}) => { map[k] = { dx, dy }; return map }, {})
    const key = ({dx, dy}) => keys[1 - dy][1 + dx]
    
    return { run(display) {
        const {track, starting_positions} = track_gen()

        const position_marker = '.'
        const show_position = (p, char = position_marker)  => ({ x: p.x, y: p.y, char })
        const finish_line = track.finish_line.map(({x, y}) => ({x, y, char: '-'}))
        const display_track = (...overlays) => {
            const {width, height} = track.size
            const overlay_map = finish_line.concat(overlays)
                .filter(({x, y}) => 0 <= x && x < width && 0 <= y && y < height)
                .reduce((map, {x, y, char}) => { map[y][x] = char; return map }, range(height).map(() => Array(width)))
            return range(height)
                .map( y => range(width).map( x => track.in_bounds(position(x, y)) ? ' ' : 'X'))
                .map( (row, y) => row.map( (cell, x) => overlay_map[y][x] === undefined? cell : overlay_map[y][x] ))
                .map( row => row.join(''))
                .reverse().join('\n')
        }

        const player = ({possible_moves, default_move}) => {
            const {start, end} = default_move
            const dv = p => p.minus(default_move.end)
            if (possible_moves.length > 0) {
                const mv_overlay = possible_moves
                        .map(({end}) => ({end, dv: dv(end)}))
                        .map(({end, dv}) => show_position(end, key(dv)))
                display.tell(display_track(...mv_overlay, show_position(start)))
                const make_move = (question) => {
                    return display.ask(question).then(k => {
                        const move = possible_moves.find(mv => dv(mv.end).equals(keymap[k]))
                        return move || make_move('Not a valid move. Please select move')
                    })
                }
                return make_move('Please select move')
            } else {
                const mv_overlay = 
                    [ end.north().west(), end.north(), end.north().east(),
                      end.west(),         end,         end.east(),
                      end.south().west(), end.south(), end.south().east()].map(p => show_position(p, '¤'))
                display.tell(display_track(...mv_overlay, show_position(start)))
                return display.ask('Danger, danger, danger ...').then(() => {
                    display.tell(display_track(show_position(end)))
                })
            }
        }
        runner(track, { player, starting_position: starting_positions[Math.floor(Math.random() * starting_positions.length)] })
            .onFinish(({winner, turn, final}) => {
                if (winner.length === 0) {
                    display.tell('You crashed after ' + turn + ' turns')    
                } else {
                    const [{move: { end }}] = final
                    display.tell(display_track(show_position(end, '#')))
                    display.tell('You won in ' + turn + (turn === 1? ' turn' : ' turns'))
                }
                display.close()
            })
            .onError(reason => {
                display.tell(reason.stack? reason.stack : reason)
                display.close()
            })
    }}
}
