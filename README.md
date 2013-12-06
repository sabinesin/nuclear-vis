# Nuclear Detonations Information Visualization
This is an visualization of nuclear detonations around the world for CS 4460 at the Georgia Institute of Technology.

## How To Use / Installation
Simply open index.html in a current web browser to see and interact with the visualization. No set-up is required since external libraries and necessary files are already contained within this project.

## Credits
### Nuclear data
The data was extracted from [Johnston's Archive](http://www.johnstonsarchive.net/nuclear/tests/) and converted to CSV format.

### Topology
The topology data is from [Natural Earth](http://www.naturalearthdata.com) and converted to TopoJSON using [World Atlas TopoJSON](https://github.com/mbostock/world-atlas).

It was generated using `make topo/world-110m.json`.

### Other Third-party Resources
* Modal window using Twitter Bootstrap – http://getbootstrap.com
* Tooltips using Caged’s d3-tip.JS – https://github.com/Caged/d3-tip
* Mike Bostock’s Queue.JS – https://github.com/mbostock/queue
* JQuery - http://jquery.com
* D3 – http://d3js.org
