const tape = require('tape')
const test = (description, test_function) => {
	tape(description, (expect) => {
		test_function(expect)
		if (!expect._plan) expect.end()
	})
}
test.skip = tape.skip
const { position, vector, move, path, track_from_string_array} = require('../track.js')
const { is_legal, next_moves, run } = require('../rules.js')(vector, move)

const track_spec = [
  	'XXXXXXXXXX',
  	'XXXXXXXXXX',
	'XXX    XXX',
	'XXX    XXX',
	'XX      XX',
	'XX      XX',
	'X   XX   X',
	'X   XX   X',
	'X  XXXX  X',
	'X  XXXX  X'
]
const the_track = track_from_string_array(track_spec, [position(7, 0), position(8, 0)])

test('legal moves', expect => {
	const expectLegal = (start_position, desc, ...velocities) => {
		velocities
		    .map(v => move(start_position, v))
				.forEach(m => expect.true(is_legal(the_track)(m), desc + ' ' + m))
	}
	const expectIllegal = (start_position, desc, ...velocities) => {
		velocities
		    .map(v => move(start_position, v))
				.forEach(m => expect.false(is_legal(the_track)(m), desc + ' ' + m))
	}
	expectLegal(position(3, 5), 'basic moves',
	  vector(0, 2), vector(1, 2), vector(2, 2),
	  vector(0, 1), vector(1, 1), vector(2, 1),
	  vector(0, 0), vector(1, 0), vector(2, 0))
	expectIllegal(position(3, 5), 'moving out of bounds',
	  vector(1, 3), vector(2, 3), vector(3, 3))
	expectIllegal(position(3, 0), 'through out of bounds', vector(5, 0))
	expectIllegal(position(0, 0), 'from out of bounds', vector(1, 0))
	expectIllegal(position(1, 0), 'to out of bounds', vector(-1, 0))
	expectLegal(position(7, 1), 'through finish line', vector(0, -4))
})

test('moves', expect => {
  expect.deepEqual(next_moves(the_track)(move(position(2, 4), vector(1, 1))),
  		{ possible_moves:
              [vector(0, 2), vector(1, 2), vector(2, 2),
               vector(0, 1), vector(1, 1), vector(2, 1),
               vector(0, 0), vector(1, 0), vector(2, 0),
             ].map(v => move(position(3, 5), v)),
		  default_move: move(position(3, 5), vector(1, 1))
		}, 'Basic move is the 8 directions')
 expect.deepEqual(next_moves(the_track)(move(position(1, 3), vector(2, 2))),
        { possible_moves:
            [vector(1, 2), vector(2, 2), vector(3, 2),
			 vector(1, 1), vector(2, 1), vector(3, 1)
			].map(v => move(position(3, 5), v)),
		  default_move: move(position(3, 5), vector(2, 2))
		}, 'Cannot move out of bounds')
  expect.deepEqual(next_moves(the_track)(move(position(0, 0), vector(0, 0))),
           { possible_moves: [], default_move: move(position(0, 0), vector(0, 0)) }, 'No legal moves from move starting out of bounds')
  expect.deepEqual(next_moves(the_track)(move(position(3, 2), vector(2, 0))),
           { possible_moves: [], default_move: move(position(5, 2), vector(2, 0)) }, 'No legal moves from out of bounds')
  expect.deepEqual(next_moves(the_track)(move(position(1, 2), vector(2, 0))),
           { possible_moves: [], default_move: move(position(3, 2), vector(2, 0)) }, 'No legal moves through out of bounds')
  expect.deepEqual(next_moves(the_track)(move(position(7, 4), vector(0, -3))),
  		{ possible_moves:
            [vector(-1, -2), vector(0, -2), vector(1, -2),
             vector(-1, -3), vector(0, -3), vector(1, -3),
             vector(-1, -4), vector(0, -4), vector(1, -4)
			].map(v => move(position(7, 1), v)),
		  default_move: move(position(7, 1), vector(0, -3))
		}, 'It\'s legal to move out of bounds if it\'s a finisher')
})

const preprogrammed = (onDefault) => (...velocities) => {
  	const iterator = velocities[Symbol.iterator]()
  	const player = ({ possible_moves, default_move }) => {
		  if (onDefault) onDefault(default_move)
		  return Promise.resolve(possible_moves[0] && move(possible_moves[0].start, iterator.next().value))
	  }
	player.expected = velocities
	player.expected.last = velocities[velocities.length - 1]
	return player
}

const test_players = (onDefault) => {
	const player_gen = preprogrammed(onDefault)
	const winning_player = {
		player: player_gen(vector(0, 1), vector(1, 2), vector(1, 1), vector(1, 0), vector(1, -1), vector(1, -2), vector(0, -3)), 
		starting_position: position(2, 0)
	}
	const runner_up = {
		player: player_gen(vector(0, 1), vector(1, 2), vector(1, 1), vector(1, 0), vector(), vector(1, -1), vector(1, -2), vector(0, -3)), 
		starting_position: position(2, 0)
	}
	const dnf = {
		player: player_gen(vector(0, 1), vector(1, 2), vector(2, 3), vector(2, 3), vector(1, 2), vector(0, 1), vector()),
		starting_position: position(2, 0)
	}
	const late_dnf = {
		player: player_gen(vector(0, 1), vector(1, 2), vector(1, 1), vector(1, 0), vector(1, -1), vector(2, 0), vector(2, -1)), 
		starting_position: position(2, 0)
	}
	const cheater = {
		player: player_gen(vector(0, 1), vector(1, 2), vector(4, 6)),
		starting_position: position(2, 0)
	}
	const velocities = [ vector(0, 1), vector(1, 2)]
	const failing_player = {
		player: (iterator => ({ possible_moves, default_move }) => {
				if (onDefault) onDefault(default_move)
				const next = iterator.next()
				return next.done ? Promise.reject('Done') : Promise.resolve(move(possible_moves[0].start, next.value))
			})(velocities[Symbol.iterator]()),
		starting_position: position(2, 0)
	}
	failing_player.player.expected = velocities
	const players = [winning_player, runner_up, dnf, late_dnf, cheater, failing_player]
	players.forEach(p => p.path = path(p.starting_position, ...p.player.expected))
	return { winning_player, runner_up, dnf, late_dnf, cheater, failing_player }
}

test('single-player run within bounds', (expect) => {
	const { winning_player } = test_players()
	expect.plan(3 * winning_player.path.length)
    let expected_turn = 0
	run(the_track, winning_player)
	.onValue(({move: [{move}], turn}) => {
		expect.deepEquals(turn, ++expected_turn, 'turns are reported correctly')
		expect.deepEquals(move, winning_player.path[turn - 1], 'the chosen velocities are used')
		expect.true(the_track.in_bounds(move.end), 'moves are with bounds')
	})
	.onFinish(({ winner: [winner], turn, final: [{move}] }) => {
		expect.deepEquals(winner, 0, 'last move is a winning move')
		expect.equals(turn, 7, 'Completed in 7 turns')
		expect.deepEquals(move, winning_player.path[turn - 1], 'Finish returns last move')
	})
	.onError(reason => expect.fail('Shouldn\'t give ' + reason))
})

test('Default move', expect => {
	let default_moves = [ move(position(2, 0), vector()), move(position(2, 1), vector(0, 1)), move(position(3, 3), vector(1, 2)) ]
	expect.plan(default_moves.length)
	let turn = 0
	const onDefault = (default_move) => {
		expect.deepEquals(default_move, default_moves[turn++], 'Default move reported correctly')
	}
	const { cheater } = test_players(onDefault)
	run(the_track, cheater)
	  .onError(reason => expect.fail('Unexpected error: ' + reason))
})

test('cheating finishes with dsq', expect => {
	const p0 = position(1, 0)
	const p1 = position(1, 1)
	const v0 = vector(-1, 0)
	const v1 = vector(0, 2)
	expect.plan(6)
	run(the_track, {player: () => Promise.resolve(move(p0, v0)), starting_position: p0})
		.onFinish(({winner, turn, final}) => {
			expect.deepEquals(winner, [], 'Moving out of bounds doesn\'t produce a winner')
			expect.deepEquals(final[0].dsq, 'Illegal move', 'Moving out of bounds disqualifies')
		})
		.onError(reason => expect.fail('Shouldn\'t give ' + reason))
	run(the_track, {player: () => Promise.resolve(move(p0, v1)), starting_position: p0})
		.onFinish(({winner, turn, final}) => {
			expect.deepEquals(winner, [], 'Ineligeble moves doesn\'t produce a winner')
			expect.deepEquals(final[0].dsq, 'Illegal move', 'Ineligble moves disqualifies')
		})
		.onError(reason => expect.fail('Shouldn\'t give ' + reason))
	run(the_track, {player: () => Promise.resolve(move(p1, v1)), starting_position: p0})
		.onFinish(({winner, turn, final}) => {
			expect.deepEquals(winner, [], 'Teleporting doesn\'t produce a winner')
			expect.deepEquals(final[0].dsq, 'Illegal move', 'Teleporting disqualifies')
		})
		.onError(reason => expect.fail('Shouldn\'t give ' + reason))
})

test('Player fails', expect => {
	const { failing_player } = test_players()
	expect.plan(1)
	run(the_track, failing_player)
	.onError(reason => expect.equals(reason, 'Done', 'Player failure is propagated'))
})

test('single-player run out of bounds', (expect) => {
	expect.plan(9)
	const { dnf } = test_players()
	run(the_track, dnf)
	.onValue(({move: [{move}], turn}) => {
		expect.deepEquals(move, dnf.path[turn - 1], 'the chosen velocities are used')
		expect.true(the_track.in_bounds(move.end), 'Moves are with bounds')
	})
	.onFinish(({ winner, turn, final}) => {
		expect.deepEquals(winner, [], 'Out of bounds is losing')
		expect.deepEquals(turn, 4)
		expect.deepEquals(final[0].dnf,'Crashed')
	})
	.onError(reason => expect.fail('Shouldn\'t give ' + reason))
})

const project = (...properties) => (obj) => 
	properties.reduce((proj, p) => { 
		if (obj[p] !== undefined) proj[p] = obj[p] 
		return proj 
	}, {})

test('more players', (expect) => {
	const { winning_player, runner_up, dnf, cheater } = test_players()
	const expected_turns = [
		[{move: winning_player.path[0]}, {move: runner_up.path[0]}, {move: dnf.path[0]}, {move: cheater.path[0]}],
		[{move: winning_player.path[1]}, {move: runner_up.path[1]}, {move: dnf.path[1]}, {move: cheater.path[1]}],
		[{move: winning_player.path[2]}, {move: runner_up.path[2]}, {move: dnf.path[2]}, {dsq: 'Illegal move'}],
		[{move: winning_player.path[3]}, {move: runner_up.path[3]}, {dnf: 'Crashed'}, {dsq: 'Illegal move'}],
		[{move: winning_player.path[4]}, {move: runner_up.path[4]}, {dnf: 'Crashed'}, {dsq: 'Illegal move'}],
		[{move: winning_player.path[5]}, {move: runner_up.path[5]}, {dnf: 'Crashed'}, {dsq: 'Illegal move'}]
	]
	expect.plan(9)
	run(the_track, winning_player, runner_up, dnf, cheater)
		.onValue(({move, turn}) => expect.deepEquals(move.map(project('move', 'dnf', 'dsq')), expected_turns[turn - 1], 'Game proceeds as expected'))
		.onFinish(({winner, turn, final}) => {
			expect.deepEquals(winner, [0]) 
			expect.equals(turn, 7)
			expect.deepEquals(final.map(project('move', 'dnf', 'dsq')), [{move: winning_player.path[6]}, {move: runner_up.path[6]}, {dnf: 'Crashed'}, {dsq: 'Illegal move'}])
		})
		.onError(reason => {console.log(reason.stack); expect.fail('Unexpected error: ' + reason)})
})

test('Failing player', (expect) => {
	const { winning_player, runner_up, failing_player } = test_players()
	const expected_turns = [
		[winning_player.path[0], runner_up.path[0], failing_player.path[0]],
		[winning_player.path[1], runner_up.path[1], failing_player.path[1]]
	]
	expect.plan(3)
	const expected_iterator = expected_turns[Symbol.iterator]()
	run(the_track, winning_player, runner_up, failing_player)
		.onValue(({move}) => expect.deepEquals(move.map(x => x.move), expected_iterator.next().value, 'Game proceeds as expected'))
		.onFinish(() => expect.fail('The run cannot finish'))
		.onError(reason => expect.equals(reason, 'Done', 'Failure reason propagated'))

})

test('Ties', (expect) => {
	const { winning_player, runner_up } = test_players()
	const { winning_player: winner2 } = test_players()
	const expected_turns = [0, 1, 2, 3, 4, 5].map(i => [ winning_player.path[i], winner2.path[i], runner_up.path[i]])
	expect.plan(9)
	run(the_track, winning_player, winner2, runner_up)
		.onValue(({move, turn}) => expect.deepEquals(move.map(x => x.move), expected_turns[turn - 1], 'Game proceeds as expected'))
		.onFinish(({winner, final, turn}) => {
			expect.deepEquals(winner, [0, 1])
			expect.deepEquals(turn, 7)
			expect.deepEquals(final.map(project('move')), [{move: winning_player.path[6]}, {move: winner2.path[6]}, {move: runner_up.path[6]}])
		})
		.onError(() => expect.fail('Errors reported in result'))
})

test('No winners', (expect) => {
	const { dnf, cheater } = test_players()
	const expected_turns = [
		[{move: dnf.path[0]}, {move: cheater.path[0]}],
		[{move: dnf.path[1]}, {move: cheater.path[1]}],
		[{move: dnf.path[2]}, {dsq: 'Illegal move'}]
	]
	expect.plan(6)
	run(the_track, dnf, cheater)
		.onValue(({move, turn}) => expect.deepEquals(move.map(project('move', 'dsq')), expected_turns[turn - 1], 'Game proceeds as expected'))
		.onFinish(({winner, turn, final}) => {
			expect.deepEquals(winner, [])
			expect.deepEquals(turn, 4)
			expect.deepEquals(final.map(project('dnf', 'dsq')),  [{dnf: 'Crashed'}, {dsq: 'Illegal move'}])
		})
		.onError(() => expect.fail('Errors reported in result'))
})

test('Crashing while someone else wins', (expect) => {
	const { winning_player, late_dnf } = test_players()
	const expected_turns = [0, 1, 2, 3, 4, 5].map(i => [ winning_player.path[i], late_dnf.path[i]])
	expect.plan(9)
	run(the_track, winning_player, late_dnf)
		.onValue(({move, turn}) => expect.deepEquals(move.map(x => x.move), expected_turns[turn - 1], 'Game proceeds as expected'))
		.onFinish(({winner, final, turn}) => {
			expect.deepEquals(winner, [0])
			expect.deepEquals(turn, 7)
			expect.deepEquals(final.map(project('move', 'dnf')), [{move: winning_player.path[6]}, {dnf: 'Crashed'}])
		})
		.onError(() => expect.fail('Errors reported in result'))
})


test('Crashing at different times', (expect) => {
	const { dnf, late_dnf } = test_players()
	const expected_turns = [0, 1, 2, 3, 4, 5].map(i => i < 3? [ {move: dnf.path[i]}, {move: late_dnf.path[i]}] : [{ dnf: 'Crashed' }, {move: late_dnf.path[i]}])
	expect.plan(9)
	run(the_track, dnf, late_dnf)
		.onValue(({move, turn}) => expect.deepEquals(move.map(project('move', 'dnf')), expected_turns[turn - 1], 'Game proceeds as expected'))
		.onFinish(({winner, final, turn}) => {
			expect.deepEquals(winner, [])
			expect.deepEquals(turn, 7)
			expect.deepEquals(final.map(project('dnf')), [{dnf: 'Crashed'}, {dnf: 'Crashed'}])
		})
		.onError(() => expect.fail('Errors reported in result'))
})
