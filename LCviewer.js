
//some initial definitions
var	idleTimeout,
	idleDelay = 350,
	errLen = 4, //error cap
	tDuration = 750;

//will store plots
var rawPlot,phasePlot;

//will store the data from the file
var inputData;

//will store reformatted data (somewhat wasteful!)
var phaseData = [],
	rawData = [];

var ppos = 0; //which filter to use to define the period
var mpos = 0; //which multiple to use

var multiples = [1, 0.5, 2., 3.]; //multiplicative factor for the period
var mnames = {1.:"whole period",0.5:"half the period",2.:"twice the period",3.:"triple the period"}; //names for the buttons

d3.json("data/27882110006813.json")
	.then(function(data) {
		inputData = data;
		startPlotting();
	});

//////////////
// add data to plot
//////////////
function addData(data, plot, xScale, yScale){
	// Add Error Line
	plot.append("g").selectAll("line")
		.data(data).enter()
			.append("line")
			.style("stroke", function(d) {return d.errColor;})
			.attr("class", "error-line")
			.attr("x1", function(d) {return xScale(+d.x);})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x);})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});

	// Add Error Top Cap
	plot.append("g").selectAll("line")
		.data(data).enter()
			.append("line")
			.style("stroke", function(d) {return d.errColor;})
			.attr("class", "error-cap error-cap-top")
			.attr("x1", function(d) {return xScale(+d.x) - errLen;})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + errLen;})
			.attr("y2", function(d) {return yScale(+d.y + d.ye);});
		
	// Add Error Bottom Cap
	plot.append("g").selectAll("line")
		.data(data).enter()
			.append("line")
			.style("stroke", function(d) {return d.errColor;})
			.attr("class", "error-cap error-cap-bottom")
			.attr("x1", function(d) {return xScale(+d.x) - errLen;})
			.attr("y1", function(d) {return yScale(+d.y - d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + errLen;})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});
	
	plot.append("g").selectAll("circle")
		.data(data).enter()
			.append("circle")
			.style("fill", function(d) {return d.circleColor;})
			.attr("class", "dot circle")
			.attr("r", 3.5)
			.attr("cx", function(d) { return xScale(+d.x); })
			.attr("cy", function(d) { return yScale(+d.y); })
}

//////////////
// setup the plot
//////////////
function createPlot(data, width, height, margin, xTitle, yTitle, className, topXlabel=false, left=0, top=0, labelFontsize="18pt", axisFontsize="12pt"){

	var x0 = [margin.left, width + margin.left ],
		y0 = [height + margin.top, margin.top];
	var xScale = d3.scaleLinear().range(x0),
		yScale = d3.scaleLinear().range(y0);


	var xAxisBottom = d3.axisBottom(xScale),
		xAxisTop = d3.axisTop(xScale),
		yAxisLeft = d3.axisLeft(yScale),
		yAxisRight = d3.axisLeft(yScale);


	var xExtent = d3.extent(data, function(d) { return +d.x; }),
		yExtent = d3.extent(data, function(d) { return (+d.y + d.ye); });

	xScale.domain(xExtent).nice();
	yScale.domain(yExtent).nice();

	var plot = d3.select("body").append("svg")
		.attr('class',className)
		.style('position', 'absolute')
		.attr("width", (width + margin.left + margin.right))
		.attr("height", (height + margin.top + margin.bottom))
		.attr("transform", "translate(" + left + "," + top + ")")

	//axes
	var gXbottom = plot.append("g")
		.attr("class", "axis axis-x-bottom")
		.attr("transform", "translate(0," + (height + margin.top) + ")")
		.style("font-size", axisFontsize)
		.call(xAxisBottom)
	var gXtop = plot.append("g")
		.attr("class", "axis axis-x-top")
		.attr("transform", "translate(0," + (margin.top) + ")")
		.style("font-size", axisFontsize)
		.call(xAxisTop)
	var gYleft = plot.append("g")
		.attr("transform", "translate(" + margin.left + ",0)")
		.attr("class", "axis axis-y-left")
		.style("font-size", axisFontsize)
		.call(yAxisLeft)
	var gYright = plot.append("g")
		.attr("transform", "translate(" + (width + margin.left) + ",0)")
		.attr("class", "axis axis-y-right axis-blank")
		.style("font-size", axisFontsize)
		.call(yAxisRight)

	//cleanup ticks
	if (topXlabel){
		gXbottom.classed('axis-blank', true);
	} else{
		gXtop.classed('axis-blank', true);
	}
	gYleft.call(yAxisLeft.ticks(5));
	gYright.call(yAxisRight.ticks(5));
	gXtop.call(xAxisTop.ticks(5));
	gXbottom.call(xAxisBottom.ticks(5));

	//axes labels
	var yoffset = height + margin.bottom - 20,
		xoffset = -height/2.
	if (topXlabel){
		yoffset = 20;
		xoffset = -height;
	}
	plot.append("text")
		.attr("class", "label")
		.attr("x", width/2. + margin.left)
		.attr("y", yoffset)
		.style("text-anchor", "middle")
		.style("font-size", labelFontsize)
		.html(xTitle);
	plot.append("text")
		.attr("class", "label")
		.attr("transform", "rotate(-90)")
		.attr("x", xoffset)
		.attr("y", 20)
		.style("text-anchor", "middle")
		.style("font-size", labelFontsize)
		.html(yTitle)


	//add the data (from external function)
	addData(data, plot, xScale, yScale);

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
		plot.select(".axis-x-top").transition(t).call(xAxisTop);
		plot.select(".axis-x-bottom").transition(t).call(xAxisBottom);
		plot.select(".axis-y-left").transition(t).call(yAxisLeft);
		plot.select(".axis-y-right").transition(t).call(yAxisRight);
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

function updateButtons(){

	var periodSelectID = "#periodSelectButton"+ppos;
	var periodModID = "#periodModButton"+mpos;

	//reset all buttons
	var b = d3.selectAll('.button');
	b.classed('clicked', false);
	d3.selectAll('.periodModButton').style('background-color',null)

	//filter select box
	d3.select(periodSelectID).classed('clicked', true);

	//period modification box
	b = d3.select(periodModID)
	b.style('background-color',inputData[inputData.filters[ppos]].color);
	b.classed('clicked', true);


}
function updatePhasePlot(){

	var period = inputData[inputData.filters[ppos]].period*multiples[mpos];

	var p = 0;
	inputData.filters.forEach(function(filter, j){

		inputData[filter].obsmjd.forEach(function(d, i){
			phaseData[p].x = (parseFloat(inputData[filter].obsmjd[i]) % period)/period;
			p += 1;
		})
	});

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
	var	marginDays = {top: 50, right: 15, bottom: 5, left: 65},
		marginPhase = {top: 5, right: 15, bottom: 65, left: 65},
		heightDays = 100,
		heightPhase = 300,
		width = 500;

	var period = inputData[inputData.filters[ppos]].period;

	inputData.filters.forEach(function(filter, j){

		//reformat the data -- easier for plotting

		inputData[filter].obsmjd.forEach(function(d, i){
			rawData.push({"x":parseFloat(inputData[filter].obsmjd[i]), 
				"y":parseFloat(inputData[filter].mag_autocorr_mean[i]), 
				"ye":parseFloat(inputData[filter].magerr_auto[i]),  
				"circleColor":inputData[filter].color, 
				"errColor":inputData[filter].color
			});
			phaseData.push({"x":(parseFloat(inputData[filter].obsmjd[i]) % period)/period, 
				"y":parseFloat(inputData[filter].mag_autocorr_mean[i]), 
				"ye":parseFloat(inputData[filter].magerr_auto[i]),
				"circleColor":inputData[filter].color, 
				"errColor":inputData[filter].color
			});
		})

	});

	rawPlot = createPlot(rawData, width, heightDays, marginDays, "Time (d)", "Brightness&rarr;", "rawPlot", topXlabel=true, left=0, top=0, labelFontsize="12pt", axisFontsize="10pt");

	phasePlot = createPlot(phaseData, width, heightPhase, marginPhase, "Phase", "Brightness&rarr;", "phasePlot", topXlabel=false, left=0, top=(heightDays + marginPhase.bottom + marginPhase.top));

	//create the buttons
	var periodSelectDiv = d3.select("body").append("div")
		.attr('id','periodSelectDiv')
		.attr('class','buttonsDiv')
		.style('position','absolute')
		.style('top', (marginDays.top + 40) + 'px')
		.style('left', (width + marginDays.left + marginDays.right + 50) + 'px')
		.text('1) Select the filter.')
	inputData.filters.forEach(function(filt, j){
		periodSelectDiv.append('div')
			.attr('id', 'periodSelectButton'+j)
			.attr('class', 'button')
			.style('background-color', inputData[filt].color)
			.text(filt)
			.on('click',function(d){
				ppos = j;
				updateButtons();
				updatePhasePlot();
			});
	});
	d3.select("#periodSelectButton"+ppos).classed('clicked', true)

	var bsize = periodSelectDiv.node().getBoundingClientRect();

	var periodModDiv = d3.select("body").append("div")
		.attr('id','periodModDiv')
		.attr('class','buttonsDiv')
		.style('position','absolute')
		.style('top', (bsize.y + bsize.height + 20) + 'px')
		.style('left', (width + marginDays.left + marginDays.right + 50) + 'px')
		.text('2) Modify the period.')
	multiples.forEach(function(m, j){
		periodModDiv.append('div')
			.attr('id', 'periodModButton'+j)
			.attr('class', 'button periodModButton')
			.text(mnames[m])
			.on('click',function(d){
				mpos = j;
				updateButtons()
				updatePhasePlot()
			});	
		});
	b = d3.select("#periodModButton"+mpos);
	b.classed('clicked', true);
	b.style('background-color',inputData[inputData.filters[ppos]].color);


}