var userCounts = [8, 8, 8]
var docs;
var logs;
var data = []

//Load Docs
Promise.all([	
	d3.json("/js/ProvSegments/Dataset_1/Documents/Documents_Dataset_1.json"),
	d3.json("/js/ProvSegments/Dataset_2/Documents/Documents_Dataset_2.json"),
	d3.json("/js/ProvSegments/Dataset_3/Documents/Documents_Dataset_3.json")
]).then(function(json){
	docs = json
	console.log(docs)
})

Promise.all([
	d3.json("/js/test.json")
]).then(function(json){
	logs = json[0] //everything is wrapped in an extra array so

	var seg = logs[2][7] //get P1
	
	var seg = segmentify(seg)
	console.log(seg)

	for (var i = 0; i<seg.length; i++){
		var summary = summarize_segment(seg[i])
		summary.pid = 1;
		summary.number = i
		data.push(summary)
	}
	
	console.log(data)
	
	//draw cards
	var card = d3.select("#chart").
				selectAll("svg").
				data(data).
				enter().
				append("svg").
				attr("height", 210).
				attr("width",410).
				attr("id",function(d){
					return d.pid + ":" +d.number
				})

	card.bg = card.append("rect").
				attr("x",5).
				attr("y",5).
				attr("rx",5).
				attr("ry",5).
				attr("height",200).
				attr("width",400).
				style("fill","white").
				style("stroke","royalblue").
				style("stroke-width", 3)

	card.label = card.append("text").
				attr("x",15).
				attr("y",25).
				style("font-weight", "bold").
				style("text-decoration", "underline").
				text(function(d){
					return "Participant: " + d.pid + ", Segment: " + d.number
				})

	card.text = card.append("text").
				attr("x",15).
				attr("y",60).
				text(function(d){
					return d.summaryText
				})
				.call(wrap, 385)

	card.drag_bg = card.append("rect").
					attr("x",15).
					attr("y",150).
					attr("height", function(d){
						return 50
					}).
					attr("width",50).
					style("fill","royalblue")

	card.drag_bar = card.append("rect").
					attr("x",15).
					attr("y",150).
					attr("height", function(d){
						return 50*(1.0 - d.drag_ratio)
					}).
					attr("width",50).
					style("fill","lightblue")

	card.drag_text = card.append("text").
					attr("x",15).
					attr("y",150).
					text("Dragging").
					style("font-size", 12)
					.call(wrap, 385)

	card.search_bg = card.append("rect").
					attr("x",75).
					attr("y",150).
					attr("height", function(d){
						return 50
					}).
					attr("width",50).
					style("fill","royalblue")

	card.search_bar = card.append("rect").
					attr("x",75).
					attr("y",150).
					attr("height", function(d){
						return 50*(1.0 - d.search_ratio)
					}).
					attr("width",50).
					style("fill","lightblue")

	card.drag_text = card.append("text").
					attr("x",75).
					attr("y",150).
					text("Searching").
					style("font-size", 12)
					.call(wrap, 385)

	card.highlight_bg = card.append("rect").
					attr("x",135).
					attr("y",150).
					attr("height", function(d){
						return 50
					}).
					attr("width",50).
					style("fill","royalblue")

	card.highlight_bar = card.append("rect").
					attr("x",135).
					attr("y",150).
					attr("height", function(d){
						return 50*(1.0 - d.highlight_ratio)
					}).
					attr("width",50).
					style("fill","lightblue")

	card.drag_text = card.append("text").
					attr("x",135).
					attr("y",150).
					text("Highlighting").
					style("font-size", 12)
					.call(wrap, 385)



	console.log(card)

})

//Argument: a participant interaction json object
//Result: 	an array of interaction json objects regrouped by segment
function segmentify(json){
	var segmented_data = []
	var current_segment = []
	var segment_id = 0
	for (var item of json){
		if(item['segment'] == segment_id){
			current_segment.push(item)
		}else{
			segmented_data.push(current_segment)
			current_segment = [];
			segment_id++;
		}
		
	}
	return segmented_data
}


//Argument: a segment from the array returned by segmentify
//Returns:  a json object
function summarize_segment(segment){

	var drags = []; //Draging
	var searches = []; //Search
	var notes = [] //Add note
	var highlights = [] //Highlight
	var total_interactions = 1;

	//remove non-alphanumeric chars to aboid issue
	for(var interaction of segment){
		switch(interaction['InteractionType']){
			case "Draging":
				drags.push(interaction["Text"])
				total_interactions++
				break
			case "Search":
				searches.push(interaction["Text"].replace(/\W/g, ''))
				total_interactions++
				break;
			case "Add note":
				notes.push(interaction["Text"])
				total_interactions++
				break
			case "Highlight":
				//ignore really long highlights
				if(interaction["Text"].length <=15){
					total_interactions++
					highlights.push(interaction["Text"].replace(/\W/g, ''))
				}
				break
		}
	}

	//only unique
	searches = [...new Set(searches)]
	highlights = [...new Set(highlights)]

	//Find features	
	var bestFeatures = []
	var summaryText = "";
	if(searches.length !=0){
		summaryText += "The investigator searched for documents related to "
		for(var i =0; i<Math.min(3,searches.length); i++){

			//last
			if(i!=0 && i==Math.min(3,searches.length)-1)
				summaryText +="and "

			summaryText += searches[i]

			//not first
			if(i!=Math.min(3,searches.length)-1)
				summaryText +=", "
		}
		summaryText+=". \n"
	}

	if(highlights.length !=0){
		if(highlights.length == 1)
			summaryText += "The investigator thought the phrase "
		else
			summaryText += "The investigator thought the phrases "

		for(var i =0; i<Math.min(3,highlights.length); i++){

			//not first and last
			if(i!=0 && i==Math.min(3,highlights.length)-1)
				summaryText +="and "

			summaryText += "\"" + highlights[i] + "\""

			//not last
			if(i!=Math.min(3,highlights.length)-1)
				summaryText +=", "
		}
		
		if(highlights.length == 1)
			summaryText += " was notable."
		else
			summaryText += " were notable."
	}


	if(summaryText == ""){
		summaryText = "Nothing interesting was found."
	}

	console.log( drags.length/total_interactions)
	var summary = {
		total_interactions: total_interactions,
		drags: drags,
		drag_ratio: drags.length/total_interactions,
		searches: searches,
		search_ratio: searches.length/total_interactions,
		notes: notes,
		note_ratio: notes.length/total_interactions,
		highlights: highlights,
		highlight_ratio: highlights.length/total_interactions,
		summaryText: summaryText
	}
	return summary;
}

//Argument: An array
//Returns:  Counts of each item in the array
function count(arr){
	counts = []
	for(var item of arr){
		if(!counts[item]){
			counts[item]=1
		} else{
			counts[item]++
		}
	}
	return counts;
}

//Magic dunction found on stackoverflow for wrapping text
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}