const EventEmitter = require('events')

module.exports = (vector, move) => {
  const stream = (seed) => (generator) => {
    const emitter = new EventEmitter()
    const error = (...args) => emitter.emit('error', ...args)
    const finish = (...args) => emitter.emit('finish', ...args)
    const recur = (value, seed) => { 
      emitter.emit('value', value, seed)
      setImmediate(() => generator(seed, recur, error, finish))
    }
    const the_stream = {}
    the_stream.onValue = (callback) => {
        emitter.on('value', callback)
        return the_stream
    }
    the_stream.onError = (callback) => {
        emitter.on('error', callback)
        return the_stream
    }
    the_stream.onFinish = (callback) => {
        emitter.on('finish', callback)
        return the_stream
    }
    setImmediate(() => generator(seed, recur, error, finish))
    return the_stream
  }

  const is_legal = track => m => track.finish(m) || !track.intersects(m)
  const moves = [
    vector(-1, 1),  vector(0, 1),  vector(1, 1),
    vector(-1, 0),  vector(0, 0),  vector(1, 0),
    vector(-1, -1), vector(0, -1), vector(1, -1)]
  const next_moves = track => mv =>
    ({ possible_moves: moves
        .map(v => move(mv.end, mv.velocity.plus(v)))
        .filter(is_legal(track)),
       default_move: move(mv.end, mv.velocity)
    })
  const filter_index = (p) =>(a) => a.map((e, i) => ({e, i})).filter(({e, i}) => p(e, i, a)).map(({e, i}) => i)
  const run = (track, ...players) => {
    const state = players.map(player => ({is_live: true, player: player.player, move: move(player.starting_position, vector())}))
    return stream({state, turn: 1})(({state, turn}, recur, error, finish) => {
      Promise.all(state.map(seed => {
        // Non-live players stay where they are until the game is resolved:
        if (!seed.is_live) return Promise.resolve(seed)
        const {move, player} = seed
        const next = next_moves(track)(move)
        // Note: If the player has no legal moves an empty moveset is still fed to the player to
        // allow the UI to notify the player.
        return player(next).then(move=> {
          if (next.possible_moves.length === 0) return {dnf: 'Crashed', is_live: false }
          if (!next.possible_moves.some(move.equals)) return { dsq: 'Illegal move', is_live: false }
          return { is_live: true, move, player}
        })
      }))
      .then(result => {
        const is_winner = x => x.is_live && track.finish(x.move)
        if (result.some(is_winner)) {
          finish({winner: filter_index(is_winner)(result), turn, final: result})
        } else if (!result.some(x => x.is_live)) {
          finish({winner: [], turn, final: result})
        } else {
          recur({ move: result, turn }, { state: result, turn: turn + 1})
        }
      })
      .catch(error)
    })
  }
  return { is_legal, next_moves, run }
}
