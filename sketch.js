// Bakeoff #2 - Seleção de Alvos Fora de Alcance
// IPM 2021-22, Período 3
// Entrega: até dia 22 de Abril às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 18 de Abril

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 0;      // Add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // Set to 'true' before sharing during the bake-off day

// Target and grid properties (DO NOT CHANGE!)
let PPI, PPCM;
let TARGET_SIZE;
let TARGET_PADDING, MARGIN, LEFT_PADDING, TOP_PADDING;
let continue_button;
let inputArea        = {x: 0, y: 0, h: 0, w: 0}    // Position and size of the user input area

// Metrics
let testStartTime, testEndTime;// time between the start and end of one attempt (54 trials)
let hits 			 = 0;      // number of successful selections
let misses 			 = 0;      // number of missed selections (used to calculate accuracy)
let database;                  // Firebase DB  

// Study control parameters
let draw_targets     = false;  // used to control what to show in draw()
let trials 			 = [];     // contains the order of targets that activate in the test
let current_trial    = 0;      // the current trial number (indexes into trials array above)
let attempt          = 0;      // users complete each test twice to account for practice (attemps 0 and 1)
let fitts_IDs        = [];     // add the Fitts ID for each selection here (-1 when there is a miss)

let DistToTarget = 0; 
// Target class (position and width)
class Target
{
  constructor(x, y, w)
  {
    this.x = x;
    this.y = y;
    this.w = w;
  }
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);    // window size in px before we go into fullScreen()
  frameRate(60);             // frame rate (DO NOT CHANGE!)
  
  randomizeTrials();         // randomize the trial order at the start of execution
  
  textFont("Arial", 18);     // font size for the majority of the text
  drawUserIDScreen();        // draws the user start-up screen (student ID and display size)
}

// Runs every frame and redraws the screen
 miss = 0;

function draw()
{
  if (draw_targets)
  {     
    // The user is interacting with the 6x3 target grid
    background(color(0,0,0));        // sets background to black
    if (miss == 1) {
      background(color(20, 0, 0));
    }
    else if (miss == 2) {
      background(color(0, 20, 0));
    }

    started = 1;
    
    // Print trial count at the top left-corner of the canvas
    noStroke();
    fill(color(255,255,255));
    textAlign(LEFT);
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);
    
    // Draw all 18 targets
    
    drawOctagons();
    
	for (var i = 0; i < 18; i++) {
      drawTarget(i);
    }
    
    // Draw the user input area
    drawInputArea()

    // Draw the virtual cursor
    let x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width)
    let y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height)

    stroke(color(255, 255, 255));
    fill(255);
    circle(x, y, 0.5 * PPCM);
  }
  
  if (draw_targets) {
    drawYellowCircle(inputArea.x + 2.5*PPCM, inputArea.y - PPCM);
    draw2Xtext(inputArea.x + 2.5*PPCM, inputArea.y - PPCM);
    
    drawFutureCircle(inputArea.x + 2.5*PPCM, inputArea.y - 2.5*PPCM, 0);
    
    drawNormalCircle(inputArea.x + 2.5*PPCM, inputArea.y - 4*PPCM, 0)
    
    noStroke();
    
    instructionText(inputArea.x + 5*PPCM, inputArea.x + 6*PPCM, inputArea.y - 4*PPCM,
               inputArea.y - 2.5*PPCM, inputArea.y - PPCM);
    
  }
  
}

function instructionText(x, x2, y1, y2, y3) {
    fill(color(255,255,255));
    noStroke();
    textFont("Arial", 36);
  
    textAlign(CENTER, CENTER);
  
    text("Target", x, y1);
    text("Click Twice", x2, y3);
    text("Next Target", x2, y2);
  
    textFont("Arial", 18);
}

// Print and save results at the end of 54 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE! 
  let accuracy			= parseFloat(hits * 100) / parseFloat(hits + misses);
  let test_time         = (testEndTime - testStartTime) / 1000;
  let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
  let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
  let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
  let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));   // clears screen
  fill(color(255,255,255));   // set text fill color to white
  text(timestamp, 10, 20);    // display time on screen (top-left corner)
  
  textAlign(CENTER);
  text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
  text("Hits: " + hits, width/2, 100);
  text("Misses: " + misses, width/2, 120);
  text("Accuracy: " + accuracy + "%", width/2, 140);
  text("Total time taken: " + test_time + "s", width/2, 160);
  text("Average time per target: " + time_per_target + "s", width/2, 180);
  text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);
  
  // Print Fitts IDS (one per target, -1 if failed selection, optional)
  noStroke();
  for (var i = 0; i < 53; i++)
{
  if (i <= 27){ 
    if (fitts_IDs[i] != -1)
       text("Fitts Target: " + i + ": " + fitts_IDs[i], width/4,240 + 20*i);
    else
      text("Fitts Target: " + i + ": " + fitts_IDs[i], width/4,240 + 20*i)
  }
  else
  {
    if (fitts_IDs[i] != -1)
      text("Fitts Target: " + i + ": " + fitts_IDs[i], 3 *width/4,240 + 20*(i-27));
    else
      text("Fitts Target: " + i + ": " + fitts_IDs[i], 3 *width/4,240 + 20*(i-27));
  }
}
  
  

 
  // 
  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:       GROUP_NUMBER,
        assessed_by:        student_ID,
        test_completed_by:  timestamp,
        attempt:            attempt,
        hits:               hits,
        misses:             misses,
        accuracy:           accuracy,
        attempt_duration:   test_time,
        time_per_target:    time_per_target,
        target_w_penalty:   target_w_penalty,
        fitts_IDs:          fitts_IDs
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

function drawInstructions() {
    draw2Xcircle(inputArea.x, inputArea.y - 5*PPCM);
  }

// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() 
{
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    // Get the location and size of the target the user should be trying to select
    let target = getTargetBounds(trials[current_trial]);   
    
    // Check to see if the virtual cursor is inside the target bounds,
    // increasing either the 'hits' or 'misses' counters
        
    if (insideInputArea(mouseX, mouseY))
    {
      let virtual_x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width)
      let virtual_y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height)
      
    for (var k = 0; k < 18; k++) {
      let target = getTargetBounds(k);
      if (dist(target.x, target.y, virtual_x, virtual_y) < 1.5*PPCM) {
        virtual_x = target.x;
        virtual_y = target.y;
      }
    }
      

      if (dist(target.x, target.y, virtual_x, virtual_y) < target.w/2) {
        miss = 2;
        hits++;
        fitts_IDs.push(Math.log2((DistToTarget/target.w )+ 1).toFixed(3));
      }
      else {
        miss = 1;
        misses++;
       fitts_IDs.push(-1)
      }
      
      current_trial++;
      target = getTargetBounds(trials[current_trial]);
      DistToTarget = dist(target.x, target.y, virtual_x, virtual_y)
      // Move on to the next trial/target
    }

    // Check if the user has completed all 54 trials
    if (current_trial === trials.length)
    {
      testEndTime = millis();
      draw_targets = false;          // Stop showing targets and the user performance results
      printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
      attempt++;                      
      
      // If there's an attempt to go create a button to start this
      if (attempt < 2)
      {
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    }
    else if (current_trial === 1) testStartTime = millis();
  }
}

// Draw target on-screen
function drawTarget(i)
{
  // Get the location and size for target (i)
  let target = getTargetBounds(i);   
  let cTarget = getTargetBounds(trials[current_trial]);

  if (trials[current_trial - 1] === i && !hoverTarget(trials[current_trial])) {
      drawFirstLine(target.x, target.y, cTarget.x, cTarget.y);
  }
  else if (trials[current_trial + 1] === i) {
    drawSecondLine(target.x, target.y, cTarget.x, cTarget.y);
  }

  // Draws the target
  fill(color(155,155,155));  
  
  if (trials[current_trial] === i) 
  {
    if (trials[current_trial+1] === i) {
        draw2Xcircle(target.x, target.y, target.w);
    }
    else {
      drawNormalCircle(target.x, target.y, target.w); 
    }
    hoverTarget(i);

  }
  else  if (trials[current_trial+1] === i) 
  { 
    drawFutureCircle(target.x, target.y, target.w);
  }
  
  else noStroke(); 
  circle(target.x, target.y, target.w);
  
  
  //draw 2x
  
  if (trials[current_trial] === i) {
    if (trials[current_trial+1] === i)
      draw2Xtext(target.x, target.y);
  }
  
  
  if (insideInputArea(mouseX, mouseY)) {
    let virtual_x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width);
    let virtual_y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height);

    if (dist(target.x, target.y, virtual_x, virtual_y) < 1.5*PPCM) {
      fill(255);
      circle(target.x, target.y, 0.5* PPCM);
    }
  }
  
}


function drawFirstLine(x1, y1, x2, y2) {
    stroke(color(0, 200, 0));
    strokeWeight(7);
    line(x1, y1, x2, y2);
}

function drawSecondLine(x1, y1, x2, y2) {
    stroke(color(200, 200, 200));
    strokeWeight(7);
    line(x1, y1, x2, y2);
}





function draw2Xcircle(x, y, w) {
    drawYellowCircle(x, y);
}

function drawYellowCircle(x, y) {
    stroke(color(255, 0, 0));
    strokeWeight(2);
    fill((color(200, 200, 0)));
    circle(x, y, 1.3*PPCM);
}

function draw2Xtext(x, y) {
    fill(color(1,1,1));
    textFont("Arial", 36);
    stroke(color(1,1,1));
    textAlign(CENTER, CENTER);
    text("2x", x, y);
    textFont("Arial", 18);

}




function drawNormalCircle(x, y, w) {
    fill(color(0, 255, 0));
    stroke(color(0, 100, 0));
    strokeWeight(4);
    circle(x, y, 1.3*PPCM);


    if (insideInputArea(mouseX, mouseY)) {
        let virtual_x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width);
        let virtual_y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height);
  
        if (dist(x, y, virtual_x, virtual_y) < w/2) {
          fill(color(0, 50, 255));
        }
    }
}




function drawFutureCircle(x, y, w) {
    stroke(color(250, 0, 0));
    strokeWeight(4);
    fill(color(200, 200, 200));
    circle(x, y, 1.3*PPCM);
}







function hoverTarget(i) {
  let target = getTargetBounds(i);
     if (insideInputArea(mouseX, mouseY)) {
      let virtual_x = map(mouseX, inputArea.x, inputArea.x + inputArea.w, 0, width)
      let virtual_y = map(mouseY, inputArea.y, inputArea.y + inputArea.h, 0, height)

      if (dist(target.x, target.y, virtual_x, virtual_y) < 1.5*PPCM) {
        fill(color(0, 50, 255));
        return true;
      }  
    }
  return false;
}





function drawOctagons() {
  fill(0);
  stroke(color(255));
  strokeWeight(1);
  
  for (var i = 0; i < 18; i++) {
    let target1 = getTargetBounds(i);
    
    line(target1.x + 0.5*PPCM, target1.y - 1.5*PPCM, target1.x + 1.5*PPCM, target1.y - 0.5*PPCM);
    line(target1.x - 0.5*PPCM, target1.y - 1.5*PPCM, target1.x - 1.5*PPCM, target1.y - 0.5*PPCM);
    
    line(target1.x + 0.5*PPCM, target1.y + 1.5*PPCM, target1.x + 1.5*PPCM, target1.y + 0.5*PPCM);
    line(target1.x - 0.5*PPCM, target1.y + 1.5*PPCM, target1.x - 1.5*PPCM, target1.y + 0.5*PPCM);
    
    
    line(target1.x - 0.5*PPCM, target1.y - 1.5*PPCM, target1.x + 0.5*PPCM, target1.y - 1.5*PPCM);
    line(target1.x - 0.5*PPCM, target1.y - 1.5*PPCM, target1.x + 0.5*PPCM, target1.y - 1.5*PPCM);
    
    line(target1.x - 0.5*PPCM, target1.y + 1.5*PPCM, target1.x + 0.5*PPCM, target1.y + 1.5*PPCM);
    line(target1.x - 0.5*PPCM, target1.y + 1.5*PPCM, target1.x + 0.5*PPCM, target1.y + 1.5*PPCM);
    
    line(target1.x - 1.5*PPCM, target1.y - 0.5*PPCM, target1.x - 1.5*PPCM, target1.y + 0.5*PPCM);
    line(target1.x + 1.5*PPCM, target1.y - 0.5*PPCM, target1.x + 1.5*PPCM, target1.y + 0.5*PPCM);
  }
}




// Returns the location and size of a given target
function getTargetBounds(i)
{
  var x = parseInt(LEFT_PADDING) + parseInt((i % 3) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);
  var y = parseInt(TOP_PADDING) + parseInt(Math.floor(i / 3) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);

  return new Target(x, y, TARGET_SIZE);
}

// Evoked after the user starts its second (and last) attempt
function continueTest()
{
  // Re-randomize the trial order
  shuffle(trials, true);
  current_trial = 0;
  print("trial order: " + trials);
  
  // Resets performance variables
  hits = 0;
  misses = 0;
  fitts_IDs = [];
  
  continue_button.remove();
  
  // Shows the targets again
  draw_targets = true;
  testStartTime = millis();  
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() 
{
  resizeCanvas(windowWidth, windowHeight);
    
  let display    = new Display({ diagonal: display_size }, window.screen);

  // DO NOT CHANGE THESE!
  PPI            = display.ppi;                        // calculates pixels per inch
  PPCM           = PPI / 2.54;                         // calculates pixels per cm
  TARGET_SIZE    = 1.5 * PPCM;                         // sets the target size in cm, i.e, 1.5cm
  TARGET_PADDING = 1.5 * PPCM;                         // sets the padding around the targets in cm
  MARGIN         = 1.5 * PPCM;                         // sets the margin around the targets in cm

  // Sets the margin of the grid of targets to the left of the canvas (DO NOT CHANGE!)
  LEFT_PADDING   = width/3 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;        

  // Sets the margin of the grid of targets to the top of the canvas (DO NOT CHANGE!)
  TOP_PADDING    = height/2 - TARGET_SIZE - 3.5 * TARGET_PADDING - 1.5 * MARGIN;
  
  // Defines the user input area (DO NOT CHANGE!)
  inputArea      = {x: width/2 + 2 * TARGET_SIZE,
                    y: height/2,
                    w: width/3,
                    h: height/3
                   }

  // Starts drawing targets immediately after we go fullscreen
  draw_targets = true;
}

// Responsible for drawing the input area
function drawInputArea()
{
  noFill();
  stroke(color(220,220,220));
  strokeWeight(2);
  
  rect(inputArea.x, inputArea.y, inputArea.w, inputArea.h);
}