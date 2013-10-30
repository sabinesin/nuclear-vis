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

  d3.json("data/world-110m.json", function(error, countries) {
    svg.append("path")
      .datum(topojson.feature(countries, countries.objects.land))
      .attr("class", "land")
      .attr("d", path);
  });
});