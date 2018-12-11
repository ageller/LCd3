
//some initial definitions
var	idleTimeout,
	idleDelay = 350;


d3.csv("data/27882110006813.csv")
	.then(function(data) {
		startPlotting(data);
	});

//////////////
// RAW DATA
//////////////
function createPlot(data, width, height, margin, xTitle, yTitle, left=0, top=0, circleColor="#DC143C", errColor="#DC143C"){

	var errLen = 4;

	var x0 = [margin.left, width + margin.left ],
		y0 = [height + margin.top, margin.top];
	var xScale = d3.scaleLinear().range(x0),
		yScale = d3.scaleLinear().range(y0);


	var xAxis = d3.axisBottom(xScale),
		yAxis = d3.axisLeft(yScale);

	var xExtent = d3.extent(data, function(d) { return +d.x; }),
		yExtent = d3.extent(data, function(d) { return (+d.y + d.ye); });

	xScale.domain(xExtent).nice();
	yScale.domain(yExtent).nice();

	var plot = d3.select("body").append("svg")
		.attr("width", (width + margin.left + margin.right))
		.attr("height", (height + margin.top + margin.bottom))
		.attr("transform", "translate(" + left + "," + top + ")")

	//axes
	var gX = plot.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + (height + margin.top) + ")")
		.call(xAxis)
	var gY = plot.append("g")
		.attr("transform", "translate(" + margin.left + ",0)")
		.attr("class", "axis axis--y")
		.call(yAxis)

	//axes labels
	plot.append("text")
		.attr("class", "label")
		.attr("x", width/2. + margin.left)
		.attr("y", height + margin.bottom-20)
		.style("text-anchor", "middle")
		.text(xTitle);
	plot.append("text")
		.attr("class", "label")
		.attr("transform", "rotate(-90)")
		.attr("x", -height/2)
		.attr("y", 20)
		.style("text-anchor", "middle")
		.text(yTitle)

	// Add Error Line
	plot.append("g").selectAll("line")
		.data(data).enter()
		.append("line")
		.style("stroke", errColor)
		.attr("class", "error-line")
		.attr("x1", function(d) {return xScale(+d.x);})
		.attr("y1", function(d) {return yScale(+d.y + d.ye);})
		.attr("x2", function(d) {return xScale(+d.x);})
		.attr("y2", function(d) {return yScale(+d.y - d.ye);});

	// Add Error Top Cap
	plot.append("g").selectAll("line")
		.data(data).enter()
		.append("line")
		.style("stroke", errColor)
		.attr("class", "error-cap error-cap-top")
		.attr("x1", function(d) {return xScale(+d.x) - errLen;})
		.attr("y1", function(d) {return yScale(+d.y + d.ye);})
		.attr("x2", function(d) {return xScale(+d.x) + errLen;})
		.attr("y2", function(d) {return yScale(+d.y + d.ye);});
		
	 // Add Error Bottom Cap
	plot.append("g").selectAll("line")
		.data(data).enter()
		.append("line")
		.style("stroke", errColor)
		.attr("class", "error-cap error-cap-bottom")
		.attr("x1", function(d) {return xScale(+d.x) - errLen;})
		.attr("y1", function(d) {return yScale(+d.y - d.ye);})
		.attr("x2", function(d) {return xScale(+d.x) + errLen;})
		.attr("y2", function(d) {return yScale(+d.y - d.ye);});
	
	plot.selectAll(".dot")
		.data(data)
		.enter().append("circle")
			.attr("class", "dot circle")
			.attr("r", 3.5)
			.attr("cx", function(d) { return xScale(+d.x); })
			.attr("cy", function(d) { return yScale(+d.y); })
			.style("fill", circleColor)
			.style("opacity",0.7);



	//brush + zoom from here : https://bl.ocks.org/mbostock/f48fcdb929a620ed97877e4678ab15e6
	var brush = d3.brush().on("end", brushended);
	plot.append("g")
		.attr("class", "brush")
		.call(brush);


	// helper functions for brushing and zooming
	function brushended() {
		var s = d3.event.selection;
		if (!s) {
			if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
			xScale.domain(xExtent).nice();
			yScale.domain(yExtent).nice();
		} else {
			xScale.domain([xScale.invert(s[0][0]), xScale.invert(s[1][0])]).nice();
			yScale.domain([yScale.invert(s[1][1]), yScale.invert(s[0][1])]).nice();
			plot.select(".brush").call(brush.move, null);
		}
		zoom();
	}

	function idled() {
		idleTimeout = null;
	}

	function zoom() {
		var t = plot.transition().duration(750);
		plot.select(".axis--x").transition(t).call(xAxis);
		plot.select(".axis--y").transition(t).call(yAxis);
		plot.selectAll("circle").transition(t)
			.attr("cx", function(d) { return xScale(+d.x); })
			.attr("cy", function(d) { return yScale(+d.y); });
		plot.selectAll(".error-line").transition(t)
			.attr("x1", function(d) {return xScale(+d.x);})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x);})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});
		plot.selectAll(".error-cap-top").transition(t)
			.attr("x1", function(d) {return xScale(+d.x) - errLen;})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + errLen;})
			.attr("y2", function(d) {return yScale(+d.y + d.ye);});
		plot.selectAll(".error-cap-bottom").transition(t)
			.attr("x1", function(d) {return xScale(+d.x) - errLen;})
			.attr("y1", function(d) {return yScale(+d.y - d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + errLen;})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});
	}

	return plot;
}




//create the plots
function startPlotting(data){
	var rawData = [],
		margin = {top: 0, right: 0, bottom: 60, left: 60},
		width = 500,
		height = 300;
	data.forEach(function(d){
		rawData.push({"x":parseFloat(d.hjd), "y":parseFloat(d.mag), "ye":parseFloat(d.emag)})
	})
	rawPlot = createPlot(rawData, width, height, margin, "Days", "Brightness");

	var period = 0.46614771; //will be substituted with real data later
	var phaseData = [];
	data.forEach(function(d){
		phaseData.push({"x":parseFloat(d.hjd) % period, "y":parseFloat(d.mag), "ye":parseFloat(d.emag)})
	})
	phasePlot = createPlot(phaseData, width, height, margin, "Phase", "Brightness", left=-(width + margin.left + margin.right), top=(height + margin.bottom + margin.top));


	// console.log(phasePlot)
}