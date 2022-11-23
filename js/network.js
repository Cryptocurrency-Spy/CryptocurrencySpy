class Network {

    constructor() {
        let width = 800;
        let height = 600;

        let svg = d3.select("#network")
            .attr('width', width)
            .attr('height', height);

        let color = d3.scaleOrdinal(d3.schemePaired);

        // Here we create our simulation, and give it some forces to apply
        //  to all the nodes:
        let simulation = d3.forceSimulation()
            // forceLink creates tension along each link, keeping connected nodes together
            .force("link", d3.forceLink().id(d => d.id)
                .strength(d => Math.sqrt(d.value / 1e4))
            )
            // forceManyBody creates a repulsive force between nodes,
            //  keeping them away from each other
            .force("charge", d3.forceManyBody())
            // forceCenter acts like gravity, keeping the whole visualization in the
            //  middle of the screen
            .force("center", d3.forceCenter(width / 2, height / 2));

            
        let data = globalObj.parsedTransData;
        let map = d3.group(data, d => d.target);
        let targets = [...map.keys()]
        // let targets = [...d3.group(data, d => d.target).keys()];
        let sources = [...d3.group(data, d => d.source).keys()];

        // targets.push(sources[0]);
        let all_nodes = targets.concat(sources);
        let node_set = new Set()
        all_nodes.forEach(d => node_set.add(d))
        all_nodes = [...node_set.values()]
        let values = data.map(d => d.value)
        let min_value = d3.min(values), max_value = d3.max(values)
        let scale = d3.scaleLog()
            .domain([min_value, max_value])
            .range([1.0, 15.0])
        // First we create the links in their own group that comes before the node
        //  group (so the circles will always be on top of the lines)
        let linkLayer = svg.append("g")
            .attr("class", "links");
        // Now let's create the lines
        let links = linkLayer.selectAll("line")
            .data(data)
            .enter().append("line")
            .attr("stroke-width", d => scale(d.value));
            // .attr("stroke-width", d => Math.sqrt(d.value/ 49) + 1.0);
        
        links.append("title")
            .text(d => `${d.time}, ${d.value} bitcoins`)

        let out_links = d3.group(links, d => d.__data__.source);
        let in_links = d3.group(links, d => d.__data__.target)
        // d3.selectAll(t.get('1XPTgDRhN8RFnzniWCddobD9iKZatrvH4'))
        //     .style("stroke", "black")
        all_nodes = all_nodes.map(d => {
            let obj = {
                id: d, 
                outs: out_links.get(d),
                ins: in_links.get(d)
            };
            return obj;
        });

        // Now we create the node group, and the nodes inside it
        let nodeLayer = svg.append("g")
            .attr("class", "nodes");
        let nodes = nodeLayer
            .selectAll("circle")
            .data(all_nodes)
            .enter().append("circle")
            .classed("nodes", true)
            .attr("r", 5)
            .attr("fill", d => "#888")

            // This part adds event listeners to each of the nodes; when you click,
            //  move, and release the mouse on a node, each of these functions gets
            //  called (we've defined them at the end of the file)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        const times = data.map( d => d.time)
        let max_opa = 0.8, min_opa = 0.2,
            max_time = d3.max(times), min_time = d3.min(times)
            
        let time_scale = d3.scaleTime()
            .domain([min_time, max_time])
            .range([min_opa, max_opa])

        links
            .style("opacity", d => time_scale(d.time))

        var mouseover = function(event, d) {
            let outs = d3.selectAll(d.outs)
            let ins = d3.selectAll(d.ins)
            ins
                .style('opacity', 1.0)
                .style('stroke', "green")
            outs
                .style('opacity', 1.0)
                .style('stroke', "firebrick")
                // FIXME: stop tampering with style and use class
        }
        var mouseleave = function(event, d) {
            let outs = d3.selectAll(d.outs)
            let ins = d3.selectAll(d.ins)
            outs //.merge(ins) // nothing happens
                .style('opacity', d => time_scale(d.time))
                .style('stroke', "#999")
            ins
                .style('opacity', d => time_scale(d.time))
                .style('stroke', "#999")
        }        
        nodes.on("mouseover", mouseover)
            .on("mouseleave", mouseleave)

        // We can add a tooltip to each node, so when you hover over a circle, you
        //  see the node's id
        nodes.append("title")
            .text(d => `Account signature ${d.id}`);

        // Now that we have the data, let's give it to the simulation...
        simulation.nodes(all_nodes);
        // The tension force (the forceLink that we named "link" above) also needs
        //  to know about the link data that we finally have - we couldn't give it
        //  earlier, because it hadn't been loaded yet!
        simulation.force("link")
            .links(data);

        // Finally, let's tell the simulation how to update the graphics
        simulation.on("tick", function () {
            // Every "tick" of the simulation will create / update each node's
            //  coordinates; we need to use those coordinates to move the lines
            //  and circles into place
            links
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            nodes
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });
        });


        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        const zoom = d3.zoom()
        .scaleExtent([0.5, 32])
        .on("zoom", zoomed);


    let k = height / width
    const y = d3.scaleLinear()
        .domain([-4.5 * k, 4.5 * k])
        .range([height, 0])
        ;
    const x = d3.scaleLinear()
        .domain([-4.5, 4.5])
        .range([0, width])
        ;
    let grid = (g, x, y) => g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call(g => g
        .selectAll(".x")
        .data(x.ticks(12))
        .join(
            enter => enter.append("line").attr("class", "x").attr("y2", height),
            update => update,
            exit => exit.remove()
        )
            .attr("x1", d => 0.5 + x(d))
            .attr("x2", d => 0.5 + x(d)))
        .call(g => g
        .selectAll(".y")
        .data(y.ticks(12 * k))
        .join(
            enter => enter.append("line").attr("class", "y").attr("x2", width),
            update => update,
            exit => exit.remove()
        )
            .attr("y1", d => 0.5 + y(d))
            .attr("y2", d => 0.5 + y(d)));
    function zoomed({transform}) {
        const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
        const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
        
        nodeLayer.attr("transform", transform).attr("stroke-width", 5 / transform.k);
        linkLayer.attr("transform", transform).attr("stroke-width", 5 / transform.k);
        
        // gx.call(xAxis, zx);
        // gy.call(yAxis, zy);
        svg.call(grid, zx, zy);
        // svg.call
    }
    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);
    // return Object.assign(svg.node(), {
    //     reset() {
    //     svg.transition()
    //         .duration(750)
    //         .call(zoom.transform, d3.zoomIdentity);
    //     }
    }
}