const tape = require('tape');
const test = (description, test_function) => {
	tape(description, (expect) => {
		test_function(expect);
		if (!expect._plan) expect.end();
	});
};
test.skip = tape.skip;
const { position, vector, move, track_from_string_array} = require('../track.js')
const { is_legal, next_moves, run } = require('../rules.js')(vector, move)
const consolegame = require('../consolegame.js')

const mock_console = expect => {
    const expectations = []
    let closed = false
    return {
        expect_tell(message, description) {
            expectations.push({tell: message, description})
        },
        expect_ask(question, ...args) {
            if (args.length === 1) {
                var answer = undefined, [description] = args
            } else {
                var [answer, description] = args
            }
            expectations.push({question: question, answer: answer, description})
        },
        expect_no_answer(question, description) {
            expectations.push({question: question, description})
        },
        run() {
            expect.plan(3 * expectations.length + 1)
            return {
                tell(message) {
                    const {tell, question, description} = expectations.shift()
                    expect.false(closed, 'Operation not called on closed console');
                    if (question) {
                        expect.equal(question, undefined, 'Expected ask ' + question + '\nGot tell ' + message);
                    } else {
                        expect.notEqual(tell, undefined, 'Expected tell');
                    }
                    expect.equals(message, tell, description);
                },
                ask(message) {
                    const {question, answer, tell, description} = expectations.shift()
                    expect.false(closed, 'Operation not called on closed console');
                    if (tell) {
                        expect.equal(tell, undefined, 'Expected tell ' + tell + '\nGot ask ' + message);
                    } else {
                        expect.notEqual(question, undefined, 'Expected ask');
                    }
                    expect.equals(message, question, description);
                    return answer? Promise.resolve(answer) : Promise.reject('Cancelled');
                },
                close() {
                    expect.false(closed, 'Close was called exactly once')
                    closed = true
                }
            }
        }
    }
}

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
];
const the_track = track_from_string_array(track_spec, [position(7, 0), position(8, 0)]);
const track_printer = () => {
    const track = track_spec.slice().reverse()
    return {
        toString() {
            return track.reverse().join('\n');
        },
        splice(y, x, ...values) {
            track[y] = track[y].slice(0, x).concat(values.join(''), track[y].slice(x + values.length))
            return this;
        }
    }.splice(0, 7, '-', '-')
}

test('The short run', expect => {
    const starting_position = position(7, 1)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(2, 6, '7', '8', '9')
        .splice(1, 7, '.', '6')
        .splice(0, 7, '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '3', 'Game prompts for move')
    console.expect_tell(track_printer().splice(0, 8, '#').toString(), 'Game shows game state')
    console.expect_tell('You won in 1 turn', 'Came reports result');
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})

test('Won in two', expect => {
    const starting_position = position(7, 1)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(2, 6, '7', '8', '9')
        .splice(1, 7, '.', '6')
        .splice(0, 7, '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '5', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(2, 6, '7', '8', '9')
        .splice(1, 7, '.', '6')
        .splice(0, 7, '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '3', 'Game prompts for move')
    console.expect_tell(track_printer().splice(0, 8, '#').toString(), 'Game shows game state')
    console.expect_tell('You won in 2 turns', 'Came reports result');
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})

test('The early cancel', expect => {
    const starting_position = position(2, 0)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(1, 1, '7', '8')
        .splice(0, 1, '4', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', 'Game prompts for move')
    console.expect_tell('Cancelled', 'Game reports error')
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})

test('The second move', expect => {
    const starting_position = position(2, 0)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(1, 1, '7', '8')
        .splice(0, 1, '4', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '8', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(3, 1, '7', '8', '9')
        .splice(2, 1, '4', '5', '6')
        .splice(1, 1, '1', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', 'Game prompts for move')
    console.expect_tell('Cancelled', 'Game reports error')
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})

test('All directions', expect => {
    const starting_position = position(5, 5)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(6, 4, '7', '8', '9')
        .splice(5, 4, '4', '.', '6')
        .splice(4, 4, '1', '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '5', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(6, 4, '7', '8', '9')
        .splice(5, 4, '4', '.', '6')
        .splice(4, 4, '1', '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '1', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(4, 2, '7', '8', '.')
        .splice(3, 2, '4', '5')
        .splice(2, 2, '1')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '9', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(5, 3, '7', '8', '9')
        .splice(4, 3, '4', '.', '6')
        .splice(3, 3, '1')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '8', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(7, 3, '7', '8', '9')
        .splice(6, 3, '4', '5', '6')
        .splice(5, 3, '1', '.', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '2', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(6, 3, '7', '8', '9')
        .splice(5, 3, '4', '.', '6')
        .splice(4, 3, '1', '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '6', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(6, 5, '7', '8')
        .splice(5, 5, '.', '5', '6')
        .splice(4, 5, '1', '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '4', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(6, 4, '7', '8', '9')
        .splice(5, 4, '4', '.', '6')
        .splice(4, 4, '1', '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '3', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(4, 6, '.', '8')
        .splice(3, 6, '4', '5', '6')
        .splice(2, 6, '1', '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '7', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(5, 5, '7', '8', '9')
        .splice(4, 5, '4', '.', '6')
        .splice(3, 5, 'X', '2', '3')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', 'Game prompts for move')
    console.expect_tell('Cancelled', 'Game reports error')
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})

test('Showing the player position', expect => {
    const starting_position = position(2, 0)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(1, 1, '7', '8')
        .splice(0, 1, '4', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '8', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(3, 1, '7', '8', '9')
        .splice(2, 1, '4', '5', '6')
        .splice(1, 1, '1', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '8',  'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(6, 3, '9')
        .splice(5, 2, '5', '6')
        .splice(4, 2, '2', '3')
        .splice(3, 2, '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', 'Game prompts for move')
    console.expect_tell('Cancelled', 'Game reports error')
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})

test('Crashing', expect => {
    const starting_position = position(2, 0)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(1, 1, '7', '8')
        .splice(0, 1, '4', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '8', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(3, 1, '7', '8', '9')
        .splice(2, 1, '4', '5', '6')
        .splice(1, 1, '1', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '8',  'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(6, 3, '9')
        .splice(5, 2, '5', '6')
        .splice(4, 2, '2', '3')
        .splice(3, 2, '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '9', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(9, 3, '¤', '¤', '¤')
        .splice(8, 3, '¤', '¤', '¤')
        .splice(6, 3, '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Danger, danger, danger ...', 'Anything', 'Game waits for prompt')
    console.expect_tell(track_printer()
        .splice(9, 4, '.')
        .toString(), 'Game shows game state')
    console.expect_tell('You crashed after 4 turns')
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})

test('Wrong input', expect => {
    const starting_position = position(2, 0)
    const console = mock_console(expect)
    console.expect_tell(track_printer()
        .splice(1, 1, '7', '8')
        .splice(0, 1, '4', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '8', 'Game prompts for move')
    console.expect_tell(track_printer()
        .splice(3, 1, '7', '8', '9')
        .splice(2, 1, '4', '5', '6')
        .splice(1, 1, '1', '.')
        .toString(), 'Game shows game state')
    console.expect_ask('Please select move', '3',  'Game prompts for move')
    console.expect_ask('Not a valid move. Please select move')
    console.expect_tell('Cancelled', 'Game reports error')
    const game = consolegame(run)(() => ({ track: the_track, starting_position }))
    game.run(console.run())
})
