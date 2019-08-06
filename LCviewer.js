//////////////////////////////////////////////////
//React stuff

// //the data 
// //it seems like from Shaun's example this should be loaded in the *.spec.js file, but I can't make that work 
// import data from './input/27882110006813.json';

// //my local style sheet
// import './input/LightCurveViewerStyles.css';

// //for the icons, using Google's Material Design Icons
// import WebFont from 'webfontloader';
// WebFont.load({
//   google: {
//     families: ['Material Icons']
//   }
// });

// //SVG image for the CMD (still not working)
// //var CMDimage = require('svg-inline-loader?classPrefix!./input/CMDbackground_BW.svg');
// //https://itnext.io/react-svg-images-and-the-webpack-loader-to-make-them-play-nice-2d177ae34d2b
// import CMDimage from './input/CMDbackground_BW.svg';
// import SVG from 'react-inlinesvg';
// //console.log(SVG)

// //could use a full screen button?


// //imports copied from Shaun's example
// import * as d3 from 'd3';
// import PropTypes from 'prop-types';
// import React, { Component } from 'react';
// import ReactResizeDetector from 'react-resize-detector';
// import { inject, observer } from 'mobx-react'





// //not quite sure what this does... it appears to allow the props to be used, but I don't know how to change the props to be what I need.
// function storeMapper (stores) {
//   const {
//     enableMove,
//     interactionMode, // string: indicates if the Classifier is in 'annotate' (default) mode or 'move' mode
//     setOnZoom // func: sets onZoom event handler
//   } = stores.classifierStore.subjectViewer

//   const {
//     addAnnotation
//   } = stores.classifierStore.classifications
//   const annotations = stores.classifierStore.classifications.currentAnnotations
//   const { active: step } = stores.classifierStore.workflowSteps
  
//   const currentTask =
//     (stores.classifierStore.workflowSteps.activeStepTasks
//      && stores.classifierStore.workflowSteps.activeStepTasks[0])
//     || {}
  
//   return {
//     addAnnotation,
//     annotations,
//     currentTask,
//     enableMove,
//     interactionMode,
//     setOnZoom
//   }
// }

// @inject(storeMapper)
// @observer
// class LightCurveViewer extends Component{
		// super()
		// this.svgContainer = React.createRef();
		// this.container = this.svgContainer.current;

		// //will store the data from the file
		// //this does not work (trying to load from the .spec.js file)
		// //this.inputData = this.props.inputData;
		// this.inputData = data;
		// this.CMDImage = CMDimage;
//////////////////////////////////////////////////

class LightCurveViewer {
	constructor () {
		this.container = "#container";
		this.inputData;
		//this.CMDImage = "./data/CMDbackground_BW.svg"
		this.CMDImage = "./data/CMDbackground_BW.png"

		//colors for the plotting region
		this.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--plot-background-color'); 
		this.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--plot-border-color'); 

		//settings for plots
		this.idleTimeout;
		this.idleDelay = 350;
		this.errLen = 4; //error cap
		this.tDuration = 500;



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
	}

	setPlotPositions(bbox){

		//rescale the plots based on the size of the bounding box (clunky, but works)
		this.plotPositions = {};

		var topPos = 75,
			leftPos = 5;

		this.plotPositions.marginPhase = {top: 50, right: 5, bottom: 5, left: 65}; //adding to the bottom so that I can shift the y label
		this.plotPositions.leftPhase = leftPos + parseFloat(bbox.left);
		this.plotPositions.topPhase = topPos + parseFloat(bbox.top);
		this.plotPositions.heightPhase = parseFloat(bbox.height)*0.7 - this.plotPositions.marginPhase.top - this.plotPositions.marginPhase.bottom - topPos;
		this.plotPositions.widthPhase = parseFloat(bbox.width)*0.6;


		this.plotPositions.marginDays = {top: 5, right: 5, bottom: 65, left: 65};
		this.plotPositions.leftDays = this.plotPositions.leftPhase;
		this.plotPositions.topDays = topPos + parseFloat(bbox.top) + this.plotPositions.heightPhase + this.plotPositions.marginPhase.top + this.plotPositions.marginPhase.bottom; 
		this.plotPositions.heightDays = parseFloat(bbox.height) - this.plotPositions.heightPhase - this.plotPositions.marginPhase.top - this.plotPositions.marginPhase.bottom - this.plotPositions.marginDays.top - this.plotPositions.marginDays.bottom - topPos;
		this.plotPositions.widthDays = this.plotPositions.widthPhase;

		this.plotPositions.marginCMD = {top: 50, right: 5, bottom: 65, left: 5};
		this.plotPositions.leftCMD = this.plotPositions.leftPhase + this.plotPositions.widthPhase + this.plotPositions.marginPhase.left + this.plotPositions.marginPhase.right;
		this.plotPositions.topCMD = topPos + parseFloat(bbox.top);
		this.plotPositions.heightCMD = parseFloat(bbox.height) - this.plotPositions.marginCMD.top - this.plotPositions.marginCMD.bottom - topPos;
		this.plotPositions.widthCMD = parseFloat(bbox.width) - this.plotPositions.widthPhase - this.plotPositions.marginPhase.left - this.plotPositions.marginPhase.right - this.plotPositions.marginCMD.left - this.plotPositions.marginCMD.right - 5;


		this.plotPositions.marginFeature = {top: 2, right: 0, bottom: 30, left: 5};
		this.plotPositions.leftFeature = parseFloat(bbox.left)+335 + 5;
		this.plotPositions.topFeature = bbox.top;
		this.plotPositions.heightFeature = 50; 
		this.plotPositions.widthFeature = parseFloat(bbox.width) - 393 - this.plotPositions.marginFeature.left - this.plotPositions.marginFeature.right; //I don't understand the 393 here: I thought it should be 385...



	}

	//////////////
	// helper function since d3.v4 removed d3.transform
	// https://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4
	//////////////
	getTransformation(transform) {
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
	addData(data, plot, xScale, yScale, errorType){
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

			// // Add Error Top Cap
			// lines.append("line")
			// 	.style("stroke", function(d) {return d.c;})
			// 	.attr("class", function(d) {return "line error-cap error-cap-top "+d.filter})
			// 	.attr("x1", function(d) {return xScale(+d.x) - this.errLen;}.bind(this))
			// 	.attr("y1", function(d) {return yScale(+d.y + d.ye);})
			// 	.attr("x2", function(d) {return xScale(+d.x) + this.errLen;}.bind(this))
			// 	.attr("y2", function(d) {return yScale(+d.y + d.ye);});
				
			// // Add Error Bottom Cap
			// lines.append("line")
			// 	.style("stroke", function(d) {return d.c;})
			// 	.attr("class", function(d) {return "line error-cap error-cap-bottom "+d.filter})
			// 	.attr("x1", function(d) {return xScale(+d.x) - this.errLen;}.bind(this))
			// 	.attr("y1", function(d) {return yScale(+d.y - d.ye);})
			// 	.attr("x2", function(d) {return xScale(+d.x) + this.errLen;}.bind(this))
			// 	.attr("y2", function(d) {return yScale(+d.y - d.ye);});

			var symbols = plot.selectAll('.symbol').data(data).enter();
			symbols.append('path')
				.attr('class', function(d) {return 'symbol '+d.filter;})
				.attr('d', function(d) {
					return d3.symbol().type(d3['symbol'+d.s]).size(d.r)();
				})
				.attr("transform", function(d) { 
					return "translate(" + xScale(+d.x) + "," + yScale(+d.y) +")"; 
				})
				.style("fill", function(d) {return d.c;})
				.attr('stroke','#555555')
				.attr('stroke-width',1)
			// var circles = plot.selectAll('.circle').data(data).enter();
			// circles.append("circle")
			// 	.style("fill", function(d) {return d.c;})
			// 	.attr("class", function(d) {return "dot circle "+d.filter})
			// 	.attr("r", function(d) {return d.r})
			// 	.attr("cx", function(d) { return xScale(+d.x); })
			// 	.attr("cy", function(d) { return yScale(+d.y); })
		} else {
			//elliptical errors
			// var arcs = plot.selectAll('.arc').data(data).enter();
			// arcs.append('path')
			// 	.attr('class', 'arc')
			// 	.attr('d', function(d) {
			// 		return d3.arc().innerRadius(0).outerRadius(xScale(+d.x+d.rxp) - xScale(+d.x)).startAngle(0).endAngle(Math.PI/2.)();
			// 	})
			// 	.attr('transform', function(d) { 
			// 		return 'translate('+[xScale(+d.x),yScale(+d.y)]+')'
			// 	})
			// 	.style("fill", function(d) {return d.c;})
			//  	.style("stroke", '#555555')




			//I would rather include this in the defs, but that doesn't seem to work
			//var clipPath = plot.select('defs').selectAll('.clipPathEllipse').data(data).enter();
			var clipPath = plot.selectAll('.clipPathEllipse').data(data).enter();
			var ellipses = plot.selectAll('.ellipse').data(data).enter();
			var offset = 0.5; //for the clip path to allow for the stroke (which apparently is outside the ellipse)
			//upper right
			clipPath.append('clipPath')
				.attr('class', 'clipPathEllipse ellipse-clipUR')
				.attr("id", function(d,i) {return "ellipse-clipUR"+i})
				.append('rect')
					.attr("width", function(d) { return xScale(+d.x+d.rxp) - xScale(+d.x) + 2*offset; })
					.attr("height", function(d) { return yScale(+d.y+d.ryp) - yScale(+d.y) + 2*offset; })
					.attr("x", function(d) { return xScale(+d.x) - 1.*offset; })
					.attr("y", function(d) { return yScale(+d.y-d.ryp) - 1.*offset; })
			ellipses.append("ellipse")
				.style("fill", function(d) {return d.c;})
				.style("stroke", '#555555')
				.attr("class", function(d) {return "ellipseUR"})
				.attr("rx", function(d) { return xScale(+d.x+d.rxp) - xScale(+d.x); })
				.attr("ry", function(d) { return yScale(+d.y+d.ryp) - yScale(+d.y); })
				.attr("cx", function(d) { return xScale(+d.x); })
				.attr("cy", function(d) { return yScale(+d.y); })
				.attr("clip-path",function(d,i) {return "url(#ellipse-clipUR"+i+")"})

			//lower right
			clipPath.append('clipPath')
				.attr('class', 'clipPathEllipse ellipse-clipLR')
				.attr("id", function(d,i) {return "ellipse-clipLR"+i})
				.append('rect')
					.attr("width", function(d) { return xScale(+d.x+d.rxp) - xScale(+d.x) + 2.*offset; })
					.attr("height", function(d) { return yScale(+d.y+d.rym) - yScale(+d.y) + 2.*offset; })
					.attr("x", function(d) { return xScale(+d.x) - 1.*offset; })
					.attr("y", function(d) { return yScale(+d.y) - 1.*offset; })
			ellipses.append("ellipse")
				.style("fill", function(d) {return d.c;})
				.style("stroke", '#555555')
				.attr("class", function(d) {return "ellipseLR"})
				.attr("rx", function(d) { return xScale(+d.x+d.rxp) - xScale(+d.x); })
				.attr("ry", function(d) { return yScale(+d.y+d.rym) - yScale(+d.y); })
				.attr("cx", function(d) { return xScale(+d.x); })
				.attr("cy", function(d) { return yScale(+d.y); })
				.attr("clip-path",function(d,i) {return "url(#ellipse-clipLR"+i+")"})

			//upper left
			clipPath.append('clipPath')
				.attr('class', 'clipPathEllipse ellipse-clipUL')
				.attr("id", function(d,i) {return "ellipse-clipUL"+i})
				.append('rect')
					.attr("width", function(d) { return xScale(+d.x+d.rxm) - xScale(+d.x) + 2.*offset; })
					.attr("height", function(d) { return yScale(+d.y+d.ryp) - yScale(+d.y) + 2.*offset; })
					.attr("x", function(d) { return xScale(+d.x-d.rxm) - 1.*offset; })
					.attr("y", function(d) { return yScale(+d.y-d.ryp) - 1.*offset; })
			ellipses.append("ellipse")
				.style("fill", function(d) {return d.c;})
				.style("stroke", '#555555')
				.attr("class", function(d) {return "ellipseUL"})
				.attr("rx", function(d) { return xScale(+d.x+d.rxm) - xScale(+d.x); })
				.attr("ry", function(d) { return yScale(+d.y+d.ryp) - yScale(+d.y); })
				.attr("cx", function(d) { return xScale(+d.x); })
				.attr("cy", function(d) { return yScale(+d.y); })
				.attr("clip-path",function(d,i) {return "url(#ellipse-clipUL"+i+")"})

			//lower left
			clipPath.append('clipPath')
				.attr('class', 'clipPathEllipse ellipse-clipLL')
				.attr("id", function(d,i) {return "ellipse-clipLL"+i})
				.append('rect')
					.attr("width", function(d) { return xScale(+d.x+d.rxm) - xScale(+d.x) + 2.*offset; })
					.attr("height", function(d) { return yScale(+d.y+d.rym) - yScale(+d.y) + 2.*offset; })
					.attr("x", function(d) { return xScale(+d.x-d.rxm) - 1.*offset; })
					.attr("y", function(d) { return yScale(+d.y) - 1.*offset; })
			ellipses.append("ellipse")
				.style("fill", function(d) {return d.c;})
				.style("stroke", '#555555')
				.attr("class", function(d) {return "ellipseLL"})
				.attr("rx", function(d) { return xScale(+d.x+d.rxm) - xScale(+d.x); })
				.attr("ry", function(d) { return yScale(+d.y+d.rym) - yScale(+d.y); })
				.attr("cx", function(d) { return xScale(+d.x); })
				.attr("cy", function(d) { return yScale(+d.y); })
				.attr("clip-path",function(d,i) {return "url(#ellipse-clipLL"+i+")"})

		}


	}

	updatePlotData(plotObj, tDur, rScale){

		var t = d3.transition().duration(tDur);
		var offset = 0.5;
		//the points
		plotObj.plot.select(".axis-x-top").transition(t).call(plotObj.xAxisTop);
		plotObj.plot.select(".axis-x-bottom").transition(t).call(plotObj.xAxisBottom);
		plotObj.plot.select(".axis-y-left").transition(t).call(plotObj.yAxisLeft);
		plotObj.plot.select(".axis-y-right").transition(t).call(plotObj.yAxisRight);
		if (plotObj.errorType == "line"){
			plotObj.plot.selectAll(".symbol").transition(t)
				.attr("transform", function(d) { 
					return "translate(" + plotObj.xScale(+d.x) + "," + plotObj.yScale(+d.y) +")scale("+rScale+")"; 
				})

			// plotObj.plot.selectAll("circle").transition(t)
			// 	.attr("cx", function(d) {return plotObj.xScale(+d.x); })
			// 	.attr("cy", function(d) {return plotObj.yScale(+d.y); })
			// 	.attr("r", function(d) {return rScale*d.r; });
			plotObj.plot.selectAll(".error-line").transition(t)
				.attr("x1", function(d) {return plotObj.xScale(+d.x);})
				.attr("y1", function(d) {return plotObj.yScale(+d.y + d.ye);})
				.attr("x2", function(d) {return plotObj.xScale(+d.x);})
				.attr("y2", function(d) {return plotObj.yScale(+d.y - d.ye);});
			// plotObj.plot.selectAll(".error-cap-top").transition(t)
			// 	.attr("x1", function(d) {return plotObj.xScale(+d.x) - this.errLen;}.bind(this))
			// 	.attr("y1", function(d) {return plotObj.yScale(+d.y + d.ye);})
			// 	.attr("x2", function(d) {return plotObj.xScale(+d.x) + this.errLen;}.bind(this))
			// 	.attr("y2", function(d) {return plotObj.yScale(+d.y + d.ye);});
			// plotObj.plot.selectAll(".error-cap-bottom").transition(t)
			// 	.attr("x1", function(d) {return plotObj.xScale(+d.x) - this.errLen;}.bind(this))
			// 	.attr("y1", function(d) {return plotObj.yScale(+d.y - d.ye);})
			// 	.attr("x2", function(d) {return plotObj.xScale(+d.x) + this.errLen;}.bind(this))
			// 	.attr("y2", function(d) {return plotObj.yScale(+d.y - d.ye);});
		} else {
			//upper right
			plotObj.plot.selectAll(".ellipse-clipUR").select('rect').transition(t)
				.attr("width", function(d) { return plotObj.xScale(+d.x+d.rxp) - plotObj.xScale(+d.x) + 2.*offset; })
				.attr("height", function(d) { return plotObj.yScale(+d.y+d.ryp) - plotObj.yScale(+d.y) + 2.*offset; })
				.attr("x", function(d) { return plotObj.xScale(+d.x) - 1.*offset; })
				.attr("y", function(d) { return plotObj.yScale(+d.y-d.ryp) - 1.*offset; })
			plotObj.plot.selectAll(".ellipseUR").transition(t)
				.attr("cx", function(d) {return plotObj.xScale(+d.x); })
				.attr("cy", function(d) {return plotObj.yScale(+d.y); })
				.attr("rx", function(d) { return plotObj.xScale(+d.x+d.rxp) - plotObj.xScale(+d.x); })
				.attr("ry", function(d) { return plotObj.yScale(+d.y+d.ryp) - plotObj.yScale(+d.y); })
			//lower right
			plotObj.plot.selectAll(".ellipse-clipLR").select('rect').transition(t)
				.attr("width", function(d) { return plotObj.xScale(+d.x+d.rxp) - plotObj.xScale(+d.x) + 2.*offset; })
				.attr("height", function(d) { return plotObj.yScale(+d.y+d.rym) - plotObj.yScale(+d.y) + 2.*offset; })
				.attr("x", function(d) { return plotObj.xScale(+d.x) - 1.*offset; })
				.attr("y", function(d) { return plotObj.yScale(+d.y) - 1.*offset; })
			plotObj.plot.selectAll(".ellipseLR").transition(t)
				.attr("cx", function(d) {return plotObj.xScale(+d.x); })
				.attr("cy", function(d) {return plotObj.yScale(+d.y); })
				.attr("rx", function(d) { return plotObj.xScale(+d.x+d.rxp) - plotObj.xScale(+d.x); })
				.attr("ry", function(d) { return plotObj.yScale(+d.y+d.rym) - plotObj.yScale(+d.y); })
			//upper left
			plotObj.plot.selectAll(".ellipse-clipUL").select('rect').transition(t)
				.attr("width", function(d) { return plotObj.xScale(+d.x+d.rxm) - plotObj.xScale(+d.x) + 2.*offset; })
				.attr("height", function(d) { return plotObj.yScale(+d.y+d.ryp) - plotObj.yScale(+d.y) + 2.*offset; })
				.attr("x", function(d) { return plotObj.xScale(+d.x-d.rxm) - 1.*offset; })
				.attr("y", function(d) { return plotObj.yScale(+d.y-d.ryp) - 1.*offset; })
			plotObj.plot.selectAll(".ellipseUL").transition(t)
				.attr("cx", function(d) {return plotObj.xScale(+d.x); })
				.attr("cy", function(d) {return plotObj.yScale(+d.y); })
				.attr("rx", function(d) { return plotObj.xScale(+d.x+d.rxm) - plotObj.xScale(+d.x); })
				.attr("ry", function(d) { return plotObj.yScale(+d.y+d.ryp) - plotObj.yScale(+d.y); })
			//lower left
			plotObj.plot.selectAll(".ellipse-clipLL").select('rect').transition(t)
				.attr("width", function(d) { return plotObj.xScale(+d.x+d.rxm) - plotObj.xScale(+d.x) + 2.*offset; })
				.attr("height", function(d) { return plotObj.yScale(+d.y+d.rym) - plotObj.yScale(+d.y) + 2.*offset; })
				.attr("x", function(d) { return plotObj.xScale(+d.x-d.rxm) - 1.*offset; })
				.attr("y", function(d) { return plotObj.yScale(+d.y) - 1.*offset; })
			plotObj.plot.selectAll(".ellipseLL").transition(t)
				.attr("cx", function(d) {return plotObj.xScale(+d.x); })
				.attr("cy", function(d) {return plotObj.yScale(+d.y); })
				.attr("rx", function(d) { return plotObj.xScale(+d.x+d.rxm) - plotObj.xScale(+d.x); })
				.attr("ry", function(d) { return plotObj.yScale(+d.y+d.rym) - plotObj.yScale(+d.y); })
		}

		//I would rather include this in updatePhasePlot, but this needs to work on zoom as well...
		if (! plotObj.plot.select("#phaseBlockLeft").empty()){
			var w = plotObj.xScale(0) - plotObj.xScale(-this.phaseLim);
			plotObj.plot.select("#phaseBlockLeft").transition(t)
				.attr("x",plotObj.xScale(-this.phaseLim))
				.attr("width",w);
			plotObj.plot.select("#phaseBlockRight").transition(t)
				.attr("x",plotObj.xScale(1))
				.attr("width",w);
		}
	}
	//////////////
	// create the plot axes
	//////////////
	createAxes(data, width, height, margin, xTitle, yTitle, className, topXlabel, rightYlabel, left, top, labelFontsize, axisFontsize, xExtent, yExtent, hideAllTicks, xFormat, yFormat, nXticks, nYticks){

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

		var plot = d3.select(this.container).append("svg")
			.attr('class',className)
			.style('position', 'absolute')
			.style('top',top + "px")
			.style('left',left + "px")
			.attr("width", (width + margin.left + margin.right)+"px")
			.attr("height", (height + margin.top + margin.bottom)+"px")
			//.attr("transform", "translate(" + left + "," + top + ")")


		//https://bl.ocks.org/jarandaf/df3e58e56e9d0d3b9adb
		var clipPath = plot.append('defs').append("clipPath")
			.attr("id","clip"+className)
			.attr("class","clipPathMain");
		var clip = clipPath.append('rect')
			.attr("width", width+"px")
			.attr("height", height+"px")
			.attr("x",margin.left)
			.attr("y",margin.top);

		const main = plot.append('g')
			.attr('class', 'main')
			.attr('clip-path', 'url(#clip'+className+')');

		//white background for plot
		main.append('rect')
			.attr("id","backgroundFill")
			.attr("width", width+"px")
			.attr("height", height+"px")
			.attr("x",margin.left)
			.attr("y",margin.top)
			.attr("fill", "white");

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
			xYoffset = height + margin.bottom - parseFloat(labelFontsize),
			yXoffset = -yTitle.length/4.*parseFloat(labelFontsize), //seems to look OK, but not ideal
			yYoffset = parseFloat(labelFontsize);


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
	createScatterPlot(plotObj, data, errorType){

		var main = plotObj.plot.select(".main"),
			rect = plotObj.plot.select("defs").select("clipPath").select("rect");

		var	width = parseFloat(rect.attr("width")),
			height = parseFloat(rect.attr("height")),
			left = parseFloat(rect.attr("x")),
			top = parseFloat(rect.attr("y"));

		plotObj.errorType = errorType;

		//add the data (from external function)
		this.addData(data, main, plotObj.xScale, plotObj.yScale, errorType);

		//enable zooming
		this.addBrushZoom(plotObj);

	}

	//////////////
	// zoom functionality, with possibility of a background image
	//////////////
	addBrushZoom(plotObj){

		const _this = this;

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
			var translate = _this.getTransformation(null)
			if (!s) {
				if (!_this.idleTimeout) return _this.idleTimeout = setTimeout(idled, _this.idleDelay);
				plotObj.xScale.domain(plotObj.xExtent).nice();
				plotObj.yScale.domain(plotObj.yExtent).nice();
				s = [[left, top],
					[width + left, height + top]];
				translate = _this.getTransformation(null)

			} else {
				plotObj.xScale.domain([plotObj.xScale.invert(s[0][0]), plotObj.xScale.invert(s[1][0])]);//.nice();
				plotObj.yScale.domain([plotObj.yScale.invert(s[1][1]), plotObj.yScale.invert(s[0][1])]);//.nice();
				plotObj.plot.select(".brush").call(brush.move, null);
				if (plotObj.image != null){
					var trans = plotObj.image.attr("transform");
					if (trans == ""){
						trans = null;
					}
					translate = _this.getTransformation(trans)
				}

			}
			zoom(s, translate);
		}

		function idled() {
			_this.idleTimeout = null;
		}

		function zoom(s, translate) {
			//the image
			var sX = 1.
			if (plotObj.image != null){
				var sWidth = s[1][0] - s[0][0];
				var scaleX = width/sWidth;
				sX = scaleX*translate.scaleX;
				_this.updatePlotImage(plotObj, s, translate, _this.tDuration)
			}

			//the data
			_this.updatePlotData(plotObj, _this.tDuration, sX);

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
	addImageToPlot(plotObj, backgroundImage){


		var main = plotObj.plot.select(".main"),
			rect = plotObj.plot.select("defs").select(".clipPathMain").select("rect");

		var	width = parseFloat(rect.attr("width")),
			height = parseFloat(rect.attr("height")),
			left = parseFloat(rect.attr("x")),
			top = parseFloat(rect.attr("y"));


		plotObj.image = null;
		if (backgroundImage != null){

			plotObj.image = main.append("image")
				.attr("width", width+"px")
				.attr("height", height+"px")
				.attr("x", left+"px")
				.attr("y", top+"px")
				.attr("xlink:href",backgroundImage)
				//.attr("xlink:href","./input/CMDbackground_BW.svg")
				//.attr("src", backgroundImage);

			// plotObj.image = main.append("rect")
			// 	.attr("id","CMDimage")
			//  	.attr("width", width+"px")
			//  	.attr("height", height+"px")
			// 	.attr("x", left+"px")
			// 	.attr("y", top+"px")
			// 	.attr("fill",'none')
			// 	//.append(CMDimage)
			// 	// .append("svg")
			// 	// 	.attr("src", CMDimage);

			// var elem = document.getElementById("CMDimage")
			// elem.innerHTML = backgroundImage;
		}
	}

	//////////////
	// update the size and location of image based on zoom
	//////////////
	updatePlotImage(plotObj, s, translate, tDur){

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
		var t = d3.transition().duration(this.tDuration);
		plotObj.image.transition(t)
			.attr("transform","translate(" + dx +  "," + dy + ")scale(" + sX + "," + sY +")")


	}

	//////////////
	// create the bar plot (for period and amplitude spines)
	//////////////
	createBarPlot(plotObj, data, horizontal){

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
	updateButtons(){


		//change bar fill and outline and also plotted points based on selections 
		this.inputData.filters.forEach(function(filter, j){


			var onOff = d3.select('#onOff'+filter)
			var onOffLabel = d3.select('#onOffLabel'+filter)
			var fillColor = this.inputData[filter].color;
			var lineColor = this.inputData[filter].color;
			if (onOff.property('checked')){
				onOffLabel.select("i").text("visibility")
				this.phasePlot.plot.selectAll("."+filter).filter(".symbol").style("stroke", '#555555');
				this.phasePlot.plot.selectAll("."+filter).filter(".symbol").raise();
				this.rawPlot.plot.selectAll("."+filter).filter(".symbol").style("stroke", '#555555');
				this.rawPlot.plot.selectAll("."+filter).filter(".symbol").raise();
			} else {
				fillColor = "lightgray";
				onOffLabel.select("i").text("visibility_off")
				this.phasePlot.plot.selectAll("."+filter).filter(".symbol").style("stroke", fillColor);
				this.rawPlot.plot.selectAll("."+filter).filter(".symbol").style("stroke", fillColor);
			}
			onOffLabel.style('color',fillColor);

			this.phasePlot.plot.selectAll("."+filter).filter(".symbol").style("fill", fillColor);
			this.phasePlot.plot.selectAll("."+filter).filter(".line").style("stroke", fillColor);
			this.rawPlot.plot.selectAll("."+filter).style("fill", fillColor);
			this.rawPlot.plot.selectAll("."+filter).filter(".line").style("stroke", fillColor);

			this.featurePlots.forEach(function(p){
				p.plot.selectAll("."+filter).classed("barSelected", false);
				p.plot.selectAll("."+filter).style("fill", fillColor);
			});		



		}.bind(this));

		//outlines on rects
		this.featurePlots.forEach(function(p){
			p.plot.selectAll("."+this.inputData.filters[this.ppos]).classed("barSelected", true);
		}.bind(this));

		//length of period rects (assuming that the period plot is always first!)
		var left = parseFloat(this.featurePlots[0].plot.select("defs").select("clipPath").select("rect").attr("x"));
		if (this.featurePlots[0].plot.classed("hidden")){
			left += this.plotPositions.widthFeature;
		}

		var t = d3.transition().duration(this.tDuration);
		this.featurePlots[0].plot.selectAll(".bar-rect").transition(t)
			.attr("width", function(d) {return this.featurePlots[0].xScale(+d.y*this.periodMultiple) - left;}.bind(this)) ;

		d3.select("#multipleText").property("value","="+this.periodMultiple)
		d3.select("#multipleText").text("="+this.periodMultiple)
	}

	//////////////
	// updates to the phase plot (including transitions)
	//////////////
	updatePhasePlot(tDur){

		var periodOld = this.period;
		this.period = this.inputData[this.inputData.filters[this.ppos]].period*this.periodMultiple;
		var cData = this.phasePlot.plot.selectAll(".symbol").data();
		cData.forEach(function(d, j){
			var phase = (d.xRaw % this.period)/this.period; 
			var phaseNew = phase;

			if (d.mirrored){
				if (phase < this.phaseLim){
					phaseNew = phase + 1;
				}
				if (phase > 1.-this.phaseLim){
					phaseNew = phase - 1;
				}
			}
			d.x = phaseNew;
		}.bind(this));

		this.updatePlotData(this.phasePlot, tDur, 1.)


	}

	//////////////
	// create the buttons and link bars into control
	//////////////
	createButtons(bbox){
			//link controls
		this.inputData.filters.forEach(function(filt, j){
			//select the period from the rect
			this.featurePlots.forEach(function(p){

				p.plot.selectAll("."+filt)
					.on('click',function(d){
						this.ppos = j;
						this.updateButtons();
						this.updatePhasePlot(this.tDuration);
					}.bind(this))
			}.bind(this));

			//on/off buttons 
			var y = parseFloat(this.featurePlots[0].plot.select('.'+filt).attr("y")) //why do I need the -2?
			var h = parseFloat(this.featurePlots[0].plot.select('.'+filt).attr("height"))
			//https://www.w3schools.com/howto/howto_css_switch.asp
			var onOffButton = d3.select(this.container).append("div")
				.style('position','absolute')
				.style('top',this.plotPositions.topFeature + this.plotPositions.marginFeature.top + y -2 + 'px')
				.style('left', this.plotPositions.leftFeature + this.plotPositions.marginFeature.left -30 + 'px')
				.style('z-index',1)
				.attr('id','onOffButton')
			onOffButton.append("input")
				.attr("type","checkbox")
				.attr("name","onOff"+filt)
				.attr("id","onOff"+filt)
				.attr("value","valuable")
				.property('checked', true)
				.on("change",function(){
					this.updateButtons();
					this.updatePhasePlot(this.tDuration);
				}.bind(this));
			onOffButton.append("label")
				.attr("for","onOff"+filt)
				.attr("id","onOffLabel"+filt)
				.style("height",h+"px")
				.style("width",h+"px")
				.style("cursor","pointer")
				.append("i")
					.attr("class","material-icons")
					.text("visibility")
					.style("font-size",h+"px")
		}.bind(this));

		var helpButton = d3.select(this.container).append("div")
			.attr('id','helpButton')
			.attr('class','buttonDiv buttonDivUse')
			.style('top',bbox.top)
			.style('left',bbox.left)
			.style('border-left','none')
			.append("i")
				.attr("class","buttonText material-icons")
				.text("help_outline")


		var flipButton = d3.select(this.container).append("div")
			.attr('id','flipButton')
			.attr('class','buttonDiv buttonDivUse')
			.style('top',bbox.top)
			.style('left',parseFloat(bbox.left) + 50 + "px")
			.on('mousedown',function(d){
				var plots = [this.phasePlot, this.rawPlot]
				plots.forEach(function(p){
					var extent = p.yExtent;
					p.yExtent = [extent[1], extent[0]]
					p.yScale.domain(p.yExtent);
					this.updatePlotData(p, 20, 1.)
					var fill = p.plot.select("#flipRect").classed("filledRect")
					p.plot.select("#flipRect").classed("filledRect", !fill)
				}.bind(this))

				var sel = d3.select("#flipButton").classed("buttonDivSelected")
				d3.select("#flipButton").classed("buttonDivSelected", !sel)
			}.bind(this))
			.append("i")
				.attr("class","buttonText material-icons")
				.text("swap_vert")

		var multipleBox = d3.select(this.container).append("form")
			.attr('id','multipleBox')
		var value = ""
		multipleBox.append('input')
			.attr('type','text')
			.attr('name','multipleText')
			.attr('id','multipleText')
			.attr('class','buttonDiv buttonDivUse')
			.style('top',bbox.top)
			.style('left',parseFloat(bbox.left) + 200 + "px")
			.style('width',"100px")
			.style('text-align',"left")
			.style('padding',0)
			.style('border-left','none')
			.style('border-top','none')
			.attr('value',"="+this.inputData.multiples[this.mpos])
			.text("="+this.inputData.multiples[this.mpos])
			.on("keypress", function(){
				var e = d3.event;
				value += String.fromCharCode(e.keyCode)
				if (e.keyCode == 13){
					e.preventDefault();
					if (value.slice(0,1) == "=") {
						value = value.slice(1)
					}
					if (isNaN(value)){
						value = this.periodMultiple;
					} else {
						this.periodMultiple = parseFloat(value); 
					}
					this.updateButtons();
					this.updatePhasePlot(this.tDuration);
					value = ""
				}
			}.bind(this))


		//dropdown
		var periodDropdown = d3.select(this.container).append("div")
			.attr('id','periodControl')
			.attr('class','dropdown')
			.style('top',bbox.top)
			.style('left',bbox.left + 100 + "px")
			.style('border-right','none')
			.style('border-top','none')
			.text("Period Multiple")
			.append("div")
				.attr("id","periodDropdown")
				.attr("class","dropdown-content")

		d3.select('#periodControl').on('click', function(d){
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
		this.inputData.multiples.forEach(function(m, j){
			dropdown.append('div')
				.style('display','block')
				.attr('value', this.inputData.multiples[j])
				.html("&nbsp;" + this.inputData.multiplesNames[j])
				.on('click',function(d){
					this.periodMultiple = this.inputData.multiples[j];
					this.updateButtons()
					this.updatePhasePlot(this.tDuration)
				}.bind(this));	
			}.bind(this));

		//outline for the On/Off buttons
		// var onOffDiv = d3.select(this.container).append("div")
		// 	.attr('id','onOffDiv')
		// 	.attr('class','buttonDiv')
		// 	.style('top',bbox.top)
		// 	.style('left',parseFloat(bbox.left)+300+"px")
		// 	.style('width','35px')


		//outline for the feature plots 
		var featureBox = d3.select(this.container).append("div")
			.attr('id','featureBox')
			.attr('class','buttonDiv')
			.style('top',bbox.top)
			.style('left',parseFloat(bbox.left)+300+"px") 
			.style('width',40 + this.plotPositions.widthFeature + this.plotPositions.marginFeature.left + this.plotPositions.marginFeature.right + "px") // 5 pixels more than I expected, probably due to borders??
			.style('background-color',getComputedStyle(document.documentElement).getPropertyValue('--button-background-color'))

		//button to switch features
		var featureButton = d3.select(this.container).append("div")
			.attr('id','featureButton')
			.attr('class','buttonDiv buttonDivUse')
			.style('top',bbox.top)
			.style('left',parseFloat(featureBox.style('left'))+parseFloat(featureBox.style('width')) + "px")
			.style('width',"50px")
			.style('border-right','none')
			.on('click',function(d){
				this.fpos = (this.fpos + 1) % this.featurePlots.length;
				this.featurePlots.forEach(function(p, i){
					p.plot.classed("hidden", false);

					var rects = p.plot.selectAll("rect")
					var rectsX = parseFloat(rects.attr("x"))
					var xtitle = p.plot.selectAll(".x-title")
					var xtitleX = parseFloat(xtitle.attr("x"))
					var xaxis = p.plot.selectAll(".axis-x-bottom")
					var xaxisTrans = this.getTransformation(xaxis.attr("transform"))
					var t = d3.transition().duration(this.tDuration);
					xtitle.transition(t).attr("x",xtitleX + this.plotPositions.widthFeature)
					xaxis.transition(t).attr("transform","translate("+ (xaxisTrans.translateX + this.plotPositions.widthFeature) +","+xaxisTrans.translateY+")")
					rects.transition(t)
						.attr("x",rectsX + this.plotPositions.widthFeature)
						.on("end", function(){
							if (p.plot.classed("hidden")){
								rects.attr("x",rectsX - this.plotPositions.widthFeature)
								xtitle.attr("x",xtitleX - this.plotPositions.widthFeature)
								xaxis.transition(t).attr("transform","translate("+ (xaxisTrans.translateX - this.plotPositions.widthFeature) +","+xaxisTrans.translateY+")")

							}
							if (i != this.fpos){
								p.plot.classed("hidden", true);
							}
						}.bind(this));


				}.bind(this))
			}.bind(this))
			.append("i")
				.attr("class","buttonText material-icons")
				.text("arrow_forward")

		//descriptions under each button
		d3.select(this.container).append("div")
			.attr("class","buttonInstructions")
			.style("left",bbox.left)
			.style("top",parseFloat(bbox.top) + 50 + "px")
			.text("help");
		d3.select(this.container).append("div")
			.attr("class","buttonInstructions")
			.style("left",parseFloat(bbox.left) + 50 + "px")
			.style("top",parseFloat(bbox.top) + 50 + "px")
			.text("flip");
		d3.select(this.container).append("div")
			.attr("class","buttonInstructions")
			.style("left",parseFloat(bbox.left) + 100 + "px")
			.style("top",parseFloat(bbox.top) + 50 + "px")
			.style("width","200px")
			.text("change the period");
		d3.select(this.container).append("div")
			.attr("class","buttonInstructions")
			.style("left",parseFloat(bbox.left) + 300 + "px")
			.style("top",parseFloat(bbox.top) + 50 + "px")
			.style("width","40px")
			.text("on/off");	
		
		d3.select(this.container).append("div")
			.attr("class","buttonInstructions")
			.style('left',parseFloat(featureBox.style('left'))+parseFloat(featureBox.style('width')) + "px")
			.style("top",parseFloat(bbox.top) + 50 + "px")
			.text("next feature");	
	}

	//////////////
	// create the plots
	//////////////
	startPlotting(){

		//cleanup, in case this replots
		d3.select(this.container).selectAll("div").remove();
		d3.select(this.container).selectAll("svg").remove();
		d3.select(this.container).selectAll("form").remove();
		this.fpos = 0;
		this.featurePlots = [];

		var bbox = d3.select(this.container).node().getBoundingClientRect();
		this.setPlotPositions(bbox);

		console.log("props", this.props)
		this.period = this.inputData[this.inputData.filters[this.ppos]].period;

		//set the background
		d3.select(this.container).style('background-color',this.backgroundColor)
		d3.select(this.container).style('border','1px solid '+this.borderColor)

		//add the phase data
		this.inputData.phaseData = [];

		this.inputData.rawData.forEach(function(d, i){
			var phase = (parseFloat(d.x) % this.period)/this.period;
			var phaseNew = null;
			this.inputData.phaseData.push({"x": phase,
				"xRaw":parseFloat(d.x), 
				"y":parseFloat(d.y), 
				"ye":parseFloat(d.ye),
				"r":parseFloat(d.r),  
				"c":d.c, 
				"s":d.s, 
				"filter":d.filter,
				"mirrored":false,
			});
			if (phase < this.phaseLim){
				phaseNew = phase + 1;
			}
			if (phase > 1.-this.phaseLim){
				phaseNew = phase - 1;
			}
			if (phaseNew != null){
				this.inputData.phaseData.push({"x": phaseNew,
					"xRaw":parseFloat(d.x), 
					"y":parseFloat(d.y), 
					"ye":parseFloat(d.ye),
					"r":parseFloat(d.r),  
					"c":d.c, 
					"s":d.s, 
					"filter":d.filter,
					"mirrored":true,
				});	
			}

		}.bind(this))

		//add a filter to CMD data so we don't get errors in plotting
		// this.inputData.CMDdata.forEach(function(d,j){
		// 	d["filter"] = this.inputData.filters[this.ppos];	
		// });

		//reset the bottom phase margin so that I don't clip the right axis title
		this.plotPositions.marginPhase.bottom = 65;
		this.phasePlot = this.createAxes(this.inputData.phaseData, 
									this.plotPositions.widthPhase, 
									this.plotPositions.heightPhase, 
									this.plotPositions.marginPhase, 
									"Phase", 
									"Brightness&rarr;", 
									"phasePlot", 
									true, 
									false, 
									this.plotPositions.leftPhase, 
									this.plotPositions.topPhase,
									"18pt", "10pt",  null, null, false, d3.scaleLinear(), d3.scaleLinear(), 5, 5);
		var main = this.phasePlot.plot.select(".main")
		//add the gray blocks to the phase plot where it extends beyond 0-1
		var w = (this.phasePlot.xScale(0) - this.phasePlot.xScale(-this.phaseLim) );
		main.append('rect')
			.attr("id","phaseBlockLeft")
			.attr("width", w)
			.attr("height", this.plotPositions.heightPhase)
			.attr("x",this.phasePlot.xScale(-this.phaseLim))
			.attr("y",this.plotPositions.marginPhase.top)
			.attr("fill", "lightgray");
		main.append('rect')
			.attr("id","phaseBlockRight")
			.attr("width", w)
			.attr("height", this.plotPositions.heightPhase)
			.attr("x",this.phasePlot.xScale(1))
			.attr("y",this.plotPositions.marginPhase.top)
			.attr("fill", "lightgray");
		main.append('rect')
			.attr("id","flipRect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", "none");
		this.createScatterPlot(this.phasePlot, this.inputData.phaseData, "line");
		//reposition left label
		this.phasePlot.plot.select(".y-title").attr("x",-this.plotPositions.heightPhase);

		this.rawPlot = this.createAxes(this.inputData.rawData, 
									this.plotPositions.widthDays, 
									this.plotPositions.heightDays, 
									this.plotPositions.marginDays, 
									"Time (days)", 
									"", 
									"rawPlot", 
									false, 
									false, 
									this.plotPositions.leftDays, 
									this.plotPositions.topDays, 
									"18pt", "10pt",  null, null, false, d3.scaleLinear(), d3.scaleLinear(), 5, 5);
		var main = this.rawPlot.plot.select(".main")
		main.append('rect')
			.attr("id","flipRect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", "none");
		this.createScatterPlot(this.rawPlot, this.inputData.rawData, "line");


		this.CMDPlot = this.createAxes(this.inputData.CMDdata, 
									this.plotPositions.widthCMD, 
									this.plotPositions.heightCMD, 
									this.plotPositions.marginCMD, 
									"&larr;Temperature", 
									"", 
									"CMDPlot", 
									false, 
									false, 
									this.plotPositions.leftCMD,
									this.plotPositions.topCMD,
									"18pt", "10pt",
									[-0.7644119, 5.7152615], 
									[18.828021451359326, -3.263948750885376],
									true, d3.scaleLinear(), d3.scaleLinear(), 5, 5);								 
		this.addImageToPlot(this.CMDPlot, this.CMDImage)
		this.createScatterPlot(this.CMDPlot, this.inputData.CMDdata, "ellipse");
		//reposition bottom label
		var y = parseFloat(this.rawPlot.plot.select(".x-title").attr("y")) + this.plotPositions.heightPhase + this.plotPositions.marginPhase.top + + this.plotPositions.marginDays.top;
		this.CMDPlot.plot.select(".x-title").attr("y",y+"px");

		//features
		this.inputData.features.forEach(function(feature, i){
			var xFormat = d3.scaleLinear();
			if (this.inputData['featuresFormat'][i] == "log"){
				xFormat = d3.scaleLog().base(10)
			}
			var featurePlot = this.createAxes(this.inputData.featureData[feature], 
								this.plotPositions.widthFeature, 
								this.plotPositions.heightFeature, 
								this.plotPositions.marginFeature, 
								feature+"&rarr;", 
								"", 
								feature+"Plot", 
								false, 
								false, 
								this.plotPositions.leftFeature,
								this.plotPositions.topFeature, 
								"12px", 
								"10pt",
								this.inputData['featuresRange'][i], 
								[0,this.inputData.featureData[feature].length],
								true,
								xFormat,
								d3.scaleLinear(),
								10, 5);

			this.createBarPlot(featurePlot, this.inputData.featureData[feature], true);
			featurePlot.plot.style('z-index',1) //to place it on top of the fature box
			//hide some axes
			featurePlot.gXtop.classed("hidden",true)
			featurePlot.gYleft.classed("hidden",true)
			featurePlot.gYright.classed("hidden",true)
			//reposition bottom label
			featurePlot.plot.select(".x-title").attr("y",66);
			//add to the params list

			this.featurePlots.push(featurePlot)
		}.bind(this));



		//initial outlines on the bars
		//also hide all the feature plots except for the first one
		this.featurePlots.forEach(function(p, i){
			p.plot.selectAll("."+this.inputData.filters[this.ppos]).classed("barSelected", true);
			if (i != this.fpos){
				p.plot.classed("hidden", true);
				//setup for fly in/out on buttons
				var rects = p.plot.selectAll('rect')
				var rectsX = parseFloat(rects.attr("x"))
				var xtitle = p.plot.selectAll(".x-title")
				var xtitleX = parseFloat(xtitle.attr("x"))
				var xaxis = p.plot.selectAll(".axis-x-bottom")
				var xaxisTrans = this.getTransformation(xaxis.attr("transform"))
				rects.attr("x",rectsX - this.plotPositions.widthFeature)
				xtitle.attr("x",xtitleX - this.plotPositions.widthFeature)
				xaxis.attr("transform","translate("+ (xaxisTrans.translateX - this.plotPositions.widthFeature) +","+xaxisTrans.translateY+")")		}
		}.bind(this));



		this.createButtons(bbox);
		this.updateButtons();
	}

//////////////////////////////////////////////////
//React stuff
	// render () {
	// 	console.log("rendering")

	// 	return (
	// 		<div className='light-curve-viewer' ref={this.svgContainer}>
	// 			<ReactResizeDetector
	// 				handleWidth
	// 				handleHeight
	// 				onResize={this.startPlotting.bind(this)}
	// 				refreshMode='debounce'
	// 				refreshRate={500}
	// 			/>

	// 		</div>
	// 	)
	// }
//////////////////////////////////////////////////

}
//////////////////////////////////////////////////
//React stuff
// //
// //<img src={CMDimage} width="200" height="200" />

// LightCurveViewer.wrappedComponent.propTypes = {
//   inputData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
// }

// LightCurveViewer.wrappedComponent.defaultProps = {
//   inputData: [[]]
// }

// export default LightCurveViewer
//////////////////////////////////////////////////

//////////////
// first, read in the data
//////////////
let lightCurveViewer = new LightCurveViewer()
d3.json("data/27882110006813.json")
	.then(function(data) {
		lightCurveViewer.inputData = data;
		lightCurveViewer.startPlotting();
	});



//simple way to scroll through these data files with space bar
iData = 0;
files = ['data/27882110006813.json',
		'data/XanderTest/37.json',
		'data/XanderTest/182.json',
		'data/XanderTest/180.json',
		'data/XanderTest/2.json',
		'data/XanderTest/210.json',
		'data/XanderTest/791.json',
		'data/XanderTest/154.json']
document.body.onkeyup = function(e){
	if(e.keyCode == 32){
		iData += 1;
		iData = iData % files.length;
		console.log(iData, files[iData]);
		d3.select('#container').html(""); //remove the previous plot
		d3.json(files[iData])
			.then(function(data) {
				lightCurveViewer.inputData = data;
				lightCurveViewer.startPlotting();
			});
	}
}