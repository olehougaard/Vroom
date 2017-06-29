module.exports = (vector, move) => {
  const seq = (...fs) => (...args) => fs.forEach(f => f(...args)); 
  const stream = (seed) => (generator) => {
    let error = () => {}
    let finish = () => {}
    let recur = (value, seed) => setImmediate(() => continuation(seed, generator))
    const continuation = (seed, generator) => setImmediate(() => generator(seed, recur, error, finish))
    continuation(seed, generator);
    return {
      onValue(callback) {
        recur = seq(callback, recur);
        return this;
      },
      onError(callback) {
        error = seq(callback, error);
        return this;
      },
      onFinish(callback) {
        finish = seq(callback, finish);
        return this;
      }
    };
  }

  const is_legal = track => m => track.finish(m) || !track.intersects(m);
  const moves = [
    vector(-1, 1),  vector(0, 1),  vector(1, 1),
    vector(-1, 0),  vector(0, 0),  vector(1, 0),
    vector(-1, -1), vector(0, -1), vector(1, -1)];
  const next_moves = track => mv =>
    ({ possible_moves: moves
        .map(v => move(mv.end, mv.velocity.plus(v)))
        .filter(is_legal(track)),
       default_move: move(mv.end, mv.velocity)
    });
  const filter_index = (p) =>(a) => a.map((e, i) => ({e, i})).filter(({e, i}) => p(e, i, a)).map(({e, i}) => i)
  const run = (track, ...players) => {
    const state = players.map(player => ({is_live: true, player: player.player, move: move(player.starting_position, vector())}))
    return stream({state, turn: 1})(({state, turn}, recur, error, finish) => {
      Promise.all(state.map(seed => {
        if (!seed.is_live) return Promise.resolve(seed)
        const {move, player} = seed
        const next = next_moves(track)(move)
        return player(next).then(move=> {
          if (next.possible_moves.length === 0) return {dnf: 'Crashed', is_live: false }
          if (next.possible_moves.every(m => !m.equals(move))) return { dsq: 'Illegal move', is_live: false }
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
