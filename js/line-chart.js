
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
                .attr('d', this.pathGenerator(data))
                .attr('fill', 'none')
                .attr('stroke', this.colorScale(name))

            this.svg.append('path')
                .attr('id', 'areas')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
                .attr('d', this.areaGenerator(data))
                .attr('fill', this.colorScale(name))
                .attr('opacity', 0.5)



        }
    }

    updateRange() {
        this.svg.selectAll('#lines').remove();
        this.svg.selectAll('#areas').remove();

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

    updateOverlay(e) {
        let mouseX = e.clientX - 5;
        if (mouseX > this.margin.left && mouseX < this.vizWidth - this.margin.right) {
            this.svg.select('#overlay').style("visibility", 'visible')

            this.svg.select('#overlay').select('line')
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
                    else {
                        // console.log('fetch error!')
                    }
                }
                dataFetched.sort((d1, d2) => parseFloat(d2[0].price) - parseFloat(d1[0].price))
                console.log(dataFetched)
            }



            // else{
            //     dataFetched = [];
            //     for (let cData of this.contData) {  // iterate each continent
            //         // find the relevant data
            //         let dateHovered = new Date(Math.floor(this.xScale.invert(mouseX - MARGIN.left)));  // get the date by x-coordinate
            //
            //         let tmp = cData[1]
            //             .filter(d => Math.abs(d3.timeDay.count(d3.timeParse("%b %d %Y")(d.date), dateHovered)) < 1.1);  // time difference less than 1 day
            //         if (tmp.length === 0) console.log('fetch error!')
            //
            //         let color = get_color_by_continent_code(cData[0]);
            //         let color_rgb = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
            //
            //         dataFetched.push([tmp[Math.floor(tmp.length / 2.0)], color_rgb])
            //     }
            //     // dataFetched: (example)
            //     // d[0]: {"code": "OWID_AFR", "loca": "Africa", "date": "Apr 29 2022", "case": "8379.02"}
            //     // d[1]: rgb(0,49,167)
            //     dataFetched.sort((d1, d2) => d2[0].case - d1[0].case);
            // }

            // set the overlay labels---------------------------------------------------------------------------------
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
