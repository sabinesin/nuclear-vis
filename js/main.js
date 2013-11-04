$(document).ready(function() {
  var margin = {
    top: 0,
    right: 0,
    bottom: 50,
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
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

  svg.append("rect")
    .attr("class", "overlay")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);

  var mapGroup = svg.append("g");

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

      var allData = [usa, uk, ussr, india, northkorea, pakistan, china, unknown];

      var countries = topojson.feature(world, world.objects.countries).features;
      var neighbors = topojson.neighbors(world.objects.countries.geometries);

      mapGroup.selectAll(".country")
        .data(countries)
      .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path);

      function drawDetonations(data, name) {
        mapGroup.selectAll(".detonation." + name)
          .data(data)
        .enter().append("circle")
          .attr("class", name + " detonation")
          .attr("cx", function(d) { return projection([d["LONG"], d["LAT"]])[0]; })
          .attr("cy", function(d) { return projection([d["LONG"], d["LAT"]])[1]; })
          .attr("r", 2 * zoom.scaleExtent()[0] / zoom.scale())
          .on("mouseover", tip.show)
          .on("mouseout", tip.hide);
      }

      drawDetonations(usa, "usa");
      drawDetonations(uk, "uk");
      drawDetonations(ussr, "ussr");
      drawDetonations(india, "india");
      drawDetonations(northkorea, "northkorea");
      drawDetonations(pakistan, "pakistan");
      drawDetonations(china, "china");
      drawDetonations(unknown, "unknown");

      var timelineMargin =  {
        top: 5,
        right: 0,
        bottom: 20,
        left: 0
      };

      var parseDate = d3.time.format("%Y").parse;

      var x = d3.time.scale()
        .range([0, width]);

      var y = d3.scale.linear()
        .range([0, margin.bottom - timelineMargin.top - timelineMargin.bottom]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

      var years = [];
      var yearsTemp = {};

      allData.forEach(function(country) {
        country.forEach(function(detonation) {
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

      console.log(y.range(), y.domain());

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
        .attr("width", width / years.length)
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
      }

      function brushend() {
        timeline.classed("selecting", !d3.event.target.empty());
      }
    });

  function zoomed() {
    mapGroup.selectAll(".detonation")
      .attr("r", 2 * zoom.scaleExtent()[0] / zoom.scale());

    mapGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
});