
class GridBrush {//Bubble

    constructor() {
        this.parsedData = globalObj.parsedData;

        this.groupedTimeData = d3.group(this.parsedData, d => d.month);
        this.allTime = Array.from(this.groupedTimeData.keys())
        globalObj.selectedTime = this.allTime

        this.divWidth = 900;
        this.divHeight = 900;
        this.svgHeight = 450;
        this.margin = 10;
        this.dx = 70
        this.dy = 50
        this.w = 50
        this.h = 30
        this.year_count = 13


        // this.scaleX = d3.scaleLinear()
        //     .domain([-50, 50])
        //     .range([20, this.vizWidth-40]);
        //
        // this.axisX = d3.axisTop(this.scaleX)
        //     .tickValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        //     .tickFormat((d, i) => ["Jan", "Feb", "March", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"][i]);

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
        this.rect_data = []
        for(let j of [...Array(this.year_count).keys()]) {
            for (let i of [...Array(12).keys()]) {
                this.rect_data.push([i, j]);
            }
        }
        this.rects = this.rectGroup.selectAll('rect')
            .data(this.rect_data)
            .join('rect')
            .attr('width', this.w)
            .attr('height', this.h)
            .attr('x', d => this.w * d[0])
            .attr('y', d => this.h * d[1])
            .attr('class', 'gridRect')

        // texts of years
        this.yearTextGroup = this.svg.append('g')
            .attr('id', 'year_text')
            .attr('transform', 'translate('+ 30 + ','+ 68 +')')
        let years = []
        for (let i of [...Array(this.year_count).keys()]) {
            years.push(i + 2010)
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

        // this.div.select('svg').remove()

        // button
        this.clearButton = this.div.select('#clear_time')
            .attr('transform', 'translate(0,' + 400 + ')')
            // .attr('top', 400)
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

        // console.log(connerRectIndices)

        this.selectedRects = this.rects
            .filter(d => (
                d[0] >= connerRectIndices[0][0] && d[0] <= connerRectIndices[1][0] &&
                d[1] >= connerRectIndices[0][1] && d[1] <= connerRectIndices[1][1]
            ))
            .attr('class', 'gridRect' + ' selected')

            // .attr('aaa', d => (console.log(d[0],d[1])))

    }

    brushend(e) {
        // console.log('brushend called')
        // globalObj.grid_brush.updateLineChart();

        globalObj.selectedTime = []  // "month/year", such as "03/2020"
        this.selectedRects
            .attr('time', function(d){
                // d[0]: month (0-11), d[1]: year (0-12)
                let year_str = (d[1]+2010).toString()
                let month_str = (d[0]+1).toString()
                globalObj.selectedTime.push(year_str + "/" + month_str)
                return year_str + "/" + month_str
            })

        globalObj.line_chart.updateRange(e)
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

        globalObj.line_chart.updateRange(e)
    }

}




