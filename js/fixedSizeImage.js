var image_height = document.querySelector('input[name="height"]').value;
var card_height_in = 2.125
var dpi = 0;

update();

d3.select("#width").text(image.style("width"));
d3.select("#swidth").text(screen.width);
d3.select("#sheight").text(screen.height);


function update(){
  image_height = document.querySelector('input[name="height"]').value;
  image = d3.select('#image');
  console.log("setting picture")
  image.attr('src',"./pictures/creditCardDimensions.png");
  console.log("picture set")
  image.style('height',image_height);

  dpi = image_height/card_height_in;
  console.log(dpi)

  d3.select("#width").text(image.style("width"));
  d3.select("#dpi").text(dpi);
}