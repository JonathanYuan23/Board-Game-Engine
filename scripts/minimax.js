// check for winner
function eval(board, dim) {
    let rows = new Array(dim).fill(0), // row wins
        cols = new Array(dim).fill(0), // column wins
        diags = [0, 0]; // top left - bottom right, bottom left - top right respectively

    const equal = (i, j, val) => val && board[i][j] === val;

    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            rows[i] += equal(i, j, board[i][0]);
            cols[j] += equal(i, j, board[0][j]);
        }

        diags[0] += equal(i, i, board[0][0]);
        diags[1] += equal(dim - 1 - i, i, board[dim - 1][0]);
    }

    for (let i = 0; i < dim; i++) {
        if (rows[i] === dim) return board[i][0];

        if (cols[i] === dim) return board[0][i];
    }

    if (diags[0] === dim) return board[0][0];

    if (diags[1] === dim) return board[dim - 1][0];

    return 0;
}

let minimax = (function () {
    let bestMove;

    function nextMove() {
        return bestMove;
    }

    function search(board, dim, depth, alpha, beta, maximizingPlayer) {
        const boardVal = eval(board, dim);

        if (!depth || boardVal) return boardVal;

        const cell = maximizingPlayer ? 1 : -1;

        let limit = maximizingPlayer ? -Infinity : Infinity;

        rows: for (let i = 0; i < dim; i++) {
            cols: for (let j = 0; j < dim; j++) {
                if (!board[i][j]) {
                    board[i][j] = cell;

                    let val = search(board, dim, depth - 1, alpha, beta, !maximizingPlayer);

                    // maximizingPlayer
                    //     ? ((alpha = Math.max(alpha, val)), (limit = Math.max(limit, val)))
                    //     : ((beta = Math.min(beta, val)), (limit = Math.min(limit, val)));

                    if (maximizingPlayer) {
                        alpha = Math.max(alpha, val);

                        if (val > limit) {
                            limit = val;
                            bestMove = { targetX: i, targetY: j };
                        }
                    } else {
                        beta = Math.min(beta, val);

                        if (val < limit) {
                            limit = val;
                            bestMove = { targetX: i, targetY: j };
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
