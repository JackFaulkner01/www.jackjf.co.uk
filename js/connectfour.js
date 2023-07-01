const ID_COLUMN = 4;
const ID_ROW = 5;
const COLUMN_LIMIT = 7;
const ROW_LIMIT = 6;
const BOARD_COLUMN_LIMIT = 6;
const BOARD_ROW_LIMIT = 5;
const CONNECT_COUNT = 4;

var board = [[0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0]];
var player1 = "discRed";
var player2 = "discGreen";
var isPlayer1 = true;
var isUser = true;
var ai;
var aiDepth;
var gameOver = false;

function bodyOnLoad() {
    var temps = document.getElementsByClassName("disc");
    var tempColumn, tempRow;
    
    ai = document.getElementById("aiLevelSelect");
    aiDepth = document.getElementById("aiDepthSelect");

    for (var i = 0; i < temps.length; i++) {
        tempColumn = parseInt(temps[i].id.charAt(ID_COLUMN)) - 1;
        tempRow = parseInt(temps[i].id.charAt(ID_ROW)) - 1;
        board[tempRow][tempColumn] = new Disc(temps[i]);

        temps[i].addEventListener("mouseover", hoverOverDisc);
        temps[i].addEventListener("mouseout", hoverOutDisc);
        temps[i].addEventListener("click", selectDisc);
    }
}

function hoverOverDisc() {
    if (gameOver || !isUser) {
        return;
    }

    var disc = getLowestDisc(this);
    
    if (disc) {
        disc.addClass(getColour() + "Hover");
    }
}

function hoverOutDisc() {
    if (gameOver || !isUser) {
        return;
    }

    var disc = getLowestDisc(this);

    if (disc) {
        disc.removeClass(getColour() + "Hover");
    }
}

function selectDisc() {
    if (gameOver || !isUser) {
        return;
    }

    var disc = getLowestDisc(this);

    if (disc) {
        disc.removeClass(getColour() + "Hover");
        disc.addClass(getColour());

        if (checkWon() == CONNECT_COUNT) {
            showWon();
        }

        isPlayer1 = !isPlayer1;

        switch (ai.selectedIndex) {
            case 0:
                randomAI();
                break;
            case 1:
                minimaxAI(0, aiDepth.value);
                break;
            case 2:
                minimaxAI(1, aiDepth.value);
                break;
        }

        isPlayer1 = !isPlayer1;
    }
}

class Disc {
    constructor(disc) {
        this.disc = disc;
    }

    isSelected() {
        return this.disc.classList.contains(player1) || this.disc.classList.contains(player2);
    }

    getColumn() {
        return this.disc.id.charAt(ID_COLUMN) - 1;
    }

    getRow() {
        return this.disc.id.charAt(ID_ROW) - 1;
    }

    addClass(cssClass) {
        this.disc.classList.add(cssClass);
    }

    removeClass(cssClass) {
        this.disc.classList.remove(cssClass);
    }

    hasClass(cssClass) {
        return this.disc.classList.contains(cssClass);
    }
  }

function getColour() {
    if (isPlayer1) {
        return player1;
    }

    return player2;
}

function getNotColour() {
    if (isPlayer1) {
        return player2;
    }

    return player1;
}

function getLowestDisc(disc) {
    var column = parseInt(disc.id.charAt(ID_COLUMN)) - 1;
    var lowestDisc = null;

    for (var i = 0; i < ROW_LIMIT; i++) {
        if (!board[i][column].isSelected()) {
            lowestDisc = board[i][column];
            break;
        }
    }

    return lowestDisc;
}

function checkWon() {
    var bestCount = 0;
    var count;

    for (var column = 0; column < COLUMN_LIMIT; column++) {
        for (var row = 0; row < ROW_LIMIT; row++) {
            count = checkDiscWon(board[row][column]);

            if (bestCount < count) {
                bestCount = count;

                if (bestCount == CONNECT_COUNT) {
                    return bestCount;
                }
            }
        }
    }

    return bestCount;
}

function checkDiscWon(disc) {
    var allSteps = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    var bestCount = 0;
    var count;

    if (disc.hasClass(getColour())) {
        for (var i = 0; i < allSteps.length; i++) {
            count = scan(disc, allSteps[i]);

            if (bestCount < count) {
                bestCount = count;

                if (bestCount == CONNECT_COUNT) {
                    return bestCount;
                }
            }
        }
    }

    return bestCount;
}

function scan(disc, step) {
    var column = disc.getColumn();
    var row = disc.getRow();
    var count = 1;

    while (true) {
        column += step[0];
        row += step[1];

        if (column < 0 || column > BOARD_COLUMN_LIMIT || row < 0 || row > BOARD_ROW_LIMIT) {
            break;
        }
        
        if (board[row][column].hasClass(getColour())) {
            count++;

            if (count == CONNECT_COUNT) {
                break;
            }
        } else {
            break;
        }
    }

    return count;
}

function showWon() {
    gameOver = true;
    document.body.classList.add(getColour());
}

function randomAI() {
    if (gameOver) {
        return;
    }

    var random, disc;
    var valid = false;

    while (!valid) {
        random = Math.floor(Math.random() * COLUMN_LIMIT);
        disc = getLowestDisc(board[BOARD_ROW_LIMIT][random].disc);

        if (disc) {
            disc.addClass(getColour());
            valid = true;
            
            if (checkWon() == CONNECT_COUNT) {
                showWon();
            }
        }
    }
}

function minimaxAI(version, depth) {
    if (gameOver) {
        return;
    }

    var disc;
    var score;
    var bestScore = -10000;
    var bestDiscs = [];

    for (var column = 0; column < COLUMN_LIMIT; column++) {
        disc = getLowestDisc(board[BOARD_ROW_LIMIT][column].disc);

        if (!disc) {
            continue;
        }

        if (version == 0) {
            score = prettyBadMinSearch(disc, depth);
        } else if (version == 1) {
            score = decentMinSearch(disc, depth);
        }
        
        if (bestScore < score) {
            bestScore = score;
            bestDiscs = [disc];
        } else if (bestScore == score) {
            bestDiscs.push(disc);
        }
    }

    bestDiscs[Math.floor(Math.random() * bestDiscs.length)].addClass(getColour());

    if (checkWon() == CONNECT_COUNT) {
        showWon();
    }
}

/*
*
* Start: Pretty bad minimax
*
*/
function prettyBadMaxSearch(disc, depth) {
    // Make user move
    disc.addClass(getColour());
    var current = checkWon();

    if (depth == 0 || current == CONNECT_COUNT) {
        disc.removeClass(getColour());
        return prettyBadMinScore(current);
    }

    // Now loop each AI move
    var score;
    var bestScore = -1000;
    var player = isPlayer1;

    for (var column = 0; column < COLUMN_LIMIT; column++) {
        current = getLowestDisc(board[BOARD_ROW_LIMIT][column].disc);

        if (!current) {
            continue;
        }

        isPlayer1 = !player;
        score = prettyBadMinSearch(current, depth - 1);

        if (bestScore < score) {
            bestScore = score;
        }

        isPlayer1 = player;
    }

    disc.removeClass(getColour());
    return bestScore;
}

function prettyBadMinSearch(disc, depth) {
    // Make AI move
    disc.addClass(getColour());
    var current = checkWon();

    if (depth == 0 || current == CONNECT_COUNT) {
        disc.removeClass(getColour());
        return prettyBadMaxScore(current);
    }

    // Now loop each user move
    var score;
    var worstScore = 1000;
    var player = isPlayer1;

    for (var column = 0; column < COLUMN_LIMIT; column++) {
        current = getLowestDisc(board[BOARD_ROW_LIMIT][column].disc);

        if (!current) {
            continue;
        }

        isPlayer1 = !player;
        score = prettyBadMaxSearch(current, depth - 1);

        if (worstScore > score) {
            worstScore = score;
        }

        isPlayer1 = player;
    }

    disc.removeClass(getColour());
    return worstScore;
}

function prettyBadMaxScore(count) {
    if (count == CONNECT_COUNT) {
        return 100;
    }

    if (count == CONNECT_COUNT - 1) {
        return 5;
    }

    if (count == CONNECT_COUNT - 2) {
        return 2;
    }
    
    return 0;
}

function prettyBadMinScore(count) {
    if (count == CONNECT_COUNT) {
        return -100;
    }

    if (count == CONNECT_COUNT - 1) {
        return -5;
    }

    if (count == CONNECT_COUNT - 2) {
        return -2;
    }
    
    return 0;
}
/*
*
* End: Pretty bad minimax
*
*/

/*
*
* Start: Decent minimax
*
*/
function decentMaxSearch(disc, depth) {
    // Make user move
    disc.addClass(getColour());
    var current = checkWon();

    if (current == CONNECT_COUNT) {
        disc.removeClass(getColour());
        return -1000 - depth;
    }

    if (depth == 0) {
        disc.removeClass(getColour());
        return decentScore(current);
    }

    // Now loop each AI move
    var score;
    var bestScore = -1000;
    var player = isPlayer1;

    for (var column = 0; column < COLUMN_LIMIT; column++) {
        current = getLowestDisc(board[BOARD_ROW_LIMIT][column].disc);

        if (!current) {
            continue;
        }

        isPlayer1 = !player;
        score = decentMinSearch(current, depth - 1);

        if (bestScore < score) {
            bestScore = score;
        }

        isPlayer1 = player;
    }

    disc.removeClass(getColour());
    return bestScore;
}

function decentMinSearch(disc, depth) {
    // Make AI move
    disc.addClass(getColour());
    var current = checkWon();

    if (current == CONNECT_COUNT) {
        disc.removeClass(getColour());
        return 1000 + depth;
    }

    if (depth == 0) {
        disc.removeClass(getColour());
        return decentScore(current);
    }

    // Now loop each user move
    var score;
    var worstScore = 1000;
    var player = isPlayer1;

    for (var column = 0; column < COLUMN_LIMIT; column++) {
        current = getLowestDisc(board[BOARD_ROW_LIMIT][column].disc);

        if (!current) {
            continue;
        }

        isPlayer1 = !player;
        score = decentMaxSearch(current, depth - 1);

        if (worstScore > score) {
            worstScore = score;
        }

        isPlayer1 = player;
    }

    disc.removeClass(getColour());
    return worstScore;
}

// Score based on entire board
function decentScore() {
    var score = 0;
    var disc;
    var count;

    for (var column = 0; column < COLUMN_LIMIT; column++) {
        for (var row = 0; row < ROW_LIMIT; row++) {
            disc = board[row][column];

            if (!disc.isSelected()) {
                continue;
            }

            if (disc.hasClass(player1)) {
                // Make user move
                isPlayer1 = true;
                count = checkDiscWon(disc);
                score -= decentEvaluate(count);
            } else {
                // Make AI move
                isPlayer1 = false;
                count = checkDiscWon(disc);
                score += decentEvaluate(count);
            }
        }
    }

    return score;
}

function decentEvaluate(count) {
    if (count == CONNECT_COUNT) {
        return 100;
    }

    if (count == CONNECT_COUNT - 1) {
        return 5;
    }

    if (count == CONNECT_COUNT - 2) {
        return 2;
    }
    
    return 0;
}
/*
*
* End: Decent minimax
*
*/
