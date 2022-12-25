function terminal(board, dim) {
    let rows = new Array(dim).fill(0), // row wins
        cols = new Array(dim).fill(0), // column wins
        diags = new Array(2).fill(0); // top left - bottom right, bottom left - top right respectively

    const equal = (i, j, val) => val && board[i][j] === val;

    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            rows[i] += equal(i, j, board[i][0]);
            cols[j] += equal(i, j, board[0][j]);
        }

        diags[0] += equal(i, i, board[0][0]);
        diags[1] += equal(dim - 1 - i, i, board[dim - 1][0]);
    }

    const i = rows.indexOf(dim);
    const j = cols.indexOf(dim);

    if (i !== -1) return board[i][0];
    if (j !== -1) return board[0][j];

    if (diags[0] === dim) return board[0][0];
    if (diags[1] === dim) return board[dim - 1][0];

    return 0;
}

function rotate(board, dim) {
    let newBoard = [];
    for (let i = 0; i < dim; i++) newBoard.push(new Array(dim));

    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            newBoard[dim - 1 - j][dim - 1 - i] = board[i][j];
        }
    }

    return newBoard;
}

// heuristic evaluation
function evaluate(board, dim, difficultyPercentage) {
    const rotated = rotate(board, dim);
    let diagonals = [[], []];

    let score = 0;
    let iP, iC;

    const sum = (p, c, arr) => {
        let subScore = 0;

        if (p !== -1 && c === -1) {
            const count = arr.reduce((accumulator, cell) => accumulator + (cell === 1), 0);
            subScore += Math.pow(10, count);
        } else if (p === -1 && c != -1) {
            const count = arr.reduce((accumulator, cell) => accumulator + (cell === -1), 0);
            subScore += -Math.pow(10, count);
        }

        return subScore;
    };

    for (let i = 0; i < dim; i++) {
        // row score
        iP = board[i].indexOf(1);
        iC = board[i].indexOf(-1);

        score += sum(iP, iC, board[i]);

        // column score
        iP = rotated[i].indexOf(1);
        iC = rotated[i].indexOf(-1);

        score += sum(iP, iC, rotated[i]);

        // fill diagonals
        diagonals[0].push(board[i][i]);
        diagonals[1].push(board[dim - 1 - i][i]);
    }

    // diagonal score
    iP = diagonals[0].indexOf(1);
    iC = diagonals[0].indexOf(-1);

    score += sum(iP, iC, diagonals[0]);

    iP = diagonals[1].indexOf(1);
    iC = diagonals[1].indexOf(-1);

    score += sum(iP, iC, diagonals[1]);

    // add noise with random value
    const bound = Math.floor(difficultyPercentage * 1000);
    const rand = Math.floor(Math.random() * bound + 1);

    return score + rand;
}

const Move = (r, c) => ({ targetX: r, targetY: c });

const minimax = (function () {
    let difficultyPercentage;

    function setDifficulty(difficulty) {
        switch (difficulty) {
            case 1:
                difficultyPercentage = 0.5;
                break;
            case 2:
                difficultyPercentage = 0.35;
                break;
            case 3:
                difficultyPercentage = 0.15;
                break;
        }
    }

    function getDepth(moves, difficulty) {
        switch (difficulty) {
            case 1:
                return Math.ceil(0.2 * moves);
            case 2:
                return Math.ceil(0.3 * moves);
            case 3:
                return Math.ceil(0.5 * moves);
        }
    }

    function search(board, dim, depth, alpha, beta, maximizingPlayer) {
        if (!depth || terminal(board, dim)) {
            const val = evaluate(board, dim, difficultyPercentage);
            return [val, Move(-1, -1)];
        }

        const cell = maximizingPlayer ? 1 : -1;
        const func = maximizingPlayer ? Math.max : Math.min;

        let limit = maximizingPlayer ? -Infinity : Infinity;
        let bestMove;

        rows: for (let i = 0; i < dim; i++) {
            for (let j = 0; j < dim; j++) {
                if (!board[i][j]) {
                    board[i][j] = cell;

                    const val = search(board, dim, depth - 1, alpha, beta, !maximizingPlayer)[0];

                    board[i][j] = 0;

                    limit = func(limit, val);

                    if (maximizingPlayer && val > alpha) {
                        alpha = val;
                        bestMove = Move(i, j);
                    }
                    if (!maximizingPlayer && val < beta) {
                        beta = val;
                        bestMove = Move(i, j);
                    }

                    if (alpha >= beta) break rows;
                }
            }
        }

        return [limit, bestMove];
    }
    return {
        setDifficulty,
        getDepth,
        search,
    };
})();

export default function getMove(board, dim, moves, difficulty, maximizingPlayer) {
    minimax.setDifficulty(difficulty);

    const depth = minimax.getDepth(moves, difficulty);
    const move = minimax.search(board, dim, depth, -Infinity, Infinity, maximizingPlayer)[1];

    return move;
}
