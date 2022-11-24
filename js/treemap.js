class Treemap {

    constructor() {
        this.svg = d3.select("#treemap")
        this.width = this.svg.attr("width")
        this.height = this.svg.attr("height");
        // this.color = d3.scaleOrdinal(d3.schemeGnBu[9]);

        this.format = d3.format(",d");

        this.treemap = d3.treemap()
            .size([this.width, this.height])
            .round(true)
            .padding(1);

        this.parsedData = globalObj.parsedData;
        this.draw_treemap();

        // this.attachTreemapBrush()
    }

    // attachTreemapBrush() {
    //     this.brushGroup = d3.select('#tree_brush_group')  // g
    //         // .attr('transform', 'translate(' + this.dx + ',' + this.dy + ')')
    //
    //     this.brush = d3.brush().extent([
    //         [0, 0],
    //         [this.width, this.height]
    //     ])
    //         // .on("start", e => this.brushstart(e))
    //         // .on("brush", e => this.brushed(e))
    //         .on("end", e => this.brushend(e))
    //
    //     this.brushg = this.brushGroup.append('g')
    //         .call(this.brush)
    // }
    //
    // brushend(e) {
    //     let s = e.selection
    //     let [[x0, y0], [x1, y1]] = s
    //     console.log(s)
    //
    //     crop(x0, y0, 0, 0, this.width, this.height)
    //     crop(x1, y1, 0, 0, this.width, this.height)
    //     function crop(x, y, x_min, y_min, x_max, y_max) {
    //         if (x < x_min) {
    //             x = x_min
    //         }
    //         if (y < y_min) {
    //             y = y_min
    //         }
    //         if (x > x_max) {
    //             x = x_max
    //         }
    //         if (y > y_max) {
    //             y = y_max
    //         }
    //     }
    //
    //
    // }

    cropTime(time) {
        let lower = '2013/04', upper = '2019/04'
        return d3.min([d3.max([time, lower]), upper])
    }

    draw_treemap() {
        this.final_time = d3.max(globalObj.selectedTime)
        this.start_time = d3.min(globalObj.selectedTime)

        // this.final_time = this.cropTime(this.final_time)
        // this.start_time = this.cropTime(this.start_time)

        // console.log(date)
        let _data = this.parsedData.filter(d => d.date === `${this.final_time}/24`);
        let start_data = this.parsedData.filter(d => d.date === `${this.start_time}/24`)
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
        // this._data = _data

        let map_from_name = d3.group(_data, d => d.name);

        this.root = d3.stratify()
            .id(d => d.name)
            .parentId(d => d.name === "a" ? null : "a")
            (_data)
            .sum(d => d.cap)
            .sort((a, b) => b.height - a.height || b.value - a.value)

        this.treemap(this.root);

        this.cell = this.svg.selectAll("a")
            .data(this.root.leaves())
            .join("a")
            // .selectAll("#cell_group")
            .selectAll("g")
            .data(d => [d])
            // .data(this.root.leaves())
            .join("g")
            .attr("target", "_blank")
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

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
                // console.log(globalObj.colorScale(a[0].id))//a: "bitcoin", "a"
                return globalObj.colorScale(d.id);
            })
            .style("stroke-width", "5px")
            .attr('checked', false)
            .on('click', e => {
                globalObj.updateGlobalNameSelection(e)
                // globalObj.name_select.checkboxes.attr("checked", false)
            })

        // texts (their color encode changes in prices)
        let changes = _data.map(d => d.change)
        let max_changes = d3.max(changes)
        let min_changes = d3.min(changes)

        this.scale_change = d3.scaleDiverging()
            .domain([min_changes, 0, max_changes])
            .interpolator(d3.interpolateRdYlGn)

        this.texts = this.cell.selectAll('text')
            .data(d => [d])
            .join("text")
            .attr("x", d => 0.05 * (d.x1 -d.x0))
            .attr("y", d => 0.5 * (d.y1 - d.y0))
            .text(d => d.id + "\n" + this.format(d.value))
            .style("font-size", "20px")
            .style('fill', d => {
                let t = map_from_name.get(d.id)[0]
                return this.scale_change(t.change);
            })



    }

    updateTreeRectStatus() {
        this.rectangles
            .style("stroke", d => (globalObj.selectedNames.includes(d.id))? "black": "none")
    }

    // do not delete this
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