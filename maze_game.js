// Simple Maze Game with Reinforcement Learning
// This demonstrates how an AI agent learns to navigate a maze

// Game configuration
const config = {
  gridSize: 10,
  cellSize: 40,
  agentColor: "#4fa4a4",
  wallColor: "#333333",
  goalColor: "#ffcc00",
  backgroundColor: "#f9f9f9",
  rewardColor: "#8cc63f",
  penaltyColor: "#ff6666",
  animationSpeed: 200,
  learningRate: 0.1,
  discountFactor: 0.9,
  explorationRate: 0.2
};

// Game state
let gameState = {
  agent: { x: 0, y: 0 },
  goal: { x: 9, y: 9 },
  walls: [],
  qTable: {},
  episodes: 0,
  totalReward: 0,
  isLearning: false,
  isManualControl: true,
  path: []
};

// Initialize the game
function initGame() {
  // Create walls
  gameState.walls = [
    {x: 2, y: 0}, {x: 2, y: 1}, {x: 2, y: 2}, {x: 2, y: 3}, {x: 2, y: 4},
    {x: 4, y: 5}, {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 8, y: 5},
    {x: 4, y: 7}, {x: 4, y: 8}, {x: 4, y: 9},
    {x: 6, y: 2}, {x: 7, y: 2}, {x: 8, y: 2}, {x: 9, y: 2}
  ];
  
  // Initialize Q-table
  for (let x = 0; x < config.gridSize; x++) {
    for (let y = 0; y < config.gridSize; y++) {
      const state = `${x},${y}`;
      gameState.qTable[state] = {
        up: 0,
        down: 0,
        left: 0,
        right: 0
      };
    }
  }
  
  // Reset agent position
  resetAgent();
  
  // Draw initial state
  drawGame();
  
  // Update UI
  updateStats();
}

// Reset agent to starting position
function resetAgent() {
  gameState.agent = { x: 0, y: 0 };
  gameState.path = [{ x: 0, y: 0 }];
}

// Draw the game
function drawGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  ctx.strokeStyle = "#e0e0e0";
  for (let i = 0; i <= config.gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * config.cellSize, 0);
    ctx.lineTo(i * config.cellSize, config.gridSize * config.cellSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i * config.cellSize);
    ctx.lineTo(config.gridSize * config.cellSize, i * config.cellSize);
    ctx.stroke();
  }
  
  // Draw walls
  ctx.fillStyle = config.wallColor;
  gameState.walls.forEach(wall => {
    ctx.fillRect(
      wall.x * config.cellSize,
      wall.y * config.cellSize,
      config.cellSize,
      config.cellSize
    );
  });
  
  // Draw goal
  ctx.fillStyle = config.goalColor;
  ctx.beginPath();
  ctx.arc(
    (gameState.goal.x + 0.5) * config.cellSize,
    (gameState.goal.y + 0.5) * config.cellSize,
    config.cellSize / 2 - 5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Draw agent
  ctx.fillStyle = config.agentColor;
  ctx.beginPath();
  ctx.arc(
    (gameState.agent.x + 0.5) * config.cellSize,
    (gameState.agent.y + 0.5) * config.cellSize,
    config.cellSize / 2 - 5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Draw path
  if (gameState.path.length > 1) {
    ctx.strokeStyle = config.agentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      (gameState.path[0].x + 0.5) * config.cellSize,
      (gameState.path[0].y + 0.5) * config.cellSize
    );
    
    for (let i = 1; i < gameState.path.length; i++) {
      ctx.lineTo(
        (gameState.path[i].x + 0.5) * config.cellSize,
        (gameState.path[i].y + 0.5) * config.cellSize
      );
    }
    ctx.stroke();
  }
  
  // Draw Q-values if in learning mode
  if (!gameState.isManualControl) {
    const state = `${gameState.agent.x},${gameState.agent.y}`;
    const qValues = gameState.qTable[state];
    
    // Up arrow
    drawArrow(ctx, gameState.agent.x, gameState.agent.y, 'up', qValues.up);
    
    // Down arrow
    drawArrow(ctx, gameState.agent.x, gameState.agent.y, 'down', qValues.down);
    
    // Left arrow
    drawArrow(ctx, gameState.agent.x, gameState.agent.y, 'left', qValues.left);
    
    // Right arrow
    drawArrow(ctx, gameState.agent.x, gameState.agent.y, 'right', qValues.right);
  }
}

// Draw an arrow indicating Q-value
function drawArrow(ctx, x, y, direction, qValue) {
  const centerX = (x + 0.5) * config.cellSize;
  const centerY = (y + 0.5) * config.cellSize;
  const arrowLength = config.cellSize * 0.3;
  
  // Normalize Q-value for color (from red to green)
  const normalizedValue = Math.max(0, Math.min(1, (qValue + 10) / 20));
  const r = Math.floor(255 * (1 - normalizedValue));
  const g = Math.floor(255 * normalizedValue);
  const arrowColor = `rgb(${r}, ${g}, 0)`;
  
  ctx.strokeStyle = arrowColor;
  ctx.lineWidth = 2;
  ctx.fillStyle = arrowColor;
  
  let startX, startY, endX, endY;
  
  switch (direction) {
    case 'up':
      startX = centerX;
      startY = centerY - config.cellSize * 0.2;
      endX = centerX;
      endY = centerY - config.cellSize * 0.4;
      break;
    case 'down':
      startX = centerX;
      startY = centerY + config.cellSize * 0.2;
      endX = centerX;
      endY = centerY + config.cellSize * 0.4;
      break;
    case 'left':
      startX = centerX - config.cellSize * 0.2;
      startY = centerY;
      endX = centerX - config.cellSize * 0.4;
      endY = centerY;
      break;
    case 'right':
      startX = centerX + config.cellSize * 0.2;
      startY = centerY;
      endX = centerX + config.cellSize * 0.4;
      endY = centerY;
      break;
  }
  
  // Draw arrow line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw arrowhead
  const headSize = 5;
  ctx.beginPath();
  
  switch (direction) {
    case 'up':
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headSize, endY + headSize);
      ctx.lineTo(endX + headSize, endY + headSize);
      break;
    case 'down':
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headSize, endY - headSize);
      ctx.lineTo(endX + headSize, endY - headSize);
      break;
    case 'left':
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX + headSize, endY - headSize);
      ctx.lineTo(endX + headSize, endY + headSize);
      break;
    case 'right':
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headSize, endY - headSize);
      ctx.lineTo(endX - headSize, endY + headSize);
      break;
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Draw Q-value text
  ctx.fillStyle = "#333";
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  switch (direction) {
    case 'up':
      ctx.fillText(qValue.toFixed(1), centerX, centerY - config.cellSize * 0.5);
      break;
    case 'down':
      ctx.fillText(qValue.toFixed(1), centerX, centerY + config.cellSize * 0.5);
      break;
    case 'left':
      ctx.fillText(qValue.toFixed(1), centerX - config.cellSize * 0.5, centerY);
      break;
    case 'right':
      ctx.fillText(qValue.toFixed(1), centerX + config.cellSize * 0.5, centerY);
      break;
  }
}

// Move the agent
function moveAgent(direction) {
  const newPosition = { ...gameState.agent };
  
  switch (direction) {
    case 'up':
      newPosition.y = Math.max(0, newPosition.y - 1);
      break;
    case 'down':
      newPosition.y = Math.min(config.gridSize - 1, newPosition.y + 1);
      break;
    case 'left':
      newPosition.x = Math.max(0, newPosition.x - 1);
      break;
    case 'right':
      newPosition.x = Math.min(config.gridSize - 1, newPosition.x + 1);
      break;
  }
  
  // Check if new position is a wall
  const isWall = gameState.walls.some(wall => 
    wall.x === newPosition.x && wall.y === newPosition.y
  );
  
  if (!isWall) {
    gameState.agent = newPosition;
    gameState.path.push({ ...newPosition });
  }
  
  // Check if agent reached the goal
  if (gameState.agent.x === gameState.goal.x && gameState.agent.y === gameState.goal.y) {
    showMessage("Goal reached! 🎉", config.rewardColor);
    gameState.totalReward += 10;
    setTimeout(resetAgent, 1000);
  }
  
  // Update display
  drawGame();
  updateStats();
}

// Get reward for a state-action pair
function getReward(state, newState) {
  // Check if new state is a wall
  const [x, y] = newState.split(',').map(Number);
  const isWall = gameState.walls.some(wall => wall.x === x && wall.y === y);
  
  if (isWall) {
    return -5; // Penalty for hitting a wall
  }
  
  // Check if new state is the goal
  if (x === gameState.goal.x && y === gameState.goal.y) {
    return 10; // Reward for reaching the goal
  }
  
  return -0.1; // Small penalty for each move to encourage efficiency
}

// Choose action based on Q-values and exploration rate
function chooseAction(state) {
  if (Math.random() < config.explorationRate) {
    // Explore: choose a random action
    const actions = ['up', 'down', 'left', 'right'];
    return actions[Math.floor(Math.random() * actions.length)];
  } else {
    // Exploit: choose the best action based on Q-values
    const qValues = gameState.qTable[state];
    let bestAction = 'up';
    let bestValue = qValues.up;
    
    if (qValues.down > bestValue) {
      bestAction = 'down';
      bestValue = qValues.down;
    }
    
    if (qValues.left > bestValue) {
      bestAction = 'left';
      bestValue = qValues.left;
    }
    
    if (qValues.right > bestValue) {
      bestAction = 'right';
      bestValue = qValues.right;
    }
    
    return bestAction;
  }
}

// Get new state after taking an action
function getNewState(state, action) {
  const [x, y] = state.split(',').map(Number);
  let newX = x;
  let newY = y;
  
  switch (action) {
    case 'up':
      newY = Math.max(0, y - 1);
      break;
    case 'down':
      newY = Math.min(config.gridSize - 1, y + 1);
      break;
    case 'left':
      newX = Math.max(0, x - 1);
      break;
    case 'right':
      newX = Math.min(config.gridSize - 1, x + 1);
      break;
  }
  
  // Check if new position is a wall
  const isWall = gameState.walls.some(wall => 
    wall.x === newX && wall.y === newY
  );
  
  if (isWall) {
    return state; // Stay in the same state if hitting a wall
  }
  
  return `${newX},${newY}`;
}

// Update Q-value for a state-action pair
function updateQValue(state, action, reward, nextState) {
  const qValues = gameState.qTable[state];
  const nextQValues = gameState.qTable[nextState];
  
  // Find maximum Q-value for next state
  const maxNextQ = Math.max(
    nextQValues.up,
    nextQValues.down,
    nextQValues.left,
    nextQValues.right
  );
  
  // Q-learning update formula
  qValues[action] = qValues[action] + 
    config.learningRate * (reward + config.discountFactor * maxNextQ - qValues[action]);
}

// Run a single learning step
function learningStep() {
  if (!gameState.isLearning) return;
  
  const state = `${gameState.agent.x},${gameState.agent.y}`;
  const action = chooseAction(state);
  const nextState = getNewState(state, action);
  const reward = getReward(state, nextState);
  
  // Update Q-value
  updateQValue(state, action, reward, nextState);
  
  // Update agent position
  const [newX, newY] = nextState.split(',').map(Number);
  gameState.agent = { x: newX, y: newY };
  gameState.path.push({ x: newX, y: newY });
  
  // Update total reward
  gameState.totalReward += reward;
  
  // Check if agent reached the goal
  if (newX === gameState.goal.x && newY === gameState.goal.y) {
    gameState.episodes++;
    resetAgent();
  }
  
  // Update display
  drawGame();
  updateStats();
  
  // Continue learning
  setTimeout(learningStep, config.animationSpeed);
}

// Start learning process
function startLearning() {
  gameState.isLearning = true;
  gameState.isManualControl = false;
  resetAgent();
  showMessage("AI is learning...", config.agentColor);
  learningStep();
}

// Stop learning process
function stopLearning() {
  gameState.isLearning = false;
  showMessage("Learning paused", "#333333");
}

// Switch to manual control
function switchToManual() {
  gameState.isLearning = false;
  gameState.isManualControl = true;
  resetAgent();
  showMessage("Manual control activated", "#333333");
  drawGame();
}

// Show a message to the user
function showMessage(text, color) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = text;
  messageElement.style.color = color;
}

// Update statistics display
function updateStats() {
  document.getElementById('episodes').textContent = gameState.episodes;
  document.getElementById('totalReward').textContent = gameState.totalReward.toFixed(1);
}

// Handle keyboard input for manual control
function handleKeyDown(event) {
  if (!gameState.isManualControl) return;
  
  switch (event.key) {
    case 'ArrowUp':
      moveAgent('up');
      break;
    case 'ArrowDown':
      moveAgent('down');
      break;
    case 'ArrowLeft':
      moveAgent('left');
      break;
    case 'ArrowRight':
      moveAgent('right');
      break;
  }
}

// Initialize the game when the page loads
window.onload = function() {
  initGame();
  document.addEventListener('keydown', handleKeyDown);
};
