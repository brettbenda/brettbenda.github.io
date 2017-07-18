String menu = "home";//used to tell what menu we are on, change when we click on buttons
String difficulty = "easy";
int frames;
int seconds;
int fadeAlpha = 0;

ImageButton start;
ImageButton rules;

ImageButton backFromRules;

ImageButton backFromPreGame;
ImageButton selectEasy;
ImageButton selectMed;
ImageButton selectHard;
ImageButton playGame;

ImageButton backFromGame;
ImageButton reset;
ImageButton undo;
GameBoard gameBoard = new GameBoard(difficulty);
GameBoard keyBoard;
GameBoard resetBoard;
GameBoard firstSavedBoard;
GameBoard secondSavedBoard;
GameBoard thirdSavedBoard;
GameBoard fourthSavedBoard;
GameBoard fifthSavedBoard;

ImageButton backFromPostGame;

PImage background;

void setup(){
  size(600,900);
  start = new ImageButton(300,500,loadImage("start.png"));
  rules = new ImageButton(300,700,loadImage("rules.png"));
  
  background = loadImage("temoTileSliderBackground.png");
  
  backFromRules = new ImageButton(60,60,loadImage("back.png"));
  
  backFromPreGame = new ImageButton(60,60,loadImage("back.png"));
  selectEasy = new ImageButton(300,175,loadImage("easy.png"));
  selectMed = new ImageButton(300,300,loadImage("medium.png"));
  selectHard = new ImageButton(300,425,loadImage("hard.png"));
  playGame = new ImageButton(300,800,loadImage("play.png"));
  
  reset = new ImageButton(100,800,loadImage("reset.png"));
  undo = new ImageButton(500,800,loadImage("undo.png"));
  backFromGame = new ImageButton(60,60,loadImage("back.png"));
  
  backFromPostGame = new ImageButton(60,60,loadImage("back.png"));
}

void draw(){
  switch(menu){
    case "home":
      drawHome();
      break;
    case "rules":
      drawRules();
      break;
    case "preGame":
      drawPreGame();
      break;
    case "game":
      drawGame();
      break;
    case "postGame":
      drawPostGame();
      break;
  }
}

void mousePressed(){
  //judging by what the mouse clicks on, it will switch between cases (so like between home screen and rules)
  switch(menu){
   case "home":
      if(start.isOver()){
        menu = "preGame";
      }
      if(rules.isOver()){
        menu = "rules";
      }
      break;  
   case "rules":
      if(backFromRules.isOver()){
        menu = "home";
      }
      break;
   case "preGame":
     if(backFromPreGame.isOver()){
        menu = "home"; 
     }
     if(selectEasy.isOver()){
        difficulty = "easy";
     }
     if(selectMed.isOver()){
        difficulty = "medium"; 
     }
     if(selectHard.isOver()){
        difficulty = "hard"; 
     }
     if(playGame.isOver()){
         gameBoard = new GameBoard(difficulty);
         keyBoard = new GameBoard(gameBoard);
         keyBoard.randomize();
         resetBoard = new GameBoard(gameBoard);
         firstSavedBoard = new GameBoard(gameBoard);
         secondSavedBoard = new GameBoard(gameBoard);
         thirdSavedBoard = new GameBoard(gameBoard);
         fourthSavedBoard = new GameBoard(gameBoard);
         fifthSavedBoard = new GameBoard(gameBoard);
         menu = "game";
         frames = 0;
         seconds = 0;
     }break;
   case "game":
     if(backFromGame.isOver()){
        menu = "home"; 
     }
     if(reset.isOver()){
      gameBoard = new GameBoard(resetBoard); 
     }
     if(undo.isOver()){
      undoMove(); 
     }
     break;
   case "postGame":
     if(backFromPostGame.isOver()){
         menu = "home";
     }
     break;
  }
}

void keyPressed(){
  //this method allows us to denote which direction to move the gameboard in
   switch(menu){
    case "game":
      if(keyCode==RIGHT || keyCode==LEFT || keyCode==UP || keyCode==DOWN){
        fifthSavedBoard = new GameBoard(fourthSavedBoard);
        fourthSavedBoard = new GameBoard(thirdSavedBoard);
        thirdSavedBoard = new GameBoard(secondSavedBoard);
        secondSavedBoard = new GameBoard(firstSavedBoard);
        firstSavedBoard = new GameBoard(gameBoard);   
      }
    
      if(keyCode==RIGHT){
        gameBoard.moveRight();
      }
      if(keyCode==LEFT){
        gameBoard.moveLeft();
      }
      if(keyCode==UP){
        gameBoard.moveUp();
      }
      if(keyCode==DOWN){
        gameBoard.moveDown();
      }
      
   }
}

void drawHome(){
  //will draw the home screen
  background(background);
  start.show();
  rules.show();
}

void drawRules(){
  pushMatrix();
  background(255);
  noStroke();
  fill(245,161,161);
  rectMode(CORNER);
  rect(30,150,width-60,510);
  textMode(CENTER);
  fill(0);
  textSize(50);
  textAlign(CENTER);
  text("Rules",width/2,200);
  textSize(25);
  textAlign(LEFT);
  text("The goal of the game is to match a “key”",40,250);
  text("pattern displayed at the bottom of the",40,280);
  text("screen by manipulating a set of color tiles",40,310);
  text("on the game board.",40,340);
  text("1.  When the game begins, the player will ",50,380);
  text("use the keyboard arrow keys to slide",90,410);
  text("all color tiles on the game board in the",90,440);
  text("input direction.",90,470);
  text("2.  If a tile collides with another tile, they",50,510);
  text("move as one unit until separated.",90,540);
  text("3.  If a tile collides with a wall (black block)",50,580);
  text("or the edge of the board, it cannot",90,610);
  text("move further in that direction.",90,640);
  popMatrix();
  backFromRules.show();
}

void drawPreGame(){
  //will draw pregame, with a selection of difficulty and another case switch
  background(255);
  textSize(30);
  
  rectMode(CENTER);
  strokeWeight(5);
  fill(0);
  textFont(createFont("Tahoma",50));
  text("Difficulty:",200,100);
  
  switch(difficulty){
   case "easy":
     stroke(#26400D);
     fill(#26400D);
     rect(300,175,205,118,5);
     break;
   case "medium":
     stroke(#403B0D);
     fill(#403B0D);
     rect(300,300,205,118,5);
     break;
   case "hard":
     stroke(#40110D);
     fill(#40110D);
     rect(300,425,205,118,5);
     break;
  }
  
  
  backFromPreGame.show();
  selectEasy.show();
  selectMed.show();
  selectHard.show();
  playGame.show();
}

void drawGame(){
  //will draw and setup the actual game
  background(255);
  textSize(30);
  backFromGame.show();
  gameBoard.show();
  reset.show();
  undo.show();
  keyBoard.showKey();
  checkWinCondition();
  
  frames++;
  if(frames==60){
    seconds++;
    frames = 0;
  }
  fill(0);
  text("Time: " + seconds,245,100);
}

void undoMove(){
  
 gameBoard = new GameBoard(firstSavedBoard); 
 firstSavedBoard = new GameBoard(secondSavedBoard);
 secondSavedBoard = new GameBoard(thirdSavedBoard);
 thirdSavedBoard = new GameBoard(fourthSavedBoard);
 fourthSavedBoard = new GameBoard(fifthSavedBoard);
 
}

void checkWinCondition(){
 //this method runs a simple array comparison to check the win condition
  color[][] gameboard = gameBoard.colors;
  color[][] keyboard = keyBoard.colors;
  int iterator = 0;
  boolean winCondition = false;
  for(int i = 0; i < gameBoard.sideLength; i++){
   for(int j = 0; j < gameBoard.sideLength; j++){
     
    if(gameboard[i][j] == keyboard[i][j]){
     iterator++; 
    }
     
   }
  }
  
  if(iterator == (gameBoard.sideLength * gameBoard.sideLength)){
   winCondition = true; 
  }
  if(winCondition){
    frames = 0;
    fadeAlpha = 0;
    menu = "postGame";
  }
}

void drawPostGame(){
  frames++;
  if(frames==3){
    println(frames);
    fadeAlpha++;
    frames = 0;
  }
  fill(255,fadeAlpha);
  rect(0,0,600,900);
  textAlign(CENTER);
  textSize(25);
  fill(0);
  text("You finished the game in " + seconds  + " seconds.",width/2,height*2/3);
  backFromPostGame.show();
  victoryblocks();
}

//decoration for win screen
void victoryblocks() {
  pushMatrix();
  int totalNum = 7;
  for(int i=0; i<totalNum; i++) {
    rectMode(CORNER);
    noStroke();
    fill(random(100,255),random(100,255),random(100,255));
    rect( (2.5*(i+1))+(80*i)+15, height/3, 70, 70);
  }
  for(int i=0; i<7; i++) {
    fill(0);
    stroke(0);
    textSize(75);
    textAlign(CENTER,CENTER);
    char letter;
    switch(i) {
      case 0: letter = 'V'; break;
      case 1: letter = 'I'; break;
      case 2: letter = 'C'; break;
      case 3: letter = 'T'; break;
      case 4: letter = 'O'; break;
      case 5: letter = 'R'; break;
      case 6: letter = 'Y'; break;
      default: letter = ' '; break;
    }
    text(letter, (2.5*(i+1))+(80*i)+50, height/3+30);
  }
  popMatrix();
}

class GameBoard{
 String difficulty;
 color[][] colors;
 int sideLength;
 color[] potentialColors = {color(#0033ff),color(#00ff33),color(#3300ff),color(#33ff00),color(#ff3300),color(#ff0033)
                           ,color(#ff11cc),color(#ffcc11),color(#11ffcc),color(#11ccff),color(#cc11ff),color(#ccff11)};
 
 GameBoard(GameBoard input){
   //creates the gameboard
     this.difficulty = input.difficulty;
     this.colors = new color[input.sideLength][input.sideLength];
     this.sideLength = input.sideLength;
          
     for(int i = 0;i<sideLength;i++){
      for(int j = 0;j<sideLength;j++){
       colors[i][j]=input.colors[i][j];
      }
     }
 }
 
 GameBoard(String difficulty){
   //creates the game board
   if(difficulty.equals("hard")){
     this.difficulty = difficulty;
     this.colors = new color[9][9];
     this.sideLength = 9;
          
     for(int i = 0;i<sideLength;i++){
      for(int j = 0;j<sideLength;j++){
       float random = random(0,5);
       if(random<1){ 
        colors[i][j]= potentialColors[(int)random(0,12)];
       }else if(random>4){
        colors[i][j]=0;
       }else{
        colors[i][j]=200; 
       }
      }
     }
   }
   if(difficulty.equals("medium")){
     this.difficulty = difficulty;
     this.colors = new color[7][7];
     this.sideLength = 7;
     for(int i = 0;i<sideLength;i++){
      for(int j = 0;j<sideLength;j++){
       float random = random(0,5);
       if(random<1){ 
        colors[i][j]= potentialColors[(int)random(0,12)];
       }else if(random>4){
        colors[i][j]=0;
       }else{
        colors[i][j]=200; 
       }
      }
     }
   }
   if(difficulty.equals("easy")){
     this.difficulty = difficulty;
     this.colors = new color[5][5];
     this.sideLength = 5;
     for(int i = 0;i<sideLength;i++){
      for(int j = 0;j<sideLength;j++){
       float random = random(0,5);
       if(random<1){ 
        colors[i][j]= potentialColors[(int)random(0,12)];
       }else if(random>4){
        colors[i][j]=0;
       }else{
        colors[i][j]=200; 
       }
      }
     }
   }
 }
 
 void show(){
   //draws the gameboard
  rectMode(CENTER); 
  stroke(230);
  noFill();
  
  rect(300,350,450,450,50);
  
  noStroke(); 
  rectMode(CORNER);
  for(int i = 0;i<sideLength;i++){
   for(int j = 0;j<sideLength;j++){
    colorMode(HSB);
    
    fill(colors[i][j]);
    rect(102.5+(i*(400/sideLength)),155+(j*(400/sideLength)),(400/sideLength)-5,(400/sideLength)-5,15);
   }
  }
 }
 
 void showKey(){
   //shows the key to which we want the user to achieve
  rectMode(CORNER);
  noStroke(); 
  for(int i = 0;i<sideLength;i++){
   for(int j = 0;j<sideLength;j++){
    colorMode(HSB);
    
    fill(colors[i][j]);
    rect(175+5+(i*(250/sideLength)),612.5+(j*(250/sideLength)),(250/sideLength)-5,(250/sideLength)-5,15-sideLength);
   }
  }
 }
 
 void randomize(){
   //randomizes the moves made on the game board to give the player a challenge to solve
   int times=0;
   switch(difficulty){
    case "easy":
      times = 5;
      break;
    case "medium":
      times = 10;
      break;
    case "hard":
      times = 15;
      break;
   }
   
  for(int i = 0; i < times; i++){
    float temp = random(0,4);
    
    if(temp < 1){
      moveUp();
      print("U");
    }else if(temp >= 1 && temp < 2){
      moveDown();
      print("D");
    }else if(temp >= 2 && temp < 3){
      moveRight();
      print("R");
    }else{
      moveLeft();
      print("L");
    }
    println(" ");
  }
 }
 
 void moveRight(){
   //shifts everything that can shift to the right
  for(int i = sideLength-1;i>=0;i--){
   for(int j = 0;j<sideLength;j++){
     if(i+1==sideLength){
      //edge of gameboard
     }else if(colors[i][j]==0){
      //walls dont move
     }else if(colors[i+1][j]!=200){
      //occupied by a block that is not empty
     }else if(colors[i+1][j]==0){
      //next tile is a wall 
     }else{
       colors[i+1][j]=colors[i][j];
       colors[i][j]=200;
     }
   }
  }
 }
 
  void moveLeft(){
    //shifts everything that can shift to the left
  for(int i = 0;i<sideLength;i++){
   for(int j = 0;j<sideLength;j++){
     if(i-1==-1){
      //edge of gameboard
     }else if(colors[i][j]==0){
      //walls dont move
     }else if(colors[i-1][j]!=200){
      //occupied by a block that is not empty
     }else if(colors[i-1][j]==0){
      //next tile is a wall 
     }else{
       colors[i-1][j]=colors[i][j];
       colors[i][j]=200;
     }
   }
  }
 }
 
  void moveDown(){
    //shifts everything that can shift to the down direction
  for(int i = 0;i<sideLength;i++){
   for(int j = sideLength-1;j>=0;j--){
     if(j+1==sideLength){
      //edge of gameboard
     }else if(colors[i][j]==0){
      //walls dont move
     }else if(colors[i][j+1]!=200){
      //occupied by a block that is not empty
     }else if(colors[i][j+1]==0){
      //next tile is a wall 
     }else{
       colors[i][j+1]=colors[i][j];
       colors[i][j]=200;
     }
   }
  }
 }
 
  void moveUp(){
    //shifts everything that can shift to the up direction
  for(int i = 0;i<sideLength;i++){
   for(int j = 0;j<sideLength;j++){
     if(j-1==-1){
      //edge of gameboard
     }else if(colors[i][j]==0){
      //walls dont move
     }else if(colors[i][j-1]!=200){
      //occupied by a block that is not empty
     }else if(colors[i][j-1]==0){
      //next tile is a wall 
     }else{
       colors[i][j-1]=colors[i][j];
       colors[i][j]=200;
     }
   }
  }
 }
 
}

class ImageButton{
 float x;
 float y;
 PImage image;
 
 ImageButton(float x, float y, PImage image){
   this.x = x;
   this.y = y;
   this.image = image;
 }
 
 void show(){
   //shows images
   imageMode(CENTER);
   image(image,x,y);
 }
 
 boolean isOver(){
   //checks if the mouse is over the button in reference
   if(mouseX > x - image.width/2 && mouseX < x + image.width/2){
    if(mouseY > y - image.height/2 && mouseY < y + image.height/2){
     return true; 
    }
   }
   return false;
 }
}