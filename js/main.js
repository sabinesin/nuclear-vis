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

      var countries = topojson.feature(world, world.objects.countries).features;
      var neighbors = topojson.neighbors(world.objects.countries.geometries);

      svg.selectAll(".country")
        .data(countries)
      .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path);

      function drawDetonations(data, name) {
        svg.selectAll(".detonation." + name)
          .data(data)
        .enter().append("circle")
          .attr("class", name + " detonation")
          .attr("cx", function(d) { return projection([d["LONG"], d["LAT"]])[0]; })
          .attr("cy", function(d) { return projection([d["LONG"], d["LAT"]])[1]; })
          .attr("r", 2)
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
    });
});