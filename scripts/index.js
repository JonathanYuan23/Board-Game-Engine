// pubsub module pattern
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

let gameControlerModule = (function () {
    let whoseTurn = 1;
    let alteringGameboard = 0;
    let gameOver = 0;

    // bind events
    pubsub.subscribe('clickCell', check);
    pubsub.subscribe('resetGame', reset);
    pubsub.subscribe('toggleAltering', toggleAltering);
    pubsub.subscribe('toggleTurn', toggleTurn);
    pubsub.subscribe('gameOver', toggleGameOver);

    function altering() {
        return alteringGameboard;
    }

    function over() {
        return gameOver;
    }

    function toggleAltering() {
        alteringGameboard = arguments.length > 0 ? arguments[0] : !alteringGameboard;
    }

    function toggleTurn() {
        whoseTurn = arguments.length > 0 ? arguments[0] : !whoseTurn;
    }

    function toggleGameOver() {
        gameOver = arguments.length > 0 ? arguments[0] : !gameOver;
    }

    function check(clickCell) {
        const row = clickCell.row;
        const col = clickCell.col;
        const gameboard = clickCell.gameboard;

        const changeCell = {
            row: row,
            col: col,
            html: whoseTurn ? 'X' : 'O',
            validTurn: gameboard[row][col] === '',
        };

        toggleAltering();
        pubsub.publish('changeCell', changeCell);
    }

    function reset() {
        toggleAltering(0);
        toggleTurn(1);
        toggleGameOver(0);
    }

    return {
        altering,
        over,
    };
})();

let headerModule = (function () {
    let winner;

    // cache DOM
    const resetBtn = document.querySelector('#reset-btn');

    // bind events
    resetBtn.addEventListener('click', reset);

    function reset() {
        if (!gameControlerModule.altering() && !gameControlerModule.over()) pubsub.publish('resetGame');
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
        const index = boardCells.indexOf(event.currentTarget);
        const clickCell = {
            row: Math.floor(index / 3),
            col: index % 3,
            gameboard: gameboard,
        };
        if (!gameControlerModule.altering() && !gameControlerModule.over()) pubsub.publish('clickCell', clickCell);
    }

    function renderCell(changeCell) {
        if (changeCell.validTurn) {
            const { row, col, html } = changeCell;
            const index = row * 3 + col;

            gameboard[row][col] = html;
            boardCells[index].innerHTML = `<span class="selection">${html}</span>`;

            if (gameOver(html)) return;

            pubsub.publish('toggleTurn');
        }
        pubsub.publish('toggleAltering');
    }

    function toggleModal() {
        const msg = winMsgs.find((e) => e.getAttribute('id') === winner);

        overlay.classList.toggle('active');
        msg.classList.toggle('active');
        playAgainBtn.classList.toggle('active');
    }

    function reset() {
        gameboard = [
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
        ];
        boardCells.forEach((cell) => (cell.innerHTML = ''));
        strikethroughs.forEach((strikethrough) => strikethrough.classList.remove('active'));
    }

    function gameOver(player) {
        // prefix sum arrays for each row, column and diagonal
        let rows = [0, 0, 0],
            cols = [0, 0, 0],
            diags = [0, 0];
        let cellsOccupied = 0;

        const equal = (i, j, val) => gameboard[i][j] === val;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (gameboard[i][j] != '') cellsOccupied++;

                cols[j] += equal(i, j, player); // top -> down
                rows[j] += equal(j, i, player); // left -> right
            }

            diags[0] += equal(i, i, player); // topleft -> bottom right
            diags[1] += equal(2 - i, i, player); // bottom left -> top right
        }

        // it is now possible to join all the psas with index matching to the strikethroughs array
        const winIndex = [...rows, ...cols, ...diags].findIndex((e) => e === 3);

        if (winIndex >= 0) {
            pubsub.publish('gameOver', 1);
            strikethroughs[winIndex].classList.add('active');

            winner = player;
            toggleModal();

            return true;
        }

        if (cellsOccupied === 9) {
            pubsub.publish('gameOver', 1);

            winner = 'draw';
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
