$(document).ready(function() {
  var margin = {
    top: 0,
    right: 0,
    bottom: 50,
    left: 0
  };
  
  var sidebarMargin = {
    top: 10,
    bottom: 50,
    left: 0
  };
  
  var sidebarWidth = 100;
  
  var mainMargin = {
    top: 10,
    right: 0,
    bottom: 50,
    left: sidebarWidth,
  };
  
  var mapMargin = {
    top: 10,
    right: 0,
    bottom: 0,
    left: mainMargin.left
  };

  var legendMargin = {
    top: 0,
    right: 0,
    bottom: 5,
    left: mainMargin.left
  };

  var width = 960 - margin.left - margin.right,
      mainWidth = width - sidebarWidth;

  var totalHeight = 500,
      height = totalHeight - margin.top - margin.bottom;

  var zoom = d3.behavior.zoom()
      .scaleExtent([1, 10])
      .on("zoom", zoomed);

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", totalHeight)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var countryColors = d3.scale.category10();

  var mapGroup = svg.append("g")
    .attr("id", "viewer")
    .attr("transform", "translate(" + mapMargin.left + "," + mapMargin.top + ")");

  var legend = svg.append("g");
  
  svg.append("rect")
    .attr("class", "background")
    .attr("id", "sidebar")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", sidebarWidth)
    .attr("height", height);
      
  svg.append("rect")
    .attr("class", "overlay")
    .attr("x", sidebarWidth)
    .attr("y", 0)
    .attr("width", mainWidth)
    .attr("height", height)
    .call(zoom);

  var projection = d3.geo.equirectangular()
    .scale(150)
    .translate([width / 2, height / 2])
    .rotate([0, 0]);

  var yield = d3.scale.linear()
    .range([10, 50]);

  var path = d3.geo.path()
    .projection(projection);

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<strong>Year:</strong> <span style='color:white'>" + d["YEAR"] + "</span><br>" +
          "<strong>Series:</strong> <span style='color:white'>" + d["SERIES"] + "</span><br>" +
          "<strong>Name:</strong> <span style='color:white'>" + d["NAME"] + "</span><br>";
  });

  svg.call(tip);
  
  queue()
    .defer(d3.json, "data/world-110m.json")
    .defer(d3.csv, "data/USA.csv")
    .defer(d3.csv, "data/UK.csv")
    .defer(d3.csv, "data/USSR.csv")
    .defer(d3.csv, "data/India.csv")
    .defer(d3.csv, "data/NorthKorea.csv")
    .defer(d3.csv, "data/Pakistan.csv")
    .defer(d3.csv, "data/PRCChina.csv")
    .defer(d3.csv, "data/Unknown.csv")
    .defer(d3.csv, "data/Treaties.csv")
    .await(function ready(errors, world, usa, uk, ussr, india, northkorea, pakistan, china, unknown, treaties) {
      if (errors) {
        console.log("Could not draw data due to error in retrieving data.");
        console.error(errors);

        return;
      }

      var data = [
        {
          "name": "USA",
          "data": usa
        },
        {
          "name": "UK",
          "data": uk
        },
        {
          "name": "USSR",
          "data": ussr
        },
        {
          "name": "India",
          "data": india
        },
        {
          "name": "North Korea",
          "data": northkorea
        },
        {
          "name": "Pakistan",
          "data": pakistan
        },
        {
          "name": "China",
          "data": china
        },
        {
          "name": "Unknown",
          "data": unknown
        },
      ];

      // Draw world
      var countries = topojson.feature(world, world.objects.countries).features;
      var neighbors = topojson.neighbors(world.objects.countries.geometries);

      mapGroup.append("g")
        .attr("id", "map")
        .selectAll(".country")
        .data(countries)
      .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path);

      // Draw detonations
      var parseDate = d3.time.format("%Y").parse;

      var domain = data.map(function(d) {
        return d["data"].map(function(d) {
          return d["YIELD"];
        });
      });

      domain = [].concat.apply([], domain);

      yield.domain(d3.extent(domain, function(d) {
        return parseFloat(d);
      }));

      data.forEach(function(country) {
        country["data"].forEach(function(detonation) {
          detonation["formattedDate"] = parseDate(detonation["YEAR"]);
          
          var parseDateComplete = d3.time.format("%Y %b %d").parse;
          detonation["formattedDateComplete"] = parseDateComplete(detonation["YEAR"] + " " + detonation["MON"] + " " + detonation["DAY"]);
        });
      });

      mapGroup.append("g")
        .attr("id", "countries")
        .selectAll(".country")
        .data(data)
      .enter().append("g")
        .attr("class", function(d) { return d["name"].replace(/ /g, ''); })
        .style("fill", function(d) { return countryColors(d["name"]); })
        .selectAll(".detonation")
        .data(function(d) { return d["data"]; })
      .enter().append("circle")
        .attr("class", "detonation shown")
        .attr("cx", function(d) { return projection([d["LONG"], d["LAT"]])[0]; })
        .attr("cy", function(d) { return projection([d["LONG"], d["LAT"]])[1]; })
        .attr("r", 0)
        .attr("opacity", 0.5)
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
      .transition()
        .duration(1000)
        .attr("r", detonationYieldRadius);

			// Cursor indicator over map
			d3.select(".overlay").style("cursor", "zoom-in")
				.on("mousedown", function() {d3.select(this).style("cursor", "-moz-grabbing").style("cursor", "-webkit-grabbing").style("cursor", "grabbing");})
        .on("mouseup", function() { 
          if (d3.event.shiftKey)
            d3.select(this).style("cursor", "-webkit-zoom-out").style("cursor", "zoom-out");
          else
            d3.select(this).style("cursor", "-webkit-zoom-in").style("cursor", "zoom-in");
        });

      d3.select("body")
        .on("keydown", function() {
          if (d3.event.shiftKey) 
            d3.select(".overlay").style("cursor", "-webkit-zoom-out").style("cursor", "zoom-out");
        })
        .on("keyup", function() {
          d3.select(".overlay").style("cursor", "-webkit-zoom-in").style("cursor", "zoom-in");
        });
				 
      // Detonation Yield Scale
      var yieldMargin = {
        top: 50,
        right: 0,
        left: 0
      };
      
      var yieldScale = svg.append("g")
        .attr("transform", "translate(" + (sidebarWidth / 2) + " ," + yieldMargin.top + ")")
      var yieldScaleHeight = 150;
      
      var yieldY = d3.scale.linear()
          .rangeRound([yieldScaleHeight, 0])
          .domain(d3.extent(domain, function(d) {
            return parseFloat(d);
          }));
          
      yieldY.nice();

      var yieldAxis = d3.svg.axis()
        .scale(yieldY)
        .orient("left");
        
      var yieldScaleDrawn = yieldScale.append("g")
          .attr("class", "axis")
          .call(yieldAxis)
        .append("text")
          .attr("y", yieldScaleHeight + 20)
          .style("text-anchor", "middle")
          .text("Yield");
          
      yieldScale.selectAll("circle")
          .data(d3.range(0, 60000, 5000))
        .enter().append("circle")
          .attr("r", function(d) { return yield(d);})
          .attr("cy", function(d) { return yieldY(d);})
          .style("fill", "#A4A4A4")
          .style('opacity', .25)
          
      // Draw legend
      legend.append("rect")
        .attr("class", "background")
        .attr("x", legendMargin.left)
        .attr("y", 0)
        .attr("width", mainWidth)
        .attr("height", mapMargin.top + legendMargin.bottom);
      
      var legendItem = legend.selectAll(".item")
        .data(data)
      .enter().append("g")
        .attr("transform", function(d, i) { return "translate(" + (legendMargin.left + i * (mainWidth / data.length)) + ", 0)"; });

      legendItem.append("rect")
        .attr("width", mapMargin.top)
        .attr("height", mapMargin.top)
        .style("fill", function(d) { return countryColors(d["name"]); });

      legendItem.append("text")
        .attr("x", mapMargin.top + mapMargin.top / 2)
        .attr("y", mapMargin.top)
        .text(function(d) { return d["name"]; });

      // Draw timeline
      var detonations = d3.selectAll(".detonation");

      var timelineMargin =  {
        top: 5,
        right: 15,
        bottom: 20,
        left: 15
      };

      var x = d3.time.scale()
        .range([timelineMargin.left, width - timelineMargin.right - timelineMargin.left]);

      var y = d3.scale.linear()
        .range([3, margin.bottom - timelineMargin.top - timelineMargin.bottom]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

      var years = [];
      var yearsTemp = {};

      data.forEach(function(country) {
        country["data"].forEach(function(detonation) {
          var year = detonation["YEAR"];

          if (year == null || year == "") {
            return;
          }

          if (yearsTemp[year] == null) {
            yearsTemp[year] = 0;
          }

          yearsTemp[year]++;
        });
      });

      for (var key in yearsTemp) {
        years.push({
          "year": parseDate(key),
          "detonations": yearsTemp[key]
        });
      }
      
      // Addition
      years.sort(function(a, b) { return a["year"] - b["year"]; }); //for using binary search later?
      
      x.domain(d3.extent(years, function(d) { return d["year"]; }));
      y.domain([0, d3.max(years, function(d) { return d["detonations"]; })]);

      x.nice();

      var timeline = svg.append("g")
        .attr("transform", "translate(0," + height + ")")

      timeline.append("rect")
        .attr("class", "background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", margin.bottom);

      timeline.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (margin.bottom - timelineMargin.bottom) + ")")
        .call(xAxis);
          
      var detonationBars = timeline.selectAll(".bar")
        .data(years)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d["year"]); })
        .attr("y", function(d) { return margin.bottom - timelineMargin.bottom - y(d["detonations"]); })
        .attr("width", width / (y.domain()[1] - y.domain()[0]))
        .attr("height", function(d) { return y(d["detonations"]); });

      timeline.append("g")
        .attr("class", "brush")
        .call(d3.svg.brush().x(x)
        .on("brushstart", brushstart)
        .on("brush", brushmove)
        .on("brushend", brushend))
      .selectAll("rect")
        .attr("height", height);

      function brushstart() {
        timeline.classed("selecting", true);
      }

      function brushmove() {
        var s = d3.event.target.extent();

        detonationBars.classed("selected", function(d) {
          var year = d["year"];

          return s[0] <= year && year <= s[1];
        });

        detonations.classed("shown", function(d) {
            var year = d["formattedDate"];

            return s[0] <= year && year <= s[1];
          })
          .transition()
          .attr("r", function(d) {
              var year = d["formattedDate"];
              var present = s[0] <= year && year <= s[1];

              return present ? detonationYieldRadius(d) : 0.0;
          });
      }

      function brushend() {
        timeline.classed("selecting", !d3.event.target.empty());

        if (d3.event.target.empty()) {
          detonations.transition().attr("r", detonationYieldRadius);
          detonations.classed("shown", true);
        }
        
        // Linking with focused timeline axis
        var s = d3.event.target.extent();
				var yearInterval = d3.time.year;	
				var adjustedMin = yearInterval.ceil(s[0]),
					adjustedMax = yearInterval.ceil(s[1]);
				
        //x2.domain(d3.event.target.empty() ? x2.domain() : [adjustedMin, adjustedMax]);
				x2.domain(d3.event.target.empty() ? x2.domain() : d3.event.target.extent());
				
        // Updating the focused timeline
        d3.selectAll(".focus").classed("shown", function(d) {
            var year = d["formattedDate"];

            return s[0] <= year && year <= s[1];
          })
          .attr("cx", function(d) {return x2(d["formattedDateComplete"]); })
          .attr("opacity", function(d) {
              var cx = x2(d["formattedDateComplete"]);
              var present = timelineMargin.left <= cx && cx <= width - timelineMargin.right - timelineMargin.left;

              return present ? .75 : 0.0;
          });
        timelineFocus.select(".x.axis").call(xAxis2);
      }
      
      // Treaties text boxes
      var treatyMarksHeight = 60;
      totalHeight += treatyMarksHeight;
      height += margin.bottom;
      
      d3.select("svg")
        .attr("height", totalHeight)
    
      var treatySection = svg.append("g")
          .attr("transform", "translate(" + margin.left + "," + height + ")");
        
      treatySection.append("rect")
        .attr("class", "background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", treatyMarksHeight)

      var treatyMarks = treatySection.selectAll(".treaty")
          .data(treaties)
          .enter()
        
      timeline.selectAll(".marks")
      .data(treaties)
        .enter()
      .append("rect")
        .attr("class", "line")
        .attr("x", function(d) { return x(parseDate(d["YEAR"])); })
        .attr("y", margin.bottom - timelineMargin.bottom )
        .attr("width", 1)
        .attr("height", function(d) { return parseFloat(d["YEAR"]) % 5 == 0 ? 0 : timelineMargin.bottom; })
        
      var textboxY = 10;
      
      treatyMarks.append("rect")
        .attr("class", "line")
        .attr("x", function(d) { return x(parseDate(d["YEAR"])); })
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", textboxY)
      
      treatyMarks.append("foreignObject")
        .attr('x', function(d) { return x(parseDate(d["YEAR"])) - 50; })
        .attr('y', textboxY)
        .attr('width', 102)
        .attr('height', 102)
          .append("xhtml:div")
            .append("p")
            .style("border", "2px double #F7FE2E")
            .style("outline", "1px solid #000")
            .style("outline-offset", "-3px")
            .style("padding", "2px")
            .style("text-align", "center")
              .text(function(d) { return d["NAME"]; })
            .on("mouseover", function() {d3.select(this).style("background-color", "#d8d8d8").style("cursor", "pointer");})
            .on("mouseout", function() {d3.select(this).style("background-color", "#ffffff");})
            .on("click", function(d) {
               popup.select(".contents")
                .html("<b>" + d["YEAR"] + "<br>" + d["NAME"] + "</b><br><br>" + d["DESCRIPTION"]  + "<br><br>Learn more: <a href=" + d["WEBSITE"] + ">" + d["NAME"] + " on Wikipedia</a>");
                
              popup.style("visibility", "visible");
            })

      
      // Focus Timeline
      var x2 = d3.time.scale()
        .range([timelineMargin.left, width - timelineMargin.right - timelineMargin.left]);

      var xAxis2 = d3.svg.axis()
          .scale(x2)
          .orient("bottom");
      
      x2.domain(d3.extent(years, function(d) { return d["year"]; }));
      x2.nice();
      
      var timelineFocusHeight = 50;
      totalHeight += timelineFocusHeight;
      height += treatyMarksHeight;
      
      d3.select("svg")
        .attr("height", totalHeight)
    
      var timelineFocus = svg.append("g")
        .attr("transform", "translate(0," + height + ")")

      timelineFocus.append("rect")
        .attr("class", "background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", margin.bottom);

      timelineFocus.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (margin.bottom - timelineMargin.bottom) + ")")
        .call(xAxis2);
      
      timelineFocus.append("g")
        .selectAll(".countryFocus")
        .data(data)
      .enter().append("g")
        .style("fill", function(d) { return countryColors(d["name"]); })
        .selectAll(".focus")
        .data(function(d) { return d["data"]; })
      .enter().append("circle")
        .attr("class", "focus shown")
        .attr("cx", function(d) { return x2(d["formattedDateComplete"]); })
        .attr("cy", margin.bottom - timelineMargin.bottom )
        .attr("r", 5)
        .attr("opacity", 0.75)
      
      height += timelineFocusHeight;
      
    });

  // Help/welcome/controls button and message
  var controls = '<br><br><b>Controls</b><br><br><img src="img/zoom-in.gif"> Double click / <img src="img/zoom-out.gif"> Shift + Double click or Mouse wheel to zoom<br><img src="img/grabbing.gif"> Click + Drag to pan';
  
  var welcomeMessage = "<h1>Welcome</h1>" + 
      "<h2>Global Nuclear Detonations from 1945 to 2010</h2>" +
      "<br><br>Data source: <a href=http://www.johnstonsarchive.net/nuclear/tests/>Johnston's Archive</a>" +
      controls;
      
  svg.append("g")
    .attr("transform", "translate(" + mapMargin.left + "," + (mapMargin.top + 5) + ")")
    .append("foreignObject")
    .attr('width', 50)
    .attr('height', 70)
      .append("xhtml:div")
        .append("p")
        .style("border", "2px double #F7FE2E")
        .style("outline", "1px solid #000")
        .style("outline-offset", "-3px")
        .style("padding", "2px")
          .text("Help?")
        .on("mouseover", function() {d3.select(this).style("background-color", "#d8d8d8").style("cursor", "pointer");})
        .on("mouseout", function() {d3.select(this).style("background-color", "#ffffff");})
            .on("click", function(d) {
               popup.select(".contents")
                .html(welcomeMessage);
                
              popup.style("visibility", "visible");
            })
  


  // Popup
  var popupProperties = {
		width: width / 2,
		height: height / 2,
    top: height / 4,
    left: width / 4,
		margin: 20,
  };

  var popup = svg.append("g")
        .attr("transform", "translate(" +  popupProperties.left + "," + popupProperties.top + ")")
        //.style("visibility", "hidden")
				
  popup.append("rect")
    .attr("class", "background")
    .attr("width", popupProperties.width)
    .attr("height", popupProperties.height)
    .style("opacity", .70)
		
  popup.append("g")
    .attr("transform", "translate(" + (popupProperties.width - 25) + ", 0)")
    .selectAll(".redCross")
      .data([{color: "#ffffff", w: 25, h: 25, x: 0, y: 0, r: 0},
            {color: "#B40404", w: 20, h: 6, x: 7, y: 4, r: 45},
            {color: "#B40404", w: 20, h: 6, x: 3, y: 18, r: -45}])
      .enter()
      .append("rect")
        .attr("transform", function(d) { return "translate(" + d.x + ", " + d.y + ") rotate(" + d.r + ")"; })
        .attr("width", function(d) { return d.w; })
        .attr("height", function(d) { return d.h; })
        .attr("fill", function(d) { return d.color; })
        .style("opacity", function(d, i) { return i == 0 ? 0 : 1; })
          .on("mouseover", function() {d3.select(this).style("cursor", "pointer");})
          .on("click", function(){return popup.style("visibility", "hidden");});

  popup.append("foreignObject")
      .attr('x', popupProperties.margin)
      .attr('y', popupProperties.margin)
      .attr('width', function() { return popupProperties.width - popupProperties.margin * 2; })
      .attr('height', function() { return popupProperties.height - popupProperties.margin * 2; })
        .append("xhtml:div")
          .attr("class", "contents")
          .style("height", function() { return popupProperties.height - popupProperties.margin * 2 + "px"; })
          .style("overflow", "auto")
          .html(welcomeMessage);
						
  function detonationYieldRadius(d) {
    var value = parseFloat(d["YIELD"]);

    if (isNaN(value)) {
      value = 1;
    }

    return transformDetonationRadius(yield(value));
  }

  function transformDetonationRadius(value) {
    return value * zoom.scaleExtent()[0] / zoom.scale()
  }

  function zoomed() {
    mapGroup.selectAll(".detonation.shown")
      .attr("r", detonationYieldRadius);

    mapGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
});