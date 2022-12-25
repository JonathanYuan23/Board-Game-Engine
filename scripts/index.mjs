import getMove from './minimax.mjs';

let pubsub = (function () {
    let events = {};

    function subscribe(eventName, ...func) {
        for (let i = 0; i < func.length; i++) {
            events[eventName] = events[eventName] || [];
            events[eventName].push(func[i]);
        }
    }

    function unsubscribe(eventName, func) {
        if (events[eventName]) {
            for (let i = 0; i < events[eventName].length; i++) {
                if (events[eventName] === func) {
                    events[eventName].splice(i, 1);
                    break;
                }
            }
        }
    }

    function publish(eventName, ...data) {
        if (events[eventName]) {
            events[eventName].forEach((func) => {
                func(...data);
            });
        }
    }

    return {
        subscribe,
        unsubscribe,
        publish,
    };
})();

const Player = (symbol, value) => ({ symbol, value });
const Cell = (r, c, moves, player) => ({ r, c, moves, player });

const _sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

let gameControlerModule = (function () {
    const players = [Player('X', 1), Player('O', -1)];
    const difficultyMap = {
        Easy: 1,
        Normal: 2,
        Hard: 3,
    };

    let moves = 0;
    let turn = 0;
    let altering = 0;
    let over = 0;

    // cache DOM
    const resetBtn = document.querySelector('#reset-btn');
    const difficultyForm = document.querySelector('#difficulty-form');
    const difficultySelect = document.querySelector('#difficulty');

    // bind events
    resetBtn.addEventListener('click', () => {
        if (!altering && !over) pubsub.publish('resetGame');
    });
    difficultyForm.addEventListener('change', () => {
        if (!altering && !over) pubsub.publish('resetGame');
    });

    pubsub.subscribe('clickCell', check);
    pubsub.subscribe('resetGame', resetGame);
    pubsub.subscribe('setAltering', setAltering);
    pubsub.subscribe('setTurn', setTurn);
    pubsub.subscribe('generateMove', generateMove);
    pubsub.subscribe('over', setOver);

    function setAltering() {
        altering = arguments.length > 0 ? arguments[0] : !altering;
    }

    function setMoves() {
        moves = arguments.length > 0 ? arguments[0] : 0;
    }

    function setTurn() {
        turn = arguments.length > 0 ? arguments[0] : +!turn; // + is necessary for casting to int

        if (turn) pubsub.publish('computerMove');
    }

    function setOver() {
        over = arguments.length > 0 ? arguments[0] : !over;
    }

    async function generateMove(board) {
        setAltering(); // block user from making new move

        const difficulty = difficultyMap[difficultySelect.value];
        const { targetX: r, targetY: c } = getMove(board, 3, 9 - moves, difficulty, 0);

        const newCell = Cell(r, c, moves, players[turn]);

        await _sleep(500 + Math.random() * 500);

        moves++;

        pubsub.publish('changeCell', newCell);
    }

    function check(cell, board) {
        const r = cell.r;
        const c = cell.c;

        if (altering || over || board[r][c] !== 0) return;

        moves++;

        const newCell = Cell(r, c, moves, players[turn]);

        setAltering();
        pubsub.publish('changeCell', newCell);
    }

    function resetGame() {
        setTurn(0);
        setOver(0);
        setMoves(0);
    }
})();

let gameboard = (function () {
    let board = [new Array(3).fill(0), new Array(3).fill(0), new Array(3).fill(0)];

    let result;

    // cache DOM
    const boardCells = Array.from(document.querySelectorAll('.board-cell'));
    const diagStrikethroughs = Array.from(document.querySelectorAll('.diagonal-strikethrough'));
    const strikethroughs = [...Array.from(document.querySelectorAll('.strikethrough')), ...diagStrikethroughs];
    const winMsgs = Array.from(document.querySelectorAll('.win-msg'));
    const playAgainBtn = document.querySelector('#play-again-btn');
    const overlay = document.querySelector('#overlay');

    // bind events
    boardCells.forEach((cell) => cell.addEventListener('click', cellClicked));
    playAgainBtn.addEventListener('click', playAgain);
    pubsub.subscribe('changeCell', renderCell);
    pubsub.subscribe('resetGame', reset);
    pubsub.subscribe('computerMove', () => pubsub.publish('generateMove', board));

    function cellClicked(event) {
        const i = boardCells.indexOf(event.currentTarget);
        const cell = {
            r: Math.floor(i / 3),
            c: i % 3,
        };
        pubsub.publish('clickCell', cell, board);
    }

    function renderCell(newCell) {
        const { r, c, moves, player } = newCell;
        const i = r * 3 + c;
        board[r][c] = player.value;
        boardCells[i].innerHTML = `<span class="selection">${player.symbol}</span>`;

        if (over(player.value, player.symbol, moves)) return;

        pubsub.publish('setAltering');
        pubsub.publish('setTurn');
    }

    function toggleModal() {
        const msg = winMsgs.find((e) => e.getAttribute('id') === result);

        overlay.classList.toggle('active');
        msg.classList.toggle('active');
        playAgainBtn.classList.toggle('active');
    }

    function reset() {
        board = [new Array(3).fill(0), new Array(3).fill(0), new Array(3).fill(0)];
        boardCells.forEach((cell) => (cell.innerHTML = ''));
        strikethroughs.forEach((strikethrough) => strikethrough.classList.remove('active'));
    }

    function over(value, symbol, moves) {
        let rows = new Array(3).fill(0),
            cols = new Array(3).fill(0),
            diags = new Array(2).fill(0);

        const equal = (i, j, val) => board[i][j] === val;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                rows[i] += equal(i, j, value);
                cols[j] += equal(i, j, value);
            }

            diags[0] += equal(i, i, value);
            diags[1] += equal(2 - i, i, value);
        }

        const i = [...rows, ...cols, ...diags].findIndex((e) => e === 3);

        if (i !== -1) {
            pubsub.publish('over', 1);
            pubsub.publish('setAltering', 0);

            strikethroughs[i].classList.add('active');

            result = symbol;
            toggleModal();

            return true;
        }

        if (moves === 9) {
            pubsub.publish('over', 1);
            pubsub.publish('setAltering', 0);

            result = 'draw';
            toggleModal();

            return true;
        }

        return false;
    }

    function playAgain() {
        toggleModal();
        pubsub.publish('resetGame');
    }
})();
