var userCounts = [8, 8, 8]
var docs;
var logs;
var segments;
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
	logs = json[0].interactionLogs
	segments = json[0].segments
	console.log(segments)

	var seg = logs[0][0] //get P1
	
	var seg = segmentify(seg)
	console.log(seg)

	var total_interactions = 0;
	for (var i = 0; i<seg.length; i++){
		var summary = summarize_segment(seg[i])
		summary.pid = 1;
		summary.dataset = 1
		summary.number = i
		if(summary.interesting)
			total_interactions += summary.total_interactions;
		data.push(summary)
	}

	//average number of interactions
	//total_interactions /= data.length

	//interactions rate = 0.5 if at average, <0.5 if
	for(var seg of data){
		seg.interaction_rate = Math.max(0,(seg.total_interactions / total_interactions));
	}

	console.log(data)
	
	//draw cards
	var card = d3.select("#chart").
				selectAll("card").
				data(data).
				enter().
				append("svg").
				attr("height", 210).
				attr("width",410).
				// attr("transform", function(d){
				// 	return "scale(" + Math.max(0.75,(d.total_interactions/25 > 1.0)?1.0:d.total_interactions/25)  + ")"
				// }).
				attr("id",function(d){
					return "card" + d.pid + "_" +d.number
				})
				//attr("class","card")

	card.bg = card.append("rect").
				attr("x",5).
				attr("y",5).
				attr("rx",5).
				attr("ry",5).
				attr("height",200).
				attr("width",400).
				style("fill","white").
				style("stroke", function(d){
					return d.interesting ? "royalblue" : "indianred"
				}).
				style("stroke-width", 3)

	card.label = card.append("text").
				attr("x",15).
				attr("y",25).
				style("font-weight", "bold").
				style("text-decoration", "underline").
				text(function(d){
					var segment =  GetSegment(d.number, d.pid, d.dataset)
					return "Participant: " + d.pid + ", Segment: " + (d.number+1) + " [" + segment.start + ", " + segment.end + "] (" + segment.length + ")"
				})

	card.text = card.append("text").
				attr("x",15).
				attr("y",60).
				text(function(d){
					return d.summaryText
				})
				.call(wrap, 385)


	card.search = barElement(card, 15, 150, "Search", function(d){
		return 50*(1.0 - d.search_ratio)
	})

	card.highlight = barElement(card, 75, 150, "Highlight", function(d){
		return 50*(1.0 - d.highlight_ratio)
	})

	card.notes = barElement(card, 135, 150, "Notes", function(d){
		return 50*(1.0 - d.note_ratio)
	})

	card.drag = barElement(card, 195, 150, "Drag", function(d){
		return 50*(1.0 - d.drag_ratio)
	})

	card.total = barElement(card, 345, 150, "Total", function(d){
		return 50*(1.0 - d.interaction_rate)
	})


	// card.search = circleElement(card, 15,150, 25, "Search", function(d){
	// 	return 50*(d.search_ratio)/2
	// })

	// card.highlight = circleElement(card, 75,150, 25,"Highlight", function(d){
	// 	return 50*(d.highlight_ratio)/2
	// })

	// card.notes = circleElement(card, 135,150, 25,"Notes", function(d){
	// 	return 50*(d.note_ratio)/2
	// })

	// card.drag = circleElement(card, 195,150, 25,"Drag", function(d){
	// 	return 50*(d.drag_ratio)/2
	// })

	// card.total = circleElement(card, 345,150, 25, "Total", function(d){
	// 	return 50*(d.interaction_rate)
	// })


	// card.total = card.append("text")
	// 			 .attr("x", 250)
	// 			 .attr("y", 185)
	// 			 .text(function(d){
	// 			 	return "Total Interactions: " + d.total_interactions
	// 			 })

	

	console.log(card)

})


//Arguments: The svg element to draw the bar on, x location, y location, text label, function to determine size of bar
//Output: void return, item added to input svg
function barElement(card, x, y, text, sizefunc){
	element = {}
	element.bar = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", 50).
					attr("width",50).
					attr("class", "barBar"+text).
					style("fill",function(d){
							return d.interesting ? "royalblue" : "coral"
					})
					.on("mouseover",function(d,i){
						var selectID = "#card" + d.pid+"_"+i

						//linked to other data!
						card.append("text").
							attr("x", x+25).
							attr("y",y+30).
							attr("class","barText").
							text(function(d,i){return TextToValue(d,text)}).
							style("font-size", 12).
							style("font-weight", "bold")

						card.selectAll(".barBar"+text).
							style("fill", "lightcoral")
					})
					.on("mouseout",function(d,i){
						var selectID = "#card" + d.pid+"_"+i

						d3.selectAll(".barText").remove()

						card.selectAll(".barBar"+text).
							style("fill", function(d){
								return d.interesting ? "royalblue" : "coral"
							})
					})

	element.bg = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", sizefunc).
					attr("width",50).
					style("fill",function(d){
							return d.interesting ? "lightblue" : "lightcoral"
					})
					.on("mouseover",function(d,i){
						var selectID = "#card" + d.pid+"_"+i

						//linked to other data!
						card.append("text").
							attr("x", x+25).
							attr("y",y+30).
							attr("class","barText").
							text(function(d,i){return TextToValue(d,text)}).
							style("font-size", 12).
							style("font-weight", "bold")

						
						card.selectAll(".barBar"+text).
							style("fill", "lightcoral")
					})
					.on("mouseout",function(d,i){
						var selectID = "#card" + d.pid+"_"+i
						d3.selectAll(".barText").remove()

						card.selectAll(".barBar"+text).
							style("fill", function(d){
								return d.interesting ? "royalblue" : "coral"
							})
					})

	element.text = card.append("text").
					attr("x",x).
					attr("y",y-5).
					text(text).
					style("font-size", 12)
					.call(wrap, 385)

	return element

}

//Arguments: The svg element to draw the bar on, x location, y location, text label, function to determine size of bar
//Output: void return, item added to input svg
function circleElement(card, x, y, r, text, sizefunc){
	element = {}
	element.bg = card.append("circle").
					attr("cx",x+r).
					attr("cy",y+r).
					attr("r", r).
					style("fill",function(d){
						return d.interesting ? "lightblue" : "lightcoral"	
					})
					.on("mouseover",function(d,i){
						var selectID = "#card" + d.pid+"_"+i
						d3.select(selectID).append("text").
							attr("x", x+25).
							attr("y",y+30).
							attr("class","barText").
							text(TextToValue(d,text)).
							style("font-size", 12).
							style("font-weight", "bold")
					})
					.on("mouseout",function(d,i){
						d3.selectAll(".barText").remove()
					})

	element.bar = card.append("circle").
					attr("cx",x+r).
					attr("cy",y+r).
					attr("r", sizefunc).
					style("fill",function(d){
							return d.interesting ? "royalblue" : "coral"
					})
					.on("mouseover",function(d,i){
						console.log("mouseover")
						var selectID = "#card" + d.pid+"_"+i
						d3.select(selectID).append("text").
							attr("x", x+25).
							attr("y", y+30).
							attr("class","barText").
							text(TextToValue(d,text)).
							style("font-size", 12).
							style("font-weight", "bold")
					})
					.on("mouseout",function(d,i){
						d3.selectAll(".barText").remove()
					})

	element.text = card.append("text").
					attr("x",x).
					attr("y",y-5).
					text(text).
					style("font-size", 12)
					.call(wrap, 385)

}

//Argument: a participant interaction json object
//Result: 	an array of interaction json objects regrouped by segment
function segmentify(json){
	var segmented_data = []
	var current_segment = []
	var segment_id = 0
	for (var item of json){
		if(item['segment'] == segment_id){
			current_segment.push(item)
		}else if(item['segment']!=null){
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
	var total_interactions = 0;

	//collect interesting data from logs, removes non-alphanumeric chars to avoid issues
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
				//ignore really long notes
				//if(interaction["Text"].legth <= 30){
					notes.push(interaction["Text"])
					total_interactions++
				//}
				break
			case "Highlight":
				//ignore really long highlights
				//if(interaction["Text"].length <=15){
					total_interactions++
					highlights.push(interaction["Text"].replace(/\W/g, ''))
				//}
				break
		}
	}

	//only unique
	searches2 = [...new Set(searches)]
	highlights2 = [...new Set(highlights)]

	//Find features	
	var bestFeatures = []
	var summaryText = "";

	//check for searches
	if(searches2.length !=0){
		summaryText += "The investigator searched for documents related to "
		for(var i =0; i<Math.min(3,searches2.length); i++){

			//last
			if(i!=0 && i==Math.min(3,searches2.length)-1)
				summaryText +="and "

			summaryText += searches2[i]

			//not first
			if(i!=Math.min(3,searches2.length)-1)
				summaryText +=", "
		}
		summaryText+=". \n"
	}

	//check for highlights
	if(highlights2.length !=0){
		if(highlights2.length == 1)
			summaryText += "The investigator thought the phrase "
		else
			summaryText += "The investigator thought the phrases "

		for(var i =0; i<Math.min(3,highlights2.length); i++){

			//not first and last
			if(i!=0 && i==Math.min(3,highlights2.length)-1)
				summaryText +="and "

			summaryText += "\"" + highlights2[i] + "\""

			//not last
			if(i!=Math.min(3,highlights2.length)-1)
				summaryText +=", "
		}
		
		if(highlights.length == 1)
			summaryText += " was notable."
		else
			summaryText += " were notable."
	}

	if(summaryText == "" && notes.length != 0 && notes[0].length < 30){
		summaryText += "The investigator made the following note: \'" + notes[0] + "\".";
	}

	if(summaryText == "" && drags.length != 0){
		summaryText += "The investigator rearranged some documents.";
	}


	if(summaryText == ""){
		summaryText = "Nothing interesting was found."
	}

	console.log(drags.length/total_interactions)
	var summary = {
		interesting : (total_interactions > 0) ? true:false,
		total_interactions: total_interactions,
		drags: drags,
		drag_ratio: (total_interactions > 0) ? drags.length/total_interactions : 0,
		searches: searches,
		search_ratio: (total_interactions > 0) ? searches.length/total_interactions : 0,
		notes: notes,
		note_ratio: (total_interactions > 0) ? notes.length/total_interactions :0,
		highlights: highlights,
		highlight_ratio: (total_interactions > 0) ? highlights.length/total_interactions:0,
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

function TextToValue(d, Text){
	switch(Text){
		case "Search":
			return d.searches.length
		case "Highlight": 
			return d.highlights.length
		case "Notes":
			return d.notes.length
		case "Drag":
			return d.drags.length
		case "Total":
			return d.total_interactions
	}
}

function GetSegment(sid, pid, dataset){
	for(var seg of segments){
		if(seg.sid == sid && seg.pid==pid && seg.dataset==dataset){
			return seg
		}
	}
}

function colorAll(classname){

}