class Treemap {

    constructor() {
        let svg = d3.select("#treemap"),
            width = svg.attr("width"),
            height = svg.attr("height");

        let color = d3.scaleOrdinal(d3.schemeGnBu[9]);

        let format = d3.format(",d");

        let treemap = d3.treemap()
            .size([width, height])
            .round(true)
            .padding(1);

        this.parsedData = globalObj.parsedData;

        let _data = this.parsedData.filter(d => d.date === "2019/04/24");
        _data.push({
            name: "a",
            cap: "",
        })
        _data = _data.map(d => {
            let t = d.cap;

            d.cap = t * 1.0;
            return d;
        })

        let root = d3.stratify()
            .id(d => {
                return d.name;
            })
            .parentId(d => {
                let p = d.name === "a" ? null : "a";
                return d.name === "a" ? null : "a";
            })
            (_data)
            .sum(d => d.cap)
            .sort((a, b) => b.height - a.height || b.value - a.value)
        ;

        treemap(root);

        this.cell = svg.selectAll("a")
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

        this.rectangles = this.cell
            .selectAll("rect")
            .data(d => {
                let _d = d;
                _d.selected = false;
                return [_d];
            })
            .join("rect")
            .attr("id", d => d.id)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => {
                let a = d.ancestors();
                return color(a[0].id);
            })
            .style("stroke-width", "5px")
            .attr('checked', false)
            .on('click', (e, d) => {
                let rect = d3.select(`#${d.id}`);
                d.selected = !d.selected
                rect.datum(d)
                if (d.selected) {
                    rect.style("stroke", "black");
                }
                else {
                    rect.style("stroke", "none");
                }
                globalObj.name_select.updateName(d);
                // this.updateNameSelectionByTreemap(e);
            })

        this.texts = this.cell.append("text")
            // .attr("x", d => 0.5 * (d.x1 -d.x0))
            .attr("y", d => 0.5 * (d.y1 - d.y0))
            .text(d => d.id + "\n" + format(d.value));

        // let checkbox = globalObj.name_select.labels.selectAll('input')
        //     .node()
        // checkbox.click()
    }

    updateNameSelectionByTreemap(e) {

        let et = e.target;
        let name = et.getAttribute('id')
        let checkbox = globalObj.name_select.labels.selectAll('input')
            .filter(d => (d === name))
            .node()
        checkbox.click()
        

        // this.triggerMouseEvent(checkbox, "click");

    }

    triggerMouseEvent (node, eventType) {
        let event = new Event(eventType, {bubbles : true, cancelable: true});
        node.dispatchEvent(event);
    }
}