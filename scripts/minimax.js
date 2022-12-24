// check for winner
function evaluate(board, dim) {
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

let minimax = (function () {
    let bestMoves = [];

    function nextMove() {
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function search(board, dim, depth, alpha, beta, maximizingPlayer) {
        const boardVal = evaluate(board, dim);

        if (!depth || boardVal) return boardVal;

        const cell = maximizingPlayer ? 1 : -1;

        let limit = maximizingPlayer ? -Infinity : Infinity;

        rows: for (let i = 0; i < dim; i++) {
            cols: for (let j = 0; j < dim; j++) {
                if (!board[i][j]) {
                    board[i][j] = cell;

                    let val = search(board, dim, depth - 1, alpha, beta, !maximizingPlayer);

                    if (val === limit) bestMoves.push({ targetX: i, targetY: j });

                    if (maximizingPlayer) {
                        alpha = Math.max(alpha, val);

                        if (val > limit) {
                            limit = val;
                            bestMoves = [{ targetX: i, targetY: j }];
                        }
                    } else {
                        beta = Math.min(beta, val);

                        if (val < limit) {
                            limit = val;
                            bestMoves = [{ targetX: i, targetY: j }];
                        }
                    }

                    board[i][j] = 0;

                    if (alpha >= beta) break rows;
                }
            }
        }

        return limit;
    }

    return {
        nextMove,
        search,
    };
})();

function pickDepth(moves, difficulty) {
    switch (difficulty) {
        case 1:
            return Math.max(moves / 2);
        case 2:
            return Math.max((3 * moves) / 4);
        case 3:
            return moves;
    }
}

function getMove(board, dim, moves, difficulty, maximizingPlayer) {
    const depth = pickDepth(moves, difficulty);
    minimax.search(board, dim, depth, -Infinity, Infinity, maximizingPlayer);

    return minimax.nextMove();
}
