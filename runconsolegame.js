const { position, vector, move, track} = require('./track.js')
const { run } = require('./rules.js')(vector, move)
const { arc } = require('./curve.js')
const { from_curve } = require('./trackgenerator.js')(track, vector)
const consolegame = require('./consolegame.js')(run)


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

const the_track = from_curve({width: 21, height: 21}, arc.negative(position(11, 0), 6, 16, Math.PI, 0), 6)
const generator = () => the_track
const game = consolegame(generator)
game.run(real_console(process))
