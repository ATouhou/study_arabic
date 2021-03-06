var verbApp = angular.module('verbApp');

verbApp.controller('typingTutorCtrl', function($scope, $document) {
    $scope.letterGroups = ["ا - ل", "ت - ب", "ن - ي", "م - س", "ط - ك - ش", "غ - ف", "ع - ق", "ه - ث", "خ - ص", "ح - ض",
        "د - ج", "ى - ذ", "ة - ر", "و - ؤ", "ز - ء", "ظ - ئ", "أ - إ - آ", "-َ -ِ -ُ"]

    $scope.range1 = _.range(1, 10);
    $scope.range2 = _.range(10, 18);

    angular.element($document).ready(function () {
        if ($("#gameCanvas").length === 1)
        {

            //$('span').tooltip();
            var startButton = $("#startButton");
            var stopButton = $("#stopButton");
            var showKeyboardButton = $("#show-keyboard");
            var hideKeyboardButton = $("#hide-keyboard");

            var canvas = $("#gameCanvas");
            var context = canvas.get(0).getContext("2d");
            // have to use monospace font for Arabic to work correctly
            context.font = "bold 30px 'courier new'"

            // Canvas dimensions
            var canvasWidth = canvas.width();
            var canvasHeight = canvas.height();
            var paused = true;
            // so that levels are selectable when game is paused but not when there is an alert box present
            // thus, create second boolean variable
            var clickableLevels = false;
            var sentenceY = 100;
            var sentenceClearBoundary = 110;

            // create a game object which keeps track of sentences, sentenceNumber, correctCount, etc
            var Game = function() {

                this.pauseGame = function()
                {
                    paused = true;
                    $(window).unbind("keypress");
                }

                this.getSentences = function(level) {
                    // lines is an array of sentences
                    var result = false;
                    var textFile = "/static/typing_tutor/level" + level + ".html";
                    $.ajax({
                        url: textFile,
                        success: function(text) { result = text; },
                        async: false
                    });
                    var sentences = result.split("\n");
                    // subtract 1 because it seems include an empty string
                    this.totalSentences = sentences.length - 1;
                    this.remainingSentences = this.totalSentences;
                    return sentences;
                }

                this.sentenceNumber = 0;
                this.currentLevel = 1;
                this.sentences = this.getSentences(1);
                this.correctSentences = 0;
                this.points = 0;
                this.totalSentences;
                this.remainingSentences;
                this.totalLevels = 16;

                this.getAllLevels = function() {
                    var levelList = [];
                    for (var j = 1; j <= this.totalLevels; j++)
                    {
                        levelList.push(j);
                    }
                    return levelList;
                }

                this.allLevels = this.getAllLevels();
                // no level have been completed upon starting the game
                this.completedLevels = [];

                // add points and update remaining sentences
                this.addPoints = function() {
                    this.correctSentences += 1;
                    this.points += 5
                    this.remainingSentences -= 1;
                    gameElements.gameDisplay.updateScore(this.points);
                    gameElements.gameDisplay.updateRemainingSentences();
                }

                this.getUserLetter = function(e) {
                    var charCode = e.which; // charCode will contain the code of the character inputted
                    var letter = String.fromCharCode(charCode); // theChar will contain the actual character
                    return letter;
                }

                this.clearCanvas = function() {
                    context.clearRect(0, 0, canvasWidth, sentenceClearBoundary);
                }

                this.showNextSentence = function(newLevel) {

                    if (newLevel === true) { this.sentenceNumber = 0; }
                    else
                    {
                        this.sentenceNumber += 1;
                    }

                    if (this.checkIfLastSentence() === true)
                    {
                        this.handleLastSentence();
                    }
                    else
                    {
                        if (paused !== true || clickableLevels === true)
                        {
                            gameElements.sentence = new Sentence(gameElements.game.sentences[gameElements.game.sentenceNumber]);
                            this.clearCanvas();
                            gameElements.cover.restartCover();
                            gameElements.sentence.redraw();
                        }
                    }
                }

                this.checkIfLastSentence = function() {
                    if (this.sentenceNumber > this.totalSentences - 1) { return true; }
                    else { return false; }
                }

                this.handleLastSentence = function() {
                    // if the user got everything correct, then move to the next incomplete level (if there are any more)
                    if (this.totalSentences === this.correctSentences)
                    {
                        var nextLevel = this.getNextLevel();
                        if (nextLevel === 0)
                        {
                            gameElements.gameDisplay.gameCompletionAlert();
                            newGame();
                        }
                        else
                        {
                            this.markLevelAsCompleted(this.currentLevel);
                            gameElements.gameDisplay.levelCompletionAlert(this.currentLevel);
                            this.newLevel(nextLevel)
                        }
                    }
                    else
                    {
                        // repeat the same level
                        gameElements.gameDisplay.levelRestartAlert(this.currentLevel);
                        this.newLevel(this.currentLevel);
                    }
                }

                this.markLevelAsCompleted = function() {
                    // if the completedLevel array doesn't already have the currentLevel in it, then and only then you can add it.
                    if ($.inArray(this.currentLevel, this.completedLevels) === -1)
                    {
                        this.completedLevels.push(this.currentLevel);
                        gameElements.gameDisplay.colorCompletedLevelBox();
                    }
                }

                this.newLevel = function(level) {
                    this.currentLevel = level;
                    gameElements.gameDisplay.updateLevel();
                    this.correctSentences = 0;
                    this.sentences = this.getSentences(level);
                    gameElements.gameDisplay.updateRemainingSentences();
                    this.showNextSentence(true);
                }

                this.getNextLevel = function() {
                    // including the current level, which this.completedLevels does not yet include
                    var allCompletedLevels = (this.completedLevels.concat(this.currentLevel)).sort(sortFunction);
                    if (this.allLevels.sort(sortFunction).join(",") === allCompletedLevels.join(","))
                    {
                        return 0;
                    }
                    else
                    {
                        // make a shallow copy of the the allLevels array
                        var incompleteLevels = this.allLevels.slice();
                        for (var i = 0; i < allCompletedLevels.length; i++)
                        {
                            var level = allCompletedLevels[i];
                            var indexToRemove = incompleteLevels.indexOf(level);
                            incompleteLevels.splice(indexToRemove, 1);
                        }
                        // go to the next possible level
                        var nextLevelIndex = incompleteLevels.indexOf(this.currentLevel + 1)
                        var nextLevel = incompleteLevels[nextLevelIndex]
                        // if there is no larger level, loop back to the beginning of the array
                        if (nextLevel === undefined)
                        {
                            nextLevel = incompleteLevels[0];
                        }
                        return nextLevel;
                    }
                }
            }

            /// for numerical sorting
            function sortFunction(a, b){
                return (a - b) //causes an array to be sorted numerically and ascending
            }

            var GameDisplay = function() {
                this.alertDiv = $("#game-start");
                this.keyboardImage = $("#arabic-keyboard")
                this.alertDelay = 2000;
                this.score = $("#score");
                var _this = this;
                this.updateScore = function(points) {
                    // update the UI to display the new score
                    this.score.html(points);
                }

                this.initializeScore = function() {
                    this.score.html(0);
                }

                this.updateRemainingSentences = function() {
                    $("#lines-remaining").html(gameElements.game.remainingSentences);
                }

                this.updateLevel = function() {
                    // make all other level boxes inactive
                    $(".levelBox").removeClass("currentLevel");
                    // make the new level box active
                    $("#levelBox_" + gameElements.game.currentLevel).addClass("currentLevel");
                }


                this.colorCompletedLevelBox = function() {
                    $("#levelBox_" + gameElements.game.currentLevel).addClass("completedLevel");
                }

                this.initializeCurrentLevel = function() {
                    $("#levelBox_1").addClass("currentLevel");
                }

                this.initializeRemainingSentences = function() {
                    $("#lines-remaining").html(gameElements.game.remainingSentences);
                }

                this.initializeDifficultyLevel = function() {
                    var difficultyOptions = '<a class="btn dropdown-toggle current-option" data-toggle="dropdown" href="#" id="Beginner">' +
                        'Beginner<span class="caret"></span></a><ul class="dropdown-menu" id="difficulty-option">' +
                        '<li><a href="#" id="Intermediate">Intermediate</a></li>' +
                        '<li><a href="#" id="Advanced">Advanced</a></li></ul>'
                    $("#difficulty-level-div").html(difficultyOptions);
                }

                this.levelCompletionAlert = function(level) {
                    var message = "Good job! You completed level " + level + ".";
                    this.displayMessage(message, "Okay");
                }

                // where user reaches the end of a level but didn't get all the sentences correct
                this.levelRestartAlert = function() {
                    var message = "Good try but you didn't pass the level. Try again!";
                    this.displayMessage(message, "Okay");
                }

                this.gameCompletionAlert = function() {
                    var message = "Congratulations! You have completed all of the levels!";
                    this.displayMessage(message, "Start New Game");
                }

                this.displayMessage = function(message, buttonMessage) {
                    var _this = this;
                    startButton.hide();
                    stopButton.hide();
                    var message = message + '<br /><br /><button class="btn btn-default" type="button" id="okay">' + buttonMessage + '</button>'
                    $('#message-div').show();
                    $('#message-div').html(message);
                    this.alertDiv.css("z-index", 10);
                    gameElements.game.pauseGame();
                    clickableLevels = false;
                    $("#okay").on("mouseup", function() {
                        // why is this being triggered in chrome? That's basically the issue here!!!
                        _this.moveAlertBack();
                    })
                }

                this.moveAlertBack = function() {
                    $('#message-div').hide();
                    this.alertDiv.css("z-index", -2);
                    paused = false;
                    clickableLevelLevels = true;
                    stopButton.show();
                    gameElements.game.showNextSentence(true);
                    runGame();
                }

                this.reinitializeUi = function() {
                    $(".levelBox").removeClass("currentLevel");
                    $(".levelBox").removeClass("completedLevel");
                    this.initializeCurrentLevel();
                    this.initializeRemainingSentences();
                    this.initializeScore();
                    this.initializeDifficultyLevel();
                }

                this.showKeyboard = function() {
                    showKeyboardButton.hide();
                    hideKeyboardButton.show();
                    this.keyboardImage.css("z-index", 1);
                }

                this.hideKeyboard = function() {
                    hideKeyboardButton.hide();
                    showKeyboardButton.show();
                    this.keyboardImage.css("z-index", -10);
                }

                this.initializeCurrentLevel();
            }


            var Cover = function() {
                this.x = 0;
                this.initialY = canvasHeight;
                this.y = this.initialY;
                this.boundary = sentenceClearBoundary;
                this.levelToSpeed = {"Beginner": 0.1, "Intermediate": 0.3, "Advanced": 0.6}
                this.speed = this.levelToSpeed["Beginner"];

                this.setState = function() {
                    //context.fillStyle = "rgba(0, 195, 209, 1)";
                    context.fillStyle = "rgba(192, 192, 192, 1)";
                }

                this.update = function() {
                    this.setState();
                    context.clearRect(0, this.boundary, canvasWidth, canvasHeight);
                    context.fillRect(this.x, this.y, 940, 500);
                    this.y = this.y - this.speed;
                    if (this.y < (gameElements.sentence.y - 20))
                    {
                        gameElements.game.showNextSentence();
                        this.restartCover();
                    }
                }

                this.restartCover = function() {
                    this.y = this.initialY;
                }

                this.changeSpeed = function(difficultyLevel) {
                    this.speed = this.levelToSpeed[difficultyLevel]
                }
            }

            var Sentence = function(sentenceString) {
                this.sentenceString = sentenceString;
                this.correctCount = 0;
                this.y = 100;
                this.x = canvasWidth - 30;

                this.getLetters = function() {
                    var letters = sentenceString.split("");
                    return letters;
                }

                this.letters = this.getLetters();

                this.setState = function() {
                    context.fillStyle = "rgba(45, 39, 97, 1)";
                }

                this.redraw = function() {
                    this.setState();
                    context.fillText (sentenceString, this.x, this.y);
                }

                this.getCurrentSnippet = function() {
                    return this.letters.slice(0, this.correctCount).join("");
                }
            }

            var Highlighter = function() {
                this.width = 0;

                this.setState = function() {
                    context.fillStyle = "rgba(255, 204, 0, 0.5)";
                }

                this.highlight = function(currentSnippet) {
                    this.width = -(context.measureText(currentSnippet).width);
                    this.setState();
                    context.fillRect(gameElements.sentence.x, 75, this.width, 30);
                }
            }

            var InputHandler = function() {
                this.handleCorrectInput = function() {
                    gameElements.game.clearCanvas();
                    gameElements.sentence.redraw();
                    gameElements.sentence.correctCount += 1;
                    currentSnippet = gameElements.sentence.getCurrentSnippet();
                    gameElements.highlighter.highlight(currentSnippet);
                }

                // check if user has completed the sentence such that a new sentence is necessary
                this.checkForNextSentence = function() {
                    if (gameElements.sentence.correctCount === gameElements.sentence.letters.length)
                    {
                        gameElements.game.addPoints();
                        gameElements.game.showNextSentence();
                    }
                    return gameElements.sentence;
                }

                this.handleIncorrectInput = function() {
                }


                $(".levelBox").click(function() {
                    if (paused !== true || clickableLevels === true)
                    {
                        var level = parseInt(this.id.split("_")[1]);
                        gameElements.game.newLevel(level);
                        gameElements.gameDisplay.updateLevel(level);
                    }
                });

                $("#difficulty-option a").click(function(e) {
                    e.preventDefault();
                    var newOptionElement = $(this);
                    var newOption = this.id;

                    // grab selected-option, change it's id and html to newOption
                    var currentOptionElement = $(".current-option")
                    var currentOption = currentOptionElement.attr("id");

                    currentOptionElement.html(newOption + ' <span class="caret"></span>');
                    currentOptionElement.attr("id", newOption);

                    newOptionElement.attr("id", currentOption);
                    newOptionElement.html(currentOption);

                    // change speed of cover
                    gameElements.cover.changeSpeed(newOption);
                });

                showKeyboardButton.click(function() {
                    gameElements.gameDisplay.showKeyboard();
                })

                hideKeyboardButton.click(function() {
                    gameElements.gameDisplay.hideKeyboard();
                })

            }

            Elements = function() {
                this.game = new Game();
                this.sentence = new Sentence(this.game.sentences[this.game.sentenceNumber]);
                this.inputHandler = new InputHandler();
                this.highlighter = new Highlighter();
                this.cover = new Cover();
                this.gameDisplay = new GameDisplay();
            }
            // global object which contains all of the game elements
            gameElements = new Elements();

            function newGame() {
                gameElements.game.pauseGame();
                gameElements.game.clearCanvas();
                // clear all the UI stuff -- score, lines remaining, difficulty level
                // foobar
                gameElements.gameDisplay.reinitializeUi();
                gameElements = new Elements();
                runGame();
            }

            function runGame() {
                function moveCover() {
                    gameElements.cover.update();
                    if (paused !== true) { setTimeout(moveCover, 33); }
                };

                moveCover();
                gameElements.gameDisplay.initializeRemainingSentences();

                if (!paused)
                {
                    gameElements.sentence.redraw();
                    $(window).keypress(function(e) {
                        var letter = gameElements.game.getUserLetter(e);

                        // prevent scrolling when space bar is hit
                        if (letter === " ")
                            e.preventDefault();
                        if (letter === gameElements.sentence.letters[gameElements.sentence.correctCount])
                        {
                            gameElements.inputHandler.handleCorrectInput();
                            gameElements.inputHandler.checkForNextSentence();
                        }
                        // if the wrong letter in input
                        else
                        {
                            gameElements.inputHandler.handleIncorrectInput();
                        }
                    });
                }
            }

            function init(){
                setUpUi();
                runGame();
            }

            function setUpUi(){
                var delay = 200

                startButton.hide();
                stopButton.hide();
                showKeyboardButton.hide();
                hideKeyboardButton.hide();
                $(window).unbind("keypress");

                // set paused to false
                $("#game-start").css("z-index", -1);
                $('#message-div').hide();
                //$("#game-start").hide();
                paused = false;
                clickableLevels = true;
                stopButton.show();
                showKeyboardButton.show();

                startButton.click(function(){
                    $(this).hide();
                    stopButton.show();
                    paused = false;
                    runGame();
                });

                stopButton.click(function(){
                    $(this).hide();
                    startButton.show();
                    paused = true;
                    // unbind the keydown listener
                    $(window).unbind("keypress");
                });
            }

            init();

        }

    });
})



