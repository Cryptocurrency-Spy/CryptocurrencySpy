
class LineChart {

    constructor() {
        this.vizWidth = 900;
        this.vizHeight = 500;
        this.margin = { left: 70, bottom: 20, top: 20, right: 20 };
        this.logOn = true;

        this.svg = d3.select("#line-chart")
            .attr('width', this.vizWidth)
            .attr('height', this.vizHeight)

        // this.svg.on('mousemove', e => this.updateOverlay(e));

        this.parsedData = globalObj.parsedData;

        this.selectedData = this.parsedData//

        this.groupedData = globalObj.groupedData
        this.allNames = globalObj.allNames
        this.allTime = globalObj.allTime

        this.pathGenerators = []
        this.areaGenerators = []

        this.updateAxes()

        this.pathGenerator = d3.line()
            .x(d => this.xScale(d3.timeParse("%Y/%m/%d")(d.date)))
            .y(d => this.yScale(d.price))

        this.areaGenerator = d3.area()
            .x(d => this.xScale(d3.timeParse("%Y/%m/%d")(d.date)))
            .y1(d => this.yScale(d.high))
            .y0(d => this.yScale(d.low));

        this.colorScale = globalObj.colorScale;
        this.colorScaleFade = globalObj.colorScaleFade;

        this.updatePaths()

        this.svg.append('text')
            .attr('id', 'y-text')
            .text('market price')
            .attr('x', -140)
            .attr('y', 12)
            .attr('transform', 'rotate(-90)');

        this.logButton = d3.select("#logButton")
            .attr("checked", true)
            .on('change', e => {
                this.logOn = e.target.checked
                // console.log(this.logOn)
                this.update()
            })

        this.preset1Button = d3.select("#preset1")
            .on('click', e => {
                globalObj.selectedTime = ["2017/01", "2017/02", "2017/03", "2017/04", "2017/05", "2017/06",
                    "2017/07", "2017/08", "2017/09", "2017/10", "2017/11", "2017/12", ]
                this.update()
            })

        this.preset2Button = d3.select("#preset2")
            .on('click', e => {
                globalObj.selectedTime = ["2018/01", "2018/02", "2018/03", "2018/04", "2018/05", "2018/06",
                    "2018/07", "2018/08", "2018/09", "2018/10", "2018/11", "2018/12", ]
                this.update()
            })
    }

    updateAxes() {
        // update x-axis
        this.start_time = d3.min(this.selectedData, d => Date.parse(d.date));//
        this.final_time = d3.max(this.selectedData, d => Date.parse(d.date));//
        // console.log(d3.timeFormat("%Y/%m/%d")(this.start_time), d3.timeFormat("%Y/%m/%d")(this.final_time))
        // this.xScale = d3.scaleTime()
        //     .domain([this.start_time, this.final_time])
        //     .range([0, this.vizWidth - this.margin.left - this.margin.right])
        // this.xAxis = d3.axisBottom(this.xScale)
        //     .tickFormat(d3.timeFormat("%y.%m.%d"));
        // this.xAxisGroup = this.svg.select('#x-axis')
        //     .attr('transform', 'translate(' + this.margin.left + ',' + (this.vizHeight - this.margin.bottom) + ')')
        // this.xAxisGroup.append('g')
        //     .call(this.xAxis)



        this.years = []
        for (let time of globalObj.selectedTime) {
            let tmp = time.slice(0, 4)
            if (!this.years.includes(tmp)){
                this.years.push(tmp)
            }
        }
        this.years.sort((a,b) => (a-b)) //
        this.groupedYearData = d3.group(this.selectedData, d => d.month.slice(0, 4));
        this.start_times = []
        this.final_times = []
        this.time_intervals = []
        let tmp = ""
        for (let year of this.years) {
            let data = this.groupedYearData.get(year)
            this.st = d3.min(data, d => Date.parse(d.date)) // start time of the year
            this.ft = d3.max(data, d => Date.parse(d.date)) // final time of the year
            // console.log("...")
            this.start_times.push(this.st)
            this.final_times.push(this.ft)
            if (tmp === ""){
                this.time_intervals.push(0)
            }
            else {
                this.time_intervals.push(d3.timeDay.count(tmp, this.st))
            }
            tmp = this.ft
        }
        this.time_intervals.push(0)
        this.total_days = d3.timeDay.count(this.start_time, this.final_time)
        let w = this.vizWidth - this.margin.left - this.margin.right
        let wr = w / this.total_days
        for (let i of [...Array(this.years.length).keys()]) {
            this.xS = d3.scaleTime()
                .domain([this.start_times[i], this.final_times[i]])
                .range([
                    wr * (d3.timeDay.count(this.start_time, this.start_times[i]) - this.time_intervals[i]*0.5),
                    wr * (d3.timeDay.count(this.start_time, this.final_times[i]) + this.time_intervals[i+1]*0.5)
                ])
            this.xA = d3.axisBottom(this.xS)
                .tickFormat(d3.timeFormat("%y.%m.%d"))
                .ticks(1)
            this.xAxisGroup = this.svg.select('#x-axis')
                .attr('transform', 'translate(' + this.margin.left + ',' + (this.vizHeight - this.margin.bottom) + ')')
            this.xAxisGroup.append('g')
                .call(this.xA)

            // path generators for each x-axis
            let pG = d3.line()
                .x(d => this.xS(d3.timeParse("%Y/%m/%d")(d.date)))
                .y(d => this.yScale(d.price))
            let aG = d3.area()
                .x(d => this.xS(d3.timeParse("%Y/%m/%d")(d.date)))
                .y1(d => this.yScale(d.high))
                .y0(d => this.yScale(d.low));
            this.pathGenerators.push(pG)
            this.areaGenerators.push(aG)
        }

        // update y-axis
        this.max_price = d3.max(this.selectedData, d => parseFloat(d.price))
        this.min_price = d3.min(this.selectedData, d => parseFloat(d.price))
        this.yScale = d3.scaleLinear()  // change it to scaleLog
            .domain([this.min_price, this.max_price])
            .range([this.vizHeight - this.margin.bottom - this.margin.top, 0])
            .nice()

        this.yScaleLog = d3.scaleLog()
            .domain([this.min_price, this.max_price])
            .range([this.vizHeight - this.margin.bottom - this.margin.top, 0])
            .nice()

        if(this.logOn) {
            this.yScale = this.yScaleLog
        }

        this.yAxis = d3.axisLeft(this.yScale);

        this.svg.select('#y-axis')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.bottom + ')')
            .call(this.yAxis)


    }

    updatePaths(){
        let names = globalObj.selectedNames;
        for (let name of names){ // for each cryptocurrency
            let Data = this.groupedData.get(name)
                .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))

            let groupedData = d3.group(Data, d => d.month.slice(0, 4));// group by year

            let cgroup = this.svg.append('g')

            for (let i of [...Array(this.years.length).keys()]) { // for each year
                // console.log(groupedData.keys())

                if (Array.from(groupedData.keys()).includes(this.years[i])){
                    let data = groupedData.get(this.years[i])

                    cgroup.append('path')
                        .datum(name)
                        .attr('class', 'lines')
                        .attr('id', name)
                        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                        .attr('d', this.pathGenerators[i](data))
                        // .attr('d', this.pathGenerator(data))
                        .attr('fill', 'none')
                        .attr('stroke', this.colorScale(name))

                    cgroup.append('path')// price range area
                        .datum(name)
                        .attr('class', 'areas')
                        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                        .attr('id', name)
                        .attr('d', this.areaGenerators[i](data))
                        // .attr('d', this.areaGenerator(data))
                        .attr('fill', this.colorScale(name))
                        .attr('opacity', 0.5)

                    cgroup.append("path")// draw a wider path for easier hovering
                        .datum(name)
                        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                        .attr('id', name)
                        .attr('d', this.pathGenerators[i](data))
                        // .attr('d', this.pathGenerator(data))
                        .attr("class", "fatpath")
                        .on("mouseover", e => {
                            this.svg.selectAll(".lines")
                                .attr("stroke", d => this.colorScaleFade(d))//fade
                                .filter(d => d===name)
                                .attr("stroke", this.colorScale(name))
                            this.svg.selectAll(".areas")
                                .attr("fill", d => this.colorScaleFade(d))//fade
                                .filter(d => d===name)
                                .attr("fill", this.colorScale(name))
                            this.svg.selectAll("#"+(e.target).id)
                                .attr("stroke-width", 3)//highlight
                        })
                        .on("mouseout", e => {//restore
                            this.svg.selectAll(".lines")
                                .attr("stroke", d => this.colorScale(d))
                            this.svg.selectAll(".areas")
                                .attr("fill", d => this.colorScale(d))
                            this.svg.selectAll("#"+(e.target).id)
                                .attr("stroke-width", 1)
                        })
                }
            }




        }
    }

    update() {
        this.svg.selectAll('path').remove();
        this.xAxisGroup.selectAll('g').remove()

        this.selectedData = this.parsedData//
            .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))
            .filter(d => globalObj.selectedNames.length === 0 ? false : globalObj.selectedNames.includes(d.name))//

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
                    // console.log(this.)
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
            else {
                this.svg.select('#overlay')
                    .selectAll('text')
                    .attr('visibility', 'hidden')
            }

        }


    }


}
