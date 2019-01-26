//see the look here, and match it? https://github.com/zooniverse/front-end-monorepo/pull/376

//could use a full screen button?

//could make a fun transition between feature plots (flying in/out from side)

//the params object holds all "global" variables
var params;
function defineParams(){
	ParamsInit = function() {
		//settings for plots
		this.idleTimeout;
		this.idleDelay = 350,
		this.errLen = 4, //error cap
		this.tDuration = 500;

		//will store the data from the file
		this.inputData;

		//will store plots
		this.rawPlot;
		this.phasePlot;
		this.CMDPlot;
		this.featurePlots = [];

		this.period;
		this.periodMultiple = 1.;

		this.ppos = 0; //which filter to use to define the period (for inputData.filters)
		this.mpos = 0; //which multiple to use (for inputData.multiples)
		this.fpos = 0; //which feature plot to show

		this.r0 = 3.5; //size of circles in plots
		this.phaseLim = 0.2;// region in phase plot to repeat on either side

		//positions for all the plots
		this.plotPositions = {};
		var width = 500,
			topPos = 75,
			leftPos = 5;

		this.plotPositions.marginPhase = {top: 50, right: 5, bottom: 65, left: 65}; //adding to the bottom so that I can shift the y label
		this.plotPositions.heightPhase = 300;
		this.plotPositions.widthPhase = width;
		this.plotPositions.leftPhase = leftPos;
		this.plotPositions.topPhase = topPos;

		this.plotPositions.marginDays = {top: 5, right: 5, bottom: 65, left: 65};
		this.plotPositions.heightDays = 100;
		this.plotPositions.widthDays = width;
		this.plotPositions.leftDays = leftPos;
		this.plotPositions.topDays = topPos + this.plotPositions.heightPhase + this.plotPositions.marginPhase.top + 5; //5 is the desired marginPhase.bottom

		this.plotPositions.marginCMD = {top: 50, right: 5, bottom: 65, left: 5};
		this.plotPositions.heightCMD = this.plotPositions.heightDays + this.plotPositions.heightPhase  + this.plotPositions.marginDays.top + 5; //5 is the desired marginPhase.bottom
		this.plotPositions.widthCMD = this.plotPositions.heightPhase;
		this.plotPositions.leftCMD = leftPos + width + this.plotPositions.marginPhase.left + this.plotPositions.marginPhase.right;
		this.plotPositions.topCMD = topPos;

		this.plotPositions.marginFeature = {top: 2, right: 5, bottom: 30, left: 15};
		this.plotPositions.heightFeature = 50; 
		this.plotPositions.widthFeature = this.plotPositions.widthDays - 10;
		this.plotPositions.leftFeature = 325;
		this.plotPositions.topFeature = 0;


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
function addData(data, plot, xScale, yScale, errorType="line"){
	// Add Error Line
	if (errorType == "line"){
		var lines = plot.selectAll('.line').data(data).enter();
		lines.append("line")
			.style("stroke", function(d) {return d.c;})
			.attr("class", function(d) {return "line error-line "+d.filter})
			.attr("x1", function(d) {return xScale(+d.x);})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x);})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});

		// Add Error Top Cap
		lines.append("line")
			.style("stroke", function(d) {return d.c;})
			.attr("class", function(d) {return "line error-cap error-cap-top "+d.filter})
			.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return yScale(+d.y + d.ye);});
			
		// Add Error Bottom Cap
		lines.append("line")
			.style("stroke", function(d) {return d.c;})
			.attr("class", function(d) {return "line error-cap error-cap-bottom "+d.filter})
			.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return yScale(+d.y - d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});

		var circles = plot.selectAll('.circle').data(data).enter();
		circles.append("circle")
			.style("fill", function(d) {return d.c;})
			.attr("class", function(d) {return "dot circle "+d.filter})
			.attr("r", function(d) {return d.r})
			.attr("cx", function(d) { return xScale(+d.x); })
			.attr("cy", function(d) { return yScale(+d.y); })
	} else {
		//elliptical errors
		var circles = plot.selectAll('.ellipse').data(data).enter();
		circles.append("ellipse")
			.style("fill", function(d) {return d.c;})
			.attr("class", function(d) {return "dot circle "+d.filter})
			.attr("rx", function(d) { return d.rx; })
			.attr("ry", function(d) { return d.ry; })
			.attr("cx", function(d) { return xScale(+d.x); })
			.attr("cy", function(d) { return yScale(+d.y); })
	}


}

function updatePlotData(plotObj, tDur=params.tDuration, rScale=1.){

	var t = d3.transition().duration(tDur);

	//the points
	plotObj.plot.select(".axis-x-top").transition(t).call(plotObj.xAxisTop);
	plotObj.plot.select(".axis-x-bottom").transition(t).call(plotObj.xAxisBottom);
	plotObj.plot.select(".axis-y-left").transition(t).call(plotObj.yAxisLeft);
	plotObj.plot.select(".axis-y-right").transition(t).call(plotObj.yAxisRight);
	if (plotObj.errorType == "line"){
		plotObj.plot.selectAll("circle").transition(t)
			.attr("cx", function(d) {return plotObj.xScale(+d.x); })
			.attr("cy", function(d) {return plotObj.yScale(+d.y); })
			.attr("r", function(d) {return rScale*d.r; });
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
	} else {
		plotObj.plot.selectAll("ellipse").transition(t)
			.attr("cx", function(d) {return plotObj.xScale(+d.x); })
			.attr("cy", function(d) {return plotObj.yScale(+d.y); })
			.attr("rx", function(d) {return rScale*d.rx; })
			.attr("ry", function(d) {return rScale*d.ry; });
	}

	//I would rather include this in updatePhasePlot, but this needs to work on zoom as well...
	if (! plotObj.plot.select("#phaseBlockLeft").empty()){
		var w = plotObj.xScale(0) - plotObj.xScale(-params.phaseLim);
		plotObj.plot.select("#phaseBlockLeft").transition(t)
			.attr("x",plotObj.xScale(-params.phaseLim))
			.attr("width",w);
		plotObj.plot.select("#phaseBlockRight").transition(t)
			.attr("x",plotObj.xScale(1))
			.attr("width",w);
	}
}
//////////////
// create the plot axes
//////////////
function createAxes(data, width, height, margin, xTitle, yTitle, className, topXlabel=false, rightYlabel=false, left=0, top=0, labelFontsize="18pt", axisFontsize="10pt", xExtent = null, yExtent = null, hideAllTicks = false, xFormat=d3.scaleLinear(), yFormat=d3.scaleLinear(), nXticks = 5, nYticks = 5){

	var x0 = [margin.left, width + margin.left ],
		y0 = [height + margin.top, margin.top];

	var xScale = xFormat.range(x0),
		yScale = yFormat.range(y0);


	//for style, I want the ticks inside, but the labels outside.  
	//I will reposition ticks and text later
	var xAxisBottom = d3.axisBottom(xScale),
		xAxisTop = d3.axisTop(xScale),
		yAxisLeft = d3.axisLeft(yScale),
		yAxisRight = d3.axisRight(yScale);


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
		.style('top',top)
		.style('left',left)
		.attr("width", (width + margin.left + margin.right))
		.attr("height", (height + margin.top + margin.bottom))
		//.attr("transform", "translate(" + left + "," + top + ")")


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
		.attr("transform", "translate(" + (width + margin.left) + ",0)") 
		.attr("class", "axis axis-y-right")
		.style("font-size", axisFontsize)
		.call(yAxisRight)

	gYleft.call(yAxisLeft.ticks(nYticks));
	gYright.call(yAxisRight.ticks(nYticks));
	gXtop.call(xAxisTop.ticks(nXticks));
	gXbottom.call(xAxisBottom.ticks(nXticks));

	//cleanup ticks
	//flip them
	var y2 = parseFloat(gXtop.selectAll('.tick').selectAll('line').attr("y2"));
	gXtop.selectAll('.tick').selectAll('line').attr("transform","translate(0,"+ (-y2)+")");
	var y2 = parseFloat(gXbottom.selectAll('.tick').selectAll('line').attr("y2"));
	gXbottom.selectAll('.tick').selectAll('line').attr("transform","translate(0,"+(-y2)+")");
	var x2 = parseFloat(gYleft.selectAll('.tick').selectAll('line').attr("x2"));
	gYleft.selectAll('.tick').selectAll('line').attr("transform","translate("+(-x2)+",0)");
	var x2 = parseFloat(gYright.selectAll('.tick').selectAll('line').attr("x2"));
	gYright.selectAll('.tick').selectAll('line').attr("transform","translate("+(-x2)+",0)");

	//and the "domain"
	gXtop.select('.domain').attr("transform","scale(1,-1)");
	gXbottom.select('.domain').attr("transform","scale(1,-1)");
	gYleft.select('.domain').attr("transform","scale(-1,1)");
	gYright.select('.domain').attr("transform","scale(-1,1)");

	//remove additional numbers
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


	if (hideAllTicks){
		gXbottom.classed('axis-blank', true);
		gXtop.classed('axis-blank', true);
		gYleft.classed('axis-blank', true);
		gYright.classed('axis-blank', true);
	}



	//axes labels
	var xXoffset = width/2. + margin.left,
		xYoffset = (height + margin.bottom),
		yXoffset = -height/2. - yTitle.length/4.*parseFloat(labelFontsize), //seems to look OK, but not ideal
		yYoffset = 20;

	if (topXlabel){
		xYoffset = 20;
		//yXoffset = -height; //not sure why this is needed
	}
	if (rightYlabel){
		yYoffset = width + margin.left + 30;
	}
	plot.append("text")
		.attr("class", "label x-title")
		.attr("x", xXoffset)
		.attr("y", xYoffset)
		.style("text-anchor", "middle")
		.style("font-size", labelFontsize)
		.html(xTitle);
	plot.append("text")
		.attr("class", "label y-title")
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
			"gYleft":gYleft,
			"image":null};

}


//////////////
// create the scatter plot
//////////////
function createScatterPlot(plotObj, data, errorType="line"){

	var main = plotObj.plot.select(".main"),
		rect = plotObj.plot.select("defs").select("clipPath").select("rect");

	var	width = parseFloat(rect.attr("width")),
		height = parseFloat(rect.attr("height")),
		left = parseFloat(rect.attr("x")),
		top = parseFloat(rect.attr("y"));

	plotObj.errorType = errorType;

	//add the data (from external function)
	addData(data, main, plotObj.xScale, plotObj.yScale, errorType=errorType);

	//enable zooming
	addBrushZoom(plotObj);

}

//////////////
// zoom functionality, with possibility of a background image
//////////////
function addBrushZoom(plotObj){

	var rect = plotObj.plot.select("defs").select("clipPath").select("rect");

	var	width = parseFloat(rect.attr("width")),
		height = parseFloat(rect.attr("height")),
		left = parseFloat(rect.attr("x")),
		top = parseFloat(rect.attr("y"));

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
			if (plotObj.image != null){
				var trans = plotObj.image.attr("transform");
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
		//the image
		var sX = 1.
		if (plotObj.image != null){
			var sWidth = s[1][0] - s[0][0];
			var scaleX = width/sWidth;
		 	sX = scaleX*translate.scaleX;
			updatePlotImage(plotObj, s, translate, tDur = params.tDuration)
		}

		//the data
		updatePlotData(plotObj, tDur = params.tDuration, rScale = sX);

		//flip any new ticks
		var y2 = parseFloat(plotObj.gXtop.selectAll('.tick').selectAll('line').attr("y2"));
		plotObj.gXtop.selectAll('.tick').selectAll('line').attr("transform","translate(0,"+ (-y2)+")");
		var y2 = parseFloat(plotObj.gXbottom.selectAll('.tick').selectAll('line').attr("y2"));
		plotObj.gXbottom.selectAll('.tick').selectAll('line').attr("transform","translate(0,"+(-y2)+")");
		var x2 = parseFloat(plotObj.gYleft.selectAll('.tick').selectAll('line').attr("x2"));
		plotObj.gYleft.selectAll('.tick').selectAll('line').attr("transform","translate("+(-x2)+",0)");
		var x2 = parseFloat(plotObj.gYright.selectAll('.tick').selectAll('line').attr("x2"));
		plotObj.gYright.selectAll('.tick').selectAll('line').attr("transform","translate("+(-x2)+",0)");




	}
}
//////////////
// add a background image to a plot (e.g., for the CMD)
//////////////
function addImageToPlot(plotObj, backgroundImage){


	var main = plotObj.plot.select(".main"),
		rect = plotObj.plot.select("defs").select("clipPath").select("rect");

	var	width = parseFloat(rect.attr("width")),
		height = parseFloat(rect.attr("height")),
		left = parseFloat(rect.attr("x")),
		top = parseFloat(rect.attr("y"));


	plotObj.image = null;
	if (backgroundImage != null){
		plotObj.image = main.append("image")
			.attr("width", width)
			.attr("height", height)
			.attr("x", left)
			.attr("y", top)
			.attr("xlink:href", backgroundImage);
	}
}

//////////////
// update the size and location of image based on zoom
//////////////
function updatePlotImage(plotObj, s, translate, tDur = params.tDuration){

	var rect = plotObj.plot.select("defs").select("clipPath").select("rect");

	var width = parseFloat(rect.attr("width")),
		height = parseFloat(rect.attr("height")),
		left = parseFloat(rect.attr("x")),
		top = parseFloat(rect.attr("y"));

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
	var t = d3.transition().duration(params.tDuration);
	plotObj.image.transition(t)
		.attr("transform","translate(" + dx +  "," + dy + ")scale(" + sX + "," + sY +")")


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
	bar.style("fill", function(d) {return d.c})
		.attr("class",function(d) {return "bar-rect "+d.filter})
		.attr("rx",4)
		.attr("ry",4);
	if (horizontal){
		bar.attr("x", left)
			.attr("width", function(d) { return plotObj.xScale(+d.y) - left;})
			.attr("y", function(d, i) {return height/data.length*i + top +2; }) 
			.attr("height",  height/data.length*0.8);
	} else {
		bar.attr("x", function(d, i) {return width/data.length*i + left + 10; })
			.attr("width", width/data.length*0.8)
			.attr("y", function(d) { return (plotObj.yScale(+d.y));}) 
			.attr("height", function(d) { return height + top - plotObj.yScale(+d.y);})
	}

}

//////////////
// updates to the buttons
//////////////
function updateButtons(){


	//change bar fill and outline and also plotted points based on selections 
	params.inputData.filters.forEach(function(filter, j){


		var onOff = d3.select('#onOff'+filter)
		var onOffLabel = d3.select('#onOffLabel'+filter)
		var fillColor = params.inputData[filter].color;
		var lineColor = params.inputData[filter].color;
		if (onOff.property('checked')){
			onOffLabel.select("i").classed("fa-eye",true)
			onOffLabel.select("i").classed("fa-eye-slash",false)
			params.phasePlot.plot.selectAll("."+filter).filter(".circle").style("stroke", "black");
			params.phasePlot.plot.selectAll("."+filter).filter(".circle").raise();
			params.rawPlot.plot.selectAll("."+filter).filter(".circle").style("stroke", "black");
			params.rawPlot.plot.selectAll("."+filter).filter(".circle").raise();
		} else {
			fillColor = "lightgray";
			onOffLabel.select("i").classed("fa-eye-slash",true)
			onOffLabel.select("i").classed("fa-eye",false)
			params.phasePlot.plot.selectAll("."+filter).filter(".circle").style("stroke", fillColor);
			params.rawPlot.plot.selectAll("."+filter).filter(".circle").style("stroke", fillColor);
		}
		onOffLabel.style('color',fillColor);

		params.phasePlot.plot.selectAll("."+filter).style("fill", fillColor);
		params.phasePlot.plot.selectAll("."+filter).filter(".line").style("stroke", fillColor);
		params.rawPlot.plot.selectAll("."+filter).style("fill", fillColor);
		params.rawPlot.plot.selectAll("."+filter).filter(".line").style("stroke", fillColor);

		params.featurePlots.forEach(function(p){
			p.plot.selectAll("."+filter).classed("barSelected", false);
			p.plot.selectAll("."+filter).style("fill", fillColor);
		});		



	});

	//outlines on rects
	params.featurePlots.forEach(function(p){
		p.plot.selectAll("."+params.inputData.filters[params.ppos]).classed("barSelected", true);
	});

	//length of period rects (assuming that the period plot is always first!)
	var left = parseFloat(params.featurePlots[0].plot.select("defs").select("clipPath").select("rect").attr("x"));

	//console.log(period, params.periodPlot.xScale(+period))
	var t = d3.transition().duration(params.tDuration);			
	params.featurePlots[0].plot.selectAll(".bar-rect").transition(t)
		.attr("width", function(d) {return params.featurePlots[0].xScale(+d.y*params.periodMultiple) - left;}) ;

	d3.select("#multipleText").property("value","="+params.periodMultiple)
	d3.select("#multipleText").text("="+params.periodMultiple)
}

//////////////
// updates to the phase plot (including transitions)
//////////////
function updatePhasePlot(tDur = params.tDuration){

	var periodOld = params.period;
	params.period = params.inputData[params.inputData.filters[params.ppos]].period*params.periodMultiple;
	var cData = params.phasePlot.plot.selectAll("circle").data();
	cData.forEach(function(d, j){
		var phase = (d.xRaw % params.period)/params.period; 
		var phaseNew = phase;

		if (d.mirrored){
			if (phase < params.phaseLim){
				phaseNew = phase + 1;
			}
			if (phase > 1.-params.phaseLim){
				phaseNew = phase - 1;
			}
		}
		d.x = phaseNew;
	});

	updatePlotData(params.phasePlot, tDur=tDur)


}

//////////////
// create the buttons and link bars into control
//////////////
function createButtons(){
		//link controls
	params.inputData.filters.forEach(function(filt, j){
		//select the period from the rect
		params.featurePlots.forEach(function(p){

			p.plot.selectAll("."+filt)
				.on('click',function(d){
					params.ppos = j;
					updateButtons();
					updatePhasePlot();
				})
		});

		//on/off buttons 
		var y = parseFloat(params.featurePlots[0].plot.select('.'+filt).attr("y")) //why do I need the -2?
		var h = parseFloat(params.featurePlots[0].plot.select('.'+filt).attr("height"))
		//https://www.w3schools.com/howto/howto_css_switch.asp
		var onOffDiv = d3.select("#container").append("div")
			.style('position','absolute')
			.style('top',params.plotPositions.topFeature + params.plotPositions.marginFeature.top + y -2 + 'px')
			.style('left', params.plotPositions.leftFeature + params.plotPositions.marginFeature.left -30 + 'px')
		onOffDiv.append("input")
			.attr("type","checkbox")
			.attr("name","onOff"+filt)
			.attr("id","onOff"+filt)
			.attr("value","valuable")
			.property('checked', true)
			.on("change",function(){
				updateButtons();
				updatePhasePlot();
			});
		onOffDiv.append("label")
			.attr("for","onOff"+filt)
			.attr("id","onOffLabel"+filt)
			.style("height",h+"px")
			.style("width",h+"px")
			.style("cursor","pointer")
			.append("i")
				.attr("class","far")
				.classed("fa-eye",true)
				.style("font-size",h+"px")
	});

	var helpButton = d3.select("#container").append("div")
		.attr('id','helpButton')
		.attr('class','buttonDiv buttonDivUse')
		.style('top',0)
		.style('left',0)
		.append("i")
			.attr("class","far fa-question-circle")

	var flipButton = d3.select("#container").append("div")
		.attr('id','flipButton')
		.attr('class','buttonDiv buttonDivUse')
		.style('top',0)
		.style('left',"50px")
		.on('mousedown',function(d){
			plots = [params.phasePlot, params.rawPlot]
			plots.forEach(function(p){
				var domain = p.yScale.domain();
				p.yExtent = [domain[1], domain[0]]
				p.yScale.domain(p.yExtent);
				updatePlotData(p, tDur=20)
				var fill = p.plot.select("#flipRect").classed("filledRect")
				p.plot.select("#flipRect").classed("filledRect", !fill)
			})

			//updatePhasePlot(tDur = 20);
			var sel = d3.select("#flipButton").classed("buttonDivSelected")
			d3.select("#flipButton").classed("buttonDivSelected", !sel)
		})
		.append("i")
			.attr("class","fas fa-arrows-alt-v")

	var multipleBox = d3.select("#container").append("form")
		.attr('id','multipleBox')
		//.attr('action','text')
		//.attr('method','post')
	multipleBox.append('input')
			.attr('type','text')
			.attr('name','multipleText')
			.attr('id','multipleText')
			.attr('class','buttonDiv buttonDivUse')
			.style('top',0)
			.style('left',"200px")
			.style('width',"100px")
			.style('text-align',"left")
			.style('padding-left',"2px")
			.style('border-left','none')
			.attr('value',"="+params.inputData.multiples[params.mpos])
			.text("="+params.inputData.multiples[params.mpos])
			.on("keypress", function(){
				var e = d3.event;
				if (e.keyCode == 13){
					e.preventDefault();
					value = this.value;
					if (value.slice(0,1) == "=") {
						value = this.value.slice(1)
					}
					console.log(value)
					if (isNaN(value)){
						value = params.periodMultiple;
					} else {
						params.periodMultiple = parseFloat(value); 
					}
					updateButtons();
					updatePhasePlot();
				}
			})


	//dropdown
	var periodDropdown = d3.select("#container").append("div")
		.attr('id','periodControl')
		.attr('class','dropdown')
		.style('top',0)
		.style('left',"100px")
		.style('border-right','none')
		.text("Period Multiple")
		.append("div")
			.attr("id","periodDropdown")
			.attr("class","dropdown-content")

	d3.select('#periodControl').on('click', function(){
		d = d3.select('#periodDropdown');
		if (d.style('display') === 'none') {
			d.style('display','block');
			d3.select('#periodControl').classed('clickedDropdown', true);
		} else {
			d.style('display','none');
			d3.select('#periodControl').classed('clickedDropdown', false);
		}
	});
	var dropdown = d3.select('#periodDropdown');
	params.inputData.multiples.forEach(function(m, j){
		dropdown.append('div')
			.style('display','block')
			.attr('value', params.inputData.multiples[j])
			.html("&nbsp;" + params.inputData.multiplesNames[j])
			.on('click',function(d){
				params.periodMultiple = params.inputData.multiples[j];
				updateButtons()
				updatePhasePlot()
			});	
		});

	//outline for the feature plots
	var featureBox = d3.select("#container").append("div")
		.attr('id','featureBox')
		.attr('class','buttonDiv')
		.style('top',0)
		.style('left',"300px")
		.style('width',"530px")
		.style('z-index',-1)

	//button to switch features
	var featureButton = d3.select("#container").append("div")
		.attr('id','featureButton')
		.attr('class','buttonDiv buttonDivUse')
		.style('top',0)
		.style('left',"830px")
		.style('width',"50px")
		.on('click',function(d){
			params.fpos = (params.fpos + 1) % params.featurePlots.length;
			params.featurePlots.forEach(function(p, i){
				p.plot.classed("hidden", true);
				if (i == params.fpos){
					p.plot.classed("hidden", false);
				}
			})
		})
		.append("i")
			.attr("class","far fa-arrow-alt-circle-right")


	//descriptions under each button
	d3.select("#container").append("div")
		.attr("class","buttonInstructions")
		.style("left",0)
		.text("help");
	d3.select("#container").append("div")
		.attr("class","buttonInstructions")
		.style("left","50px")
		.text("flip");
	d3.select("#container").append("div")
		.attr("class","buttonInstructions")
		.style("left","100px")
		.style("width","200px")
		.text("change the period");
	d3.select("#container").append("div")
		.attr("class","buttonInstructions")
		.style("left","300px")
		.style("width","40px")
		.text("on/off");	
	
	d3.select("#container").append("div")
		.attr("class","buttonInstructions")
		.style("left","830px")
		.text("next feature");	
}

//////////////
// create the plots
//////////////
function startPlotting(){


	params.period = params.inputData[params.inputData.filters[params.ppos]].period;

	//add the phase data
	params.inputData.phaseData = [];
	params.inputData.rawData.forEach(function(d, i){

		var phase = (parseFloat(d.x) % params.period)/params.period;
		var phaseNew = null;
		params.inputData.phaseData.push({"x": phase,
			"xRaw":parseFloat(d.x), 
			"y":parseFloat(d.y), 
			"ye":parseFloat(d.ye),
			"r":parseFloat(d.r),  
			"c":d.c, 
			"filter":d.filter,
			"mirrored":false,
		});
		if (phase < params.phaseLim){
			phaseNew = phase + 1;
		}
		if (phase > 1.-params.phaseLim){
			phaseNew = phase - 1;
		}
		if (phaseNew != null){
			params.inputData.phaseData.push({"x": phaseNew,
				"xRaw":parseFloat(d.x), 
				"y":parseFloat(d.y), 
				"ye":parseFloat(d.ye),
				"r":parseFloat(d.r),  
				"c":d.c, 
				"filter":d.filter,
				"mirrored":true,
			});	
		}

	})

	//add a filter to CMD data so we don't get errors in plotting
	// params.inputData.CMDdata.forEach(function(d,j){
	// 	d["filter"] = params.inputData.filters[params.ppos];	
	// });


	params.phasePlot = createAxes(params.inputData.phaseData, 
								params.plotPositions.widthPhase, 
								params.plotPositions.heightPhase, 
								params.plotPositions.marginPhase, 
								"Phase", 
								"Brightness&rarr;", 
								"phasePlot", 
								topXlabel=true, 
								rightYlabel=false, 
								left=params.plotPositions.leftPhase, 
								top=params.plotPositions.topPhase,
								labelFontsize="18pt");
	var main = params.phasePlot.plot.select(".main")
	//add the gray blocks to the phase plot where it extends beyond 0-1
	var w = (params.phasePlot.xScale(0) - params.phasePlot.xScale(-params.phaseLim) );
	main.append('rect')
		.attr("id","phaseBlockLeft")
		.attr("width", w)
		.attr("height", params.plotPositions.heightPhase)
		.attr("x",params.phasePlot.xScale(-params.phaseLim))
		.attr("y",params.plotPositions.marginPhase.top)
		.attr("fill", "lightgray");
	main.append('rect')
		.attr("id","phaseBlockRight")
		.attr("width", w)
		.attr("height", params.plotPositions.heightPhase)
		.attr("x",params.phasePlot.xScale(1))
		.attr("y",params.plotPositions.marginPhase.top)
		.attr("fill", "lightgray");
	main.append('rect')
		.attr("id","flipRect")
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("fill", "none");
	createScatterPlot(params.phasePlot, params.inputData.phaseData);
	//reposition left label
	params.phasePlot.plot.select(".y-title").attr("x",-310);

	params.rawPlot = createAxes(params.inputData.rawData, 
								params.plotPositions.widthDays, 
								params.plotPositions.heightDays, 
								params.plotPositions.marginDays, 
								"Time (days)", 
								"", 
								"rawPlot", 
								topXlabel=false, 
								rightYlabel=false, 
								left=params.plotPositions.leftDays, 
								top=params.plotPositions.topDays, 
								labelFontsize="18pt", 
								axisFontsize="10pt");
	var main = params.rawPlot.plot.select(".main")
	main.append('rect')
		.attr("id","flipRect")
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("fill", "none");
	createScatterPlot(params.rawPlot, params.inputData.rawData);
	//reposition bottom label
	params.rawPlot.plot.select(".x-title").attr("y",150);

	params.CMDPlot = createAxes(params.inputData.CMDdata, 
								params.plotPositions.widthCMD, 
								params.plotPositions.heightCMD, 
								params.plotPositions.marginCMD, 
								"&larr;Temperature", 
								"", 
								"CMDPlot", 
								topXlabel=false, 
								rightYlabel=false, 
								left=params.plotPositions.leftCMD,
								top=params.plotPositions.topCMD,
								labelFontsize="18pt", 
								axisFontsize="10pt",
								xExtent = [-0.7644119, 4.715261459350586], 
								yExtent=[16.3, -3.263948750885376],
								hideAllTicks = true);								 
	addImageToPlot(params.CMDPlot, "data/CMDbackground_BW.svg")
	createScatterPlot(params.CMDPlot, params.inputData.CMDdata, errorType="elipse");
	//reposition bottom label
	params.CMDPlot.plot.select(".x-title").attr("y",505);

	//features
	params.inputData.features.forEach(function(feature, i){
		var xFormat = d3.scaleLinear();
		if (params.inputData['featuresFormat'][i] == "log"){
			xFormat = d3.scaleLog().base(10)
		}
		var featurePlot = createAxes(params.inputData.featureData[feature], 
							params.plotPositions.widthFeature, 
							params.plotPositions.heightFeature, 
							params.plotPositions.marginFeature, 
							feature+"&rarr;", 
							"", 
							feature+"Plot", 
							topXlabel=false, 
							rightYlabel=false, 
							left=params.plotPositions.leftFeature,
							top=params.plotPositions.topFeature, 
							labelFontsize="12px", 
							axisFontsize="10pt",
							xExtent = params.inputData['featuresRange'][i], 
							yExtent = [0,params.inputData.featureData[feature].length],
							hideAllTicks = true,
							xFormat = xFormat,
							yFormat = d3.scaleLinear(),
							nXticks = 10);

		createBarPlot(featurePlot, params.inputData.featureData[feature], horizontal = true);
		//hide some axes
		featurePlot.gXtop.classed("hidden",true)
		featurePlot.gYleft.classed("hidden",true)
		featurePlot.gYright.classed("hidden",true)
		//reposition bottom label
		featurePlot.plot.select(".x-title").attr("y",66);
		//add to the params list
		params.featurePlots.push(featurePlot)
	});



	//initial outlines on the bars
	//also hide all the feature plots except for the first one
	params.featurePlots.forEach(function(p, i){
		p.plot.selectAll("."+params.inputData.filters[params.ppos]).classed("barSelected", true);
		if (i != params.fpos){
			p.plot.classed("hidden", true);
		}
	});



	createButtons();
	updateButtons();
}

//////////////
// first, read in the data
//////////////
d3.json("data/27882110006813.json")
	.then(function(data) {
		params.inputData = data;
		startPlotting();
	});