
class LineChart {

    constructor() {
        this.divWidth = 1200;
        this.vizWidth = 700;
        this.vizHeight = 500;
        this.margin = { left: 70, bottom: 20, top: 20, right: 20 };

        this.svg = d3.select("#line-chart")
            .attr('width', this.vizWidth)
            .attr('height', this.vizHeight)

        this.parsedData = globalObj.parsedData;

        this.selectedData = this.parsedData//

        this.groupedData = globalObj.groupedData
        this.allNames = globalObj.allNames
        this.allTime = globalObj.allTime

        this.updateAxes()

        this.pathGenerator = d3.line()
            .x(d => this.xScale(d3.timeParse("%Y/%m/%d")(d.date)))
            .y(d => this.yScale(d.price))

        this.colorScale = globalObj.colorScale;

        this.updatePaths()

        // add y-axis label
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
        console.log(d3.timeFormat("%Y/%m%/%d")(this.start_time), d3.timeFormat("%Y/%m%/%d")(this.final_time))
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
        if (names.length===0) {
            // console.log("names = globalObj.allNames!!!")
            names = globalObj.allNames;
        }
        // console.log(names)
        for (let name of names){
            let data = this.groupedData.get(name)
                .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))

            this.svg.append('path')
                .attr('id', 'lines')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                .attr('d', this.pathGenerator(data))//
                .attr('fill', 'none')
                .attr('stroke', this.colorScale(name));//
        }
    }

    updateRange() {
        this.svg.selectAll('#lines').remove();

        this.selectedData = this.parsedData//
            .filter(d => globalObj.selectedTime.length === 0 ? false : globalObj.selectedTime.includes(d.month))
            .filter(d => globalObj.selectedNames.length === 0 ? false : globalObj.selectedNames.includes(d.name))//

        if (this.selectedData.length === 0) {  // if no data is selected, select all
        // if (globalObj.selectedTime.length === 0 && globalObj.selectedNames.length === 0) {
            console.log("selecting all")
            this.selectedData = this.parsedData;
            globalObj.selectedTime = this.allTime;
            globalObj.selectedNames = this.allNames;
        }

        this.updateAxes()
        this.updatePaths()
    }




}
