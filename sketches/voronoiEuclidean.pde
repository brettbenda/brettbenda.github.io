Point point1;
Button button;
ArrayList<Point> points = new ArrayList();
ArrayList<Integer> colors = new ArrayList<Integer>();

void setup() {
  size(800, 450); 
  point1 = new Point(width/2,height/2);
  button = new Button(100,50,150,50,"Add Point")
  points.add(point1);
  for (int i = 0; i<points.size(); i++) {
    colors.add((int)random(#000000, #FFFFFF));
  }
}

void draw() {
  background(255);
  if(button.isClicked()){
   points.add(new Point(width/2,height/2));
   colors.add((int)random(#000000,#FFFFFF));
  }
  
  drawVoronoi2();
  button.show();
  showPoints();
}

void keyPressed(){
 if(key=='p'){
  save("voronoi.jpg"); 
 }
}

void drawVoronoi2() {
  int best = 0;
  float closest = 10000;
  loadPixels();
  for (int x = 0; x<width; x++) {
    for (int y = 0; y<height; y++) {
      for (int k = 0; k<points.size(); k++) {
        
	/*
        //Manhattan
        if(abs((x-points.get(k).getX()))+abs((y-points.get(k).getY()))<closest){
          best = k;
          closest = abs((x-points.get(k).getX()))+abs((y-points.get(k).getY()));
        }
        */

        //Euclidean
        if (dist(x, y, points.get(k).getX(), points.get(k).getY())<closest) {
          best = k;
          closest = dist(x, y, points.get(k).getX(), points.get(k).getY());
        }

        
      }
      pixels[x+y*width] = colors.get(best);
      best = 0;
      closest = 10000;
    }  
  }
  updatePixels();
}

void showPoints(){
 for(int i = 0; i<points.size(); i++){
  points.get(i).show(); 
 }
}


class Button {
  float x;
  float y;
  float buttonWidth;
  float buttonHeight;
  String name;
  boolean wasPressed;

  Button(float x, float y, float buttonWidth, float buttonHeight, String name) {
    this.x=x;
    this.y=y;
    this.buttonWidth=buttonWidth;
    this.buttonHeight=buttonHeight;
    this.name = name;
    wasPressed=false;
  }

  void show() {
    rectMode(CENTER);
    if (isClicked()) {
      fill(200);
    } else {
      fill(225);
    }
    stroke(100);
    rect(x, y, buttonWidth, buttonHeight, 10);
    fill(0);
    textFont(createFont("Tahoma", buttonHeight/2));
    textAlign(CENTER);
    text(name,x,y+buttonHeight/5);
  }

  boolean isClicked() {
    if (mousePressed && isOver() && !wasPressed) {
      wasPressed=true;
      return true;
    }else if(mousePressed && isOver() && wasPressed){
      return false;
    }
    wasPressed = false;
    return false;
  }

  boolean isOver() {
    if (mouseX > x - buttonWidth/2 && mouseX < x + buttonWidth/2) {
      if (mouseY > y - buttonHeight/2 && mouseY < y + buttonHeight/2) {
        return true;
      }
    }
    return false;
  }
}


class Point {
  float x, y;
  boolean isMoving = false;

  Point() {
  }

  Point(float x, float y) {
    setX(x);
    setY(y);
  }

  void setX(float x) { 
    this.x = x;
  }

  void setY(float y) { 
    this.y = y;
  }

  float getX() { 
    return this.x;
  }

  float getY() { 
    return this.y;
  }

  void show() {
    strokeWeight(5);
    stroke(0);
    fill(255);
    ellipse(x, y, 20, 20);
    if(isClicked()){
      isMoving = true;
    }
    if(!mousePressed){
     isMoving = false; 
    }
    if(isMoving){
     updatePosition(); 
    }
  }


  boolean isOver() {
    if (dist(mouseX, mouseY,x,y)<10){
     return true; 
    }
    return false;
  }
  
  boolean isClicked(){
   if(isOver() && mousePressed){
     return true;
   }
   return false;
  }
  
  void updatePosition(){
   x = mouseX;
   y = mouseY;
  }
}