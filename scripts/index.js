// pubsub module pattern
let pubsub = (function () {
    let events = {};

    function subscribe(eventName, func) {
        events[eventName] = events[eventName] || [];
        events[eventName].push(func);
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

let gameControlerModule = (function () {
    let whoseTurn = 1;
    let alteringGameboard = 0;
    let gameOver = 0;

    // bind events
    pubsub.subscribe('clickCell', check);
    pubsub.subscribe('resetGame', reset);
    pubsub.subscribe('toggleAltering', toggleAltering);
    pubsub.subscribe('toggleTurn', toggleTurn);

    function toggleAltering() {
        alteringGameboard = arguments.length > 0 ? arguments[0] : !alteringGameboard;
    }

    function toggleTurn() {
        whoseTurn = arguments.length > 0 ? arguments[0] : !whoseTurn;
    }

    function toggleGameOver() {
        gameOver = !gameOver;
    }

    function check(clickCell) {
        // give changes time to render
        if (alteringGameboard) return;

        const row = clickCell.row;
        const col = clickCell.col;
        const gameboard = clickCell.gameboard;

        const changeCell = {
            row: row,
            col: col,
            html: whoseTurn ? 'X' : 'O',
            validTurn: gameboard[row][col] === '' && !gameOver,
        };

        toggleAltering();
        pubsub.publish('changeCell', changeCell);
    }

    function reset() {
        toggleAltering(0);
        toggleTurn(1);
    }
})();

let headerModule = (function () {
    // cache DOM
    const resetBtn = document.querySelector('#reset-btn');

    // bind events
    resetBtn.addEventListener('click', reset);

    function reset() {
        pubsub.publish('resetGame');
    }
})();

let gameboardModule = (function () {
    let gameboard = [
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
    ];

    // cache DOM
    const boardCells = Array.from(document.querySelectorAll('.board-cell'));

    // bind events
    boardCells.forEach((cell) => cell.addEventListener('click', cellClicked));
    pubsub.subscribe('changeCell', renderCell);
    pubsub.subscribe('resetGame', reset);

    function cellClicked(event) {
        const index = boardCells.indexOf(event.currentTarget);
        const clickCell = {
            row: Math.floor(index / 3),
            col: index % 3,
            gameboard: gameboard,
        };

        pubsub.publish('clickCell', clickCell);
    }

    function renderCell(changeCell) {
        if (changeCell.validTurn) {
            const { row, col, html } = changeCell;
            const index = row * 3 + col;

            gameboard[row][col] = html;
            boardCells[index].innerHTML = `<span class="selection">${html}</span>`;

            pubsub.publish('toggleTurn');
        }
        pubsub.publish('toggleAltering');
    }

    function reset() {
        gameboard = [
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
        ];
        boardCells.forEach((cell) => cell.innerHTML = '');
    }
})();
