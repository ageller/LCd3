
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
function createPlot(data, width, height, margin, xTitle, yTitle, left=0, top=0, fillColor="#DC143C"){


	var x0 = [margin.left, width + margin.left ],
		y0 = [height + margin.top, margin.top];
	var x = d3.scaleLinear().range(x0),
		y = d3.scaleLinear().range(y0);


	var xAxis = d3.axisBottom(x),
		yAxis = d3.axisLeft(y);

	var xExtent = d3.extent(data, function(d) { return +d.x; }),
		yExtent = d3.extent(data, function(d) { return +d.y; });

	x.domain(xExtent).nice();
	y.domain(yExtent).nice();

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


	var view = plot.selectAll(".dot")
		.data(data)
		.enter().append("circle")
			.attr("class", "dot circle")
			.attr("r", 3.5)
			.attr("cx", function(d) { return x(+d.x); })
			.attr("cy", function(d) { return y(+d.y); })
			.style("fill", fillColor)
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
			x.domain(xExtent).nice();
			y.domain(yExtent).nice();
		} else {
			x.domain([x.invert(s[0][0]), x.invert(s[1][0])]).nice();
			y.domain([y.invert(s[1][1]), y.invert(s[0][1])]).nice();
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
			.attr("cx", function(d) { return x(+d.x); })
			.attr("cy", function(d) { return y(+d.y); })
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
		rawData.push({"x":d.hjd, "y":d.mag})
	})
	rawPlot = createPlot(rawData, width, height, margin, "Days", "Brightness");

	var phaseData = rawData;
	phasePlot = createPlot(phaseData, width, height, margin, "Phase", "Brightness", left=-(width + margin.left + margin.right), top=(height + margin.bottom + margin.top), fillColor="00ff00");


	// console.log(phasePlot)
}