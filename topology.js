var jsonData = {
  "nodes": [
    {"x": 469, "y": 410},
    {"x": 493, "y": 364},
    {"x": 442, "y": 365}
  ],
  "links": [
    {"source":  0, "target":  1},
    {"source":  1, "target":  2},
    {"source":  2, "target":  0}
  ]
};
var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
var width = x;
var height = y;

var force = d3.layout.force()
    .size([width, height])
    .charge(-400)
    .linkDistance(120)
    .on("tick", tick);

var drag = force.drag()
    .on("dragstart", dragstart);

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

render(jsonData);

function render(graph) {

  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();
  link = svg.selectAll(".link").data(graph.links);

  link.select("path.path-link")    
      .attr("class", "link");

  var linkEnter = link.enter().append("g")
                                .attr("class", "link")
                                .attr("id", function(d,i){
                                    return "link" + i;
                                });


    linkEnter.append("path").attr("class", "path-link")
    .style("stroke", function(d) {
        return "steelblue";
    });

  node = node.data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 12)
      .on("dblclick", dblclick)
      .call(drag);

  d3.select(window).on("resize", resize);
  };


function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    svg.attr("width", width).attr("height", height);
    force.size([width, height]).resume();
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

        link.selectAll("path.path-link")
            .attr("d", function(d) {

            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);         

                // if there are multiple links between these two nodes, we need generate different dr for each path
                dr = dr/(1 + (1/3) );
               
            // generate svg path
            return "M" + d.source.x + "," + d.source.y + 
                "A" + dr + "," + dr + " 0 0 0," + d.target.x + "," + d.target.y;  
        });

}

function dblclick(d) {
  d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}
