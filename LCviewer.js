
//some initial definitions
var	idleTimeout,
	idleDelay = 350,
	errLen = 4, 
	tDuration = 750;

//will store plots
var rawPlot,phasePlot;

//will store the data
var rawData = [],
	phaseData = [],
	inputData,
	inputPeriods;

d3.json("data/27882110006813.json")
	.then(function(data) {
		inputData = data;
		startPlotting();
	});

//////////////
// add data to plot
//////////////
function addData(data, plot, xScale, yScale, circleColor="#DC143C", errColor="#DC143C"){
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
	
	plot.append("g").selectAll("circle")
		.data(data).enter()
			.append("circle")
			.style("fill", circleColor)
			.attr("class", "dot circle")
			.attr("r", 3.5)
			.attr("cx", function(d) { return xScale(+d.x); })
			.attr("cy", function(d) { return yScale(+d.y); })
}

//////////////
// setup the plot
//////////////
function createPlot(data, width, height, margin, xTitle, yTitle, left=0, top=0, circleColor="#DC143C", errColor="#DC143C"){

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
		.style('position', 'absolute')
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



	//add the data (from external function)
	addData(data, plot, xScale, yScale, circleColor, errColor);

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
		var t = plot.transition().duration(tDuration);
		plot.select(".axis--x").transition(t).call(xAxis);
		plot.select(".axis--y").transition(t).call(yAxis);
		plot.selectAll("circle").transition(t)
			.attr("cx", function(d) {return xScale(+d.x); })
			.attr("cy", function(d) {return yScale(+d.y); });
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

	return {"plot":plot,
			"xScale":xScale,
			"yScale":yScale};
}

function updatePhasePlot(multiple){
	console.log("updating phase")
	var period = inputData.period*multiple;

	phaseData = [];
	inputData.obsmjd.forEach(function(d, i){
		phaseData.push({"x":(parseFloat(inputData.obsmjd[i]) % period)/period, "y":parseFloat(inputData.mag_autocorr_mean[i]), "ye":parseFloat(inputData.magerr_auto[i])})
	})

	//addData(phaseData, phasePlot.plot, phasePlot.xScale, phasePlot.yScale)

	//update the data with same transition duration as zoom above
	var t = phasePlot.plot.transition().duration(tDuration);			
	phasePlot.plot.selectAll("circle").data(phaseData).transition(t)
		.attr("cx", function(d,i) {return phasePlot.xScale(+phaseData[i].x); })
	phasePlot.plot.selectAll(".error-line").data(phaseData).transition(t)
		.attr("x1", function(d,i) {return phasePlot.xScale(+phaseData[i].x);})
		.attr("x2", function(d,i) {return phasePlot.xScale(+phaseData[i].x);})
	phasePlot.plot.selectAll(".error-cap-top").data(phaseData).transition(t)
		.attr("x1", function(d,i) {return phasePlot.xScale(+phaseData[i].x) - errLen;})
		.attr("x2", function(d,i) {return phasePlot.xScale(+phaseData[i].x) + errLen;})
	phasePlot.plot.selectAll(".error-cap-bottom").data(phaseData).transition(t)
		.attr("x1", function(d,i) {return phasePlot.xScale(+phaseData[i].x) - errLen;})
		.attr("x2", function(d,i) {return phasePlot.xScale(+phaseData[i].x) + errLen;})

}

//create the plots
function startPlotting(){
	//raw data
	var	margin = {top: 0, right: 0, bottom: 60, left: 60},
		width = 500,
		height = 300;
	//reformat the data -- easier for plotting
	inputData.obsmjd.forEach(function(d, i){
		rawData.push({"x":parseFloat(inputData.obsmjd[i]), "y":parseFloat(inputData.mag_autocorr_mean[i]), "ye":parseFloat(inputData.magerr_auto[i])})
	})
	rawPlot = createPlot(rawData, width, height, margin, "Days", "Brightness");

	//phase plot
	var period = parseFloat(inputData.period); 
	inputData.obsmjd.forEach(function(d, i){
		phaseData.push({"x":(parseFloat(inputData.obsmjd[i]) % period)/period, "y":parseFloat(inputData.mag_autocorr_mean[i]), "ye":parseFloat(inputData.magerr_auto[i])})
	})
	phasePlot = createPlot(phaseData, width, height, margin, "Phase", "Brightness", left=0, top=(height + margin.bottom + margin.top));

	//buttons
	bwidth = 160;
	var buttonsDiv = d3.select("body").append("div")
		.attr('id','buttonsDiv')
		.style('width',bwidth+'px')
		.style('position','absolute')
		.style('top', '360px')
		.style('left', '500px');
	var wholePeriod = d3.select("#buttonsDiv").append('input')
		.attr('id', 'wholePeriodButton')
		.style('width',bwidth+'px')
		.attr('type','button')
		.attr('value','whole period')
		.attr('onclick','updatePhasePlot(1.)');
	var halfPeriod = d3.select("#buttonsDiv").append('input')
		.attr('id', 'halfPeriodButton')
		.style('width',bwidth+'px')
		.attr('type','button')
		.attr('value','half period')
		.attr('onclick','updatePhasePlot(0.5)');
	var twicePeriod = d3.select("#buttonsDiv").append('input')
		.attr('id', 'twicePeriodButton')
		.style('width',bwidth+'px')
		.attr('type','button')
		.attr('value','twice period')
		.attr('onclick','updatePhasePlot(2.0)');
}