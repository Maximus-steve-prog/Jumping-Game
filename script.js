$(document).ready(function() {

    // --- DOM Elements ---
    const player = $('#player');
    const gameContainer = $('#game-container');
    const obstaclesContainer = $('#obstacles-container');
    const scoreDisplay = $('#score');
    const highScoreDisplay = $('#high-score');
    const jumpButton = $('#jump-button');
    const startStopButton = $('#start-stop-button');
    const startMessage = $('#start-message');
    const darkModeToggle = $('#dark-mode-toggle');

    // --- Game Variables ---
    let playerBottom = 0;
    let playerLeft = 30; // Increased initial left position for the player
    let isJumping = false;
    let gravity = 0.9; // How fast the player falls
    let jumpStrength = 28; // How high the player jumps
    let velocityY = 0; // Player's vertical speed
    let isGameOver = false;
    let isGameRunning = false; // Tracks if the game is currently active
    let score = 0;

    // Obstacle speed (initial value)
    let obstacleSpeed = 3; // How fast obstacles move left
    // Store the base speed to reset when starting a new game
    const baseObstacleSpeed = 3;

    // Timer for creating obstacles (initial value)
    let obstacleInterval = 2100; // Time between new obstacles (milliseconds)
    // Store the base interval to reset when starting a new game
    const baseObstacleInterval = 2100;

    let obstacleTimer; // Timer for creating obstacles
    let gameLoopId; // ID for the requestAnimationFrame loop

    // --- Local Storage Keys ---
    const highScoreKey = 'jumperHighScore';
    const darkModeKey = 'jumperDarkMode';

    // --- Initialization ---

    // Get High Score from Local Storage
    let highScore = localStorage.getItem(highScoreKey) || 0;
    highScoreDisplay.text('High Score: ' + highScore);

    // Dark Mode Initialization
    const savedDarkMode = localStorage.getItem(darkModeKey);
    if (savedDarkMode === 'dark') {
        $('html').addClass('dark').removeClass('light');
    } else {
        $('html').addClass('light').removeClass('dark');
    }

    // Initial player position
    player.css({
        'bottom': playerBottom + 'px',
        'left': playerLeft + 'px' // Use the updated initial left position
    });

    // Show the start message initially
    startMessage.show();

    // --- Event Listeners ---

    // Handle key presses (Spacebar) - Only when game is running and not jumping/game over
    $(document).on('keydown', function(e) {
        if (e.which === 32 && !isJumping && !isGameOver && isGameRunning) {
            startJump();
        }
    });

    // Handle jump button click - Only when game is running and not jumping/game over
    jumpButton.on('click', function() {
        if (!isJumping && !isGameOver && isGameRunning) {
            startJump();
        }
    });

    // Handle Start/Stop button click
    startStopButton.on('click', function() {
        if (isGameRunning) {
            stopGame(); // If running, stop the game
        } else {
            startGame(); // If stopped, start the game
        }
    });

    // Handle Dark Mode Toggle button click
    darkModeToggle.on('click', function() {
        if ($('html').hasClass('dark')) {
            // Currently dark, switch to light
            $('html').removeClass('dark').addClass('light');
            localStorage.setItem(darkModeKey, 'light');
        } else {
            // Currently light, switch to dark
            $('html').removeClass('light').addClass('dark');
            localStorage.setItem(darkModeKey, 'dark');
        }
    });

    // --- Game Functions ---

    // Start the jump
    function startJump() {
        isJumping = true;
        velocityY = jumpStrength;
    }

    // Create an obstacle
    function createObstacle() {
        // Don't create obstacles if the game isn't running or is over
        if (!isGameRunning || isGameOver) return;

        const obstacle = $('<div>').addClass('obstacle'); // Create a new div and add the 'obstacle' class
        const obstacleLeft = gameContainer.width(); // Start obstacle at the right edge of the container
        // Randomize obstacle height (minimum 30px, max half of game container height)
        const obstacleHeight = Math.random() * (gameContainer.height() / 2) + 30;

        // Set initial position and height
        obstacle.css({
            'left': obstacleLeft + 'px',
            'height': obstacleHeight + 'px',
            'bottom': '0px', // Obstacles are at the bottom
            'width': '20px', // Fixed width for obstacles
            'position': 'absolute', // Needed for positioning
            'background-color': $('.dark').length ? '#48bb78' : '#3EE5DFFF', // Apply dark mode color dynamically
            'z-index': '0' // Ensure obstacles are behind the player
        });
        obstaclesContainer.append(obstacle); // Add the obstacle to the container

        // Start animating the obstacle movement
        moveObstacle(obstacle);
    }

    // Move a single obstacle
    function moveObstacle(obstacle) {
        let currentLeft = parseInt(obstacle.css('left')); // Get current left position

        function animateObstacle() {
            // Stop animation if game is not running or is over
            if (!isGameRunning || isGameOver) {
                obstacle.remove(); // Clean up obstacle if game stops
                return;
            }

            currentLeft -= obstacleSpeed; // Move obstacle to the left (using current speed)
            obstacle.css('left', currentLeft + 'px');

            // Check for collision with the player
            checkCollision(obstacle);

            // Remove obstacle if it goes off screen
            if (currentLeft + obstacle.width() < 0) {
                obstacle.remove(); // Remove the obstacle from the DOM
                increaseScore(); // Increase score and check for interval/speed adjustments
            } else {
                // Continue animation if obstacle is still on screen
                requestAnimationFrame(animateObstacle);
            }
        }

        requestAnimationFrame(animateObstacle); // Start the animation loop for this obstacle
    }

    // Function to increase score and check for interval/speed adjustments
    function increaseScore() {
        score++; // Increase score
        scoreDisplay.text('Score: ' + score); // Update score display

        // Check if the score is a multiple of 20 and greater than 0
        if (score > 0 && score % 10 === 0) {
            // --- Adjust Obstacle Interval (make it slower - easier) ---
            const potentialNewInterval = baseObstacleInterval + (Math.floor(score / 20) * 50); // Increase by 50ms every 20 points
            if (obstacleInterval < potentialNewInterval) {
                obstacleInterval = potentialNewInterval;
                console.log("Score reached " + score + "! Increasing obstacle interval to: " + obstacleInterval + "ms");

                // Clear the old timer and set a new one with the increased interval
                clearInterval(obstacleTimer);
                obstacleTimer = setInterval(createObstacle, obstacleInterval);
            }

            // --- Adjust Obstacle Speed (make it faster - harder) ---
            // Increase speed by 0.5 every 20 points
            const potentialNewSpeed = baseObstacleSpeed + (Math.floor(score / 10) * 1);
             if (obstacleSpeed < potentialNewSpeed) {
                 obstacleSpeed = potentialNewSpeed;
                 console.log("Score reached " + score + "! Increasing obstacle speed to: " + obstacleSpeed);
             }
        }
    }


    // Check for collision between player and obstacle
    function checkCollision(obstacle) {
        // Get dimensions and positions of player and obstacle
        const playerRect = {
            x: parseInt(player.css('left')),
            y: parseInt(player.css('bottom')),
            width: player.width(),
            height: player.height()
        };

        const obstacleRect = {
            x: parseInt(obstacle.css('left')),
            y: parseInt(obstacle.css('bottom')),
            width: obstacle.width(),
            height: obstacle.height()
        };

        // Basic AABB (Axis-Aligned Bounding Box) collision detection
        if (playerRect.x < obstacleRect.x + obstacleRect.width &&
            playerRect.x + playerRect.width > obstacleRect.x &&
            playerRect.y < obstacleRect.y + obstacleRect.height &&
            playerRect.y + playerRect.height > obstacleRect.y) {
            // Collision detected!
            gameOver();
        }
    }

    // Handle Game Over
    function gameOver() {
        isGameOver = true; // Set game over flag
        stopGame(); // Stop the game loop and obstacle creation

        // Update High Score if current score is higher
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(highScoreKey, highScore); // Save new high score
            highScoreDisplay.text('High Score: ' + highScore); // Update high score display
        }

        // Show game over message
        alert('Game Over! Your score was: ' + score);

        // Reset button text and show start message for a new game
        startStopButton.text('Start');
        startMessage.text('Press Start to Play Again');
        startMessage.show();
    }

    // Game loop function (updates player position based on gravity/jump)
    function gameLoop() {
        // Stop the loop if game is not running or is over
        if (!isGameRunning || isGameOver) {
            return;
        }

        velocityY -= gravity; // Apply gravity
        playerBottom += velocityY; // Update player's vertical position

        // Prevent player from going below the ground
        if (playerBottom < 0) {
            playerBottom = 0;
            velocityY = 0; // Stop vertical movement when on ground
            isJumping = false; // Player is no longer jumping
        }

        // Update player's position in the DOM
        player.css('bottom', playerBottom + 'px');

        // Request the next frame for smooth animation
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Start the game
    function startGame() {
        // Reset game state
        isGameOver = false;
        isGameRunning = true; // Set game to running
        score = 0;
        scoreDisplay.text('Score: ' + score);

        // Reset player position
        playerBottom = 0;
        playerLeft = 100; // Reset to the slightly advanced position
        velocityY = 0;
        player.css({
            'bottom': playerBottom + 'px',
            'left': playerLeft + 'px'
        });

        obstaclesContainer.empty(); // Remove any existing obstacles
        startMessage.hide(); // Hide the start message
        startStopButton.text('Stop'); // Change button text to Stop

        // Reset obstacle interval and speed to the base values for a new game
        obstacleInterval = baseObstacleInterval;
        obstacleSpeed = baseObstacleSpeed;

        // Start creating obstacles at regular intervals
        obstacleTimer = setInterval(createObstacle, obstacleInterval);

        // Start the main game loop
        gameLoop();
    }

    // Stop the game (Pause or Game Over)
    function stopGame() {
        isGameRunning = false; // Set game to stopped
        clearInterval(obstacleTimer); // Stop creating new obstacles
        cancelAnimationFrame(gameLoopId); // Stop the main game loop

        // Stop any ongoing obstacle animations (important for pausing)
        $('.obstacle').stop();

        // If it's not a game over (i.e., it's a pause), show the pause message
        if (!isGameOver) {
            startMessage.text('Game Paused');
            startMessage.show();
            startStopButton.text('Start'); // Change button text back to Start
        }
    }

    // The game starts in a stopped state initially.
    // The user needs to press the Start button to begin.

});