$(document).ready(function() {
  var margin = {
    top: 0,
    right: 0,
    bottom: 50,
    left: 0
  };

  var mapMargin = {
    top: 10,
    right: 0,
    bottom: 0,
    left: 0
  };

  var width = 960 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var zoom = d3.behavior.zoom()
      .scaleExtent([1, 10])
      .on("zoom", zoomed);

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var legend = svg.append("g");

  var countryColors = d3.scale.category10();

  var mapGroup = svg.append("g")
    .attr("id", "viewer")
    .attr("transform", "translate(" + mapMargin.left + "," + mapMargin.top + ")");

  svg.append("rect")
    .attr("class", "overlay")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  var projection = d3.geo.equirectangular()
    .scale(150)
    .translate([width / 2, height / 2])
    .rotate([0, 0]);

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
    .await(function ready(errors, world, usa, uk, ussr, india, northkorea, pakistan, china, unknown) {
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
          "name": "Chian",
          "data": china
        },
        {
          "name": "Unknown",
          "data": unknown
        },
      ];

      var countries = topojson.feature(world, world.objects.countries).features;
      var neighbors = topojson.neighbors(world.objects.countries.geometries);

      mapGroup.append("g")
        .attr("id", "map")
        .selectAll(".country")
        .data(countries)
      .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path);

      var parseDate = d3.time.format("%Y").parse;

      data.forEach(function(country) {
        country["data"].forEach(function(detonation) {
          detonation["formattedDate"] = parseDate(detonation["YEAR"]);
        });
      });

      mapGroup.append("g")
        .attr("id", "countries")
        .selectAll(".country")
        .data(data)
      .enter().append("g")
        .attr("class", function(d) { return d["name"].replace(/ /g, ''); })
        .selectAll(".detonation")
        .data(function(d) { return d["data"]; })
      .enter().append("circle")
        .attr("class", "detonation")
        .attr("cx", function(d) { return projection([d["LONG"], d["LAT"]])[0]; })
        .attr("cy", function(d) { return projection([d["LONG"], d["LAT"]])[1]; })
        .attr("r", 2 * zoom.scaleExtent()[0] / zoom.scale())
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

      // Draw legend
      var legendItem = legend.selectAll(".item")
        .data(data)
      .enter().append("g")
        .attr("transform", function(d, i) { return "translate(" + i * (width / data.length) + ", 0)"; });

      legendItem.append("rect")
        .attr("width", mapMargin.top)
        .attr("height", mapMargin.top)
        .style("fill", function(d) { return countryColors(d["name"]); });

      legendItem.append("text")
        .attr("x", mapMargin.top + mapMargin.top / 2)
        .attr("y", mapMargin.top)
        .text(function(d) { return d["name"]; });

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

      x.domain(d3.extent(years, function(d) { return d["year"]; }));
      y.domain([0, d3.max(years, function(d) { return d["detonations"]; })]);

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

          return s[0] < year && year < s[1];
        });

        detonations.attr("opacity", function(d) {
            var year = d["formattedDate"];
            var present = s[0] < year && year < s[1];

            return present ? 1.0 : 0.2;
        });
      }

      function brushend() {
        timeline.classed("selecting", !d3.event.target.empty());

        if (d3.event.target.empty()) {
          detonations.attr("opacity", 1.0);
        }
      }
    });

  function zoomed() {
    mapGroup.selectAll(".detonation")
      .attr("r", 2 * zoom.scaleExtent()[0] / zoom.scale());

    mapGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
});