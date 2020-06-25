var userCounts = [8, 8, 8]
var docs;
var logs;
var segments;
var data = []
var tooltip

var DS = 3
var P = 5
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
	//unwrap json
	logs = json[0].interactionLogs
	segments = json[0].segments

	//Get P1 interactions
	var participantData = logs[DS-1][P-1] 
	console.log(participantData)

	//Get P1 segments
	var participantSegments = GetSegments(DS,P)
	console.log(participantSegments)

	//Regroup by segment
	var participantData = segmentify(participantData)
	console.log(participantData)

	//Summarize segments, get some more stats
	var total_interactions = 0;
	for (var i = 0; i<participantData.length; i++){
		var summary = summarize_segment(participantData[i])
		summary.pid = P;
		summary.dataset = DS
		summary.number = i
		if(summary.interesting)
			total_interactions += summary.total_interactions;
		data.push(summary)
	}

	//Stats
	for(var seg of data){
		seg.interaction_rate = Math.max(0,(seg.total_interactions / total_interactions));
	}

	//Timeline info needs last segment end
	var endTime = participantSegments[participantSegments.length-1].end
	console.log(endTime)

	//add separate tooltip div
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
						.attr("transform", function(d){
							return "scale(1.0)"
						})
           	
				})
				.on("mouseout",function(d, i){
					var selectID = "#card" + d.pid+"_"+i
					d3.select(selectID)
						.style("fill-opacity", "0.7")
						.style("stroke-opacity", "0.7")

				})

	//background rect
	card.bg = card.append("rect").
				attr("x",5).
				attr("y",5).
				attr("rx", 5).
				attr("height",200).
				attr("width",400).
				style("fill","white").
				style("stroke", "navy").
				style("stroke-width", 3)

	//timeline stuff
	card.timeLineBG = card.append("path").
				attr("d",function(d,i){
					var start = 125
					return d3.line()([[start, 20],[400,20]])
				}).
				attr("stroke","lightblue").
				attr("stroke-width", 15).
				attr('pointer-events', 'visibleStroke')

	card.timeLineBox = card.append("path").
				attr("d",function(d,i){
					var seg = GetSegment(d.number, d.pid, d.dataset)
					var scale = d3.scaleLinear().domain([0,endTime]).range([0,400-125])
					var start = 125

				return d3.line()([[start+scale(seg.start), 20],[start+scale(seg.end),20]])
				}).
				attr("stroke","royalblue").
				attr("stroke-width", 20).
				attr('pointer-events', 'visibleStroke')

	card.timeLineHitbox = card.append("path").
				attr("d",function(d,i){
					var start = 125
					return d3.line()([[start, 20],[400,20]])
				}).
				attr("stroke","darkSeaGreen").
				attr("stroke-width", 20).
				attr("stroke-opacity",0).
				attr('pointer-events', 'visibleStroke').
				on("mouseover",function(d,i){
					var seg = GetSegment(d.number, d.pid, d.dataset)
					tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 1.0);	

					tooltip.html(TimeToolTip(seg))	
                			.style("left", (d3.event.pageX) + "px")		
                			.style("top", (d3.event.pageY - 28) + "px");
				}).on("mouseout",function(d,i){
					tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 0.0);	
				})

	//segment label
	card.label = card.append("text").
				attr("x",15).
				attr("y",25).
				style("font-weight", "bold").
				style("text-decoration", "underline").
				text(function(d){
					var segment =  GetSegment(d.number, d.pid, d.dataset)
					return "Segment #" + (d.number+1)// + " [" + segment.start + ", " + segment.end + "] (" + segment.length + ")"
				})

	//all the text
	card.text = []

	//search info
	card.text.push(
			card.append("text").
				attr("x",15).
				attr("y",60).
				attr("id", "searchText").
				html(function(d,i){
					var keys =Object.keys(d.searches)
					if(keys.length==0)
						return
					var text = "The user searched for "
					for(var i=0; i<(Math.min(3,keys.length)); i++){
            if(i==(Math.min(3,keys.length)-1) && keys.length!=1)
              text += "and "

						text += "<tspan style=\"font-weight:bold\">"+keys[i]+"</tspan>"

						if(i!=(Math.min(3,keys.length)-1))
							text+=", "


					}
					d.displayedInfo++
          text += "."
					return text
				})
		)

	//Highlight info
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

					var slicedText = keys[0].slice(0,25)
					var text = "<tspan style=\"font-weight:bold;text-decoration:underline;fill:royalblue\">" + "\""+ slicedText + ((keys[0].length == slicedText.length)?"":"...") + "\""+"</tspan>"
					text += " was highlighted."

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

	//Note info
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
					text += "<tspan style=\"font-weight:bold;text-decoration:underline;fill:royalblue\">" + "\""+ slicedText + ((keys[0].length == slicedText.length)?"":"...") +"\""+ "</tspan>"

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

	//open info
	card.text.push(
			card.append("text").
				attr("x",15).
				attr("y",function(d,i){
					return 60+20*d.displayedInfo
				}).
				attr("id", "openText").
				html(function(d,i){
					var keys =Object.keys(d.opens)
					if(keys==0)
						return

					var text = keys.length + " document" + ((keys.length==1)?" was":"s were") + " opened."
					d.displayedInfo++
					return text
				})
		)


	//interaction bars
	card.search = barElement(card, 15, 175, "Searches", "🔎", function(d){
		return 25*(1.0 - d.search_ratio)
	})

	card.highlight = barElement(card, 50, 175, "Highlights", "📑", function(d){
		return 25*(1.0 - d.highlight_ratio)
	})

	card.notes = barElement(card, 85, 175, "Notes", "✏", function(d){
		return 25*(1.0 - d.note_ratio)
	})

	card.open = barElement(card, 120, 175, "Documents Opened", "📖", function(d){
		return 25*(1.0 - d.open_ratio)
	})

	card.total = barElement(card, 155, 175, "Total", "Total", function(d){
		return 25*(1.0 - d.interaction_rate)
	})

	

	console.log(card)

})


//Arguments: The svg element to draw the bar on, x location, y location, text label, function to determine size of bar
//Output: void return, item added to input svg
function barElement(card, x, y, text, symbol, sizefunc){
	element = {}

	selectBar = "indianred"
	selectBG = "lightpink"
	unselectBar = "royalblue"
	unselectBG = "lightblue"

	element.bar = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", 25).
					attr("width",25).
					attr("class", "barBar"+text.replace(/\s+/g, '')).
					style("fill", unselectBar)

	element.bg = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", sizefunc).
					attr("width",25).
					attr("class", "barBG"+text.replace(/\s+/g, '')).
					style("fill", unselectBG)
	
  element.text = card.append("text").
            attr("x",x).
            attr("y",y-5).
            style("user-select","none").
            html(symbol).
            style("font-size", function(){return (text=="Total"?12:18)})
            .call(wrap, 385)

	//invisible box over bar and lable, to handle interactions for both rects of the bar
	element.selectionArea = card.append("rect").
					attr("x",x).
					attr("y",y-25).
					attr("height", 25+25).
					attr("width",25).
					attr("class", "selectionArea"+text.replace(/\s+/g, '')).
					style("opacity", 0)
					.on("mouseover",function(d,i){
						var selectID = "#card" + d.pid+"_"+i

            d3.select(selectID).select(".barBar"+text.replace(/\s+/g, '')).
             style("fill", selectBar).
             style("fill-opacity", "1.0")

            d3.select(selectID).selectAll(".barBG"+text.replace(/\s+/g, '')).
             style("fill", selectBG).
             style("fill-opacity", "1.0")

						tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 1.0);	

                		tooltip.html(BarToolTipText(d,text))	
                			.style("left", (d3.event.pageX) + "px")		
                			.style("top", (d3.event.pageY - 28) + "px");		
					})
					.on("mouseout",function(d,i){
						var selectID = "#card" + d.pid+"_"+i

            d3.select(selectID).selectAll(".barBar"+text.replace(/\s+/g, '')).
             style("fill", unselectBar).
             style("fill-opacity", null)

            d3.select(selectID).selectAll(".barBG"+text.replace(/\s+/g, '')).
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
function segmentify(interactions){
	var segmented_data = []
	var current_segment = []
	var segment_id = 0

	//collect all interactions with same segment
	for (var item of interactions){
		if(item['segment'] == segment_id){
			current_segment.push(item)
		}else if(item['segment']!=null){
			segmented_data.push(current_segment)
			current_segment = [];
			segment_id++;
		}	
	}
	//push whatever was in the last segment
	segmented_data.push(current_segment)
	return segmented_data
}


//Argument: a segment from the array returned by segmentify
//Returns:  a json object
function summarize_segment(segment){

	var opens = []; //opening
	var searches = []; //Search
	var notes = [] //Add note
	var highlights = [] //Highlight
	var total_interactions = 0;

	//collect interesting data from logs, removes non-alphanumeric chars to avoid issues
	for(var interaction of segment){
		switch(interaction['InteractionType']){
			case "Doc_open":
				opens.push(interaction["Text"])
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

	var summary = {
		interesting : (total_interactions > 0) ? true:false,
		total_interactions: total_interactions,

		opens: ListToCounts(opens),
		open_ratio: (total_interactions > 0) ? opens.length/total_interactions : 0,

		searches: ListToCounts(searches),
		search_ratio: (total_interactions > 0) ? searches.length/total_interactions : 0,

		notes: ListToCounts(notes),
		note_ratio: (total_interactions > 0) ? notes.length/total_interactions :0,

		highlights: ListToCounts(highlights),
		highlight_ratio: (total_interactions > 0) ? highlights.length/total_interactions:0,

		displayedInfo: 0
	}
	return summary;
}

//get html for action bar tooltips
function BarToolTipText(d, type){
  var title = "<b>"+type+" (" + TextToValue(d,type) + ")"
  var text = ""
  var data
  switch(type){
    case "Searches":
      data = d.searches     
      break
    case "Highlights":
      data = d.highlights 
      break
    case "Notes":
      data = d.notes
      break
    case "Documents Opened":
      data = d.opens  
      break
    case "Total":
      return title
  }
  title+= ":</b> <br>"
  var keys = Object.keys(data)
  for(var i=0; i<keys.length;i++){
    text += "#"+(i+1)+": " + keys[i] + ((data[keys[i]]==1?"":" (x" + data[keys[i]]+")"))+"<br>"
  }

  if(text=="")
    text="None"

  return title + "<br>" + text;
}

//gets html for textual summary tooltip
function SummaryToolTip(text, type){
  var title = "<b>"+type+"</b> <br>"
  var text = text

  return title + "<br>" + text;
}

//get html for timeline tooltip
function TimeToolTip(segment){
  var text = "<b>Segment Time Information</b> <br>"
  text += "Start: " + IntToTime(segment.start) + "<br>"
  text += "End: " + IntToTime(segment.end) + "<br>"
  text += "Duration: " + IntToTime(segment.length) + "<br>"
  return text 
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
		case "Searches":
			data = d.searches
			break;
		case "Highlights": 
			data =  d.highlights
			break;
		case "Notes":
			data =  d.notes
			break;
		case "Documents Opened":
			data =  d.opens
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

//returns all segments belonging to a participant
function GetSegments(dataset,pid){
	var segments2 = []
	for(var seg of segments){
		if(seg.pid==pid && seg.dataset==dataset){
			segments2.push(seg)
		}
	}
	return segments2
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

//Given an int representing seconds, gives a mm:ss string back
function IntToTime(int){
	var min = Math.floor(int/60)
	var sec = int%60

	if(sec.toString().length==1)
		sec = "0"+sec.toString()

	return min+":"+sec
}