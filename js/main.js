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
        .attr("r", 2);
    });
});