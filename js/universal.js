window.onload = function(){
	var header = document.getElementById('header');
	header.innerHTML = '\
		<h1 class="text-light"><a href="index.html" class="text-light">Brett Benda</a></h1>\
		<ul class="navbar-nav ml-auto">\
	      <li class="nav-item">\
	        <a class="nav-link" href="index.html">Home</a>\
	      </li>\
        <li class="nav-item">\
          <a class="nav-link" href="pictures.html">Photography</a>\
        </li>\
	      <li class="nav-item">\
	        <a class="nav-link" href="research.html">Research</a>\
	      </li>\
	      <li class="nav-item">\
	        <a class="nav-link" href="pubs.html">Publications</a>\
	      </li>\
	      <li class="nav-item">\
	        <a class="nav-link" target="_blank" href="files/BrettBendaCV.pdf">CV</a>\
	      </li>\
	    </ul>'

	var footer = document.getElementById('footer');
	footer.innerHTML = '\
	<div class="row row-space my-auto">\
      <div class="col-sm-12">\
        <h6 class="text-center mx-auto text-light">\
          <a class="text-light" href="https://ufl.edu">University of Florida</a> | \
          <a class="text-light" href="https://cise.ufl.edu">CISE</a> | \
          <a class="text-light" href="https://www.cise.ufl.edu/~eragan/indie.html">IndieLab</a></h6>\
        <h6 class="text-center mx-auto text-light">© 2020 Brett Benda</h6>\
      </div>\
    </div>'

  console.log("loaded")
}
