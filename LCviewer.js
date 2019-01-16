//To Do : clip data outside of plots (https://bl.ocks.org/jarandaf/df3e58e56e9d0d3b9adb)


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

		//will store plots
		this.rawPlot;
		this.phasePlot;
		this.CMDPlot;

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
			.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return yScale(+d.y + d.ye);});
		
	// Add Error Bottom Cap
	plot.append("g").selectAll("line")
		.data(data).enter()
			.append("line")
			.style("stroke", function(d) {return d.errColor;})
			.attr("class", "error-cap error-cap-bottom")
			.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return yScale(+d.y - d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});
	
	plot.append("g").selectAll("circle")
		.data(data).enter()
			.append("circle")
			.style("fill", function(d) {return d.circleColor;})
			.attr("class", "dot circle")
			.attr("r", r)
			.attr("cx", function(d) { return xScale(+d.x); })
			.attr("cy", function(d) { return yScale(+d.y); })
}

//////////////
// setup the plot
//////////////
function createPlot(data, width, height, margin, xTitle, yTitle, className, topXlabel=false, left=0, top=0, labelFontsize="18pt", axisFontsize="12pt", xExtent = null, yExtent = null, hideAllTicks = false, backgroundImage = null){

	var x0 = [margin.left, width + margin.left ],
		y0 = [height + margin.top, margin.top];
	var xScale = d3.scaleLinear().range(x0),
		yScale = d3.scaleLinear().range(y0);

	var r0 = 3.5; //circle radius

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

	var plot = d3.select("body").append("svg")
		.attr('class',className)
		.style('position', 'absolute')
		.attr("width", (width + margin.left + margin.right))
		.attr("height", (height + margin.top + margin.bottom))
		.attr("transform", "translate(" + left + "," + top + ")")

	var image = null,
		imageClip = null;
	if (backgroundImage != null){
		image = plot.append("image")
			.attr("width", width)
			.attr("height", height)
			.attr("x", margin.left)
			.attr("y", margin.top)
			.attr('clip-path', null)
			.attr("xlink:href", backgroundImage);
		var imageClipPath = plot.append("clipPath")
			.attr("id","imageClip");
		imageClip = imageClipPath.append('rect')
			.attr("width", width)
			.attr("height", height)
			.attr("x",margin.left)
			.attr("y",margin.right);
		image.attr('clip-path', 'url(#imageClip)')

	}
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

	if (hideAllTicks){
		gXbottom.classed('axis-blank', true);
		gXtop.classed('axis-blank', true);
		gYleft.classed('axis-blank', true);
		gYright.classed('axis-blank', true);
	}

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
	addData(data, plot, xScale, yScale, r=r0);

	//brush + zoom from here : https://bl.ocks.org/mbostock/f48fcdb929a620ed97877e4678ab15e6
	var brush = d3.brush().on("end", brushended);
	plot.append("g")
		.attr("class", "brush")
		.call(brush);


	// helper functions for brushing and zooming
	function brushended() {

		var s = d3.event.selection;
		var translate = getTransformation(null)
		if (!s) {
			if (!params.idleTimeout) return params.idleTimeout = setTimeout(idled, params.idleDelay);
			xScale.domain(xExtent).nice();
			yScale.domain(yExtent).nice();
			s = [[margin.left, margin.top],
				[plot.attr('width') - margin.right, plot.attr('height') - margin.bottom]];
			translate = getTransformation(null)

		} else {
			xScale.domain([xScale.invert(s[0][0]), xScale.invert(s[1][0])]);//.nice();
			yScale.domain([yScale.invert(s[1][1]), yScale.invert(s[0][1])]);//.nice();
			plot.select(".brush").call(brush.move, null);
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

		var t = plot.transition().duration(params.tDuration);
		//the points
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
			.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return yScale(+d.y + d.ye);});
		plot.selectAll(".error-cap-bottom").transition(t)
			.attr("x1", function(d) {return xScale(+d.x) - params.errLen;})
			.attr("y1", function(d) {return yScale(+d.y - d.ye);})
			.attr("x2", function(d) {return xScale(+d.x) + params.errLen;})
			.attr("y2", function(d) {return yScale(+d.y - d.ye);});

		//the image
		if (backgroundImage != null){

			//distance from the edge
			var dEdgeX = s[0][0] - translate.translateX;
			var dEdgeY = s[0][1] - translate.translateY;

			//new scaling
			var sWidth = s[1][0] - s[0][0];
			var sHeight = s[1][1] - s[0][1];
			var scaleX = width/sWidth;
			var scaleY = height/sHeight;

			//multiply by old scaling for total scaling
			var sX = scaleX*translate.scaleX;
			var sY = scaleY*translate.scaleY;

			//translation
			var dx = margin.left - dEdgeX*scaleX ;
			var dy = margin.top  - dEdgeY*scaleY ;

			// update clip attributes to reflect selection
			var cw = sWidth/translate.scaleX;
			var ch = sHeight/translate.scaleY;
			var x0 = 0;
			var y0 = 0;

			//account for previous translation and scale
			if (translate.translateX != 0){
				x0 = parseFloat(imageClip.attr("x")) - margin.left/translate.scaleX;
				y0 = parseFloat(imageClip.attr("y")) - margin.top/translate.scaleY;
			}
			var cx = x0 + s[0][0]/translate.scaleX;
			var cy = y0 + s[0][1]/translate.scaleY;

			//transition duration
			var tC = params.tDuration/10.;
			if (sX == 1 && sY == 1){
				tC = params.tDuration*2.;
			}
			imageClip.transition().duration(tC)
				.attr("width", cw)
				.attr("height", ch)
				.attr("x",cx)
				.attr("y",cy);

			//now scale and translate the image
			image.transition(t)
				.attr("transform","translate(" + dx +  "," + dy + ")scale(" + sX + "," + sY +")")

			//increase the size of the circle
			plot.selectAll("circle").transition(t).attr("r",r0*sX);

	

		}


	}

	return {"plot":plot,
			"xScale":xScale,
			"yScale":yScale};
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
		//marginCMD = {top: 0, right: 0, bottom: 0, left: 0},
		heightCMD = heightDays + heightPhase + 25, //I don't quite understand the sizing here
		widthCMD = 400;

	var period = params.inputData[params.inputData.filters[params.ppos]].period;

	params.inputData.filters.forEach(function(filter, j){

		//reformat the data -- easier for plotting

		params.inputData[filter].obsmjd.forEach(function(d, i){
			params.rawData.push({"x":parseFloat(params.inputData[filter].obsmjd[i]), 
				"y":parseFloat(params.inputData[filter].mag_autocorr_mean[i]), 
				"ye":parseFloat(params.inputData[filter].magerr_auto[i]),  
				"circleColor":params.inputData[filter].color, 
				"errColor":params.inputData[filter].color
			});
			params.phaseData.push({"x":(parseFloat(params.inputData[filter].obsmjd[i]) % period)/period, 
				"y":parseFloat(params.inputData[filter].mag_autocorr_mean[i]), 
				"ye":parseFloat(params.inputData[filter].magerr_auto[i]),
				"circleColor":params.inputData[filter].color, 
				"errColor":params.inputData[filter].color
			});
		})

	});

	//dummy data for now
	var foo = [{"x":2,
				"y":5,
				"ye":1,
				"circleColor":"black",
				"errColor":"none"}];
	params.CMDPlot = createPlot(foo, 
								widthCMD, 
								heightCMD, 
								marginCMD, 
								"&larr;Temperature", 
								"Brightness&rarr;", 
								"CMDPlot", 
								topXlabel=false, 
								left=0,
								top=(marginDays.top - marginDays.bottom), //I don't quite understand the position here
								labelFontsize="18pt", 
								axisFontsize="12pt",
								xExtent = [-0.7644119, 4.715261459350586], 
								yExtent=[16.3, -3.263948750885376],
								hideAllTicks = true, 
								backgroundImage = "data/CMDbackground.svg"); 

	var leftPos = (widthCMD + marginCMD.left + marginCMD.right + 40);
	params.rawPlot = createPlot(params.rawData, 
								widthDays, 
								heightDays, 
								marginDays, 
								"Time (d)", 
								"Brightness&rarr;", 
								"rawPlot", 
								topXlabel=true, 
								left=leftPos, 
								top=0, 
								labelFontsize="12pt", 
								axisFontsize="10pt");

	params.phasePlot = createPlot(params.phaseData, 
								widthPhase, 
								heightPhase, 
								marginPhase, 
								"Phase", 
								"Brightness&rarr;", 
								"phasePlot", 
								topXlabel=false, 
								left=leftPos, 
								top=(heightDays + marginPhase.bottom + marginPhase.top));



	//create the buttons
	var leftPos = (widthDays + marginDays.left + marginDays.right + widthCMD + marginCMD.left + marginCMD.right + 80) + 'px'
	var periodSelectDiv = d3.select("body").append("div")
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

	var periodModDiv = d3.select("body").append("div")
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