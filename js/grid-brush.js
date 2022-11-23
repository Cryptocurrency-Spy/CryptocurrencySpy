
class GridBrush {//Bubble

    constructor() {
        this.parsedData = globalObj.parsedData;

        this.groupedTimeData = globalObj.groupedTimeData
        this.allTime = Array.from(this.groupedTimeData.keys())
        globalObj.selectedTime = this.allTime  // ["2019/04", "2019/03", ...]
        this.allTimeStart = 2013
        this.year_count = 7

        this.capital_by_time = {}
        for (let time of this.allTime) {
            let data = this.groupedTimeData.get(time)
            let capital_sum = data.reduce((acc, obj) => {  // accumulator, object
                let add = parseFloat(obj.cap)
                return acc + (isNaN(add)? 0: add);
            }, 0);
            this.capital_by_time[time] = capital_sum
        }
        let cmax = 0
        let cmin = Infinity
        Object.entries(this.capital_by_time).forEach(([key, value]) => {
            // console.log(key, value);
            if (value > cmax) {
                cmax = value
            }
            if (value < cmin) {
                cmin = value
            }
        });

        this.divWidth = 900;
        this.divHeight = 900;
        this.svgHeight = 270;
        this.margin = 10;
        this.dx = 70
        this.dy = 50
        this.w = 40
        this.h = 30

        this.div = d3.select('#grid-brush')
            .style('width', this.divWidth + 'px')
            .style('height', this.divHeight + 'px')

        this.svg = this.div.select('svg')
            .attr('overflow', 'visible')
            .attr('width', this.divWidth)
            .attr('height', this.svgHeight)
            .attr('x', '0')
            .attr('y', '0')

        // rectangles
        this.rectGroup = this.svg.select('#rect_group')
            .attr('transform', 'translate('+ this.dx + ','+ this.dy +')')////
            .attr('id', 'grid_rectangles')
        this.rect_indices = []
        for(let j of [...Array(this.year_count).keys()]) {
            for (let i of [...Array(12).keys()]) {
                this.rect_indices.push([i, j]);
            }
        }
        let capital_by_time = this.capital_by_time
        this.rects = this.rectGroup.selectAll('rect')
            .data(this.rect_indices)
            .join('rect')
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', d => this.w * d[0])
            .attr('y', d => this.h * d[1])
            // .attr('class', 'gridRect')
        //
            .attr('fill', function(d){
                // d[0]: month (0-11), d[1]: year (0-12)
                let year_str = (d[1]+2013).toString()
                let month_str = (d[0]+1).toString()
                if (month_str.length < 2)
                    month_str = "0" + month_str;
                let time_str = year_str + "/" + month_str
                let color = "gray"
                if (time_str in capital_by_time) {
                    color = d3.interpolateReds(Math.log(capital_by_time[time_str]/cmin)/Math.log(cmax/cmin))
                }
                return color
            })


        // texts of years
        this.yearTextGroup = this.svg.append('g')
            .attr('id', 'year_text')
            .attr('transform', 'translate('+ 30 + ','+ 68 +')')
        let years = []
        for (let i of [...Array(this.year_count).keys()]) {
            years.push(i + this.allTimeStart)
        }
        this.yearText = this.yearTextGroup.selectAll('text')
            .data(years)
            .join('text')
            .attr('transform', (d,i) => 'translate(0,'+ i * this.h +')')
            .text(d => d.toString())

        // text of months
        this.monthTextGroup = this.svg.append('g')
            .attr('id', 'month_text')
            .attr('transform', 'translate('+ 82 + ','+ 40 +')')
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"]
        this.monthText = this.monthTextGroup.selectAll('text')
            .data(months)
            .join('text')
            .attr('transform', (d,i) => 'translate('+ i * this.w +',0)')
            .text(d => d)

        // brushes
        this.attachBrushes()

        // button
        this.clearButton = this.div.select('#clear_time')
            .on('click', e => this.clearTimeSelection(e))

    }

    attachBrushes() {
        this.brushGroup = d3.select('#brush_group')  // g
            .attr('transform', 'translate(' + this.dx + ',' + this.dy + ')')

        this.brush = d3.brush().extent([
            [0, 0],
            [12 * this.w, this.year_count * this.h]
        ])
            .on("start", e => this.brushstart(e))
            .on("brush", e => this.brushed(e))
            .on("end", e => this.brushend(e))

        this.brushg = this.brushGroup.append('g')
            .call(this.brush)

    }

    brushstart(e) {
        let s = e.selection;
    }

    brushed(e) {
        let s = e.selection;
        let [[x0, y0], [x1, y1]] = s;
        // console.log(x0, y0)
        // console.log(x1, y1)

        crop(x0, y0, 0, 0, 12 * this.w, this.year_count * this.h);
        crop(x1, y1, 0, 0, 12 * this.w, this.year_count * this.h);
        function crop(x, y, x_min, y_min, x_max, y_max) {
            if (x < x_min) {
                x = x_min;
            }
            if (y < y_min) {
                y = y_min;
            }
            if (x > x_max) {
                x = x_max;
            }
            if (y > y_max) {
                y = y_max;
            }
        }
        this.rects.attr('class', 'gridRect');

        let connerRectIndices = []
        for (let j of [...Array(this.year_count).keys()]) {
            for (let i of [...Array(12).keys()]) {
                if (x0 >= i * this.w && x0 <= (i + 1) * this.w && y0 >= j * this.h && y0 <= (j + 1) * this.h) {
                    connerRectIndices.push([i, j])
                }
            }
        }
        for (let j of [...Array(this.year_count).keys()]) {
            for (let i of [...Array(12).keys()]) {
                if (x1 >= i * this.w && x1 <= (i + 1) * this.w && y1 >= j * this.h && y1 <= (j + 1) * this.h) {
                    connerRectIndices.push([i, j])
                }
            }
        }

        if (connerRectIndices[0][0] > connerRectIndices[1][0]){
            let tmp = connerRectIndices[0][0];
            connerRectIndices[0][0] = connerRectIndices[1][0];
            connerRectIndices[1][0] = tmp;
        }
        if (connerRectIndices[0][1] > connerRectIndices[1][1]){
            let tmp = connerRectIndices[0][1];
            connerRectIndices[0][1] = connerRectIndices[1][1];
            connerRectIndices[1][1] = tmp;
        }

        this.selectedRects = this.rects
            .filter(d => (
                d[0] >= connerRectIndices[0][0] && d[0] <= connerRectIndices[1][0] &&
                d[1] >= connerRectIndices[0][1] && d[1] <= connerRectIndices[1][1]
            ))
            .attr('class', 'gridRect' + ' selected')
    }

    brushend(e) {
        globalObj.selectedTime = []  // "year/month", such as "2020/03"
        this.selectedRects
            .attr('time', function(d){
                // d[0]: month (0-11), d[1]: year (0-12)
                let year_str = (d[1]+2013).toString()
                let month_str = (d[0]+1).toString()
                if (month_str.length < 2)
                    month_str = "0" + month_str;
                globalObj.selectedTime.push(year_str + "/" + month_str)
                return year_str + "/" + month_str
            })

        // console.log(globalObj.selectedTime)
        console.log(globalObj.selectedNames)
        globalObj.treemap.draw_treemap()
        globalObj.line_chart.updateRange(e)

        globalObj.updateGlobalNameSelection(e)
    }


    clearTimeSelection(e) {
        globalObj.selectedTime = [];

        this.brushg.select('.selection')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 0)
            .attr('height', 0)
            .attr('style', "display: none")
        this.brushg.selectAll('.handle').attr('style', "display: none")

        this.rects.attr('class', 'gridRect')

        globalObj.line_chart.updateRange()
        globalObj.treemap.draw_treemap()
    }

}




