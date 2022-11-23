
class LineChart {

    constructor() {
        this.vizWidth = 900;
        this.vizHeight = 500;
        this.margin = { left: 70, bottom: 20, top: 20, right: 20 };

        this.svg = d3.select("#line-chart")
            .attr('width', this.vizWidth)
            .attr('height', this.vizHeight)

        this.svg.on('mousemove', e => this.updateOverlay(e));

        this.parsedData = globalObj.parsedData;

        this.selectedData = this.parsedData//

        this.groupedData = globalObj.groupedData
        this.allNames = globalObj.allNames
        this.allTime = globalObj.allTime

        this.updateAxes()

        this.pathGenerator = d3.line()
            .x(d => this.xScale(d3.timeParse("%Y/%m/%d")(d.date)))
            .y(d => this.yScale(d.price))

        this.areaGenerator = d3.area()
            .x(d => this.xScale(d3.timeParse("%Y/%m/%d")(d.date)))
            .y1(d => this.yScale(d.high))
            .y0(d => this.yScale(d.low));

        this.colorScale = globalObj.colorScale;

        this.updatePaths()

        this.svg.append('text')
            .attr('id', 'y-text')
            .text('market price')
            .attr('x', -140)
            .attr('y', 12)
            .attr('transform', 'rotate(-90)');


    }

    updateAxes() {
        // update x-axis
        this.start_time = d3.min(this.selectedData, d => Date.parse(d.date));//
        this.final_time = d3.max(this.selectedData, d => Date.parse(d.date));//
        // console.log(d3.timeFormat("%Y/%m%/%d")(this.start_time), d3.timeFormat("%Y/%m%/%d")(this.final_time))
        this.xScale = d3.scaleTime()
            .domain([this.start_time, this.final_time])
            .range([0, this.vizWidth - this.margin.left - this.margin.right])
        this.xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.timeFormat("%y.%m.%d"));
        this.svg.select('#x-axis')
            .attr('transform', 'translate(' + this.margin.left + ',' + (this.vizHeight - this.margin.bottom) + ')')
            .call(this.xAxis)

        // update y-axis
        this.max_price = d3.max(this.selectedData, d => parseFloat(d.price))
        // console.log(this.max_price)
        this.yScale = d3.scaleLinear()  // change it to scaleLog
            .domain([0, this.max_price])
            .range([this.vizHeight - this.margin.bottom - this.margin.top, 0])
            .nice();
        this.yAxis = d3.axisLeft(this.yScale);
        this.svg.select('#y-axis')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.bottom + ')')
            .call(this.yAxis)
    }

    updatePaths(){
        let names = globalObj.selectedNames;
        // if (names.length===0) {
        //     // console.log("names = globalObj.allNames!!!")
        //     names = globalObj.allNames;
        // }
        // console.log(names)
        for (let name of names){
            let data = this.groupedData.get(name)
                .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))

            this.svg.append('path')
                .attr('id', name)
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                .attr('d', this.pathGenerator(data))
                .attr('fill', 'none')
                .attr('stroke', this.colorScale(name))
                .on('mouseover', e => this.highlightPath(e))

            this.svg.append('path')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                .attr('id', name)
                .attr('d', this.areaGenerator(data))
                .attr('fill', this.colorScale(name))
                .attr('opacity', 0.5)

            this.svg.append("path")
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                .attr('id', name)
                .attr('d', this.pathGenerator(data))
                .attr("class", "fatpath")
                .on("mouseover", e => {
                    this.svg.select("#"+(e.target).id).attr("stroke-width", 3)
                })
                .on("mouseout", e => {
                    this.svg.select("#"+(e.target).id).attr("stroke-width", 1)
                })

        }
    }

    highlightPath(e) {
        let et = e.target
        console.log(et)
        et.attr('stroke', '#ffff00')
            .attr('stroke-width', 10)
    }

    updateRange() {
        this.svg.selectAll('path').remove();

        this.selectedData = this.parsedData//
            .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))
            .filter(d => globalObj.selectedNames.length === 0 ? false : globalObj.selectedNames.includes(d.name))//

        // if (this.selectedData.length === 0) {  // if no data is selected, select all
        // // if (globalObj.selectedTime.length === 0 && globalObj.selectedNames.length === 0) {
        // //     console.log("selecting all")
        //     this.selectedData = this.parsedData;
        //     globalObj.selectedTime = this.allTime;
        //     globalObj.selectedNames = this.allNames;
        // }

        this.updateAxes()
        this.updatePaths()
    }

    updateOverlay(e) {
        let mouseX = e.clientX - 5;
        if (mouseX > this.margin.left && mouseX < this.vizWidth - this.margin.right) {
            this.svg.select('#overlay').style("visibility", 'visible')

            this.svg.select('#overlay').select('#overlay_line')
                .attr('stroke', 'black')
                .attr('x1', mouseX)
                .attr('x2', mouseX)
                .attr('y1', this.vizHeight - this.margin.bottom)
                .attr('y2', this.margin.top);

            // prepare for the overlay labels
            let dataFetched = []
            if (globalObj.selectedNames.length !== 0) {
                dataFetched = []
                for (let name of globalObj.selectedNames) {
                    let data = this.groupedData.get(name)
                        .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))
                    let dateHovered = new Date(Math.floor(this.xScale.invert(mouseX - this.margin.left)));
                    let tmp = data
                        .filter(d => Math.abs(d3.timeDay.count(d3.timeParse("%Y/%m/%d")(d.date), dateHovered)) < 1.1);
                    if (tmp.length !== 0) {
                        dataFetched.push([tmp[Math.floor(tmp.length * 0.5)], this.colorScale(name)])
                    }
                }
                dataFetched.sort((d1, d2) => parseFloat(d2[0].price) - parseFloat(d1[0].price))
                // console.log(dataFetched)
            }

            if(dataFetched.length) {
                const f = d3.format(".2");
                this.svg.select('#overlay')
                    .selectAll('text')
                    .data(dataFetched)
                    .join('text')
                    .text(d => `${d[0].name}, ${f(d[0].price)}`)
                    .attr('x', d => (d3.timeParse("%Y/%m/%d")(d[0].date)) > (0.5 * this.start_time + 0.5 * this.final_time) ?
                        mouseX - 170 : mouseX + 10)
                    .attr('y', (d, i) => 20 * i + 20)
                    .attr('alignment-baseline', 'hanging')
                    .attr('fill', d => d[1]);
            }
        }


    }


}
