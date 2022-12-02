
class LineChart {

    constructor() {
        this.vizWidth = 900;
        this.vizHeight = 800;
        this.margin = { left: 70, bottom: 20, top: 20, right: 20 };
        this.logOn = true;

        this.svg = d3.select("#line-chart")
            .attr('width', this.vizWidth)
            .attr('height', this.vizHeight)

        this.svg.on('mousemove', e => this.updateOverlay(e));

        this.parsedData = globalObj.parsedData;

        this.selectedData = this.parsedData//

        this.groupedData = globalObj.groupedData
        this.allNames = globalObj.allNames
        this.allTime = globalObj.allTime

        this.pathGenerators = []
        this.areaGenerators = []

        // this.update()
        this.years = []
        for (let time of globalObj.selectedTime) {
            let tmp = time.slice(0, 4)
            if (!this.years.includes(tmp)){
                this.years.push(tmp)
            }
        }
        this.years.sort((a,b) => (a-b))

        this.colorScale = globalObj.colorScale;
        this.colorScaleFade = globalObj.colorScaleFade;

        this.updateAxes()
        this.updatePaths()

        // this.pathGenerator = d3.line()
        //     .x(d => this.xScale(d3.timeParse("%Y/%m/%d")(d.date)))
        //     .y(d => this.yScale(d.price))
        //
        // this.areaGenerator = d3.area()
        //     .x(d => this.xScale(d3.timeParse("%Y/%m/%d")(d.date)))
        //     .y1(d => this.yScale(d.high))
        //     .y0(d => this.yScale(d.low));

        this.svg.append('text')
            .attr('id', 'y-text')
            .text('market price')
            .attr('x', -140)
            .attr('y', 32)
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
                globalObj.grid_brush.rects
                    .attr('class', 'gridRect')
                    .filter(d => (d[1]===4))
                    .attr('class', 'selectedRect')
            })

        this.preset2Button = d3.select("#preset2")
            .on('click', e => {
                globalObj.selectedTime = ["2018/01", "2018/02", "2018/03", "2018/04", "2018/05", "2018/06",
                    "2018/07", "2018/08", "2018/09", "2018/10", "2018/11", "2018/12", ]
                this.update()
                globalObj.grid_brush.rects
                    .attr('class', 'gridRect')
                    .filter(d => (d[1]===5))
                    .attr('class', 'selectedRect')
            })
    }

    updateAxes() {
        // update x-axis
        this.start_time = d3.min(this.selectedData, d => Date.parse(d.date));//
        this.final_time = d3.max(this.selectedData, d => Date.parse(d.date));//
        // console.log(d3.timeFormat("%Y/%m/%d")(this.start_time), d3.timeFormat("%Y/%m/%d")(this.final_time))
        this.xScale = d3.scaleTime()
            .domain([this.start_time, this.final_time])
            .range([0, this.vizWidth - this.margin.left - this.margin.right])
        // this.xAxis = d3.axisBottom(this.xScale)
        //     .tickFormat(d3.timeFormat("%y.%m.%d"));
        // this.xAxisGroup = this.svg.select('#x-axis')
        //     .attr('transform', 'translate(' + this.margin.left + ',' + (this.vizHeight - this.margin.bottom) + ')')
        // this.xAxisGroup.append('g')
        //     .call(this.xAxis)

        this.groupedYearData = d3.group(this.selectedData, d => d.month.slice(0, 4));
        this.start_times = []
        this.final_times = []
        this.time_intervals = []
        let tmp = ""
        for (let year of this.years) {
            if ((Array.from(this.groupedYearData.keys())).includes(year)){
                let data = this.groupedYearData.get(year)
                // if (data.length !== 0){
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
                // }
            }

        }
        this.time_intervals.push(0)
        // console.log(this.time_intervals)//

        this.total_days = d3.timeDay.count(this.start_time, this.final_time)
        this.r0r1s = []
        let w = this.vizWidth - this.margin.left - this.margin.right
        let wr = w / this.total_days
        for (let i of [...Array(this.years.length).keys()]) {
            let r0 = wr * (d3.timeDay.count(this.start_time, this.start_times[i]) - this.time_intervals[i]*0.4);
            // wr * (d3.timeDay.count(this.start_time, this.start_times[i]))
            let r1 = wr * (d3.timeDay.count(this.start_time, this.final_times[i]) + this.time_intervals[i+1]*0.4)
            // wr * (d3.timeDay.count(this.start_time, this.final_times[i]))
            this.r0r1s.push([r0, r1])
            const xS = d3.scaleTime()
                .domain([this.start_times[i], this.final_times[i]])
                .range([r0, r1])
            let xA = d3.axisBottom(xS)
                .tickFormat(d3.timeFormat("%y.%m.%d"))
                .ticks(Math.floor(0.014 * (r1 - r0))) // number of ticks
                // .ticks(2)
            this.xAxisGroup = this.svg.select('#x-axis')
                .attr('transform', 'translate(' + this.margin.left + ',' + (this.vizHeight - this.margin.bottom) + ')')
            this.xAxisGroup.append('g')
                .call(xA)

        }

        // update y-axis
        let selectedData = this.selectedData
            .filter(d => globalObj.selectedNames.length === 0 ? false : globalObj.selectedNames.includes(d.name))

        this.max_price = d3.max(selectedData, d => parseFloat(d.price))
        this.min_price = d3.min(selectedData, d => parseFloat(d.price))
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
                .filter(d => globalObj.selectedNames.length === 0 ? false : globalObj.selectedNames.includes(d.name))

            let groupedData = d3.group(Data, d => d.month.slice(0, 4));// group by year

            for (let i of [...Array(this.years.length).keys()]) { // for each year

                if (Array.from(groupedData.keys()).includes(this.years[i])){
                    let data = groupedData.get(this.years[i])

                    // if (data.length !== 0) {
                        let cgroup = this.svg.append('g')
                            .datum(name)
                            .attr('id', name + i.toString())
                            .attr('class', 'path_group')

                        let xs = d3.scaleTime()
                            .domain([this.start_times[i], this.final_times[i]])
                            .range(this.r0r1s[i])
                        console.log(i, this.start_times, this.final_times)
                        let pG = d3.line()
                            .x(d => xs(d3.timeParse("%Y/%m/%d")(d.date)))
                            .y(d => this.yScale(d.price))

                        let aG = d3.area()
                            .x(d => xs(d3.timeParse("%Y/%m/%d")(d.date)))
                            .y1(d => this.yScale(d.high))
                            .y0(d => this.yScale(d.low));

                        cgroup.append('path')
                            .datum(name)
                            .attr('class', 'lines')
                            .attr('id', name)
                            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                            .attr('d', () => {
                                console.log(data)
                                return pG(data)
                            })
                            .attr('fill', 'none')
                            .attr('stroke', this.colorScale(name))

                        cgroup.append('path')// price range area
                            .datum(name)
                            .attr('id', name)
                            .attr('class', 'areas')
                            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                            .attr('d', aG(data))
                            .attr('fill', this.colorScale(name))
                            .attr('opacity', 0.5)

                        cgroup.append("path")// draw a wider path for easier hovering
                            .datum(name)
                            .attr('id', name)
                            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                            .attr('d', pG(data))
                            .attr("class", "fatpath")
                            .on("mouseover", e => {
                                this.svg.selectAll(".lines")
                                    .attr("stroke", d => this.colorScaleFade(d))//fade
                                    .filter(d => d === name)
                                    .attr("stroke", this.colorScale(name))
                                this.svg.selectAll(".areas")
                                    .attr("fill", d => this.colorScaleFade(d))//fade
                                    .filter(d => d === name)
                                    .attr("fill", this.colorScale(name))
                                this.svg.selectAll("#" + (e.target).id)
                                    .attr("stroke-width", 3)//highlight

                                this.svg.selectAll(".path_group")
                                    .sort((a, b) => a === (e.target).id ? 1 : -1)
                            })
                            .on("mouseout", e => {//restore
                                this.svg.selectAll(".lines")
                                    .attr("stroke", d => this.colorScale(d))
                                this.svg.selectAll(".areas")
                                    .attr("fill", d => this.colorScale(d))
                                this.svg.selectAll("#" + (e.target).id)
                                    .attr("stroke-width", 1)
                            })
                    // }
                }
            }
        }
    }

    update() {
        this.svg.selectAll('.path_group').remove();
        this.xAxisGroup.selectAll('g').remove()

        console.log(globalObj.selectedTime[0], globalObj.selectedTime[globalObj.selectedTime.length-1],)
        // console.log(globalObj.selectedNames)

        this.selectedData = this.parsedData
            .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))
            // .filter(d => globalObj.selectedNames.length === 0 ? false : globalObj.selectedNames.includes(d.name))

        // this.groupedData = d3.group(this.selectedData, d => d.name);
        // if (globalObj.selectedTime.length === 0 || globalObj.selectedNames.length === 0) {
        //     this.groupedData = globalObj.groupedData
        // }

        this.years = []
        for (let time of globalObj.selectedTime) {
            let tmp = time.slice(0, 4)
            if (!this.years.includes(tmp)){
                this.years.push(tmp)
            }
        }
        this.years.sort((a,b) => (a-b))

        this.updateAxes()
        this.updatePaths()
    }

    updateOverlay(e) {
        let mouseX = e.clientX - 5;
        let aaa = false;
        for (let i of [...Array(this.years.length).keys()]) {
            let posX = mouseX - this.margin.left
            if (posX > this.r0r1s[i][0] && posX < this.r0r1s[i][1]) {
                aaa = true
            }
        }

        if (mouseX > this.margin.left && mouseX < this.vizWidth - this.margin.right && aaa) {
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

                    let posX = mouseX - this.margin.left
                    // console.log(posX)
                    let xs = this.xScale
                    for (let i of [...Array(this.years.length).keys()]) {
                        if (posX > this.r0r1s[i][0] && posX < this.r0r1s[i][1]){
                            xs = d3.scaleTime()
                                .domain([this.start_times[i], this.final_times[i]])
                                .range(this.r0r1s[i])
                            // console.log(":::::"+i)
                            break
                        }
                    }
                    // let dateHovered = new Date(Math.floor(xs.invert(posX)));
                    let dateHovered =xs.invert(posX)
                    // console.log(d3.timeFormat("%Y/%m/%d")(dateHovered))
                    // let dateHovered = new Date(Math.floor(this.xScale.invert(posX)));
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
                        mouseX - 140 : mouseX + 10)
                    // .attr('x', 0)
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
