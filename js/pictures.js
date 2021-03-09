console.log("pictures")

var gallery = document.getElementById('gallery');
Promise.all([d3.json("./pictures/pic.json")]).then(
  function(json){
  console.log(json)
  var innerHTML = ""
  var path = "./pictures/Photography/"
  var rowStart = "<div class=\"row row-space my-auto\">"
  var colStart = "<div class=\"col-sm-4\">"
  var j = 0;
  shuffleArray(json[0].images);
    for(var i=json[0].images.length-1; i>=0; i--){
        var name = json[0].images[i]

        if(j%3==0)
          innerHTML+=rowStart

        var fullpath = path+name


        innerHTML += colStart
        innerHTML += "<img class=\"img-center img-thumbnail mx-auto d-block\" src=\""+fullpath+"\" style=\"max-height: 33vh; width:auto; height: auto; margin-bottom: 10px\">"
        innerHTML += "</div>"

        if(j%3==2 || j==json[0].images.length-1)
          innerHTML+="</div>"

      	j++
    }
    gallery.innerHTML = innerHTML
})

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}