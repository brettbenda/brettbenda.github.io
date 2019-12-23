;(function()
{
	//Chart area variables
	var margin = { top: 10, right: 10, bottom: 100, left: 50 };
	var width = window.innerWidth*0.75;
  console.log(width)
  console.log(window.innerWidth)
	var height = window.innerHeight*0.925;

	// Define the div for the tooltip
	var div = d3.select("body").append("div")
	    .attr("class", "tooltip")
	    .style("opacity", 0);


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
	var circleStartColor = "green";
	var circleEndColor   = "red";
	var lineWidth = 4;
	var ts = 50; //triangle size
	var circleRadius = ["0.5%","0.65%","0.8%","0.95%","1.1%"];
	// var circleRadius = [4,6.5,8,9.5];
	var heightRange = [1.5,3,4.5, 6];
	// var triangleSize = [2,6,8,12];
	var triangleSize = [6,8,10,12];
//	var triangleRange = [1.5, 3, 4.5, 6];
	var n = 25 // Resampling to n number of points
	var heat_threshold = 98; //Display top 2% of data

	//These are the values of the 'Paired' color map. Each pair are of
	//similar color to easily match different runs of the same subject
	var lineColors  = ["#a6cee3","#1f78b4",
							"#b2df8a","#33a02c",
							"#fdbf6f","#ff7f00",
							"#cab2d6","#6a3d9a",
							"#ffff99","#b15928"];
	var lineIds = [];
	var triIds  = [];
	var dotIds = [];


	//Used by the style-switching buttons to determine style for various line elements, more styles should just be added to the array
	var colorStyles = ["Pilot Color", "Bluescale Time", "Bluescale Height", "Bluescale Velocity"]
	var colorStyle = colorStyles[0]
	var colorStyleIndex = 0
	var widthStyles = ["Constant", "Time", "Height"]
	var widthStyle = widthStyles[0]
	var widthStyleIndex = 0
	var drawLinesReset = true;
	var drawTrisReset = false;
	var drawStartReset = true;
	var drawEndReset = true;
	var heatmapVisible = false;
	var heat_bw = true;
	var activeDatasets = [0,2,4,6];
	var layer0, layer1, layer2, layer3, layer4;

	//Global references
	var jdata = [];
	var jdatastart = [];
	var jdataend =[];
	var markers_d = [];
	var tri_data, lin_data;
	var mysql;
	var chart;
	var chartWidth;
	var chartHeight;

	var p1;

	d3.select(window).on("load", register_buttons);

	init();

	// -------------------------------------------------------------------------------------
	// Main() ------------------------------------------------------------------------------
	// -------------------------------------------------------------------------------------

	function register_buttons()
	{
		//Select paths
		d3.selectAll(".Pgroup")
			.on("change", function(d) {
				// console.log("Pilot checkbox that changed: " + this.value);
				activeDatasets=[]
				// Check all check boxes to update the active drone paths
	 			d3.selectAll(".Pgroup").each(function(d){
					var cb = d3.select(this);
		 			if(cb.property("checked")){
			 			activeDatasets.push(+cb.property("value"));
		 			}
	 			});  //each pgroup
				redraw();
		});   //on change

		//Show/hide flight Paths
		d3.selectAll(".Vgroup")
			.on("change", function(d) {
				drawLinesReset = this.checked;
				redraw();
		});
    //Start Markers
		d3.selectAll(".Sgroup")
			.on("change",function(d){
				drawStartReset = this.checked;
				redraw()
			});
	  //End Markers
		d3.selectAll(".Egroup")
			.on("change",function(d){
				drawEndReset = this.checked;
				redraw()
			})
    //Drone markers
		d3.selectAll(".Dgroup")
			.on("change",function(d){
				drawTrisReset = this.checked;
				redraw()
			});
		//Number of triangle
		d3.select("#nTriangle")
			.on("input",function(d){
				updateTriangleNumber(this.value)
				redraw()
			});

    //Heat circle
		d3.selectAll(".Hgroup")
			.on("change",function(d){
				heatmapVisible = this.checked;
				console.log("Heatmap "+heatmapVisible)
				redraw()
			});
    //Heat Threshold
		d3.selectAll("#nThreshold")
			.on("input",function(d){
				heat_threshold = 100-this.value;
				console.log("heat threshold = "+heat_threshold);
				redraw()
			});

		//background
		d3.selectAll(".Bgroup")
			.on("change",function(d){
				console.log("change bg",+this.value);
				drawImage(this.value ,"Legend.jpg");
			});


		// d3.select("#changeColor")
		// 	.on("click",function()
		// 	{
		// 		colorStyleIndex++
		// 		if(colorStyleIndex >= colorStyles.length)
		// 			colorStyleIndex = 0;
		// 		colorStyle = colorStyles[colorStyleIndex]
		// 		redraw()
		// 		console.log(colorStyle)
		// 		d3.select(this).text("Change Line Color (" + colorStyle + ")")
		// 		return false;
		// 	});
		// d3.select("#changeWidth")
		// 	.on("click",function()
		// 	{
		// 		widthStyleIndex++
		// 		if(widthStyleIndex >= widthStyles.length)
		// 			widthStyleIndex = 0;
		// 		widthStyle = widthStyles[widthStyleIndex]
		// 		redraw()
		// 		console.log(widthStyle)
		// 		d3.select(this).text("Change Line Width (" + widthStyle + ")")
		// 		return false;
		// 	});

		// d3.select("#togglePaths")
		// 	.on("click",function()
		// 	{
		// 		drawLinesReset = !drawLinesReset
		// 		redraw()
		// 		console.log(drawLinesReset)
		// 		d3.select(this).text("Toggle Paths " + (drawLinesReset?"(Visible)":"(Hidden)"))
		// 		return false;
		// 	});





	}

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

				// var n = 20 // Resampling to n number of points
				var m = Math.round(json[0].length / 100); // Resampling to n number of points
				// console.log(m);

				var clean_tri = [];
				var clean_lin = [];
				//Resample all of the data (except the marker data)
				for (var i = 0; i < json.length-1; i++)
				{
					jdata.push(json[i]);
					jdatastart.push(json[i][0]);
					jdataend.push(json[i][json[i].length-1]);
					dotIds.push("circle"+i);

					//console.log("resampling");
					clean_tri.push(Resample(json[i],n));
					clean_lin.push(Resample(json[i],m));
					// activeDatasets.push(i);
				}
				//Try to combine points (when dist <= 3.5)
				// tri_data = reducePaths(clean_tri, 0.05);
				// lin_data = reducePaths(clean_lin, 0.05);
				tri_data = clean_tri;
				lin_data = clean_lin;
				// console.log("created data");
				//console.log("done");


				// var mean_path = getMean(tri_data);

				initializeChart();
				createLayers();
				// heatMap(lin_data, heat_resolution);
				createAxes();
				// heatMap(lin_data, heat_threshold);

				drawImage("Map_Traced.png","Legend.jpg");
				//drawLegend("Legend.jpg");

				var starting = [];
				var ending   = [];
				// console.log("starting loop");
				for (var i = 0; i < tri_data.length; i++)
				{
					// starting.push(lin_data[i][0]);
					// ending.push(lin_data[i][lin_data[i].length-1]);

					lineIds.push("line"+i);
					triIds.push("tri"+i);

					if(activeDatasets.includes(i)) {
						drawLines(lin_data[i],lineColors[i], "line"+i);
					}
					// console.log("Line done");
					if(activeDatasets.includes(i)) {
						drawTriangles(tri_data[i],lineColors[i],"tri"+i);
					}
					// console.log("Tri done");
				}
				// console.log("Loop done");
				markers_d = json[8]

				drawDots(markers_d, "red", "markers");

				for (var i = 0; i < dotIds.length; i++ ){

					drawDotsEnds([jdataend[i]], "yellow", dotIds[i]);
					drawDotsEnds([jdatastart[i]], "blue", dotIds[i]);
				}
				//drawDotsEnds(jdataend, "yellow", dotIds);
				// console.log("Dots done");
				// drawDots(starting, "green", "start");
				// drawDots(ending, "black", "end");

			})
		.catch(function(error)
			{
				console.warn(error);
			})
	}

	function avgSpeed(item)
	{
		var speed = (Math.abs(item.vX) + Math.abs(item.vY) + Math.abs(item.vZ)) / 3;
		return speed;
	}

	function maxSpeed(item)
	{
		var speed = Math.max(Math.abs(item.vX) + Math.abs(item.vY) + Math.abs(item.vZ));
		return speed;
	}

	function heatMap(my_data, threshold)
	{
		var heatData,heatScale;
		var values = heatMapArray(my_data, threshold);
		var gradColor = "#FF00FF"//"#FF6E63"//"#E80C7A"//"#0FAEBA"//"#6A36D9"//"#8836BF" //"F2387C" //"#FE5F55"  
		heatData   = values[0];
		heatScale  = values[1];

		var radialGradient = layer1.append("defs")
			.append("radialGradient")
			.attr("id", "radial-gradient");

		radialGradient.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", gradColor)
			.attr("stop-opacity", 1.0);

		radialGradient.append("stop")
			.attr("offset", "65%")
			.attr("stop-color", gradColor)
			.attr("stop-opacity", 0.50);

		radialGradient.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", gradColor)
			.attr("stop-opacity", 0.0);

		var circles = layer1.selectAll("heatCircles")
			.data(heatData)
			.enter()
			.append("circle");

		circles
			.attr("class", "dot")
			.attr("cx", function(d)
			{
				return chart.xScale(d.x) + margin.left;
			})
			.attr("cy", function(d)
			{
				return chart.yScale(d.y) + margin.top;
			})
			.attr("r", 10)
			.style("opacity", 0.50)
			.style("fill", "url(#radial-gradient)");
			// .style("fill", "#FE5F55");
	}

	function heatMapArray(my_data, threshold)
	{
		var linearData = [];
		var curData;
		for (var i = 0; i < my_data.length; i++)
		{
			for (var j = 0; j < my_data[i].length; j++)
			{
				curData = my_data[i][j];
				linearData.push({"value" : maxSpeed(curData), "x" : curData.x, "y" : curData.z});
			}
		}

		var colorDomain = d3.extent(linearData, function(d)
		{
			return d.value;
		});

		var percentages = [];
		for (var i = 100; i >= 0; i--)
		{
			percentages.push(i);
		}

		var quantileScale = d3.scaleQuantile()
			.domain(colorDomain)
			.range(percentages);

		var retData = [];
		for (var i = 0; i < linearData.length; i++)
		{
			if (quantileScale(linearData[i].value) >= threshold)
			{
				retData.push(linearData[i]);
			}
		}
		return [retData,quantileScale];
	}

	function getMean(new_data)
	{
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
		return mean_path;
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
				var yr = parseFloat(my_data[i-1].yaw);
				//console.log(data[i-1].yaw,data[i].yaw)
			  //added these for completeness, but we may want to do some calculations here
				var vxr = parseFloat(my_data[i-1].vX);
				var vyr = parseFloat(my_data[i-1].vY);
				var vzr = parseFloat(my_data[i-1].vZ);
				var pr = parseFloat(my_data[i-1].pitch);
				var rr = parseFloat(my_data[i-1].roll);


				// var q = {x:qx, y:0, z:qz};
				var q = {x:qx, y:qy, z:qz, vX:vxr, vY:vyr, vZ:vzr, pitch:pr, roll:rr, yaw:yr, t:tr};
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
			//RWF - added speed, pitch, & roll values so we have something, butt
			//we may want to do something in the resampling of these values
			newdata[newdata.length] = {x:my_data[my_data.length - 1].x,
									   y:my_data[my_data.length - 1].y,
									   z:my_data[my_data.length - 1].z,
										 vX:my_data[my_data.length-1].vX,
										 vY:my_data[my_data.length-1].vY,
										 vZ:my_data[my_data.length-1].vZ,
										 pitch:my_data[my_data.length-1].pitch,
										 roll:my_data[my_data.length-1].roll,
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

	function updateTriangleNumber(numberoftriangles){

		// adjust the text on the range slider
		d3.select("#nTriangle-value").text(numberoftriangles)
		d3.select("#nTriangle").property("value",numberoftriangles)

		// update the resampling value
		//console.log(jdata);

		var clean_tri = [];
		//Resample all of the data (except the marker data)
		for (var i = 0; i < jdata.length; i++)
		{
			//console.log(jdata[i])
			clean_tri.push(Resample(jdata[i],numberoftriangles));
		}

		tri_data = clean_tri;
		//console.log(clean_tri)

	};

	// -------------------------------------------------------------------------------------
	// D3 Line Drawing  --------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function drawLines(my_data, color, label)
	{
		//console.log(my_data)
		// plot dots

		var lines = layer3.selectAll(label).data(my_data);
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
							case "Pilot Color":
								return color;
							case "Rainbow Time":
								return d3.hsl(360*(i/len),1.0,0.5)
							case "Rainbow Height":
								return d3.hsl(360*d.y/6,1.0,0.5)
							case "Greyscale Time":
								return d3.hsl(0,0.0,0.75*i/len)
							case "Greyscale Height":
								return d3.hsl(0,0.0,d.y/10)
							case "Bluescale Time":
								return d3.hsl(180,1.0,0.75*i/len)
							case "Bluescale Height":
								return d3.hsl(180,1.0,d.y/10)
              case "Bluescale Velocity":
                var velocity = Math.sqrt(Math.pow(d.vX,2)+Math.pow(d.vY,2)+Math.pow(d.vZ,2))
                return d3.hsl(180,1.0, velocity/5)
						}
				})
				.attr("id", label)
				.attr("stroke-width",
					//Function has a switch that takes current style and gives a value --Brett
					//Structured like this since some variables are only in the scopre of the drawLines function --Brett
					//More styles are just a case --Brett
					function(d,i){
						switch(widthStyle){
							case "Constant":
								return lineWidth;
              case "Time":
                return 1 + 5*(i/len)
							case "Height":
								//needs some adjustment due to negative z values?
								return d.y;
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
					var dotId = this.id.replace("line","circle");
					for (var i = 0; i < dotIds.length; i++)
						{
							//console.log(this.id)
							if(dotId == dotIds[i])
							{
								d3.selectAll("#"+dotIds[i])
									.style("opacity", 1.0)
								;
							}
							else
							{
								d3.selectAll("#"+dotIds[i])
									.style("opacity", 0.25)
								;
							}
						}
				})
				//.attr("preserveAspectRatio", "xMinYMin meet")
  				//.attr("viewBox", "0 0 1000 1000")
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
						for (var i = 0; i < dotIds.length; i++)
						{
							d3.selectAll("#"+dotIds[i])
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
		if (drawTrisReset==0) return;

		var triangle = d3.symbol()
		            .type(d3.symbolTriangle)
		            .size(ts);
		var len   = my_data.length;
		var tris = layer3.selectAll(label).data(my_data);
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
					    if (d.y < heightRange[0]) ry = triangleSize[0]
							else if (d.y < heightRange[1]) ry = triangleSize[1]
							else if (d.y < heightRange[2]) ry = triangleSize[2]
							else ry = triangleSize[3];

							rx = ry*0.75; //triangleSize/2;
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
					.attr("stroke-width","1.0")
  				// .attr("stroke-width","0.5")
					.attr("fill" ,function(d,i){
						switch(colorStyle){
							case "Pilot Color":
								return color;
							case "Rainbow Time":
								return d3.hsl(360*(i/len),1.0,0.5)
							case "Rainbow Height":
								return d3.hsl(360*d.y/6,1.0,0.5)
							case "Greyscale Time":
								return d3.hsl(0,0.0,0.75*i/len)
							case "Greyscale Height":
								return d3.hsl(0,0.0,d.y/10)
							case "Bluescale Time":
                return d3.hsl(180,1.0,0.75*i/len)
              case "Bluescale Height":
                return d3.hsl(180,1.0,d.y/10)
              case "Bluescale Velocity":
                var velocity = Math.sqrt(Math.pow(d.vX,2)+Math.pow(d.vY,2)+Math.pow(d.vZ,2))
                return d3.hsl(180,1.0, velocity/5)
						}
				})
					.attr('transform' , function(d,i)
					{
						return "rotate(" + d.yaw + " " + chart.xScale(d.x) + " " + chart.yScale(d.z) + ")";
					})
					.on("mouseover", function(d,i)
					{

						console.log("mouseover");
			            div.transition()
			                .duration(100)
			                .style("opacity", .9);
											div	.html("Location: {" + twoDecimals(d.x) + ", " + twoDecimals(d.z) + "}<br/>"
											+ "Height: " + twoDecimals(d.y)+ "<br/>"
											+ "Speed: {" + twoDecimals(d.vX) +", " + twoDecimals(d.vY) + ", " + twoDecimals(d.vZ) + "}<br/>"
											// + "Pitch: " + twoDecimals(d.pitch) + "<br/>"
											// + "Roll: " + twoDecimals(d.roll) + "<br/>"
											+ "Yaw: " + twoDecimals(d.yaw) + "<br/>"
											+ "Time: " + twoDecimals(d.t))
			                .style("left", (d3.event.pageX) + "px")
			                .style("top", (d3.event.pageY - 50) + "px");


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
						var dotId = this.id.replace("tri","circle");
						for (var i = 0; i < dotIds.length; i++)
						{
							//console.log(this.id)
							if(dotId == dotIds[i])
							{
								d3.selectAll("#"+dotIds[i])
									.style("opacity", 1.0)
								;
							}
							else
							{
								d3.selectAll("#"+dotIds[i])
									.style("opacity", 0.25)
								;
							}
						}


					})
					.on("mouseout", function(d,i)
					{
			            div.transition()
			                .duration(100)
			                .style("opacity", 0);


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
						for (var i = 0; i < dotIds.length; i++)
						{
							d3.selectAll("#"+dotIds[i])
								.style("opacity", 1.0);
						}
					})
					.on("click", function(d)
					{
						console.log("triangle selected: ", d.x, ", ", d.y, ",",d.z);
					});
	}

	function twoDecimals(num)
	{
		return Math.round(num * 100) / 100;
	}
	// -------------------------------------------------------------------------------------
	// D3 Dot Drawing  ---------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function drawDots(my_data, color, label)
	{
		//var circleRadius     = 6;
		var cr;
		// console.log("Drawing dots")
		// plot dots
		var dots = layer3.selectAll(label).data(my_data);
		var len  = my_data.length;

		dots.enter()
			.append("circle")
 				.attr("class", "dot")
				.attr("cx", function(d) { return chart.xScale(d.x); })
				.attr("cy", function(d) { return chart.yScale(d.z); })
				// .attr("r", circleRadius)
				.attr("r", function(d) {
					//console.log(d);
						if (d.y < heightRange[0]) cr = circleRadius[0]
						else if (d.y < heightRange[1]) cr = circleRadius[1]
						else if (d.y < heightRange[2]) cr = circleRadius[2]
						else cr = circleRadius[3];
						return cr;

				})
				.attr("fill", color)
				.attr("stroke","black")
				.attr("stroke-width","0.5")
				.on("mouseover", function(d,i)
				{

					console.log("mouseover");
						div.transition()
								.duration(100)
								.style("opacity", .9);
						div	.html("Location: {" + twoDecimals(d.x) + ", " + twoDecimals(d.z) + "}<br/>"
									 + "Height: " + twoDecimals(d.y))
								.style("left", (d3.event.pageX) + "px")
								.style("top", (d3.event.pageY - 50) + "px");


				})
				.on("mouseout", function(d,i)
				{
								div.transition()
										.duration(100)
										.style("opacity", 0);

				});
	}
	function drawDotsEnds(my_data, color, label)
	{
		//var circleRadius     = 6;
		var cr;
		// console.log("Drawing dots")
		// plot dots
		var dots = layer3.selectAll(label).data(my_data);
		var len  = my_data.length;

		dots.enter()
			.append("circle")
				.attr("class", "circle")
				.attr("id", label)
				.attr("cx", function(d) { return chart.xScale(d.x); })
				.attr("cy", function(d) { return chart.yScale(d.z); })
				// .attr("r", circleRadius)
				.attr("r", function(d) {
					//console.log(d);
						if (d.y < heightRange[0]) cr = circleRadius[0]
						else if (d.y < heightRange[1]) cr = circleRadius[1]
						else if (d.y < heightRange[2]) cr = circleRadius[2]
						else cr = circleRadius[3];
						return cr;

				})
				.attr("fill", color)
				.attr("stroke","black")
				.attr("stroke-width","0.5")
				.on("mouseover", function(d,i)
				{

					console.log("mouseover");
						div.transition()
								.duration(100)
								.style("opacity", .9);
						div	.html("Location: {" + twoDecimals(d.x) + ", " + twoDecimals(d.z) + "}<br/>"
									 + "Height: " + twoDecimals(d.y))
								.style("left", (d3.event.pageX) + "px")
								.style("top", (d3.event.pageY - 50) + "px");


						var lineId = this.id.replace("circle","line");
						for (var i = 0; i < lineIds.length; i++)
							{
							if(lineId == lineIds[i])
							{
								d3.selectAll("#"+lineIds[i])
								//console.log(d3.selectAll("#"+lineIds[i]))
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
						var triId = this.id.replace("circle","tri");
						for (var i = 0; i < triIds.length; i++)
						{
							if(triId == triIds[i])
							{
								//console.log(this.id)
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

						for (var i = 0; i < dotIds.length; i++)
						{
							//console.log(this.id)
							if(this.id == dotIds[i])
							{
								d3.selectAll("#"+dotIds[i])
									.style("opacity", 1.0)
								;
							}
							else
							{
								d3.selectAll("#"+dotIds[i])
									.style("opacity", 0.25)
								;
							}
						}

				})
				.on("mouseout", function(d,i)
				{
								div.transition()
										.duration(100)
										.style("opacity", 0);


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
								for (var i = 0; i < dotIds.length; i++)
								{
									d3.selectAll("#"+dotIds[i])
										.style("opacity", 1.0);
								}
				});

	}

	// -------------------------------------------------------------------------------------
	// Image Loader for Background  --------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function drawImage(string1,string2)
	{
		/*

		d3.xml("./data/Maps/Map_Traced.svg")
    		.then(data => {
    			data.documentElement.setAttributeNS(null,"id", "background")
        		d3.select('svg').node().append(data.documentElement)


				var html = document.getElementById("background").innerHTML
				//console.log(html)
				document.getElementById("backgroundImage").innerHTML = html;


				var img = document.getElementById("background")

				img.innerHTML=""
   		})


    	var xoffset = chart.xScale(0);
    	var yoffset = chart.yScale(0);
    	//console.log(layer4[0].getBBox())

    	layer4
    		.attr("transform", "translate("+xoffset+ ", "+yoffset+") scale(0.65,0.45)")
		*/
		//console.log(layer4)
		//console.log(d3.select("#backgroundImage").style('width'))
		//var string = "Map_Traced.jpg"
		//var string = "Map_Traced.jpg"
		var aspect_ratio, legend_x, legend_y;

		if(width<height){
			aspect_ratio = width/height;
			legend_y = 20;
			legend_x = 1.4*legend_y/aspect_ratio;
		}else{
			aspect_ratio = height/width;
			legend_x = 20
			legend_y = legend_x/1.4/aspect_ratio;
		}
		console.log(aspect_ratio)
		console.log(legend_x)
		console.log(legend_y)


		d3.select("svg")
			.style("background","url(/data/Maps/"+string1+") no-repeat center, url(/data/Maps/"+string2+") no-repeat")
			// .style("background-size", "75% 45%, 20% 22%");
			.style("background-size", "75% 45%,"+legend_x+"% "+legend_y+"%")
			.style("background-position","center, 7.5% 2%")

	}

	// function drawLegend(string)
	// {

	// 	d3.select("svg")
	// 		.style("background","url(/data/Maps/"+string+") no-repeat top center")
	// 		.style("background-size", "12% 12%")
	// 	;
	// }

	// -------------------------------------------------------------------------------------
	// D3 Chart Drawing  -------------------------------------------------------------------
	// -------------------------------------------------------------------------------------
	function initializeChart()
	{
		chart = d3.select("#chartDiv").append("svg")
			.attr("width", width)
			.attr("height", height)

			// this controls the size of the viewbox, however im not sure how it plays with the background image

			// .attr("preserveAspectRatio", "xMinYMin meet")
  			// .attr("viewBox", "0 0 1000 1000")
  			//.classed("svg-content", true);

		chart.plotArea = chart.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	}

	function redraw()
	{
		//Draw in order:  lines, triangles, start/stop circles, markers
		var heat_data = [];
		d3.selectAll("circle").remove();

		//Draw lines;
		for(var i = 0; i<lineIds.length; i++){
			d3.selectAll("#"+lineIds[i]).remove();
			// console.log("In Redraw - active data = "+activeDatasets);
			// console.log("i = "+i+" is included "+activeDatasets.includes(i))
			// if(drawLinesReset && activeDatasets.includes(i))
			if(activeDatasets.includes(i))
			{
				if (drawLinesReset) drawLines(lin_data[i],lineColors[i], "line"+i);
				heat_data.push(lin_data[i]);
			}

		}

		//Draw Triangles
		for(var i = 0; i< triIds.length; i++){
			d3.selectAll("#"+triIds[i]).remove();
			console.log("in redraw:")
			if(activeDatasets.includes(i)){
				drawTriangles(tri_data[i],lineColors[i], "tri"+i);
			}
		}
		//Draw start and end points
		for(var i = 0; i<lineIds.length; i++) {
			// d3.selectAll("#"+lineIds[i]).remove();

			// if(drawLinesReset && activeDatasets.includes(i))  //only draw dots if the line is on
			if(activeDatasets.includes(i))   //draw dots if they are "on"
			{
				if (drawEndReset == true){
					drawDotsEnds([jdataend[i]],"yellow",dotIds[i])
				}
				if (drawStartReset == true){
					drawDotsEnds(jdatastart,"blue",dotIds[i])
				}
			}
		}

		drawDots(markers_d,"red","marker")

		layer1.selectAll("heatCircles").remove();
		console.log("redraw: heatmapVisible = "+heatmapVisible);
		if(heatmapVisible == true) {
			console.log("drawing heatmap");
			// console.log("drawing heatmap")
			heatMap(heat_data, heat_threshold);
		}

	}

	function createLayers()
	{
		layer4 = chart.append("g");
		layer0 = chart.append("g");
		layer1 = chart.append("g");
		layer2 = chart.append("g");
		layer3 = chart.append("g");

		layer4.attr("id", "backgroundImage")
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

		chart.xAxisContainer = layer2
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

		chart.yAxisContainer = layer3
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

	// function createLegend(data){
	// 	var legend = chart.append("g")
	// 		.attr("class","legend")
	// 		.attr("height",100)
	// 		.attr("width",100)
	// 		//.attr("transform","translate(-20,50)")

	// 	legend.selectAll('dots')
	// 		.data(data)
	// 		.enter()
	// 		.append("dots")
	// 		.attr("x", 65)
    //   		.attr("y", function(d, i){ return i *  20;})
	//   		.attr("width", 10)
	//   		.attr("height", 10)
	//   		.style("fill", "red")
	// }


})();
