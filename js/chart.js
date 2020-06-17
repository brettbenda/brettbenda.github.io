var userCounts = [8, 8, 8]
var docs;
var logs;
var segments;
var data = []
var tooltip
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

	tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0)
	
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
				}).
				style("fill-opacity", "0.7").
				style("stroke-opacity", "0.7")
				.on("mouseover", function(d, i){
					var selectID = "#card" + d.pid+"_"+i
					d3.select(selectID)
						.style("fill-opacity", "1.0")
						.style("stroke-opacity", "1.0")
           	
				})
				.on("mouseout",function(d, i){
					var selectID = "#card" + d.pid+"_"+i
					d3.select(selectID)
						.style("fill-opacity", "0.7")
						.style("stroke-opacity", "0.7")

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
					// var seg = GetSegment(d.number, d.pid, d.dataset)
					// if(seg.length > 300)
					// 	return "forestgreen"
					// else if(seg.length >150)
					// 	return "gold"
					// else
					// return "darkred"
					return "chocolate"
				}).
				style("stroke-width", function(d){
					var seg = GetSegment(d.number, d.pid, d.dataset)
					if(seg.length > 300)
						return 5
					else if(seg.length >150)
						return 3
					else
					return 1
				})

	card.label = card.append("text").
				attr("x",15).
				attr("y",25).
				style("font-weight", "bold").
				style("text-decoration", "underline").
				text(function(d){
					var segment =  GetSegment(d.number, d.pid, d.dataset)
					return "Segment #" + (d.number+1) + " [" + segment.start + ", " + segment.end + "] (" + segment.length + ")"
				})

	//textual explanation		
	// card.text = card.append("text").
	// 			attr("x",15).
	// 			attr("y",60).
	// 			html(function(d){
	// 				var spantext = ""
	// 				var x = d3.select(this).attr("x");//get the x position of the text
 //        			var y = d3.select(this).attr("dy");//get the y position of the text
	// 				for(var i=0; i<d.summaryText.length; i++){
	// 					//add span for each item, 
	// 					spantext += "<tspan class=\"sentence\" x="+x+ " y = "+(3+1.5*i)+"em id=" +i+ ">" + d.summaryText[i] + "</tspan>"
	// 				}
	// 				return spantext
	// 			})

	// card.text.selectAll("tspan.sentence").call(wrap,385)

	card.text = []
	card.text.push(
			card.append("text").
				attr("x",15).
				attr("y",60).
				attr("id", "searchText").
				//style("font-weight","bold").
				html(function(d,i){
					var keys =Object.keys(d.searches)
					if(keys.length==0)
						return
					var text = "Search Terms: "
					for(var i=0; i<(Math.min(3,keys.length)); i++){
						text += "<tspan style=\"font-weight:bold\">"+keys[i]+"</tspan>"
						if(i!=(Math.min(3,keys.length)-1))
							text+=", "
					}
					d.displayedInfo++

					return text
				})
		)

	card.text.push(
			card.append("text").
				attr("x",15).
				attr("y",function(d,i){
					return 60+20*d.displayedInfo
				}).
				attr("id", "highlightText").
				html(function(d,i){
					var keys =Object.keys(d.highlights)
					if(keys.length==0)
						return

					var text = "Highlight: "
					var slicedText = keys[0].slice(0,25)
					text += "<tspan style=\"font-weight:bold\">" + slicedText + ((keys[0].length == slicedText.length)?"":"...") +"</tspan>"
					
					d.displayedInfo++

					return text
				}).on("mouseover",function(d,i){
					tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 1.0);	

					tooltip.html(SummaryToolTip(Object.keys(d.highlights)[0],"Full Highlight"))	
                			.style("left", (d3.event.pageX) + "px")		
                			.style("top", (d3.event.pageY - 28) + "px");
				}).on("mouseout",function(d,i){
					tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 0.0);	
				})
		)

	card.text.push(
			card.append("text").
				attr("x",15).
				attr("y",function(d,i){
					return 60+20*d.displayedInfo
				}).
				attr("id", "noteText").
				html(function(d,i){
					var keys =Object.keys(d.notes)
					if(keys.length==0)
						return

					var text = "Note: "
					var slicedText = keys[0].slice(0,25)
					text += "<tspan style=\"font-weight:bold\">" + slicedText + ((keys[0].length = slicedText.length)?"":"...") +"</tspan>"
					d.displayedInfo++
					return text
				}).on("mouseover",function(d,i){
					tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 1.0);	

					tooltip.html(SummaryToolTip(Object.keys(d.notes)[0],"Full Note"))	
                			.style("left", (d3.event.pageX) + "px")		
                			.style("top", (d3.event.pageY - 28) + "px");
				}).on("mouseout",function(d,i){
					tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 0.0);	
				})
		)

	card.text.push(
			card.append("text").
				attr("x",15).
				attr("y",function(d,i){
					return 60+20*d.displayedInfo
				}).
				attr("id", "dragText").
				html(function(d,i){
					var keys =Object.keys(d.drags)
					if(keys==0)
						return

					var text = "Several documents were moved."
					d.displayedInfo++
					return text
				})
		)

	console.log(card.text)
	card.search = barElement(card, 15, 150, "Search", function(d){
		return 50*(1.0 - d.search_ratio)
	})

	card.highlight = barElement(card, 75, 150, "Highlight", function(d){
		return 50*(1.0 - d.highlight_ratio)
	})

	card.notes = barElement(card, 135, 150, "Note", function(d){
		return 50*(1.0 - d.note_ratio)
	})

	card.drag = barElement(card, 195, 150, "Drag", function(d){
		return 50*(1.0 - d.drag_ratio)
	})

	card.total = barElement(card, 345, 150, "Total", function(d){
		return 50*(1.0 - d.interaction_rate)
	})

	

	console.log(card)

})


//Arguments: The svg element to draw the bar on, x location, y location, text label, function to determine size of bar
//Output: void return, item added to input svg
function barElement(card, x, y, text, sizefunc){
	element = {}

	selectBar = "indianred"
	selectBG = "lightpink"
	unselectBar = "royalblue"
	unselectBG = "lightblue"

	element.bar = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", 50).
					attr("width",50).
					attr("class", "barBar"+text).
					style("fill", unselectBar)

	element.bg = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", sizefunc).
					attr("width",50).
					attr("class", "barBG"+text).
					style("fill", unselectBG)
	
	element.text = card.append("text").
						attr("x",x).
						attr("y",y-5).
						text(text).
						style("font-size", 12)
						.call(wrap, 385)

	//invisible box over bar, to handle interactions for both rects of the bar
	element.selectionArea = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", 50).
					attr("width",50).
					attr("class", "selectionArea"+text).
					style("opacity", 0)
					.on("mouseover",function(d,i){
						var selectID = "#card" + d.pid+"_"+i

						//linked to other data!
						card.append("text").
							attr("x", x+25).
							attr("y",y+30).
							attr("class","barText").
							text(function(d,i){return TextToValue(d,text)}).
							style("font-size", 12).
							style("font-weight", "bold").
							style("fill-opacity", "1.0")

						card.selectAll(".barBar"+text).
							style("fill", selectBar).
							style("fill-opacity", "1.0")

						card.selectAll(".barBG"+text).
							style("fill", selectBG).
							style("fill-opacity", "1.0")

						tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 1.0);	

                		tooltip.html(TooltipText(d,text))	
                			.style("left", (d3.event.pageX) + "px")		
                			.style("top", (d3.event.pageY - 28) + "px");		
					})
					.on("mouseout",function(d,i){
						var selectID = "#card" + d.pid+"_"+i

						d3.selectAll(".barText").remove()

						card.selectAll(".barBar"+text).
							style("fill", unselectBar).
							style("fill-opacity", null)

						card.selectAll(".barBG"+text).
							style("fill", unselectBG).
							style("fill-opacity", null)

						tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 0);
					})


	return element

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
				searches.push(interaction["Text"])
				total_interactions++
				break;
			case "Add note":
				notes.push(interaction["Text"])
				total_interactions++
				break
			case "Highlight":
				total_interactions++
				highlights.push(interaction["Text"])
				break
		}
	}

	if(false){
		//only unique
		searches2 = [...new Set(searches)]
		highlights2 = [...new Set(highlights)]

		//Find features	
		var bestFeatures = []
		var summaryText = "";
		var sentences = [];

		//check for searches
		if(searches2.length !=0){
			summaryText += "Important searches: "
			for(var i =0; i<Math.min(3,searches2.length); i++){

				//last
				if(i!=0 && i==Math.min(3,searches2.length)-1)
					summaryText +="and "

				summaryText += searches2[i]

				//not first
				if(i!=Math.min(3,searches2.length)-1)
					summaryText +=", "
			}
			summaryText+="."
			sentences.push(summaryText)
		}	

		summaryText = ""
		if(sentences.length==0 && notes.length != 0){
			summaryText += "Note made: \'" + notes[0] + "\".";
			sentences.push(summaryText)
		}

		summaryText = ""
		//check for highlights
		if(highlights2.length !=0 && sentences.length==1 ){
			if(highlights2.length == 1)
				summaryText += "The phrase "
			else
				summaryText += "The phrases "

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
			sentences.push(summaryText)
		}



		summaryText = ""
		if(sentences.length==0 && drags.length != 0){
			summaryText += "Some documents were moved.";
			sentences.push(summaryText)
		}


		if(sentences.length==0){
			summaryText = "Nothing interesting was found."
			sentences.push(summaryText)
		}
	}
	
	var summary = {
		interesting : (total_interactions > 0) ? true:false,
		total_interactions: total_interactions,

		drags: ListToCounts(drags),
		drag_ratio: (total_interactions > 0) ? drags.length/total_interactions : 0,

		searches: ListToCounts(searches),
		search_ratio: (total_interactions > 0) ? searches.length/total_interactions : 0,

		notes: ListToCounts(notes),
		note_ratio: (total_interactions > 0) ? notes.length/total_interactions :0,

		highlights: ListToCounts(highlights),
		highlight_ratio: (total_interactions > 0) ? highlights.length/total_interactions:0,

		summaryText: sentences,
		displayedInfo: 0
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

//Magic function found on stackoverflow for wrapping text
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
            id = text.attr("id"),
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

//gets counts of interaction types in segment
function TextToValue(d, type){
	var data
	switch(type){
		case "Search":
			data = d.searches
			break;
		case "Highlight": 
			data =  d.highlights
			break;
		case "Note":
			data =  d.notes
			break;
		case "Drag":
			data =  d.drags
			break;
		case "Total":
			return d.total_interactions
			break;
	}

	var key = Object.keys(data)
	var sum = 0;
	for(var i=0; i<key.length;i++){
		sum+=data[key[i]]
	}
	return sum
}

//links segments and interactions
function GetSegment(sid, pid, dataset){
	for(var seg of segments){
		if(seg.sid == sid && seg.pid==pid && seg.dataset==dataset){
			return seg
		}
	}
}

function TooltipText(d, type){
	var title = "<b>"+type+" Actions (" + TextToValue(d,type) + "):</b> <br>"
	var text = ""
	var data
	switch(type){
		case "Search":
			data = d.searches			
			break
		case "Highlight":
			data = d.highlights	
			break
		case "Note":
			data = d.notes
			break
		case "Drag":
			data = d.drags	
			break
		case "Total":
			return title
	}

	var keys = Object.keys(data)
	for(var i=0; i<keys.length;i++){
		text += "#"+(i+1)+": " + keys[i] + " (" + data[keys[i]]+")<br>"
	}

	if(text=="")
		text="None"

	return title + "<br>" + text;
}

function SummaryToolTip(text, type){
	var title = "<b>"+type+"</b> <br>"
	var text = text

	return title + "<br>" + text;
}


//Given a list, convert to a dictionary of items and counts
function ListToCounts(list){
	var counts = {}
	
	for (var i = 0; i < list.length; i++) {
	  var num = list[i];
	  counts[num] = counts[num] ? counts[num] + 1 : 1;
	}
	return counts
}