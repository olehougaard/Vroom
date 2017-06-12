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
    
    const display_track = (track, ...overlays) => {
        const {width, height} = track.size
        const overlay_map = overlays
            .filter(({x, y}) => 0 <= x && x < width && 0 <= y && y < height)
            .reduce((map, {x, y, char}) => { map[y][x] = char; return map }, range(height).map(() => Array(width)))
        return range(height)
            .map( y => range(width).map( x => track.in_bounds({x, y}) ? ' ' : 'X'))
            .map( (row, y) => row.map( (cell, x) => overlay_map[y][x] === undefined? cell : overlay_map[y][x] ))
            .map( row => row.join(''))
            .reverse().join('\n')
    }

    return { run(display) {
        const position_marker = '.'
        const {track, starting_position} = track_gen()
        const player = ({possible_moves, default_move}) => {
            const {start, end} = default_move
            const dv = p => p.minus(default_move.end)
            if (possible_moves.length > 0) {
                const mv_overlay = possible_moves
                        .map(({end}) => ({x: end.x, y: end.y, dv: dv(end)}))
                        .map(({x, y, dv}) => ({x, y, char: key(dv)}))
                display.tell(display_track(track, ...mv_overlay, {x: start.x, y: start.y, char: position_marker}))
                const make_move = (question) => {
                    return display.ask(question).then(k => {
                        const move = possible_moves.find(mv => dv(mv.end).equals(keymap[k]))
                        return move || make_move('Not a valid move. Please select move')
                    })
                }
                return make_move('Please select move')
            } else {
                const mv_overlay = 
                    [ { x: end.x - 1, y: end.y + 1}, { x: end.x, y: end.y + 1}, { x: end.x + 1, y: end.y + 1},
                      { x: end.x - 1, y: end.y    }, { x: end.x, y: end.y    }, { x: end.x + 1, y: end.y    },                
                      { x: end.x - 1, y: end.y - 1}, { x: end.x, y: end.y - 1}, { x: end.x + 1, y: end.y - 1}
                    ].map(({x, y}) => ({x, y, char: '-'}))
                display.tell(display_track(track, {x: start.x, y: start.y, char: position_marker}, ...mv_overlay))
                return display.ask('Danger, danger, danger ...').then(() => {
                    display.tell(display_track(track, {x: end.x, y: end.y, char: position_marker}))
                })
            }
        }
        runner(track, { player, starting_position })
            .onFinish(({winner, turn, final}) => {
                if (winner.length === 0) {
                    display.tell('You crashed after ' + turn + ' turns')    
                } else {
                    const [{move: { end: {x, y} }}] = final
                    display.tell(display_track(track, {x, y, char: '#'}))
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
