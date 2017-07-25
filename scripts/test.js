$(function(){
	var largeImageFlag = true;


	//used to expand selected image in table
	$(".tableElement").click(function(){
		if(largeImageFlag){
			$(this).addClass("tableElementClicked");

			$(this).children(".tileSliderImage").addClass("tileSliderImageExpanded");

			$(this).children(".roomImage").addClass("roomImageExpanded");

			$(this).children(".handImage").addClass("handImageExpanded");

			$(this).children(".particleImage").addClass("particleImageExpanded");

			$(this).children("p").toggle();

		}else{

			$(this).removeClass("tableElementClicked");

			$(this).children(".tileSliderImage").removeClass("tileSliderImageExpanded");

			$(this).children(".roomImage").removeClass("roomImageExpanded");

			$(this).children(".handImage").removeClass("handImageExpanded");

			$(this).children(".particleImage").removeClass("particleImageExpanded");
			
			$(this).children("p").toggle();
		}
		largeImageFlag = !largeImageFlag;
	});
	
});