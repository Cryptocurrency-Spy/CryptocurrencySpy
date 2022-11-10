{
    let svg = d3.select("#treemap"),
        width = svg.attr("width"),
        height = svg.attr("height");

    let color = d3.scaleOrdinal(d3.schemeGnBu[9]);

    let format = d3.format(",d");

    let treemap = d3.treemap()
        .size([width, height])
        .round(true)
        .padding(1);

    // let version = {
    //     "d3-array": "1.0.2",
    //     "d3-axis": "1.0.4",
    //     "d3-brush": "1.0.3",
    //     "d3-chord": "1.0.3",
    //     "d3-collection": "1.0.2",
    //     "d3-color": "1.0.2",
    //     "d3-dispatch": "1.0.2",
    //     "d3-drag": "1.0.2",
    //     "d3-dsv": "1.0.3",
    //     "d3-ease": "1.0.2",
    //     "d3-force": "1.0.4",
    //     "d3-format": "1.0.2",
    //     "d3-geo": "1.4.0",
    //     "d3-hierarchy": "1.0.3",
    //     "d3-interpolate": "1.1.2",
    //     "d3-path": "1.0.3",
    //     "d3-polygon": "1.0.2",
    //     "d3-quadtree": "1.0.2",
    //     "d3-queue": "3.0.3",
    //     "d3-random": "1.0.2",
    //     "d3-request": "1.0.3",
    //     "d3-scale": "1.0.4",
    //     "d3-selection": "1.0.3",
    //     "d3-shape": "1.0.4",
    //     "d3-time": "1.0.4",
    //     "d3-time-format": "2.0.3",
    //     "d3-timer": "1.0.3",
    //     "d3-transition": "1.0.3",
    //     "d3-voronoi": "1.1.0",
    //     "d3-zoom": "1.1.0"
    // };
    
    // d3.csv("data/d3.csv").then(data => {

    //     let root = d3.stratify()
    //         .id(d => d.path)
    //         .parentId(d => {
    //             return d.path.substring(0, d.path.lastIndexOf("/"));
    //         })
    //         (data)
    //         .sum(d => d.size)
    //         .sort((a, b) => b.height - a.height || b.value - a.value);

    //     treemap(root);

    d3.csv("data/consolidated_coin_data.csv").then(data => {
        // data = [...d3.group(data, d => d.Date)
        _data = data.filter(d => d.Date == "Apr 24, 2019");
        _data.push({
            Currency: "a",
            "Market Cap": "",
        })
        _data = _data.map(d => {
            t = d["Market Cap"].replaceAll(",","");
            // console.log(t * 1.0);
            d["Market Cap"] = t * 1.0;
            return d;
        })
        console.log(_data);

        let root = d3.stratify()
            .id(d => {
                // console.log(d.Currency);
                return d.Currency;
            })
            .parentId(d => {
                p = d.Currency == "a"? null: "a";
                console.log(p);
                return d.Currency == "a"? null: "a";
            })
            (_data)
            .sum(d => d["Market Cap"])
            .sort((a,b) => b.height - a.height || b.value - a.value)
            ;

        treemap(root);
// Currency,Date,Open,High,Low,Close,Volume,Market Cap
        console.log(root.leaves());

        let cell = svg.selectAll("a")
            .data(root.leaves())
            .enter().append("g")
            .attr("target", "_blank")
            // .attr("xlink:href", d => {
            //     let p = d.data.path.split("/");
            //     return "https://github.com/" + p.slice(0, 2).join("/") + "/blob/v" 
            //             + version[p[1]] + "/src/" + p.slice(2).join("/");
            // })
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");
        //Notice that the fill is dependent on the hierarchy (2 levels up)
        cell.append("rect")
            .attr("id", d => d.id)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d =>  {
                let a = d.ancestors();
                return color(a[0].id);
            });

        // cell.append("clipPath")
        //     .attr("id", d => "clip-" + d.id)
        //     .append("use")
        //     .attr("xlink:href", d => "#" + d.id);

        // let label = cell.append("text")
        //     .attr("clip-path", d => "url(#clip-" + d.id + ")");

        // label.append("tspan")
        //     .attr("x", 4)
        //     .attr("y", 13)
        //     .text(d => d.id);

        // label.append("tspan")
        //     .attr("x", 4)
        //     .attr("y", 25)
        //     .text(d => format(d.value));

        cell.append("text")
            // .attr("x", d => 0.5 * (d.x1 -d.x0))
            .attr("y", d => 0.5 * (d.y1 - d.y0))
            .text(d =>  d.id + "\n" + format(d.value));
        
    })
    .catch(error => console.error(error))

}