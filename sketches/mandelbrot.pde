int imageNum = 1;
double zoom = 4;
double xDisplacement = 0;
double yDisplacement = 0;
boolean isMoving = false;
double savedXDis;//xDisplacement at start of movement
double savedYDis;//yDisplacement at start of movement
double tempDX;//temp change in x, based on zoom
double tempDY;//temp change in y, based on zoom
double initX;//x pos when you first click
double initY;//y pos when you first click
double currX;//x pos after you click, but still have mouse pressed
double currY;//y pos after you click, but still have mouse pressed

void setup() {
  size(800, 450);
  background(255);
}

void draw() {
  background(255);
  updateZoomAndTranslation();
  drawMandelbrot(zoom, xDisplacement, yDisplacement, 100);
}

void keyPressed(){
  if(key=='w'){
    zoom*=0.9;
  }
  if(key=='s'){
    zoom*=1.1;
  }
}

void updateZoomAndTranslation() {
  if (mousePressed) {
    if (!isMoving) {
      isMoving = true;
      initX = mouseX;
      initY = mouseY;
      savedXDis = xDisplacement;
      savedYDis = yDisplacement;
    }
    if (isMoving) {
      currX = mouseX;
      currY = mouseY;
      tempDX = (double)(initX-currX)/width*zoom; 
      tempDY = (double)(initY-currY)/height*zoom;
      xDisplacement = savedXDis + tempDX;
      yDisplacement = savedYDis + tempDY;
    }
  } else {
    isMoving = false;
  }
}

void drawMandelbrot(double xAxisLength, double xDisplacement, double yDisplacement, int iterations) {
  //load pixels so we can modify them
  loadPixels();

  //using HSB for coloring
  colorMode(HSB);

  //we want the y-axis to be proportional to the x-axis
  double yAxisHeight = (xAxisLength * height)/width;

  //minimun (starting) values
  //and how much we need to increase them by each iterations
  double xMinimum = -xAxisLength/2 + xDisplacement;
  double dX = xAxisLength/width;
  double yMinimum = -yAxisHeight/2 + yDisplacement;
  double dY = yAxisHeight/height;

  double y = yMinimum;//start at minumum x-value

  //increment across the row
  for (int i = 0; i<height; i++) {

    double x = xMinimum;//start at minimum y-value;

    //increment down the column;
    for (int j = 0; j<width; j++) {

      double a = x;//real part is x

      double b = y;//imaginary part is y

      int n = 0; //start at iteration 0

      while (n<iterations) {
        double aSquared = a*a;
        double bSquared = b*b;
        double twoAB = 2*a*b;

        //new parts are determined by expansion 
        //(a+bi)^2 == a^2 - b^2 + 2ab
        a = aSquared - bSquared + x;
        b = twoAB + y;

        //if value of new
        if (Math.sqrt(a*a+b*b)>4) {
          break;
        }
        n++;
      }

      if (n == iterations) {
        pixels[j+i*width] = #000000;
      } else {
       float hue = 5*n;
        if (hue > 255) {
          hue = hue%255;
        }
        pixels[j+i*width] = color(hue, 255, 255);
      }

      x+=dX;
    }
    y+=dY;
  }

  updatePixels();
}