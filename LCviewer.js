//see the look here, and match it? https://github.com/zooniverse/front-end-monorepo/pull/376

//could use a full screen button?
//also a help button (?)

//the params object holds all "global" variables
var params;
function defineParams(){
	ParamsInit = function() {
		//settings for plots
		this.idleTimeout;
		this.idleDelay = 350,
		this.errLen = 4, //error cap
		this.tDuration = 750;

		//will store the data from the file
		this.inputData;

		//will store reformatted data (somewhat wasteful!)
		this.rawData = [];
		this.phaseData = [];
		this.periodData = [];
		this.amplitudeData = [];

		//will store plots
		this.rawPlot;
		this.phasePlot;
		this.CMDPlot;
		this.periodPlot;
		this.amplitudePlot;

		this.ppos = 0; //which filter to use to define the period (for inputData.filters)
		this.mpos = 0; //which multiple to use (for inputData.multiples)

	}
	params = new ParamsInit();

}
defineParams();


//////////////
// helper function since d3.v4 removed d3.transform
// https://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4
//////////////
function getTransformation(transform) {
	var e = 0,
		f = 0,
		a = 0,
		b = 0,
		skewX = 0,
		scaleX = 1,
		scaleY = 1;

	if (transform != null){
		// Create a dummy g for calculation purposes only. This will never
		// be appended to the DOM and will be discarded once this function 
		// returns.
		var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

		// Set the transform attribute to the provided string value.
		g.setAttributeNS(null, "transform", transform);

		// consolidate the SVGTransformList containing all transformations
		// to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
		// its SVGMatrix. 
		var matrix = g.transform.baseVal.consolidate().matrix;

		// Below calculations are taken and adapted from the private function
		// transform/decompose.js of D3's module d3-interpolate.
		var {a, b, c, d, e, f} = matrix;   // ES6, if this doesn't work, use below assignment
		// var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
		var scaleX, scaleY, skewX;
		if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
		if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
		if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
		if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
	}

	return {
		translateX: e,
		translateY: f,
		rotate: Math.atan2(b, a) * 180 / Math.PI,
		skewX: Math.atan(skewX) * 180 / Math.PI,
		scaleX: scaleX,
		scaleY: scaleY
	};
}

//////////////
// add data to plot
//////////////
function addData(data, plot, xScale, yScale, r=3.5){
	// Add Error Line
	
	var lines = plot.selectAll('.line').data(data).enter();
	lines.append("line")
		.style("stroke", function(d) {return d.errColor;})
		.attr("class", function(d) {return "line error-line "+d.filter})
		.attr("x1", function(d) {return xScale(+d.x);})
		.attr("y1", function(d) {return yScale(+d.y + d.ye);})
		.attr("x2", function(d) {return xScale(+d.x);})
		.attr("y2", function(d) {return yScale(+d.y - d.ye);});

	// Add Error Top Cap
	lines.append("line")
		.style("stroke", function(d) {return d.errColor;})
		.attr("class", function(d) {return "line error-cap error-cap-top "+d.filter})
		.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
		.attr("y1", function(d) {return yScale(+d.y + d.ye);})
		.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
		.attr("y2", function(d) {return yScale(+d.y + d.ye);});
		
	// Add Error Bottom Cap
	lines.append("line")
		.style("stroke", function(d) {return d.errColor;})
		.attr("class", function(d) {return "error-cap error-cap-bottom "+d.filter})
		.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
		.attr("y1", function(d) {return yScale(+d.y - d.ye);})
		.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
		.attr("y2", function(d) {return yScale(+d.y - d.ye);});
	
	var circles = plot.selectAll('.circle').data(data).enter();
	circles.append("circle")
		.style("fill", function(d) {return d.circleColor;})
		.attr("class", function(d) {return "dot circle "+d.filter})
		.attr("r", r)
		.attr("cx", function(d) { return xScale(+d.x); })
		.attr("cy", function(d) { return yScale(+d.y); })
}


//////////////
// create the plot axes
//////////////
function createAxes(data, width, height, margin, xTitle, yTitle, className, topXlabel=false, rightYlabel=false, left=0, top=0, labelFontsize="18pt", axisFontsize="12pt", xExtent = null, yExtent = null, hideAllTicks = false, xFormat=d3.scaleLinear(), yFormat=d3.scaleLinear(), nXticks = 5, nYticks = 5){

	var x0 = [margin.left, width + margin.left ],
		y0 = [height + margin.top, margin.top];

	var xScale = xFormat.range(x0),
		yScale = yFormat.range(y0);


	var xAxisBottom = d3.axisBottom(xScale),
		xAxisTop = d3.axisTop(xScale),
		yAxisLeft = d3.axisLeft(yScale),
		yAxisRight = d3.axisLeft(yScale);


	if (xExtent == null) {
		xExtent = d3.extent(data, function(d) { return +d.x; })
	}
	if (yExtent == null){
		yExtent = d3.extent(data, function(d) { return (+d.y + d.ye); });
	}

	xScale.domain(xExtent).nice();
	yScale.domain(yExtent).nice();

	var plot = d3.select("#container").append("svg")
		.attr('class',className)
		.style('position', 'absolute')
		.attr("width", (width + margin.left + margin.right))
		.attr("height", (height + margin.top + margin.bottom))
		.attr("transform", "translate(" + left + "," + top + ")")


	//https://bl.ocks.org/jarandaf/df3e58e56e9d0d3b9adb
	var clipPath = plot.append('defs').append("clipPath")
		.attr("id","clip"+className);
	var clip = clipPath.append('rect')
		.attr("width", width)
		.attr("height", height)
		.attr("x",margin.left)
		.attr("y",margin.top);

	const main = plot.append('g')
		.attr('class', 'main')
		.attr('clip-path', 'url(#clip'+className+')');


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
		.attr("transform", "translate(" + (width + margin.left+1) + ",0)scale(-1,1)") //scale to keep ticks on outside of plot, but not sure why I need +1 in translate
		.attr("class", "axis axis-y-right")
		.style("font-size", axisFontsize)
		.call(yAxisRight)

	//cleanup ticks
	if (topXlabel){
		gXbottom.classed('axis-blank', true);
	} else{
		gXtop.classed('axis-blank', true);
	}
	if (rightYlabel){
		gYleft.classed('axis-blank', true);
	} else{
		gYright.classed('axis-blank', true);
	}

	gYleft.call(yAxisLeft.ticks(nYticks));
	gYright.call(yAxisRight.ticks(nYticks));
	gXtop.call(xAxisTop.ticks(nXticks));
	gXbottom.call(xAxisBottom.ticks(nXticks));

	if (hideAllTicks){
		gXbottom.classed('axis-blank', true);
		gXtop.classed('axis-blank', true);
		gYleft.classed('axis-blank', true);
		gYright.classed('axis-blank', true);
	}

	//axes labels
	var xXoffset = width/2. + margin.left;
		xYoffset = height + margin.bottom - 20
		yXoffset = -height/2.,
		yYoffset = 20;

	if (topXlabel){
		xYoffset = 20;
		yXoffset = -height; //not sure why this is needed
	}
	if (rightYlabel){
		yYoffset = width + margin.left + 30;
	}
	plot.append("text")
		.attr("class", "label")
		.attr("x", xXoffset)
		.attr("y", xYoffset)
		.style("text-anchor", "middle")
		.style("font-size", labelFontsize)
		.html(xTitle);
	plot.append("text")
		.attr("class", "label")
		.attr("transform", "rotate(-90)")
		.attr("x", yXoffset)
		.attr("y", yYoffset)
		.style("text-anchor", "middle")
		.style("font-size", labelFontsize)
		.html(yTitle)

	return {"plot":plot,
			"xScale":xScale,
			"yScale":yScale, 
			"xAxisBottom":xAxisBottom,
			"xAxisTop":xAxisTop,
			"yAxisLeft":yAxisLeft,
			"yAxisRight":yAxisRight,
			"xExtent":xExtent,
			"yExtent":yExtent, 
			"gXtop":gXtop,
			"gXbottom":gXbottom,
			"gYright":gYright,
			"gYleft":gYleft};

}


//////////////
// create the scatter plot, with possibility of background image
//////////////
function createScatterPlot(plotObj, data, backgroundImage = null){


	var main = plotObj.plot.select(".main"),
		rect = plotObj.plot.select("defs").select("clipPath").select("rect");

	var	width = parseFloat(rect.attr("width")),
		height = parseFloat(rect.attr("height")),
		left = parseFloat(rect.attr("x")),
		top = parseFloat(rect.attr("y"));

	var image = null;
	if (backgroundImage != null){
		image = main.append("image")
			.attr("width", width)
			.attr("height", height)
			.attr("x", left)
			.attr("y", top)
			.attr("xlink:href", backgroundImage);
	}


	//add the data (from external function)
	var r0 = 3.5; //circle radius
	addData(data, main, plotObj.xScale, plotObj.yScale, r=r0);

	//brush + zoom from here : https://bl.ocks.org/mbostock/f48fcdb929a620ed97877e4678ab15e6
	var brush = d3.brush().on("end", brushended);
	plotObj.plot.append("g")
		.attr("class", "brush")
		.call(brush);


	// helper functions for brushing and zooming
	function brushended() {

		var s = d3.event.selection;
		var translate = getTransformation(null)
		if (!s) {
			if (!params.idleTimeout) return params.idleTimeout = setTimeout(idled, params.idleDelay);
			plotObj.xScale.domain(plotObj.xExtent).nice();
			plotObj.yScale.domain(plotObj.yExtent).nice();
			s = [[left, top],
				[width + left, height + top]];
			translate = getTransformation(null)

		} else {
			plotObj.xScale.domain([plotObj.xScale.invert(s[0][0]), plotObj.xScale.invert(s[1][0])]);//.nice();
			plotObj.yScale.domain([plotObj.yScale.invert(s[1][1]), plotObj.yScale.invert(s[0][1])]);//.nice();
			plotObj.plot.select(".brush").call(brush.move, null);
			if (backgroundImage != null){
				var trans = image.attr("transform");
				if (trans == ""){
					trans = null;
				}
				translate = getTransformation(trans)
			}

		}
		zoom(s, translate);
	}

	function idled() {
		params.idleTimeout = null;
	}

	function zoom(s, translate) {

		var t = plotObj.plot.transition().duration(params.tDuration);
		//the points
		plotObj.plot.select(".axis-x-top").transition(t).call(plotObj.xAxisTop);
		plotObj.plot.select(".axis-x-bottom").transition(t).call(plotObj.xAxisBottom);
		plotObj.plot.select(".axis-y-left").transition(t).call(plotObj.yAxisLeft);
		plotObj.plot.select(".axis-y-right").transition(t).call(plotObj.yAxisRight);
		plotObj.plot.selectAll("circle").transition(t)
			.attr("cx", function(d) {return plotObj.xScale(+d.x); })
			.attr("cy", function(d) {return plotObj.yScale(+d.y); });
		plotObj.plot.selectAll(".error-line").transition(t)
			.attr("x1", function(d) {return plotObj.xScale(+d.x);})
			.attr("y1", function(d) {return plotObj.yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return plotObj.xScale(+d.x);})
			.attr("y2", function(d) {return plotObj.yScale(+d.y - d.ye);});
		plotObj.plot.selectAll(".error-cap-top").transition(t)
			.attr("x1", function(d) {return plotObj.xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return plotObj.yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return plotObj.xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return plotObj.yScale(+d.y + d.ye);});
		plotObj.plot.selectAll(".error-cap-bottom").transition(t)
			.attr("x1", function(d) {return plotObj.xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return plotObj.yScale(+d.y - d.ye);})
			.attr("x2", function(d) {return plotObj.xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return plotObj.yScale(+d.y - d.ye);});



		//the image
		if (backgroundImage != null){
			var sWidth = s[1][0] - s[0][0];
			var sHeight = s[1][1] - s[0][1];

			//distance from the edge
			var dEdgeX = s[0][0] - translate.translateX;
			var dEdgeY = s[0][1] - translate.translateY;

			//new scaling
			var scaleX = width/sWidth;
			var scaleY = height/sHeight;

			//multiply by old scaling for total scaling
			var sX = scaleX*translate.scaleX;
			var sY = scaleY*translate.scaleY;

			//translation
			var dx = left - dEdgeX*scaleX ;
			var dy = top  - dEdgeY*scaleY ;

			//now scale and translate the image
			image.transition(t)
				.attr("transform","translate(" + dx +  "," + dy + ")scale(" + sX + "," + sY +")")

			//increase the size of the circle
			plotObj.plot.selectAll("circle").transition(t).attr("r",r0*sX);

	

		}


	}

}

//////////////
// create the bar plot (for period and amplitude spines)
//////////////
function createBarPlot(plotObj, data, horizontal = false){

	var main = plotObj.plot.select(".main"),
		rect = plotObj.plot.select("defs").select("clipPath").select("rect");

	//disable clipping
	main.attr("clip-path",null);

	var	width = parseFloat(rect.attr("width")),
		height = parseFloat(rect.attr("height")),
		left = parseFloat(rect.attr("x")),
		top = parseFloat(rect.attr("y"));

	var bar = main.selectAll("bar").data(data).enter().append("rect");
	bar.style("fill", function(d) {return d.color})
		.attr("class",function(d) {return "bar-rect "+d.filter})
		.attr("rx",4)
		.attr("ry",4);
	if (horizontal){
		bar.attr("x", left)
			.attr("width", function(d) { return plotObj.xScale(+d.y) - left;})
			.attr("y", function(d, i) {return height/data.length*i + top; }) 
			.attr("height",  height/data.length*0.8);
	} else {
		bar.attr("x", function(d, i) {return width/data.length*i + left; })
			.attr("width", width/data.length*0.8)
			.attr("y", function(d) { return (plotObj.yScale(+d.y));}) 
			.attr("height", function(d) { return height + top - plotObj.yScale(+d.y);})
	}

}

//////////////
// updates to the buttons
//////////////
function updateButtons(){

	var periodSelectID = "#periodSelectButton"+params.ppos;
	var periodModID = "#periodModButton"+params.mpos;

	//reset all buttons
	var b = d3.selectAll('.button');
	b.classed('clicked', false);
	d3.selectAll('.periodModButton').style('background-color',null)

	//filter select box
	d3.select(periodSelectID).classed('clicked', true);

	//period modification box
	b = d3.select(periodModID)
	b.style('background-color',params.inputData[params.inputData.filters[params.ppos]].color);
	b.classed('clicked', true);

	//outlines on the bars
	params.inputData.filters.forEach(function(filter, j){
		params.periodPlot.plot.selectAll("."+filter).classed("barSelected", false);
		params.amplitudePlot.plot.selectAll("."+filter).classed("barSelected", false);
	});

	//outlines on rects
	params.periodPlot.plot.selectAll("."+params.inputData.filters[params.ppos]).classed("barSelected", true);
	params.amplitudePlot.plot.selectAll("."+params.inputData.filters[params.ppos]).classed("barSelected", true);

	//length of period rects
	var period = params.inputData[params.inputData.filters[params.ppos]].period*params.inputData.multiples[params.mpos],
		left = parseFloat(params.periodPlot.plot.select("defs").select("clipPath").select("rect").attr("x"));

	//console.log(period, params.periodPlot.xScale(+period))
	var t = params.periodPlot.plot.transition().duration(params.tDuration);			
	params.periodPlot.plot.selectAll(".bar-rect").transition(t)
		.attr("width", function(d) {return params.periodPlot.xScale(+d.y*params.inputData.multiples[params.mpos]) - left;}) ;

}

//////////////
// updates to the phase plot (including transitions)
//////////////
function updatePhasePlot(){

	var period = params.inputData[params.inputData.filters[params.ppos]].period*params.inputData.multiples[params.mpos];

	var p = 0;
	params.inputData.filters.forEach(function(filter, j){

		params.inputData[filter].obsmjd.forEach(function(d, i){
			params.phaseData[p].x = (parseFloat(params.inputData[filter].obsmjd[i]) % period)/period;
			p += 1;
		})
	});

	//update the data with same transition duration as zoom above
	var t = params.phasePlot.plot.transition().duration(params.tDuration);			
	params.phasePlot.plot.selectAll("circle").data(params.phaseData).transition(t)
		.attr("cx", function(d,i) {return params.phasePlot.xScale(+params.phaseData[i].x); })
	params.phasePlot.plot.selectAll(".error-line").data(params.phaseData).transition(t)
		.attr("x1", function(d,i) {return params.phasePlot.xScale(+params.phaseData[i].x);})
		.attr("x2", function(d,i) {return params.phasePlot.xScale(+params.phaseData[i].x);})
	params.phasePlot.plot.selectAll(".error-cap-top").data(params.phaseData).transition(t)
		.attr("x1", function(d,i) {return params.phasePlot.xScale(+params.phaseData[i].x) - params.errLen;})
		.attr("x2", function(d,i) {return params.phasePlot.xScale(+params.phaseData[i].x) + params.errLen;})
	params.phasePlot.plot.selectAll(".error-cap-bottom").data(params.phaseData).transition(t)
		.attr("x1", function(d,i) {return params.phasePlot.xScale(+params.phaseData[i].x) - params.errLen;})
		.attr("x2", function(d,i) {return params.phasePlot.xScale(+params.phaseData[i].x) + params.errLen;})

}

//////////////
// create the plots
//////////////
function startPlotting(){
	//raw data
	var	marginDays = {top: 50, right: 15, bottom: 5, left: 65},
		heightDays = 100,
		widthDays = 500,
		marginPhase = {top: 5, right: 15, bottom: 65, left: 65},
		heightPhase = 300,
		widthPhase = widthDays, 
		marginCMD = {top: 5, right: 5, bottom: 65, left: 65},
		heightCMD = heightDays + heightPhase + 25, //I don't quite understand the sizing here
		widthCMD = 400;
		marginPeriod = {top: 5, right: 5, bottom: 65, left: 65},
		heightPeriod = 50, 
		widthPeriod = widthDays
		marginAmplitude = {top: 5, right: 65, bottom: 5, left: 5},
		heightAmplitude = heightPhase, 
		widthAmplitude = 50;

	var period = params.inputData[params.inputData.filters[params.ppos]].period;


	params.inputData.filters.forEach(function(filter, j){

		params.periodData.push({"x":j, 
				"y":parseFloat(params.inputData[filter].period),
				"ye":0.,
				"color":params.inputData[filter].color,
				"filter":filter
			});

		params.amplitudeData.push({"x":j, 
				"y":parseFloat(params.inputData[filter].amplitude),
				"ye":0.,
				"color":params.inputData[filter].color,
				"filter":filter
			});

		//reformat the data -- easier for plotting
		params.inputData[filter].obsmjd.forEach(function(d, i){
			params.rawData.push({"x":parseFloat(params.inputData[filter].obsmjd[i]), 
				"y":parseFloat(params.inputData[filter].mag_autocorr_mean[i]), 
				"ye":parseFloat(params.inputData[filter].magerr_auto[i]),  
				"circleColor":params.inputData[filter].color, 
				"errColor":params.inputData[filter].color,
				"filter":filter
			});
			params.phaseData.push({"x":(parseFloat(params.inputData[filter].obsmjd[i]) % period)/period, 
				"y":parseFloat(params.inputData[filter].mag_autocorr_mean[i]), 
				"ye":parseFloat(params.inputData[filter].magerr_auto[i]),
				"circleColor":params.inputData[filter].color, 
				"errColor":params.inputData[filter].color,
				"filter":filter
			});
		})

	});

	//dummy data for now
	var foo = [{"x":2,
				"y":5,
				"ye":1,
				"circleColor":"black",
				"errColor":"none"}];
	params.CMDPlot = createAxes(foo, 
								widthCMD, 
								heightCMD, 
								marginCMD, 
								"&larr;Temperature", 
								"Brightness&rarr;", 
								"CMDPlot", 
								topXlabel=false, 
								rightYlabel=false, 
								left=0,
								top=(marginDays.top - marginDays.bottom), //I don't quite understand the position here
								labelFontsize="18pt", 
								axisFontsize="12pt",
								xExtent = [-0.7644119, 4.715261459350586], 
								yExtent=[16.3, -3.263948750885376],
								hideAllTicks = true);								 
	createScatterPlot(params.CMDPlot, foo, backgroundImage = "data/CMDbackground.svg");

	var leftPos = (widthCMD + marginCMD.left + marginCMD.right + 40);
	params.rawPlot = createAxes(params.rawData, 
								widthDays, 
								heightDays, 
								marginDays, 
								"Time (days)", 
								"Brightness&rarr;", 
								"rawPlot", 
								topXlabel=true, 
								rightYlabel=false, 
								left=leftPos, 
								top=0, 
								labelFontsize="12pt", 
								axisFontsize="10pt");
	createScatterPlot(params.rawPlot, params.rawData);

	params.phasePlot = createAxes(params.phaseData, 
								widthPhase, 
								heightPhase, 
								marginPhase, 
								"Phase", 
								"Brightness&rarr;", 
								"phasePlot", 
								topXlabel=false, 
								rightYlabel=false, 
								left=leftPos, 
								top=(heightDays + marginPhase.bottom + marginPhase.top));
	createScatterPlot(params.phasePlot, params.phaseData);

	params.periodPlot = createAxes(params.periodData, 
								widthPeriod, 
								heightPeriod, 
								marginPeriod, 
								"Period&rarr;", 
								"", 
								"periodPlot", 
								topXlabel=false, 
								rightYlabel=false, 
								left=leftPos,
								top=(heightDays + heightPhase + marginPhase.bottom + marginPhase.top + marginDays.bottom + marginDays.top), 
								labelFontsize="12pt", 
								axisFontsize="10pt",
								xExtent = [0.1, 1000], 
								yExtent = [0,params.periodData.length],
								hideAllTicks = true,
								xFormat = d3.scaleLog().base(10),
								yFormat = d3.scaleLinear(),
								nXticks = 4);					
	createBarPlot(params.periodPlot, params.periodData, horizontal = true);
	//hide some axes
	params.periodPlot.gXtop.classed("hidden",true)
	params.periodPlot.gYleft.classed("hidden",true)
	params.periodPlot.gYright.classed("hidden",true)

	params.amplitudePlot = createAxes(params.amplitudeData, 
								widthAmplitude, 
								heightAmplitude, 
								marginAmplitude, 
								"", 
								"Amplitude&rarr;", 
								"amplitudePlot", 
								topXlabel=false, 
								rightYlabel=true, 
								left=leftPos + widthPhase + marginPhase.left + marginPhase.right,
								top=(heightDays + marginPhase.bottom + marginPhase.top), 
								labelFontsize="12pt", 
								axisFontsize="10pt",
								xExtent = [0,params.amplitudeData.length], 
								yExtent = [0.01, 10],
								hideAllTicks = true,
								xFormat = d3.scaleLinear(),
								yFormat = d3.scaleLog().base(10),
								nXticks = 1,
								nYticks = 3);					
	createBarPlot(params.amplitudePlot, params.amplitudeData);
	//hide some axes
	params.amplitudePlot.gXtop.classed("hidden",true)
	params.amplitudePlot.gXbottom.classed("hidden",true)
	params.amplitudePlot.gYleft.classed("hidden",true)
	//console.log(params.amplitudePlot.gYright.selectAll('.tick').selectAll('line').attr("x2", 6))

	//initial outlines on the bars
	params.periodPlot.plot.selectAll("."+params.inputData.filters[params.ppos]).classed("barSelected", true);
	params.amplitudePlot.plot.selectAll("."+params.inputData.filters[params.ppos]).classed("barSelected", true);


	//select the period from the rect
	params.inputData.filters.forEach(function(filt, j){
		params.periodPlot.plot.selectAll("."+filt)
			.on('click',function(d){
				params.ppos = j;
				updateButtons();
				updatePhasePlot();
			});
		params.amplitudePlot.plot.selectAll("."+filt)
			.on('click',function(d){
				params.ppos = j;
				updateButtons();
				updatePhasePlot();
			});
	});

	//create the buttons
	var leftPos = (widthDays + marginDays.left + marginDays.right + widthCMD + marginCMD.left + marginCMD.right + 200) + 'px'
	var periodSelectDiv = d3.select("#container").append("div")
		.attr('id','periodSelectDiv')
		.attr('class','buttonsDiv')
		.style('position','absolute')
		.style('top', (marginDays.top + 25) + 'px')
		.style('left', leftPos)
		.text('1) Select the filter.')
	params.inputData.filters.forEach(function(filt, j){
		periodSelectDiv.append('div')
			.attr('id', 'periodSelectButton'+j)
			.attr('class', 'button')
			.style('background-color', params.inputData[filt].color)
			.text(filt)
			.on('click',function(d){
				params.ppos = j;
				updateButtons();
				updatePhasePlot();
			});
	});
	d3.select("#periodSelectButton"+params.ppos).classed('clicked', true)

	var bsize = periodSelectDiv.node().getBoundingClientRect();

	var periodModDiv = d3.select("#container").append("div")
		.attr('id','periodModDiv')
		.attr('class','buttonsDiv')
		.style('position','absolute')
		.style('top', (bsize.y + bsize.height + 20) + 'px')
		.style('left', leftPos)
		.text('2) Modify the period.')
	params.inputData.multiples.forEach(function(m, j){
		periodModDiv.append('div')
			.attr('id', 'periodModButton'+j)
			.attr('class', 'button periodModButton')
			.text(params.inputData.mnames[j])
			.on('click',function(d){
				params.mpos = j;
				updateButtons()
				updatePhasePlot()
			});	
		});
	b = d3.select("#periodModButton"+params.mpos);
	b.classed('clicked', true);
	b.style('background-color',params.inputData[params.inputData.filters[params.ppos]].color);


}

//////////////
// first, read in the data
//////////////
d3.json("data/27882110006813.json")
	.then(function(data) {
		params.inputData = data;
		startPlotting();
	});