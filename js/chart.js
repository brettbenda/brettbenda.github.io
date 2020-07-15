var userCounts = [8, 8, 8]
var docs;
var logs;
var segments;
var participantData
var participantSegments
var participantData
var data = []
var tooltip
var card
var cardWidth = 510
var cardHeight = 290

var colors = {
  "Doc_open":"crimson",
  "Documents Opened":"crimson",
  "Search":"#009420",
  "Searches":"#009420",
  "Add note":"#4278f5",
  "Notes":"#4278f5",
  "Highlight":"#ab8300",
  "Highlights":"#ab8300",
  "Reading":"pink",
  "barBG": "lightgrey"
}




var DS = 1
var P = 1
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

	processData();


	var startTime = 0;
	var endTime = participantSegments[participantSegments.length-1].end
	console.log(endTime)
	drawCards(startTime, endTime)

	//add separate tooltip div
	tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0)

	

})

function processData(){
	summary = []
	data=[]
	//Get P1 interactions
	participantData = logs[DS-1][P-1] 

	//Get P1 segments
	participantSegments = GetSegments(DS,P)

	//Regroup by segment
	participantData = segmentify(participantSegments, participantData)

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

	var totalSummary = GetAllCounts(data);
  	console.log(totalSummary)
	//Stats
	for(var seg of data){
		seg.interaction_rate = Math.max(0,(seg.total_interactions / total_interactions));
	}

	console.log(data)
}

function drawCards(startTime, endTime){
	//draw cards
	d3.selectAll("#chartArea").remove()
	d3.select("#chart").append("div").attr("id","chartArea")

	console.log(data)

	card = d3.select("#chartArea").
				selectAll("card").
				data(data).
				enter().
				append("svg").
				attr("height", cardHeight).
				attr("width", cardWidth).
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
						//.attr("transform","scale(1.5)")

           	
				})
				.on("mouseout",function(d, i){
					var selectID = "#card" + d.pid+"_"+i
					d3.select(selectID)
						.style("fill-opacity", "0.7")
						.style("stroke-opacity", "0.7")
            //.attr("transform","")

				})

	//background rect
	card.bg = card.append("rect").
				attr("x",5).
				attr("y",5).
				attr("rx", 5).
				attr("height", cardHeight-10).
				attr("width",cardWidth-10).
				style("fill","white").
				style("stroke", "navy").
				style("stroke-width", 3)

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

  card.text = cardText(card)

  card.timeline = timelineElement(card, startTime, endTime);

  card.segmentTimeline = segmentTimelineElement(card);

	//interaction bars
	card.search = barElement(card, 15, 250, "Searches", "🔎", function(d){ return 25*(1.0 - d.local_search_ratio) })

	card.highlight = barElement(card, 50, 250, "Highlights", "📑", function(d){ return 25*(1.0 - d.local_highlight_ratio) })

	card.notes = barElement(card, 85, 250, "Notes", "✏", function(d){ return 25*(1.0 - d.local_note_ratio) })

	card.open = barElement(card, 120, 250, "Documents Opened", "📖", function(d){ return 25*(1.0 - d.local_open_ratio) })

	card.total = barElement(card, 155, 250, "Total", "Total", function(d){ return 25*(1.0 - d.interaction_rate) })

  card.divider = card.append("line")
  					.attr("x1",10)
	      			.attr("y1",100)
	      			.attr("x2",cardWidth-10)
	      			.attr("y2",100)
	      			.attr("stroke-width",1)
	      			.attr("stroke","grey")

	      			card.divider2 = card.append("line")
  					.attr("x1",10)
	      			.attr("y1",33)
	      			.attr("x2",cardWidth-10)
	      			.attr("y2",33)
	      			.attr("stroke-width",1)
	      			.attr("stroke","grey")
	
  card.selectionBox = card.append("line")
      .attr("x1",10)
      .attr("y1",20)
      .attr("x2",30)
      .attr("y2",20)
      .attr("stroke-width",3)
      .attr("stroke","darkblue")
      .style("stroke-opacity","0.0")
      .attr("class", function(d,i){
         return "selection" + d.pid + "_" +d.number
      })

	card.button3 = textButton(card, 10,40, "⬅", "royalblue", function(d,i){
	   	   		if(i==0)
	   	   			return
	   			var seg = GetSegment(d.number, d.pid, d.dataset)
	   			var seg2 = GetSegment(d.number-1, d.pid, d.dataset)

	            var scale = d3.scaleLinear().domain([10,cardWidth-10]).range([seg.start,seg.end])
	            var select = d3.select(".selection" + d.pid + "_" +d.number)


	            console.log(segments)

	            segments.splice(segments.indexOf(GetSegment(i, P,DS)),1)
	            segments.splice(segments.indexOf(GetSegment(i-1, P,DS)),1)

	            console.log("middle("+ scale(select.attr("x1"))+","+scale(select.attr("x2"))+")")
	            var newSeg = {
	            	start:seg2.start,
	            	end: seg.end,
	            	length: seg.end-seg2.start,
	            	dataset: DS,
	            	pid:P
	            }
	            segments.push(newSeg)
	            
				
				segments.sort(function(a,b){return a.dataset-b.dataset || a.pid-b.pid || a.start-b.start})
				for(var j=0; j<segments.length;j++)
					segments[j].sid=j
				console.log(segments)

				Promise.all([processData()]).then(function(){
					var startTime = 0;
					var endTime = participantSegments[participantSegments.length-1].end
					console.log(endTime)
					drawCards(startTime, endTime)
				})

	            console.log(IntToTime(scale(select.attr("x1"))))
	            console.log(IntToTime(scale(select.attr("x2"))))
	   		})
    card.button = textButton(card, 190,70, "Create from Selection", "lightblue", function(d,i){
   			var seg = GetSegment(d.number, d.pid, d.dataset)
            var scale = d3.scaleLinear().domain([10,cardWidth-10]).range([seg.start,seg.end])
            var select = d3.select(".selection" + d.pid + "_" +d.number)


            console.log(segments)

            segments.splice(segments.indexOf(GetSegment(i, P,DS)),1)

            
            console.log("left("+ seg.start+","+scale(select.attr("x1"))+")")
            var newSeg = {
            	start: seg.start,
            	end: Math.floor(scale(select.attr("x1"))),
            	length: Math.floor(scale(select.attr("x1")))-seg.start,
            	dataset: DS,	
            	pid:P
            }
            segments.push(newSeg)

            console.log("middle("+ scale(select.attr("x1"))+","+scale(select.attr("x2"))+")")
            var newSeg = {
            	start: Math.floor(scale(select.attr("x1"))),
            	end: Math.floor(scale(select.attr("x2"))),
            	length: Math.floor(scale(select.attr("x2")))-Math.floor(scale(select.attr("x1"))),
            	dataset: DS,
            	pid:P
            }
            segments.push(newSeg)
            
            console.log("right("+ scale(select.attr("x2"))+","+seg.end+")")
            var newSeg = {
            	start: Math.floor(scale(select.attr("x2"))),
            	end: seg.end,
            	length: seg.end-Math.floor(scale(select.attr("x2"))),
            	dataset: DS,
            	pid:P
            }
            segments.push(newSeg)
			
			segments.sort(function(a,b){return a.dataset-b.dataset || a.pid-b.pid || a.start-b.start})
			for(var j=0; j<segments.length;j++)
				segments[j].sid=j
			console.log(segments)

			Promise.all([processData()]).then(function(){
				var startTime = 0;
				var endTime = participantSegments[participantSegments.length-1].end
				console.log(endTime)
				drawCards(startTime, endTime)
			})
            
            console.log(IntToTime(scale(select.attr("x1"))))
            console.log(IntToTime(scale(select.attr("x2"))))
   		})

    card.button2 = textButton(card, 475,40, "➡", "royalblue", function(d,i){
   	   		console.log(participantSegments.length-1)
   	   		if(i==participantSegments.length-1)
   	   			return
   			var seg = GetSegment(d.number, d.pid, d.dataset)
   			var seg2 = GetSegment(d.number+1, d.pid, d.dataset)

            var scale = d3.scaleLinear().domain([10,cardWidth-10]).range([seg.start,seg.end])
            var select = d3.select(".selection" + d.pid + "_" +d.number)


            console.log(segments)

            segments.splice(segments.indexOf(GetSegment(i, P,DS)),1)
            segments.splice(segments.indexOf(GetSegment(i+1, P,DS)),1)

            console.log("middle("+ scale(select.attr("x1"))+","+scale(select.attr("x2"))+")")
            var newSeg = {
            	start:seg.start,
            	end: seg2.end,
            	length: seg2.end-seg.start,
            	dataset: DS,
            	pid:P
            }
            segments.push(newSeg)
            
			
			segments.sort(function(a,b){return a.dataset-b.dataset || a.pid-b.pid || a.start-b.start})
			for(var j=0; j<segments.length;j++)
				segments[j].sid=j
			console.log(segments)

			Promise.all([processData()]).then(function(){
				var startTime = 0;
				var endTime = participantSegments[participantSegments.length-1].end
				console.log(endTime)
				drawCards(startTime, endTime)
			})
   		})

   


}

function cardText(card){
  var element = {}
  var bulletStartY = 215
  element.descriptionText = card.append("text").
        attr("x",15).
        attr("y",function(d,i){
          return 120+20*d.displayedInfo
        }).
        attr("id", "descriptionText").
        html(function(d,i){
            if(d.descriptions.length == 0)
              return
          
          var text = ""
          for(var text2 of d.descriptions)
           text+= text2+"<br> "
          
          //d.displayedInfo++
          return text
        }).
        call(wrap,485)

        
  //open info
  element.searchText = card.append("text").
        attr("x",15).
        attr("y",function(d,i){
          return bulletStartY-20*d.displayedInfo
        }).
        attr("id", "openText").
        html(function(d,i){
          var keys =Object.keys(d.opens)
          if(keys==0)
            if(d.displayedInfo==0){
            	d.displayedInfo++
              return "• No documents were explored."
            }
            else
              return 

          var text = "• The user explored "+ keys.length + " document" + ((keys.length==1)?"":"s") + "."
          d.displayedInfo++
          return text
        })

  //Note info
  element.noteText = card.append("text").
        attr("x",15).
        attr("y",function(d,i){
          return bulletStartY-20*d.displayedInfo
        }).
        attr("id", "noteText").
        html(function(d,i){
          var keys =Object.keys(d.notes)
          if(keys.length==0)
            return

          var text = "• The user noted "
          var slicedText = keys[0].slice(0,35)
          text += "<tspan style=\"font-weight:bold;fill:chocolate\">" + "\""+ slicedText + ((keys[0].length == slicedText.length)?"":"...") +"\""+ "</tspan>."

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



    //Highlight info
  element.highlightText = card.append("text").
        attr("x",15).
        attr("y",function(d,i){
          return bulletStartY-20*d.displayedInfo
        }).
        attr("id", "highlightText").
        html(function(d,i){
          var keys =Object.keys(d.highlights)
          if(keys.length==0)
            return

          var slicedText = keys[0].slice(0,35)
          var text = "• The user highlighted " + "<tspan style=\"font-weight:bold;fill:chocolate\">" + "\""+ slicedText + ((keys[0].length == slicedText.length)?"":"...") + "\""+"</tspan>."

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

            //search info
  element.searchText = card.append("text").
        attr("x",15).
        attr("y",function(d,i){
          return bulletStartY-20*d.displayedInfo
        }).
        attr("id", "searchText").
        html(function(d,i){
          var keys =Object.keys(d.searches)
          if(keys.length==0)
            return
          var text = "• The user searched for "
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
  
  return element
}


//Arguments: The svg element to draw the bar on, x location, y location, text label, function to determine size of bar
//Output: void return, item added to input svg
function barElement(card, x, y, text, symbol, sizefunc){
	element = {}
	unselectBar = "royalblue"
	unselectBG = "lightblue"

	element.bar = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", 25).
					attr("width",25).
					attr("class", "barBar"+text.replace(/\s+/g, '')).
					style("fill", colors[text])

	element.bg = card.append("rect").
					attr("x",x).
					attr("y",y).
					attr("height", sizefunc).
					attr("width",25).
					attr("class", "barBG"+text.replace(/\s+/g, '')).
					style("fill", colors["barBG"])
	
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
             style("fill", colors[text]).
             style("fill-opacity", "0.7")

            d3.select(selectID).selectAll(".barBG"+text.replace(/\s+/g, '')).
             style("fill", colors["barBG"]).
             style("fill-opacity", "0.7")

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
             style("fill", colors[text]).
             style("fill-opacity", null)

            d3.select(selectID).selectAll(".barBG"+text.replace(/\s+/g, '')).
             style("fill", colors["barBG"]).
             style("fill-opacity", null)


						tooltip.transition()		
                			.duration(100)		
                			.style("opacity", 0);
					}).on("mousemove",function(){
            tooltip.style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY - 28) + "px");
          })


	return element

}

function textButton(card, x, y, text, color, func){
	var element = {}
	element.button = card.append("rect")
   		.attr("x",x)
   		.attr("y",y)
   		.attr("width",function(){return (text=="Create from Selection")?120:25})
   		.attr("height",25)
   		.attr("fill",color)

   	element.text = card.append("text").
            attr("x",x+2).
            attr("y",y+18).
            style("user-select","none").
            text(text).
            style("font-size", function(){return (text=="Create from Selection")?12:16})
            .call(wrap, 385)

   	element.buttonHB = card.append("rect")
   		.attr("x",x)
   		.attr("y",y)
   		.attr("width",function(){return (text=="Create from Selection")?120:25})
   		.attr("height",25)
   		.attr("opacity",0)
   		.on("mousedown", func)
}

//draws the timeline element on the card
function timelineElement(card, startTime, endTime){
  //timeline stuff
    var element = {}
    var start = 125
    element.sWidth = 10;
    element.clickX1 = -1;
    element.clickX2 = -1;
    var scale = d3.scaleLinear().domain([startTime,endTime]).range([0,cardWidth-10-start])
    var scale2 = d3.scaleLinear().domain([start,cardWidth-10]).range([startTime,endTime])
    var start = 125
    element.timeLineBG = card.append("path").
          attr("d",function(d,i){
            var start = 125
            return d3.line()([[start, 20],[cardWidth-10,20]])
          }).
          attr("stroke","lightblue").
          attr("stroke-width", 15).
          attr('pointer-events', 'visibleStroke')

    element.timeLineBox = card.append("path").
          attr("d",function(d,i){
            var seg = GetSegment(d.number, d.pid, d.dataset)
            console.log(startTime)
            return d3.line()([[start+scale(seg.start), 20],[start+scale(seg.end),20]])
          }).

          attr("stroke","royalblue").
          attr("stroke-width", 20).
          attr('pointer-events', 'visibleStroke')

    element.timeLineHitbox = card.append("path").
          attr("d",function(d,i){
            
            return d3.line()([[start, 20],[cardWidth-10,20]])
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
          }).on("mousemove",function(d,i){
            tooltip.style("left", (d3.event.pageX) + "px")   
                    .style("top", (d3.event.pageY - 28) + "px");

          })

    return element;
} 


//adds a segment timeline to each card with all interactions presented.
function segmentTimelineElement(card){ 
  var element = {}
  element.sWidth = 10;
  element.clickX1 = -1;
  element.clickX2 = -1;

  element.segmentSelectionBG = card.append("path").
                              attr("d", d3.line()([[40,60],[cardWidth-40,60]])).
                              attr("stroke","lightgrey").
                              attr("stroke-width", 10)
                              .on("mousemove",function(d,i){
                                  tooltip.style("left", (d3.event.pageX) + "px")   
                                          .style("top", (d3.event.pageY - 28) + "px");

                                  var select = d3.select(".selection" + d.pid + "_" +d.number)      
                                  //snap to mouse when selection and area
                                  select.attr("x2", function(d,i){
                                    if(element.clickX1 != -1 && element.clickX2==-1){
                                      return (event.offsetX+20)
                                    }else
                                      return select.attr("x2")
                                  })

                                }).on("mousedown",function(d,i){
                                  var seg = GetSegment(d.number, d.pid, d.dataset)
                                  var scale = d3.scaleLinear().domain([40,cardWidth-40]).range([seg.start,seg.end])
                                  var select = d3.select(".selection" + d.pid + "_" +d.number)
                                  //log first click loc
                                  if(element.clickX1 == -1){

                                    element.clickX1 = event.offsetX+20
                                    select
                                      .attr("x1", element.clickX1 )
                                      .attr("x2",element.clickX1)
                                      .attr("y1",45)
                                      .attr("y2",45)
                                      .style("stroke-opacity", "0.5")
                                      .style("stroke-width", 15)
                                      .style("stroke", "black")

                                    console.log(event.offsetX-10)
                                  }
                                  //handle second click
                                  else if(element.clickX2 == -1){ 
                                    element.clickX2 = event.offsetX+20
                                    select
                                      .attr("x2",element.clickX2)
                                      //.style("stroke-opacity", "1.0")

                                    console.log(event.offsetX-10)


                                    //swap if x1 < x2
                                    if(select.attr("x1")>select.attr("x2")){
                                      var temp = select.attr("x2")
                                      select.attr("x2",select.attr("x1"))
                                      select.attr("x1",temp)
                                    }
                                    //log selected times
                                    console.log(IntToTime(scale(select.attr("x1"))))
                                    console.log(IntToTime(scale(select.attr("x2"))))

                                    //reset
                                    element.clickX1=-1
                                    element.clickX2=-1
                                  }
                                })

  element.segmentTimelineBG = card.append("path").
                              attr("d", d3.line()([[40,45],[cardWidth-40,45]])).
                              attr("stroke","black").
                              attr("stroke-width", 3)

  element.segmentTimelineBG = card.append("g").
                              html(function(d,i){
                                var html = ""
                                var seg = GetSegment(d.number, d.pid, d.dataset)
                                var scale = d3.scaleLinear().domain([seg.start,seg.end]).range([40,cardWidth-40])

                                //first draw reading
                                for(var j=0; j<d.all_interactions.length;j++){
                                  var int = d.all_interactions[j]
                                  //only do for reading
                                  if(int.InteractionType!="Reading")
                                    continue

                                  var color, x1,x2,y1,y2,stroke
                                  color = colors["Reading"]
                                  x1 = scale(int.time/10)
                                  x2 = Math.min(cardWidth-40,scale((int.time+int.duration)/10)-1)
                                  y1 = 45
                                  y2 = 45
                                  stroke = 15                

                                  var arg = "\""+d.number+"\",\""+j+"\""

                                  html += "<line x1="+x1+" y1="+y1+" x2="+x2+" y2="+y2+ " style=\"opacity:0.9; stroke:"+color+";stroke-width:"+stroke+"\" onmouseover=segTimelineOver("+arg+") onmouseout=\"segTimelineOut()\" onmousemove=\"segTimelineMove()\" pointer-events:visibleStroke></line>"
                                }

                                //then draw interactions
                                for(var j=0; j<d.all_interactions.length;j++){
                                  var int = d.all_interactions[j]  
                                  if(int.InteractionType=="Reading")
                                    continue
                                  var color, x1,x2,y1,y2,stroke
                                
                                  //colors
                                  color = colors[int.InteractionType]
                                  //positioning
                                  switch(int.InteractionType){
                                      default:
                                        x1 = scale(int.time/10)
                                        x2 = scale(int.time/10)
                                        y1 = 45-7.5
                                        y2 = 45+7.5
                                        stroke = int.InteractionType=="Doc_open"?2:4
                                  }                    

                                  var arg = "\""+d.number+"\",\""+j+"\""

                                  html += "<line x1="+x1+" y1="+y1+" x2="+x2+" y2="+y2+ " style=\"stroke:"+color+";stroke-width:"+stroke+"\" onmouseover=segTimelineOver("+arg+") onmouseout=\"segTimelineOut()\" onmousemove=\"segTimelineMove()\" pointer-events:visibleStroke></line>"
                                }
                                return html
                              })

  return element
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
	console.log(segment)
  var text ="<p class=\"tooltipP\"><b>"+IntToTime(segment.start) + "-" + IntToTime(segment.end)+"</b> ("+IntToTime(segment.length)+")</p>"
  return text 
}

function segTimelineOver(sid, number){
  var int = GetInteraction(sid,number)
  var type = (int.InteractionType=="Doc_open")?"Document Opened":int.InteractionType
  var time = IntToTime(int.time/10)

  var text
  switch(int.InteractionType){
    case "Doc_open":
    text = "Opened <b>" + int.Text +"</b>"
    break
    case "Search":
    text = "Searched for <b>" +int.Text +"</b>" 
    break;
    case "Add note":
    text = "Noted <b>\"" +int.Text+"\"</b>"
    break
    case "Highlight":
    text = "Highlighted <b>\"" +int.Text+"\"</b> on <b>" +int.ID+"</b>"
    break  
    case "Reading":
    text = "Reading <b>\"" +int.Text+"\"</b> for "+Math.floor(int.duration/10)+" seconds"
    break 
  }  


  var text2 = "<p class=\"tooltipP\"><b>"+time+"</b><br>"+text+"</p>"
  if(int.InteractionType=="Reading")
    text2 = "<p class=\"tooltipP\"><b>"+time+"-"+IntToTime((int.time+int.duration)/10)+"</b> ("+IntToTime(int.duration/10)+")<br>"+text+"</p>"

  tooltip.transition()    
  .duration(100)    
  .style("opacity", 1.0); 

  tooltip.html(text2)  
  .style("left", (event.pageX) + "px")   
  .style("top", (event.pageY - 28) + "px");
}

function segTimelineOut(){
  tooltip.transition()    
  .duration(100)    
  .style("opacity", 0); 
}

function segTimelineMove(){
  tooltip.style("left", (event.pageX) + "px")   
         .style("top", (event.pageY - 28) + "px");
}


//Argument: a participant interaction json object
//Result: 	an array of interaction json objects regrouped by segment
function segmentify(segments, interactions){
	var segmented_data = []
	var current_segment = []
	var segment_id = 0


  for(var seg of segments){
    segmented_data.push([])
  }
  for(var item of interactions){
  	for(var seg of segments){
  	  if(item.time < seg.end*10 && item.time>seg.start*10){
        segmented_data[seg.sid].push(item)
      }
  	}
  }
  
	//push whatever was in the last segment
	//segmented_data.push(current_segment)
	return segmented_data
}


//Argument: a segment from the array returned by segmentify
//Returns:  a json object
function summarize_segment(segment){

	var opens = []; //opening
	var searches = []; //Search
	var notes = [] //Add note
	var highlights = [] //Highlight
  var readings = [] //reading
  var all_interactions = []
	var total_interactions = 0;

	//collect interesting data from logs, removes non-alphanumeric chars to avoid issues
	for(var interaction of segment){
		switch(interaction['InteractionType']){
			case "Doc_open":
				opens.push(interaction["Text"])
        all_interactions.push(interaction)
				total_interactions++
				break
			case "Search":
				searches.push(interaction["Text"])
        all_interactions.push(interaction)
				total_interactions++
				break;
			case "Add note":
				notes.push(interaction["Text"])
        all_interactions.push(interaction)
				total_interactions++
				break
			case "Highlight":
				total_interactions++
				highlights.push(interaction["Text"])
        all_interactions.push(interaction)
				break
      case "Reading":
        readings.push(interaction)
        break
		}
	}

  var readings_merged = []
  //merge small reading segments
  for(var i = 0; i<readings.length; i++){
    var int = readings[i]
    for(var j=i+1;j<readings.length;j++){

      if(readings[j].Text==int.Text){
        int.duration = (readings[j].time - int.time) + readings[j].duration
        i=j
      }
      if(readings[j].Text!=int.Text){
        if(int.duration>100){
          readings_merged.push(int)
          all_interactions.push(int)
        }
        break
      }
      
    }
  }

  all_interactions.sort(function(a,b){return a.time-b.time})
  var descriptions = []
  console.log("New Segment")
  for(var i=0; i<all_interactions.length; i++){

    //if many things were explored, we do not want to find pattern for all of them.
    if(searches.length >5 || opens.length > 15){
      descriptions.push("Ther users searched and explored many documents.")
      break;
    }else if(searches.length >3 || opens.length > 10){
      descriptions.push("The user searched and explored several documents.")
      break;
    }


   try{
    //single search action
    if(all_interactions.length==1)
      if(all_interactions[0].InteractionType=="Search")
        descriptions.push("The user searched for \"" + all_interactions[0].Text+"\".")

    if(all_interactions[i].InteractionType=="Search"){
      //Search->open->read pattern
      if(i+2 < all_interactions.length){
        if(all_interactions[i+1].InteractionType=="Doc_open"){
          if(all_interactions[i+2].InteractionType=="Reading"&&(all_interactions[i+1].Text==all_interactions[i+2].Text)){
            descriptions.push("The user searched for \"" + all_interactions[i].Text +"\" then read " + all_interactions[i+1].Text+".")
          }
        }
      }

      //Search->openmany->(maybe) read pattern
      var docCount = 0;
      var finalDoc = ""
      for(var j=i+1; j<all_interactions.length;j++){
        if(all_interactions[j].InteractionType=="Doc_open"){
          docCount++
        }
        else if(all_interactions[j].InteractionType=="Reading"){
          finalDoc=all_interactions[j].Text
          break
        }
        else
          break
      }

      if(docCount==1 && finalDoc=="")
        descriptions.push("The user searched for \"" + all_interactions[i].Text +"\" then opened " + all_interactions[i+1].Text+".")
      else if(docCount>1 && finalDoc =="")
        descriptions.push("The user searched for \"" + all_interactions[i].Text +"\" then opened " + docCount +" documents.")
      else if(docCount>1 && finalDoc !="")
        descriptions.push("The user searched for \"" + all_interactions[i].Text +"\" then opened " + docCount +" documents before reading " + finalDoc+".")

    }
  }catch{}
     
  }

  if(searches.length==0 && notes.length==0 && highlights.length==0 && (opens.length!=0 || readings_merged.length!=0))
    descriptions.push("The user focused on reading documents.")
  else if(notes.length!=0 || highlights.length!=0)
    descriptions.push("The user found important information during this time.")
  else if(opens.length > 0)
    descriptions.push("The user identified some documents of interest.")


  console.log(descriptions)

	var summary = {
		interesting : (total_interactions > 0) ? true:false,
		total_interactions: total_interactions,
    all_interactions: all_interactions,

		opens: ListToCounts(opens),
    opens_list: opens,
		local_open_ratio: (total_interactions > 0) ? opens.length/total_interactions : 0,

		searches: ListToCounts(searches),
    searches_list: searches,
		local_search_ratio: (total_interactions > 0) ? searches.length/total_interactions : 0,

		notes: ListToCounts(notes),
    notes_list: notes,
		local_note_ratio: (total_interactions > 0) ? notes.length/total_interactions :0,

		highlights: ListToCounts(highlights),
    highlights_list:highlights,
		local_highlight_ratio: (total_interactions > 0) ? highlights.length/total_interactions:0,

    readings:readings_merged,
    descriptions:descriptions,

		displayedInfo: 0
	}
	return summary;
   }



//Various helper stuff

function GetAllCounts(data){
  var search_count=0;
  var highlight_count=0;
  var note_count=0;
  var open_count=0;

  for(var seg of data){
    console.log(search_count)
    search_count+=seg.searches_list.length
    highlight_count+=seg.highlights_list.length
    note_count+=seg.notes_list.length
    open_count+=seg.opens_list.length
  }

  var summary ={
    search_count:search_count,
    highlight_count:highlight_count,
    note_count:note_count,
    open_count:open_count,
    total: (search_count+highlight_count+note_count+open_count)
  }

  return summary
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
	var sec = Math.floor(int%60)

	if(sec.toString().length==1)
		sec = "0"+sec.toString()

	return min+":"+sec
}

function GetInteraction(segmentID, interactionNum){
  for(var seg of data){
    if(seg.number==segmentID){
      return seg.all_interactions[interactionNum]
    }
  }
}