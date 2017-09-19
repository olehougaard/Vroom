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

  const split = (p) => (a) => [a.filter(p), a.filter((...args) => !p(...args))]
  const pipe = (...fns) => fns.slice(1).reduce((y, f) => f(y), fns[0])
  
  const is_legal = track => m => track.finish(m) || !track.intersects(m)
  const moves = [
    vector(-1, 1),  vector(0, 1),  vector(1, 1),
    vector(-1, 0),  vector(0, 0),  vector(1, 0),
    vector(-1, -1), vector(0, -1), vector(1, -1)]
  const next_moves = track => mv => ({ 
    possible_moves: moves
        .map(v => move(mv.end, mv.velocity.plus(v)))
        .filter(is_legal(track)),
    default_move: move(mv.end, mv.velocity)
  })
  const player_state = {
    init: ({player, starting_position}, player_no) => 
      ({ is_live: true, player, player_no, move: move(starting_position, vector())}),
    dsq : ({player_no}) => 
      ({player_no, dsq: 'Illegal move', is_live: false}),
    dnf : ({player_no}) => 
      ({player_no, dnf: 'Crashed', is_live: false}),
    live: ({move, player, player_no}) => 
      ({move, player, player_no, is_live: true})
  }
  
  const game_state = (player_states) => {
    const update_moves = (f, moves) => (updated) => {
      moves.forEach(move => { updated[move.player_no] = f(move) })
      return updated
    }
    const update = ({illegal, crashed, live}) => pipe(player_states.slice(0),
      update_moves(player_state.dsq, illegal),
      update_moves(player_state.dnf, crashed),
      update_moves(player_state.live, live),
      game_state)
    const live_players = () => player_states.filter(p => p.is_live)
    const win_state = (winner) => ({winner, final: player_states, end_state: true})
    const lose_state = () => ({final: player_states, end_state: true})
    return { player_states, update, live_players, win_state, lose_state }
  }
  game_state.init = (players) => game_state(players.map(player_state.init))

  const make_move = (state, track, legal_moves, illegal_moves) => {
    const [live, crashed] = split(m => m.move)(legal_moves)
    const next_state = state.update({illegal: illegal_moves, crashed, live})
    if (live.some(x => track.finish(x.move))) {
      return next_state.win_state(live.filter(x => track.finish(x.move)).map(w=>w.player_no))
    } else if (live.length == 0) {
      return next_state.lose_state()
    } else {
      return next_state
    }
  }

  const run = (track, ...players) => {
    return stream({state: game_state.init(players), turn: 1})(({state, turn}, recur, error, finish) => {
      Promise.all(state.live_players().map(({move, player, player_no}) => {
        const legal_moves = next_moves(track)(move)
        // Note: If the player has no legal moves an empty moveset is still fed to the player to
        // allow the UI to notify the player. The player must return undefined.
        return player(legal_moves).then(move=> {
          if (move && !legal_moves.possible_moves.some(move.equals)) 
            return { dsq: 'Illegal move', player_no }
          else
            return { move, player, player_no}
        })
      }))
      .then(split(m=>m.dsq))
      .then(([illegal, legal]) => make_move(state, track, legal, illegal))
      .then(new_state => {
        if (new_state.end_state)
          finish(Object.assign(new_state, {turn}))
        else
          recur({ move: new_state.player_states, turn }, { state: new_state, turn: turn + 1})
      })
      .catch(error)
    })
  }
  return { is_legal, next_moves, run }
}
