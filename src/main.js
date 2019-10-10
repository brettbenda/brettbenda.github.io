;(function()
{
	//Chart area variables
	var margin = { top: 10, right: 10, bottom: 100, left: 50 };
	var width = window.innerWidth;
	var height = window.innerHeight;

	//Data-specific variables
	var dataXRange = { min: -10, max: 10 }; //Should make it auto-generated, not hard-coded
	var dataYRange = { min: -10, max: 10 }; //Should make it auto-generated, not hard-coded
	var xAxisLabelHeader = "X Location (meters)";
	var yAxisLabelHeader = "Y Location (meters)";
	var numPoints = 100; //number of points

	var h1, h2, h3, h4;
	//Filtering variables
	var everyOther = 500;

	//Drawing variables
	var circleRadius     = 6;
	var circleStartColor = "green";
	var circleEndColor   = "red";
	var lineWidth = 2;
	var ts = 50; //triangle size
	var triangleSize = [2,6,8,12];
	var triangleRange = [1.5, 3, 4.5, 6];

	//These are the values of the 'Paired' color map. Each pair are of
	//similar color to easily match different runs of the same subject
	var lineColors       = ["#a6cee3","#1f78b4",
							"#b2df8a","#33a02c",
							"#fdbf6f","#ff7f00",
							"#cab2d6","#6a3d9a",
							"#ffff99","#b15928"];
	var lineIds = [];
	var triIds  = [];
	

	//Used by the style-switching buttons to determine style for various line elements, more styles should just be added to the array
	var colorStyles = ["colorArray", "rainbow-time", "rainbow-height", "greyscale-time", "greyscale-height", "redscale-time", "redscale-height"]
	var colorStyle = colorStyles[0]
	var colorStyleIndex = 0
	var widthStyles = ["constant", "bigger-time", "bigger-height"]
	var widthStyle = widthStyles[0]
	var widthStyleIndex = 0
	var drawLinesReset = true;
	var drawTrisReset = true;

	//Global references
	var data = [];
	var mysql;
	var chart;
	var chartWidth;
	var chartHeight;

	var p1;

	init();

	// -------------------------------------------------------------------------------------
	// Main() ------------------------------------------------------------------------------
	// -------------------------------------------------------------------------------------

	function init()
	{
		chartWidth = width - margin.left - margin.right;
		chartHeight = height - margin.top - margin.bottom;

		//Use this to ensure processing after data is read
		Promise.all
			([
				d3.json("../data/JSON/Subject_1_Run_1.json"),
				d3.json("../data/JSON/Subject_1_Run_2.json"),
				d3.json("../data/JSON/Subject_2_Run_1.json"),
				d3.json("../data/JSON/Subject_2_Run_2.json"),
				d3.json("../data/JSON/Subject_3_Run_1.json"),
				d3.json("../data/JSON/Subject_3_Run_2.json"),
				d3.json("../data/JSON/Subject_4_Run_1.json"),
				d3.json("../data/JSON/Subject_4_Run_2.json"),
				d3.json("../data/JSON/Marker_Data.json")
			])
		.then(function(json)
			{
				var n = 25 // Resampling to n number of points

				var clean = [];
				//Resample all of the data (except the marker data)
				for (var i = 0; i < json.length-1; i++) 
				{
					//console.log("resampling");
					clean.push(Resample(json[i],n));
				}
				//Try to combine points (when dist <= 3.5)
				new_data = reducePaths(clean, 0.05);
				//console.log("done");


				var mean_path = [];
				// compute mean of paths, per each tick
				for (i =0 ; i < new_data[0].length ;i++)
				{
					var sum = {x:0, y:0, z:0};
					var point;
					for (var j = 0; j < new_data.length; j++) 
					{
						point = new_data[j];
						sum.x += point.x;
						sum.y += point.y;
						sum.z += point.z;
					}
					sum.x += sum.x / new_data.length;
					sum.y += sum.y / new_data.length;
					sum.z += sum.z / new_data.length;
					mean_path.push(sum);
				}

				initializeChart();
				createAxes();

				drawImage();

				var starting = [];
				var ending   = [];
				for (var i = 0; i < new_data.length; i++) 
				{
					starting.push(new_data[i][0]);
					ending.push(new_data[i][new_data.length-1]);

					lineIds.push("line"+i);
					triIds.push("tri"+i);

					drawLines(new_data[i],lineColors[i], "line"+i);
					drawTriangles(new_data[i],lineColors[i],"tri"+i);
				}
				drawDots(json[8], "red", "markers");
				// drawDots(starting, "green", "start");
				// drawDots(ending, "black", "end");

			})
		.catch(function(error)
			{
				console.warn(error);
			})
	}
	function removeAllNaNs(my_data)
	{
		for (var i = 0; i < my_data.length; i++) 
		{
			my_data[i] = removeNaNs(my_data[i]);
		}
		return my_data;
	}

	function removeNaNs(list)
	{
		var new_list = []
		for (var i = 0; i < list.length; i++) 
		{
			if(list[i].x != NaN && list[i].y != NaN && list[i].z != NaN)
			{
				new_list.push(list[i]);
			}
		}
		return new_list;
	}

	function PathLength(my_data)
	{
		var d = 0.0;
			for (var i = 1; i < my_data.length; i++){
			// console.log("Path length" + my_data[0])
			d += Distance(my_data[i-1], my_data[i]);
			}
		return d;
	}

	function DistanceXZ(p1, p2)
	{
		// console.log("Distance");
		// console.log(p1);
		// console.log(p2);
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function Distance(p1, p2)
	{
		// console.log("Distance");
		// console.log(p1);
		// console.log(p2);
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;
		var dz = p2.z - p1.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	// -------------------------------------------------------------------------------------
	// Data Resample -----------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function Resample(my_data, n)
	{
		// Instead of skipping data, we need to scale the data so that it is possible to compare
		// the created paths. The resampling is done  such that the path defined by their original
		// M points is defined by N equidistantly spaced points. This way we do not distort the
		// path while scaling the data

		// Source: $1 Unistroke Recognizer (Wobbrock et al. 2007)
		// http://depts.washington.edu/acelab/proj/dollar/index.html
		var I = PathLength(my_data) / (n - 1); // interval length
		var D = 0
		var newdata = [];

		for (var i = 1; i < my_data.length; i++)
		{
			var d = Distance(my_data[i-1],my_data[i]);

			if ((D + d).toFixed(3) >= I.toFixed(3))
			{
				//console.log(my_data[i-1].x)
				var qx = parseFloat(my_data[i-1].x) + ((I - D) / d) * (my_data[i].x - my_data[i-1].x);
				var qy = parseFloat(my_data[i-1].y) + ((I - D) / d) * (my_data[i].y - my_data[i-1].y);
				var qz = parseFloat(my_data[i-1].z) + ((I - D) / d) * (my_data[i].z - my_data[i-1].z);
				var tr = parseFloat(my_data[i-1].t) + ((I - D) / d) * (my_data[i].t - my_data[i-1].t);
				var yr = parseFloat(my_data[i-1].yaw)
				//console.log(data[i-1].yaw,data[i].yaw)

				// var q = {x:qx, y:0, z:qz};
				var q = {x:qx, y:qy, z:qz, yaw:yr, t:tr};
				//var special_q = {x:qx,y:qy,z:qz}
				// console.log(q);
				newdata.push(q); // append new point 'q'
				//console.log(newdata)
				my_data.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
				D = 0
				//console.log(q)
			}
			else
			{
				D = D+d;
			}
		}

		if (newdata.length == n - 1)
		{
			newdata[newdata.length] = {x:my_data[my_data.length - 1].x, 
									   y:my_data[my_data.length - 1].y, 
									   z:my_data[my_data.length - 1].z,
									   yaw:my_data[my_data.length - 1].yaw,
									   t:my_data[my_data.length - 1].t
									}; // somtimes we fall a rounding-error short of adding the last point, so add it if so
		}
		// console.log(newdata)
		return newdata;
	}

	function reducePoints(list)
	{
		var sum = {x:0,y:0,z:0};
		var cur;

		for (var i = 0; i < list.length; i++) 
		{
			cur = list[i];
			sum.x = sum.x + cur.x;
			sum.y = sum.y + cur.y;
			sum.z = sum.z + cur.z;
		}

		sum.x = sum.x / list.length;
		sum.y = sum.y / list.length;
		sum.z = sum.z / list.length;
		return sum;
	}

	// -------------------------------------------------------------------------------------
	// Path Reduction  ---------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function reducePaths(my_data, threshold)
	{
		var replacements = new Map();
		var replace_map  = new Map();
		var dist;

		for (var i = 0; i < my_data.length; i++) 
		{
			var cur_path = my_data[i];
			for (var j = 0; j < cur_path.length; j++) 
			{
				var cur_point = cur_path[j];
				var group     = [cur_point];
				for (var k = 0; k < my_data.length; k++) 
				{
					var other_path = my_data[k];
					for (var l = 0; l < other_path.length; l++) 
					{
						var other_point = other_path[l];
						dist = DistanceXZ(cur_point,other_point);

						if(dist <= threshold && (i != k && j != l))
						{
							group.push(other_point);
						}
					}
				}
				if(group.length > 1)
				{
					// console.log(group)
					var avg = reducePoints(group);
					if(!isNaN(avg.x) && !isNaN(avg.y) && !isNaN(avg.z))
					{
						//Update the point to value map for easy replacement in the data later.
						for (var l = 0; l < group.length; l++) 
						{
							if(DistanceXZ(group[l], avg) <= threshold/2)
							{
								//console.log(DistanceXZ(group[l], avg));
								if(replace_map.has(group[l]))
								{
									var current_point = replace_map.get(group[l]);
									if(DistanceXZ(group[l], current_point) > DistanceXZ(group[l], avg))
									{
										replace_map.set(group[l], avg);
									}
								}
								else
								{
									replace_map.set(group[l], avg);
								}
							}
						}
					}
				}
			}
		}

		//We have created a list of replacements for each tick now.
		// console.log(replace_map);
		//Post-processing to replace old values with the average values.
		for (var i = 0; i < my_data.length; i++) 
		{
			var path = my_data[i];
			for (var j = 0; j < path.length; j++) 
			{
				var point = path[j];
				if(replace_map.has(point))
				{
					var avg = replace_map.get(point);
					point.x = avg.x;
					point.y = avg.y;
					point.z = avg.z;
				}
			}
		}
		return my_data;
	}

	function find2d(item, list)
	{
		if(list == undefined || list == [])
		{
			return false;
		}

		for (var i = 0; i < list.length; i++) 
		{
			var sub = list[i];
			if(item in sub)
			{
				return true;
			}
		}
		return false;
	}

	// -------------------------------------------------------------------------------------
	// D3 Line Drawing  --------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function drawLines(my_data, color, label)
	{
		//console.log(my_data)
		// plot dots

		var lines = chart.plotArea.selectAll(label).data(my_data);
		var len   = my_data.length;
		var next;

		lines.enter()
			.append("line")
				.style("stroke", 
					//Function has a switch that takes current style and gives a value --Brett
					//Structured like this since some variables are only in the scopre of the drawLines function --Brett
					//More styles are just a case --Brett
					function(d,i){
						switch(colorStyle){
							case "colorArray":
								return color;
							case "rainbow-time":
								return d3.hsl(360*(i/len),1.0,0.5)
							case "rainbow-height":
								return d3.hsl(360*Math.abs(d.z)/10,1.0,0.5)
							case "greyscale-time":
								return d3.hsl(0,0.0,0.75*i/len)
							case "greyscale-height":
								return d3.hsl(0,0.0,Math.abs(d.z)/10)
							case "redscale-time":
								return d3.hsl(0,1.0,0.75*i/len)
							case "redscale-height":
								return d3.hsl(0,1.0,Math.abs(d.z)/10)
						}
				})
				.attr("id", label)
				.attr("stroke-width", 
					//Function has a switch that takes current style and gives a value --Brett
					//Structured like this since some variables are only in the scopre of the drawLines function --Brett
					//More styles are just a case --Brett
					function(d,i){
						switch(widthStyle){
							case "constant":
								return lineWidth;
              case "bigger-time":
                return 1 + 5*(i/len)
							case "bigger-height":
								//needs some adjustment due to negative z values?
								return 1 + Math.abs(d.z);
						}
				})
				.attr("x1",
					function(d, i)
					{
						return chart.xScale(d.x);
					})
				.attr("x2",
					function(d, i)
					{
						//Make sure we're not reaching out of bounds
						if (i + 1 >= len)
						{
							return chart.xScale(d.x);
						}
						else
						{
							next = my_data[i+1];
							return chart.xScale(next.x);
						}
					})
				.attr("y1",
					function(d, i)
					{
						return chart.yScale(d.z);
					})
				.attr("y2",
					function(d, i)
					{
						//Make sure we're not reaching out of bounds
						if (i + 1 >= len)
						{
							return chart.yScale(d.z);
						}
						else
						{
							next = my_data[i+1];
							return chart.yScale(next.z);
						}
					})
				.on("mouseover", function(d,i){
					//console.log('Clicking line')
					// var clicked_line = this;
					// console.log(clicked_line.id)
					for (var i = 0; i < lineIds.length; i++) 
					{
						if(this.id == lineIds[i])
						{
							d3.selectAll("#"+lineIds[i])
								.style("opacity", 1.0)
							;
						}
						else
						{
							d3.selectAll("#"+lineIds[i])
								.style("opacity", 0.25)
							;
						}
					}
					var triId = this.id.replace("line","tri");
					// console.log(triId);
					for (var i = 0; i < triIds.length; i++) 
					{
						if(triId == triIds[i])
						{
							d3.selectAll("#"+triIds[i])
								.style("opacity", 1.0)
							;
						}
						else
						{
							d3.selectAll("#"+triIds[i])
								.style("opacity", 0.25)
							;
						}
					}
				})
				.on("mouseout", function(d,i){
					//console.log('Clicking line')
					// var clicked_line = this;
					// console.log(clicked_line.id)
						for (var i = 0; i < lineIds.length; i++) 
						{
								d3.selectAll("#"+lineIds[i])
									.style("opacity", 1.0);
						}
						// console.log(triId);
						for (var i = 0; i < triIds.length; i++) 
						{
							d3.selectAll("#"+triIds[i])
								.style("opacity", 1.0);
						}
					}
				)	;
		;
	}

	// -------------------------------------------------------------------------------------
	// D3 Triangle Drawing  ---------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function drawTriangles(my_data, color, label)
	{
		// console.log("Drawing triangles")
		// var verticalTransform = midHeight + Math.sqrt(triangleSize);

		var triangle = d3.symbol()
		            .type(d3.symbolTriangle)
		            .size(ts);

		var tris = chart.plotArea.selectAll(label).data(my_data);
		// var len  = my_data.length;
		var rx;
		var ry;

		tris.enter()
			.append("path")
				    .attr("id", label)
					//Calculate size of triangle based upon height. 
					.attr("d", function(d) 
					{
						//console.log(d);
					    if (d.y < triangleRange[0]) ry = triangleSize[0]
							else if (d.y < triangleRange[1]) ry = triangleSize[1]
							else if (d.y < triangleRange[2]) ry = triangleSize[2]
							else ry = triangleSize[3];

							rx = ry/2; //triangleSize/2;
							// var rx = 3; //triangleSize/2;
							// var ry = 6; //triangleSize
							var x = chart.xScale(d.x);
							var y = chart.yScale(d.z);
							var lx = x+rx;  //lower x
							var ly = y+ry   //Lower y
							var ux = x-rx;  //upper x
							var uy = y-ry; //upper y
							return	"M" + x + "," + uy +
									"L" + lx + "," + ly +
									"L" + ux + "," + ly +
									"L" + x + "," + uy + "Z";
					})
					.attr("stroke","black")
					.attr("stroke-width","0.5")
					.attr("fill" ,color)
					.attr('transform' , function(d,i)
					{
						return "rotate(" + d.yaw + " " + chart.xScale(d.x) + " " + chart.yScale(d.z) + ")";
					})  //this doesn't work
					.on("mouseover", function(d,i)
					{
						//console.log('Clicking line')
						// var clicked_line = this;
						// console.log(clicked_line.id)
						var lineId = this.id.replace("tri","line");
						for (var i = 0; i < lineIds.length; i++) 
						{
							if(lineId == lineIds[i])
							{
								d3.selectAll("#"+lineIds[i])
									.style("opacity", 1.0)
								;
							}
							else
							{
								d3.selectAll("#"+lineIds[i])
									.style("opacity", 0.25)
								;
							}
						}
						// console.log(triId);
						for (var i = 0; i < triIds.length; i++) 
						{
							if(this.id == triIds[i])
							{
								d3.selectAll("#"+triIds[i])
									.style("opacity", 1.0)
								;
							}
							else
							{
								d3.selectAll("#"+triIds[i])
									.style("opacity", 0.25)
								;
							}
						}
					})
					.on("mouseout", function(d,i){
					//console.log('Clicking line')
					// var clicked_line = this;
					// console.log(clicked_line.id)
						for (var i = 0; i < lineIds.length; i++) 
						{
								d3.selectAll("#"+lineIds[i])
									.style("opacity", 1.0);
						}
						// console.log(triId);
						for (var i = 0; i < triIds.length; i++) 
						{
							d3.selectAll("#"+triIds[i])
								.style("opacity", 1.0);
						}
					})	
					.on("click", function(d) 
					{
						console.log("triangle selected: ", d.x, ", ", d.y, ",",d.z);
					});
	}

	// -------------------------------------------------------------------------------------
	// D3 Dot Drawing  ---------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function drawDots(my_data, color, label)
	{
		// console.log("Drawing dots")
		// plot dots
		var dots = chart.plotArea.selectAll(label).data(my_data);
		var len  = my_data.length;

		dots.enter()
			.append("circle")
 				.attr("class", "dot")
				.attr("cx", function(d) { return chart.xScale(d.x); })
				.attr("cy", function(d) { return chart.yScale(d.z); })
				.attr("r", circleRadius)
				.attr("fill", color) 
				.attr("stroke","black")
				.attr("stroke-width","0.5")
		;
	}

	// -------------------------------------------------------------------------------------
	// Image Loader for Background  --------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function drawImage()
	{
		d3.select("svg")
			.style("background","url(/data/Maps/Map1.png) no-repeat center")
			.style("background-size", "80% 80%")
		;
	}

	// -------------------------------------------------------------------------------------
	// D3 Chart Drawing  -------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function initializeChart()
	{
		chart = d3.select("#chartDiv").append("svg")
			.attr("width", width)
			.attr("height", height);

		chart.plotArea = chart.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		//Button that when clicked cycles between color styles --Brett
		chart.colorStyleButton = d3.select("#buttonDiv").append("svg")
			.attr("width",150)
			.attr("height",150)

		chart.colorStyleButton.append("rect")
				.attr("x",0)
				.attr("y",0)
				.attr("width",150)
				.attr("height",150)
				.attr("fill","hsl(0,100%,75%)")
				.on("click",function(){
					colorStyleIndex++
					if(colorStyleIndex >= colorStyles.length)
						colorStyleIndex = 0;
					colorStyle = colorStyles[colorStyleIndex]
					redraw()
					console.log(colorStyle)
				})
				.on("mouseover",function(){
					d3.select(this).attr("fill", "hsl(0,50%,75%)")
				})
				.on("mouseout",function(){
					d3.select(this).attr("fill", "hsl(0,100%,75%)")
				})

		chart.colorStyleButtonText = chart.colorStyleButton.append("text")
				.text("Change Color")
				.attr("x",30)
				.attr("y",75)
				.attr("font-family","sans-serif")
				.attr("font-size",12)

		//Button that when clicked cycles between width styles --Brett
		chart.widthStyleButton = d3.select("#buttonDiv").append("svg")
			.attr("width",150)
			.attr("height",150)

		chart.widthStyleButton.append("rect")
				.attr("x",0)
				.attr("y",0)
				.attr("width",150)
				.attr("height",150)
				.attr("fill","hsl(90,100%,75%)")
				.on("click",function(){
					widthStyleIndex++
					if(widthStyleIndex >= widthStyles.length)
						widthStyleIndex = 0;
					widthStyle = widthStyles[widthStyleIndex]
					redraw()
					console.log(widthStyle)
				})
				.on("mouseover",function(){
					d3.select(this).attr("fill", "hsl(90,50%,75%)")
				})
				.on("mouseout",function(){
					d3.select(this).attr("fill", "hsl(90,100%,75%)")
				})

		chart.widthStyleButtonText = chart.widthStyleButton.append("text")
				.text("Change Width")
				.attr("x",30)
				.attr("y",75)
				.attr("font-family","sans-serif")
				.attr("font-size",12)

		//Button that when clicked cycles between width styles --Brett
		chart.lineToggleButton = d3.select("#buttonDiv").append("svg")
			.attr("width",150)
			.attr("height",150)

		chart.lineToggleButton.append("rect")
				.attr("x",0)
				.attr("y",0)
				.attr("width",150)
				.attr("height",150)
				.attr("fill","hsl(180,100%,75%)")
				.on("click",function(){
					drawLinesReset = !drawLinesReset
					redraw()
					console.log(drawLinesReset)
				})
				.on("mouseover",function(){
					d3.select(this).attr("fill", "hsl(180,50%,75%)")
				})
				.on("mouseout",function(){
					d3.select(this).attr("fill", "hsl(180,100%,75%)")
				})

		chart.lineToggleText = chart.lineToggleButton.append("text")
				.text("Toggle Paths")
				.attr("x",30)
				.attr("y",75)
				.attr("font-family","sans-serif")
				.attr("font-size",12)

		//Button that when clicked cycles between width styles --Brett
		chart.triToggleButton = d3.select("#buttonDiv").append("svg")
			.attr("width",150)
			.attr("height",150)

		chart.triToggleButton.append("rect")
				.attr("x",0)
				.attr("y",0)
				.attr("width",150)
				.attr("height",150)
				.attr("fill","hsl(270,100%,75%)")
				.on("click",function(){
					drawTrisReset = !drawTrisReset
					redraw()
					console.log(drawTrisReset)
				})
				.on("mouseover",function(){
					d3.select(this).attr("fill", "hsl(270,50%,75%)")
				})
				.on("mouseout",function(){
					d3.select(this).attr("fill", "hsl(270,100%,75%)")
				})

		chart.triToggleButtonText = chart.triToggleButton.append("text")
				.text("Toggle Drones")
				.attr("x",30)
				.attr("y",75)
				.attr("font-family","sans-serif")
				.attr("font-size",12)
	}

	function redraw(){
		
		for(var i = 0; i<lineIds.length; i++){
			//console.log("#"+lineIds[i])
			d3.selectAll("#"+lineIds[i]).remove();
			if(drawLinesReset){
				drawLines(new_data[i],lineColors[i], "line"+i);
			}
		}
		
		
		for(var i = 0; i< triIds.length; i++){
			//console.log("#"+triIds[i])
			d3.selectAll("#"+triIds[i]).remove();
			if(drawTrisReset){
				drawTriangles(new_data[i],lineColors[i], "tri"+i);
			}
		}
		
	}

	function createAxes()
	{

		// x axis
		chart.xScale = d3.scaleLinear()
			.domain([dataXRange.min, dataXRange.max])
			.range([0, chartWidth]);

		chart.xAxis = d3.axisBottom()
			.tickSizeOuter(0)
			.scale(chart.xScale);

		chart.xAxisContainer = chart.append("g")
			.attr("class", "x axis scatter-xaxis")
			.attr("transform", "translate(" + (margin.left) + ", " + (chartHeight + margin.top) + ")")
			.call(chart.xAxis);

		// x axis header label
		chart.append("text")
			.attr("class", "x axis scatter-xaxis")
			.style("font-size", "12px")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(" + (margin.left + chartWidth / 2.0) + ", " + (chartHeight + (margin.bottom / 2.0)) + ")")
			.text(xAxisLabelHeader);

		// y axis labels
		chart.yScale = d3.scaleLinear()
			.domain([dataYRange.min, dataYRange.max])
			.range([chartHeight, 0]);

		chart.yAxis = d3.axisLeft()
			.scale(chart.yScale);

		chart.yAxisContainer = chart.append("g")
			.attr("class", "y axis scatter-yaxis")
			.attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
			.call(chart.yAxis);

		// y axis header label
		chart.append('text')
			.style("font-size", "12px")
			.attr("class", "heatmap-yaxis")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(" + (margin.left / 2.0) + ", " + (chartHeight / 2.0) + ") rotate(-90)")
			.text(yAxisLabelHeader);
	}


})();
