var margin = {top: 0, right: 0, bottom: 60, left: 60},
	width = 500,
	height = 300,
	allWidth = 500 + margin.left + margin.right,
	allHeight = 300 + margin.top + margin.bottom,
	idleTimeout,
	idleDelay = 350;

var x0 = [margin.left, allWidth - margin.right ],
    y0 = [allHeight - margin.bottom, margin.top],
    xExtent, yExtent;

var x = d3.scaleLinear().range(x0);

var y = d3.scaleLinear().range(y0);

var xAxis = d3.axisBottom(x);

var yAxis = d3.axisLeft(y);




var rawLC = d3.select("body").append("svg")
		.attr("width", allWidth)
		.attr("height", allHeight)

d3.csv("data/27882110006813.csv")
	.then(function(data) {

//////////////
// RAW DATA
//////////////
		xExtent = d3.extent(data, function(d) { return +d.hjd; });
		yExtent = d3.extent(data, function(d) { return +d.mag; });

		x.domain(xExtent).nice();
		y.domain(yExtent).nice();

		//axes
		var gX = rawLC.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + (height + margin.top) + ")")
			.call(xAxis)
		var gY = rawLC.append("g")
			.attr("transform", "translate(" + margin.left + ",0)")
			.attr("class", "axis axis--y")
			.call(yAxis)

		//axes labels
		rawLC.append("text")
			.attr("class", "label")
			.attr("x", width/2. + margin.left)
			.attr("y", height + margin.bottom-20)
			.style("text-anchor", "middle")
			.text("Days");
		rawLC.append("text")
			.attr("class", "label")
			.attr("transform", "rotate(-90)")
			.attr("x", -height/2)
			.attr("y", 20)
			.style("text-anchor", "middle")
			.text("Brightness")


		var rawLCview = rawLC.selectAll(".dot")
			.data(data)
			.enter().append("circle")
				.attr("class", "dot circle")
				.attr("r", 3.5)
				.attr("cx", function(d) { return x(+d.hjd); })
				.attr("cy", function(d) { return y(+d.mag); })
				.style("opacity",0.7);



		//brush + zoom from here : https://bl.ocks.org/mbostock/f48fcdb929a620ed97877e4678ab15e6
		var brush = d3.brush().on("end", brushended);
		rawLC.append("g")
			.attr("class", "brush")
			.call(brush);

		function brushended() {
			var s = d3.event.selection;
			if (!s) {
				if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
				x.domain(xExtent).nice();
				y.domain(yExtent).nice();
			} else {
				x.domain([x.invert(s[0][0]), x.invert(s[1][0])]).nice();
				y.domain([y.invert(s[1][1]), y.invert(s[0][1])]).nice();
				rawLC.select(".brush").call(brush.move, null);
			}
			zoom();
		}

		function idled() {
			idleTimeout = null;
		}

		function zoom() {
			var t = rawLC.transition().duration(750);
			rawLC.select(".axis--x").transition(t).call(xAxis);
			rawLC.select(".axis--y").transition(t).call(yAxis);
			rawLC.selectAll("circle").transition(t)
				.attr("cx", function(d) { return x(+d.hjd); })
				.attr("cy", function(d) { return y(+d.mag); })
		}

	});



