var pubArea = document.getElementById('pubArea');

Promise.all([d3.csv("./files/pubs.csv")]).then(
  function(json){
  json = json[0]
  console.log(json)
  innerHTML = ""
  paraStart = "<p>"
  year = 1000;
  for(var i=json.length-1; i>=0; i--){
    json[i].Authors = json[i].Authors.replace('William Benda', '<b>William Benda</b>')
    json[i].Authors = json[i].Authors.replace('Brett Benda', '<b>Brett Benda</b>')
    json[i].VenueType = (json[i].VenueType=="") ? "Misc.":json[i].VenueType;
    
    if(year!=json[i].Year){
      innerHTML += "<h3 class=\"text-dark\">" + json[i].Year +"</h3>"
      year = json[i].Year
    }

    //pub type marker
    innerHTML += "<span class=\"small text-dark align-text-top " + json[i].VenueType.toLowerCase() + "\">[" +json[i].VenueType+ "] </span>"
    
    innerHTML += paraStart

    //title with link to PDF
    innerHTML += "<b><a href=\"./files/" + json[i].PDFName +"\">"+json[i].Title+"</a></b><br>"
    
    //Venue name + abbreviation if there is one
    innerHTML += "<span class=\"small text-dark align-text-top\">" +json[i].VenueName
    if(json[i].Abbreviation != ""){
      innerHTML+=" (" + json[i].Abbreviation + ")"
    } 
    innerHTML +="</span><br>" 

    //authors
    innerHTML += "<span class=\"small text-dark align-text-top\">" +json[i].Authors+"</span><br>"

    //Links and Videos
    if(json[i].Link!="")
      innerHTML += "<a class=\"small\" href=\"" + json[i].Link +"\">(Link) </a>"
    if(json[i].Video!="")
      innerHTML += "<a class=\"small\" href=\"" + json[i].Video +"\">(Video) </a>"
    //abstract toggle
    if(json[i].Abstract != ""){
      innerHTML += "<a class=\"small\" data-toggle=\"collapse\" href=\"#t" + i + "\" role=\"button\" aria-expanded=\"false\" aria-controls=\"t" + i + "\">\
            (View Abstract)\
          </a>"

      innerHTML += "<div class=\"collapse\" id=\"t" + i + "\">\
        <div class=\"card card-body\">"+
          json[i].Abstract+
        "</div>\
      </div>"
    }

    innerHTML += "</p>"
  }
  pubArea.innerHTML = innerHTML
})