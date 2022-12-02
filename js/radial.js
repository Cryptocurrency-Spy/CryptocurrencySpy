// let json = d3.json("data/flare.json")
// Promise.all([json]).then(data => Tree(data[0], {
//     label: d => d.name,
//     title: (d, n) => `${n.ancestors().reverse().map(d => d.data.name).join(".")}`, // hover text
//     link: (d, n) => `https://github.com/prefuse/Flare/${n.children ? "tree" : "blob"}/master/flare/src/${n.ancestors().reverse().map(d => d.data.name).join("/")}${n.children ? "" : ".as"}`,
//     width: 1152,
//     height: 1152,
//     margin: 100
// }))

// let csv = d3.csv("data/chunk0.csv")
// Promise.all([csv]).then(data => radial(data))

function radial(__data__) {
    // FIXME: change to async callback
    const sucker = '1XPTgDRhN8RFnzniWCddobD9iKZatrvH4'
    let traversed = new Set()

    d3.selectAll(".tooltip2")
        .classed("invisible", true)
    traversed.add(sucker)
    let queue = [sucker]
    let _data = JSON.parse(JSON.stringify(__data__))

    {
        let target_count = 300;
        _data.sort((a, b) => a.value - b.value)
        // FIXME: ascending
        _data = _data.slice(-target_count)
        let min_filtered = d3.min(_data.map(d => d.value))
        console.log(min_filtered)
        // FIXME: disable range inputs here

    }

    let map = d3.group(_data, d => d.source)
    function Node(c) {
        return {
            id: c.target,
            value: c.value,
            time: c.time,
            children: []
        }
    }
    let root = Node({ target: sucker })
    let extra_edges = []
    function traverse(node) {
        const _t = map.get(node.id)
        // console.log(_t)
        if (_t == undefined) return;
        const t = Array.from(_t)
        for (let c of t) {
            const cid = c.target
            if (!traversed.has(cid)) {
                traversed.add(cid)
                node.children.push(Node(c))
                traverse(node.children.at(-1))
            }
            else {
                extra_edges.push(c)
            }
        }
    }
    traverse(root)
    // console.log(root);
    let node = Tree(root, {
        title: (d) => `${d.id}`, // hover text
        width: 1152,
        height: 1152,
        margin: 100
    })
    const svg = d3.select("#network")
    let g = svg.append("g")
        .classed("extra_links", true)

        function transformed_x
        (x, y){
            // transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)
            let r = x
            let _x = y * Math.cos(r)
            let _y = y * Math.sin(r)
            return _x
        }
        function transformed_y(x, y) {
            let r = x
            let _x = y * Math.cos(r)
            let _y = y * Math.sin(r)
            return _y
        }
    let line_gen = d3.line()
        .x(d => transformed_x(d.x, d.y))
        .y(d => transformed_y(d.x, d.y))

    
    let helping_map = d3.group(node, d => d.data.id)
    // maps raw data format to {source: {x, y}, target: {x,y}} format
    extra_edges = extra_edges.map(d => {
        let t = helping_map.get(d.source)
        let s = helping_map.get(d.target)
        if (t != undefined && s != undefined) {
            t = t[0]
            s = s[0]
        }
        else {
            console.log("Error")
            return [{ x: 0.0, y: 0.0 }, { x: 0.0, y: 0.0 }]
        }
        console.log(t, s)
        d.source = {x: t.x, y: t.y}
        d.target = {x: s.x, y: s.y}
        let data = [{ x: t.x, y: t.y },
        { x: s.x, y: s.y }]
        return data;
        // return d;
    })
    g.selectAll("line")
        .data(extra_edges)
        .join("line")
        .attr("d", line_gen)
    
}
function Tree(data, { // data is either tabular (array of objects) or hierarchy (nested objects)
    path, // as an alternative to id and parentId, returns an array identifier, imputing internal nodes
    id = Array.isArray(data) ? d => d.id : null, // if tabular data, given a d in data, returns a unique identifier (string)
    parentId = Array.isArray(data) ? d => d.parentId : null, // if tabular data, given a node d, returns its parent’s identifier
    children, // if hierarchical data, given a d in data, returns its children
    tree = d3.tree, // layout algorithm (typically d3.tree or d3.cluster)
    separation = tree === d3.tree ? (a, b) => (a.parent == b.parent ? 1 : 2) / a.depth : (a, b) => a.parent == b.parent ? 1 : 2,
    sort, // how to sort nodes prior to layout (e.g., (a, b) => d3.descending(a.height, b.height))
    label, // given a node d, returns the display name
    title, // given a node d, returns its hover text
    link, // given a node d, its link (if any)
    linkTarget = "_blank", // the target attribute for links (if any)
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    margin = 60, // shorthand for margins
    marginTop = margin, // top margin, in pixels
    marginRight = margin, // right margin, in pixels
    marginBottom = margin, // bottom margin, in pixels
    marginLeft = margin, // left margin, in pixels
    radius = Math.min(width - marginLeft - marginRight, height - marginTop - marginBottom) / 2, // outer radius
    r = 3, // radius of nodes
    padding = 1, // horizontal padding for first and last column
    fill = "#999", // fill for nodes
    fillOpacity, // fill opacity for nodes
    stroke = "#555", // stroke for links
    strokeWidth = 3, // stroke width for links
    strokeOpacity = 0.4, // stroke opacity for links
    strokeLinejoin, // stroke line join for links
    strokeLinecap, // stroke line cap for links
    halo = "#fff", // color of label halo 
    haloWidth = 3, // padding around the labels
} = {}) {

    // If id and parentId options are specified, or the path option, use d3.stratify
    // to convert tabular data to a hierarchy; otherwise we assume that the data is
    // specified as an object {children} with nested objects (a.k.a. the “flare.json”
    // format), and use d3.hierarchy.
    const root = d3.hierarchy(data, children);
    // Sort the nodes.
    if (sort != null) root.sort(sort);

    // Compute labels and titles.
    const descendants = root.descendants();
    const L = label == null ? null : descendants.map(d => label(d.data, d));

    // Compute the layout.
    let treeData = tree().size([2 * Math.PI, radius]).separation(separation)(root);

    const svg = d3.select("#network")
        // .attr("viewBox", [-marginLeft - radius, -marginTop - radius, width, height])
        // .attr("width", width)
        // .attr("height", height)
        // .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);

    // let g_link = svg.append("g")
    let g_link = svg.selectAll("svg>g")
        .filter(d => d == 1)

    g_link.attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-opacity", strokeOpacity)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-width", strokeWidth)
        .attr("transform", `translate(${width / 2},${height / 2})`)
    let g_node = svg.selectAll("svg > g")
        .filter(d => d == 2)
        .attr("transform", `translate(${width / 2},${height / 2})`)
    g_link.selectAll("*").remove()
    g_node.selectAll("*").remove()
    root.x0 = root.x
    root.y0 = root.y

    const times = root.descendants().slice(1).map(d => d.data.time)
    let max_opa = 0.8, min_opa = 0.3,
        max_time = d3.max(times), min_time = d3.min(times)
    console.log(max_time, min_time)
    let time_scale = d3.scaleTime()
        .domain([min_time, max_time])
        .range([min_opa, max_opa])

    return update(root)

    function update(source) {

        let nodes = treeData.descendants()




        let _link = g_link
            .selectAll("path")
            .data(root.links(), d => {
                // console.log(d.target.data.id)
                return d.target.data.id
            })

        let linkEnter = _link.enter().insert('path')
            .attr("d", d3.linkRadial()
                .angle(d => {
                    // console.log(d)
                    return d.x0 ? d.x0 : d.parent ? d.parent.x : d.x;
                })
                .radius(d => d.y0 ? d.y0 : d.parent ? d.parent.y : d.y))
        linkEnter.append("title")
            .text(d => `${d.target.data.time}, ${d.target.data.value} bitcoins`)
        let linkUpdate = linkEnter.merge(_link)
        linkUpdate.transition()
            .duration(300)
            .attr('d', d3.linkRadial()
                .angle(d => {
                    // console.log(d)
                    return d.x
                })
                .radius(d => d.y))
            .style("opacity", d => {
                // console.log(d)
                return time_scale(d.target.data.time)
            })
            .attr("stroke-width", d => Math.sqrt(d.target.data.value / 49) + 0.5);


        let linkExit = _link.exit().transition()
            .duration(300)
            .attr('d', d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y))
            .remove()

        const node = g_node
            .selectAll("a")
            .data(root.descendants(), d => {
                // console.log(d)
                return d.data.id
            })

        let nodeEnter = node.enter()
            .append("a")
            .attr("xlink:href", link == null ? null : d => link(d.data, d))
            .attr("target", link == null ? null : linkTarget)
            .attr("transform", d => {
                // console.log(d.depth)
                return `rotate(${(d.parent ? d.parent.x : d.x) * 180 / Math.PI - 90}) translate(${d.parent ? d.parent.y : d.y},0)`
            });
        nodeEnter.append("circle")
            .attr("fill", d => d.children || d._children ? stroke : fill)
            .attr("r", r)
            .on('click', click)
        // node.append("circle")
        //     .attr("fill", d => d.children ? stroke : fill)
        //     .attr("r", r);
        let nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(300)
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .attr('r', r)

        let nodeExit = node.exit().transition()
            .duration(300)
            .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
            .remove();

        nodeExit.select("circle").attr('r', 0)
        // console.log(nodeEnter.size(), nodeUpdate.size(), nodeExit.size())
        nodes.forEach(d => {
            d.x0 = d.x
            d.y0 = d.y
        });
        console.log(linkEnter.size(), linkUpdate.size(), linkExit.size())
        if (title != null) node.append("title")
            .text(d => title(d.data, d));

        if (L) node.append("text")
            .attr("transform", d => `rotate(${d.x >= Math.PI ? 180 : 0})`)
            .attr("dy", "0.32em")
            .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
            .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
            .attr("paint-order", "stroke")
            .attr("stroke", halo)
            .attr("stroke-width", haloWidth)
            .text((d, i) => L[i]);
        function click(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
        return root.descendants()
    }


}
