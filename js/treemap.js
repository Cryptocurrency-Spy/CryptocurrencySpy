class Treemap {

    constructor() {
        let svg = d3.select("#treemap"),
            width = svg.attr("width"),
            height = svg.attr("height");
        // this.color = d3.scaleOrdinal(d3.schemeGnBu[9]);

        this.format = d3.format(",d");

        this.treemap = d3.treemap()
            .size([width, height])
            .round(true)
            .padding(1);

        this.parsedData = globalObj.parsedData;
        this.draw_treemap();
    }

    draw_treemap() {
        let svg = d3.select("#treemap");
        let end_date = d3.max(globalObj.selectedTime)
        let start_date = d3.min(globalObj.selectedTime)
        let lower = '2013/04', upper = '2019/04'
        end_date = d3.min([d3.max([end_date, lower]), upper])
        start_date = d3.min([d3.max([start_date, lower]), upper])

        // console.log(date)
        let _data = this.parsedData.filter(d => d.date === `${end_date}/24`);
        let start_data = this.parsedData.filter(d => d.date === `${start_date}/24`)
        _data.push({
            name: "a",
            cap: "",
        })
        _data = _data.map(d => {
            let t = d.cap;
            let name = d.name;
            d.cap = t * 1.0;
            d.cap0 = 0.0;
            let section = d3.filter(start_data, d => d.name === name)

            if (section.length > 0) {
                d.cap0 = section[0].cap * 1.0;
            }
            d.change = d.cap - d.cap0
            return d;
        })

        let map_from_name = d3.group(_data, d => d.name);

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

        this.treemap(root);

        this.cell = svg.selectAll("a")
            .data(root.leaves())
            .join("a")
            .selectAll("g")
            .data(d => [d])
            .join("g")
            .attr("target", "_blank")
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

        let changes = _data.map(d => d.change)
        let max_changes = d3.max(changes), min_changes = d3.min(changes)
        console.log(min_changes, max_changes)

        let scale_change = d3.scaleDiverging()
            .domain([min_changes, 0, max_changes])
            .interpolator(d3.interpolateRdYlGn)

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
                return globalObj.colorScale(d.id);
                // let t = map_from_name.get(d.id)[0]
                // return scale_change(t.change);
                // let a = d.ancestors();
                // return this.color(a[0].id);
            })
            .style("stroke-width", "5px")
            .attr('checked', false)
            .on('click', e => {
                globalObj.updateGlobalNameSelection(e)
                // globalObj.name_select.checkboxes.attr("checked", false)
            })

        this.texts = this.cell.selectAll("text")
            .data(d => [d])
            .join("text")
            // .attr("x", d => 0.5 * (d.x1 -d.x0))
            .attr("y", d => 0.5 * (d.y1 - d.y0))
            .text(d => d.id + "\n" + this.format(d.value))

    }

    updateTreeRectStatus() {
        this.rectangles
            .style("stroke", d => (globalObj.selectedNames.includes(d.id))? "black": "none")
    }

    // updateNameSelectionByTreemap(e) {
    //     let et = e.target;
    //     let name = et.getAttribute('id')
    //     let checkbox = globalObj.name_select.checkboxes
    //         .filter(d => (d === name))
    //         .node()
    //     checkbox.click()
    //     // this.triggerMouseEvent(checkbox, "click");
    // }
    //
    // triggerMouseEvent (node, eventType) {
    //     let event = new Event(eventType, {bubbles : true, cancelable: true});
    //     node.dispatchEvent(event);
    // }
}