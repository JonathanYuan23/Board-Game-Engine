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

let gameControlerModule = (function () {
    const players = [Player('X', 1), Player('O', -1)];
    let turn = 0;
    let altering = 0;
    let over = 0;

    // cache DOM
    const resetBtn = document.querySelector('#reset-btn');

    // bind events
    resetBtn.addEventListener('click', () => {
        if (!over) pubsub.publish('resetGame');
    });
    pubsub.subscribe('clickCell', check);
    pubsub.subscribe('resetGame', resetGame);
    pubsub.subscribe('toggleAltering', toggleAltering);
    pubsub.subscribe('toggleTurn', toggleTurn);
    pubsub.subscribe('over', toggleOver);

    function toggleAltering() {
        altering = arguments.length > 0 ? arguments[0] : !altering;
    }

    function toggleTurn() {
        turn = arguments.length > 0 ? arguments[0] : +!turn; // + is necessary for casting to int
    }

    function toggleOver() {
        over = arguments.length > 0 ? arguments[0] : !over;
    }

    function check(cell, board) {
        const r = cell.r;
        const c = cell.c;

        if (altering || over || board[r][c] !== 0) return;

        const newCell = {
            r,
            c,
            player: players[turn],
        };

        toggleAltering();
        pubsub.publish('changeCell', newCell);
    }

    function resetGame() {
        toggleAltering(0);
        toggleTurn(0);
        toggleOver(0);
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

    function cellClicked(event) {
        const i = boardCells.indexOf(event.currentTarget);
        const cell = {
            r: Math.floor(i / 3),
            c: i % 3,
        };
        pubsub.publish('clickCell', cell, board);
    }

    function renderCell(newCell) {
        const { r, c, player } = newCell;
        const i = r * 3 + c;
        board[r][c] = player.value;
        boardCells[i].innerHTML = `<span class="selection">${player.symbol}</span>`;

        pubsub.publish('toggleTurn');
        pubsub.publish('toggleAltering');

        if (over(player.value, player.symbol)) return;
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

    function over(value, symbol) {
        let rows = new Array(3).fill(0),
            cols = new Array(3).fill(0),
            diags = new Array(2).fill(0);
        let moves = 0;

        const equal = (i, j, val) => board[i][j] === val;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] !== 0) moves++;

                rows[i] += equal(i, j, value);
                cols[j] += equal(i, j, value);
            }

            diags[0] += equal(i, i, value);
            diags[1] += equal(2 - i, i, value);
        }

        // it is now possible to join all the psas with index matching to the strikethroughs array
        const i = [...rows, ...cols, ...diags].findIndex((e) => e === 3);

        if (i !== -1) {
            pubsub.publish('over', 1);
            strikethroughs[i].classList.add('active');

            result = symbol;
            toggleModal();

            return true;
        }

        if (moves === 9) {
            pubsub.publish('over', 1);

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
