$(document).ready(function() {
  var margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };

  var width = 960 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var projection = d3.geo.equirectangular()
    .scale(150)
    .translate([width / 2, height / 2])
    .rotate([0, 0]);

  var color = color = d3.scale.category20();

  var path = d3.geo.path()
    .projection(projection);
		
  queue()
    .defer(d3.json, "data/world-110m.json")
    .defer(d3.csv, "data/USA.csv")
    .await(function ready(errors, world, usa) {
      var countries = topojson.feature(world, world.objects.countries).features;
      var neighbors = topojson.neighbors(world.objects.countries.geometries);

      svg.selectAll(".country")
        .data(countries)
      .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path)
        .style("fill", function(d, i) { return color(d.color = d3.max(neighbors[i], function(n) { return countries[n].color; }) + 1 | 0); });

      svg.selectAll(".detonation.usa")
        .data(usa)
      .enter().append("circle")
        .attr("class", "usa detonation")
        .attr("cx", function(d) { return projection([d["LONG"], d["LAT"]])[0]; })
        .attr("cy", function(d) { return projection([d["LONG"], d["LAT"]])[1]; })
        .attr("r", 2)
		  .on("mouseover", function(){
				mouseoverDetonation = d;
				tip.show;
			// debugging - this is never triggered
			d3.select("body")
				.append("p")
				.text("mouseover");
				
			})
		  .on("mouseout", tip.hide);
    });
	
	/** Details on demand **/
	
	var mouseoverDetonation;
		
	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([-10, 0])
	  .html(function(d) {
		return "<strong>Year:</strong> <span style='color:white'>" + mouseoverDetonation["YEAR"] + "</span><br>" +
				"<strong>Series:</strong> <span style='color:white'>" + mouseoverDetonation["SERIES"] + "</span><br>" +
				"<strong>Name:</strong> <span style='color:white'>" + mouseoverDetonation["NAME"] + "</span><br>";
	  });	
		
	svg.call(tip);
	
	
	
	/** Year Slider **/
	
	 function filterYear(newMin, newMax) {
		svg.selectAll(".detonation.usa")
			.each(function(d,i) {
			var y = d["YEAR"];
			
			d3.select(this)
				.style('opacity', function(){ return (newMin <= y && y <= newMax)? 1 : 0;});
				
			/* Trying optimization here
			if (minYear <= y && y <= newMin) {
				var o = (y >= newMin)? 1 : 0;
				d3.select(this)
				  .style('opacity', o);
			} else if (newMax <= y && y <= maxYear) {
				var o = (y <= newMax)? 1 : 0;
				d3.select(this)
				  .style('opacity', o);
			} 
			*/
		});
		minYear = newMin;
		maxYear = newMax;
	}
	
	var minYear = 1945, maxYear = 2000;
	var timelineWidth = 600,
		timelineHeight = 20;
	var years = d3.time.scale()
		.rangeRound([0, timelineWidth])
		.domain([new Date(minYear, 0, 0), new Date(maxYear, 0, 0)])
		
	var yearAxis = d3.svg.axis()
		.scale(years)
		.orient("bottom")
		.tickFormat(d3.time.format("%Y"))
	
	function setSliderTicks(element) {
		var $slider =  $(element);
		var max =  $slider.slider("option", "max");    
		var min =  $slider.slider("option", "min");    
		var spacing =  100 / (max - min);

		$slider.find(".ui-slider-tick-mark").remove();
		for (var i = 0; i < max - min ; i++) {
			if (i % 5 == 0) continue;
			$('<span class="ui-slider-tick-mark"></span>').css("left", (spacing * i) +  "%").appendTo($slider); 
			$(".ui-slider-tick-mark").css("top", (timelineHeight + 0) + "px");
		 }
	}
	
	$(function() {
		$( ".ui-slider" ).slider({
			range: true,
			min: minYear,
			max: maxYear,
			values: [minYear, maxYear],
			create: function( event, ui ) {
				setSliderTicks(event.target);
			},
			slide: function( event, ui ) {
				filterYear(ui.values[0], ui.values[1]);
			}
		});
		//$(".ui-slider").css("background", "#D8D8D8");
		//$(".ui-slider .ui-slider-range").css("background", "#848484");
		
		$(".timeline").css("height", timelineHeight + "px");
		$(".timeline .ui-slider-handle").css("width","10px");
		$(".timeline .ui-slider-handle").css("height", (timelineHeight + 7) + "px");
		$(".timeline .ui-slider-handle").css("border-color","#000000");

    });
	
	d3.select("body")
		.append("div")
		.attr("class", "ui-slider timeline")
		.style("width", timelineWidth + "px")
		.style("height", timelineWidth + "px")
		.style("top", height + "px")
		.style("margin-left", "auto")
		.style("margin-right", "auto")
    
	
	var timeline = d3.select(".ui-slider.timeline").append("svg")
		.style("top", (height / 2 + timelineHeight - 100) + "px")
		.style("left", (width / 2 - 100) + "px")
		.attr("width", timelineWidth * 2)
		.attr("height", 150)
		.append("g")
		  .attr("class", "x axis")
		  .call(yearAxis)
		  .attr("transform", "translate(110, 111)")
		  
	timeline.append("text")
		  .attr("x", -70)
		  .attr("y", 0)
		  .text("Year")
		  .style("font-size","14pt")
	timeline.append("text")
		  .attr("x", timelineWidth - 15)
		  .attr("y", 17)
		  .text("2000")

	
	
	
	
});