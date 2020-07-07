console.log("pictures")

var gallery = document.getElementById('gallery');
Promise.all([d3.json("./pictures/pic.json")]).then(
  function(json){
  console.log(json)
  var innerHTML = ""
  var path = "/pictures/Photography/"
  var rowStart = "<div class=\"row row-space my-auto\">"
  var colStart = "<div class=\"col-sm-4\">"
    for(var i=0; i<json[0].images.length; i++){
        var name = json[0].images[i]

        if(i%3==0)
          innerHTML+=rowStart

        var fullpath = path+name


        innerHTML += colStart
        innerHTML += "<img class=\"img-center img-thumbnail mx-auto d-block\" src=\""+fullpath+"\" style=\"max-height: 33vh; width:auto; height: auto; margin-bottom: 10px\">"
        innerHTML += "</div>"

        if(i%3==2 || i==json[0].images.length-1)
          innerHTML+="</div>"
    }
    gallery.innerHTML = innerHTML
})

