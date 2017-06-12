const { position, vector, move, track} = require('./track.js')
const { is_legal, next_moves, run } = require('./rules.js')(vector, move)
const consolegame = require('./consolegame.js')


const real_console = ({stdin, stdout}) => {
    const readline = require('readline').createInterface({input: stdin, output: stdout})
    return {
        tell(message) {
            readline.write(message)
            readline.write('\n')
        },
        ask(question) {
            return new Promise((resolve, reject) => {
                try {
                    readline.question(question + '\n', resolve)
                } catch (e) {
                    reject(e)
                }
            })
        },
        close() {
            readline.close()
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
const the_track = track(track_spec, [position(7, 0), position(8, 0)]);

consolegame(run)(() => ({ track: the_track, starting_position: position(2, 0) })).run(real_console(process))
