
class Table {
    constructor(wordsData) {

        this.tableData = [...wordsData];
        this.headerData = [
            {
                sorted: false,
                ascend: false,
                key: 'phrase'
            },
            {
                sorted: false,
                ascend: false,
                key: 'frequency'
            },
            {
                sorted: false,
                ascend: false,
                key: 'percentage'
            },
            {
                sorted: false,
                ascend: false,
                key: 'total'
            },
        ]

        this.vizWidth = 150;
        this.vizHeight = 20;
        this.margin = 10;

        // frequency
        this.scaleFrequency = d3.scaleLinear()
            .domain([0.0, 1.0])
            .range([this.margin, this.vizWidth-this.margin]);

        this.axisFrequency = d3.axisTop(this.scaleFrequency)
            .tickValues([0.0, 0.5, 1.0])
            .tickFormat((d, i) => ['0.0', '0.5', '1.0'][i]);

        // percentage
        this.scalePercentage = d3.scaleLinear()
            .domain([-100, 100])
            .range([this.margin, this.vizWidth-this.margin]);

        this.axisPercentage = d3.axisTop(this.scalePercentage)
            .tickValues([-100, -50, 0, 50, 100])
            .tickFormat((d, i) => ['100', '50', '0', '50', '100'][i]);

        d3.select('#div_table').style("width", 600 + 'px')
        d3.select('#column_total').style("width", 60 + 'px')
        this.attachSortHandlers();
        this.drawFrequencyLegend();
        this.drawPercentageLegend();
        this.drawTable()
    }

    drawFrequencyLegend() {
        let legend = d3.select('#frequencyAxis')
            .attr('height', this.vizHeight + 'px')
            .attr('width', this.vizWidth + 'px');
        legend.append('g')
            .attr('transform', 'translate(0,20)')
            .attr('class', 'axis')
            .call(this.axisFrequency);
    }

    drawPercentageLegend() {
        let legend = d3.select('#percentageAxis')
            .attr('height', this.vizHeight + 'px')
            .attr('width', this.vizWidth + 'px');
        legend.append('g')
            .attr('transform', 'translate(0,20)')
            .attr('class', 'axis')
            .call(this.axisPercentage);
    }

    rowToCellDataTransform(d) {
        let phraseInfo = {
            type: 'text',
            value: d.phrase
        };

        let frequencyInfo = {
            type: 'viz',
            class: d.category.slice(0, 4),
            value: d.total / 50
        };

        let percentageInfo = {
            type: 'viz2',
            value: {
                percentD: d.percent_of_d_speeches,
                percentR: d.percent_of_r_speeches
            }
        };

        let totalInfo = {
            type: 'text',
            value: d.total
        };

        return [phraseInfo, frequencyInfo, percentageInfo, totalInfo]
    }

    drawTable() {
        let circles = d3.select('#bubbles').selectAll('circle')

        let selectedData = this.tableData.filter(d => (globalObj.selectedNames.includes(d.phrase)))

        let rows = d3.select('#wordTableBody')
            .selectAll('tr')
            .data(selectedData)
            .join('tr');

        let cells = rows.selectAll('td')
            .data(this.rowToCellDataTransform)
            .join('td')
            .attr('class', d => d.class)
            .text(function (d){
                // console.log(d)
                if(d.type === 'text')
                    return d.value;
            })

        // frequency
        let viz = cells.filter(d => d.type === 'viz');
        let svgs = viz.selectAll('svg')
            .data(d => [d])
            .join('svg')
            .attr('width', this.vizWidth)
            .attr('height', this.vizHeight);

        let groups = svgs.selectAll('g')
            .data(d => [d])
            .join('g')
        this.addFrequencyRectangles(groups);

        // percentage
        let viz2 = cells.filter(d => d.type === 'viz2');
        let svgs2 = viz2.selectAll('svg')
            .data(d => [d])
            .join('svg')
            .attr('width', this.vizWidth)
            .attr('height', this.vizHeight);

        let groups2 = svgs2.selectAll('g')
            .data(d => [d])
            .join('g')
        this.addPercentageRectangles(groups2);
    }


    addFrequencyRectangles(groups) {
        groups.append('rect')
            .attr('y', '5')
            .attr('height', '20')
            .attr('x', this.scaleFrequency(0.0))
            .attr('width', d => this.scaleFrequency(d.value))
            .classed('margin-bar')
    }

    addPercentageRectangles(groups) {
        groups.append('rect')
            .attr('height', '20')
            .attr('y', '5')
            .attr('class', 'democratic margin-bar')
            .attr('x', d => this.scalePercentage(-d.value.percentD))
            .attr('width', d => this.scalePercentage(0) - this.scalePercentage(-d.value.percentD));

        groups.append('rect')
            .attr('height', '20')
            .attr('y', '5')
            .attr('class', 'republican margin-bar')
            .attr('x', this.scalePercentage(0))
            .attr('width', d => this.scalePercentage(d.value.percentR) - this.scalePercentage(0));
    }

    attachSortHandlers() {
        d3.select('#columnHeaders')
            .selectAll('th')
            .data(this.headerData)
            .on('click', e => this.sortData(e))
    }

    sortData(e) {
        let et = e.target;
        let header = et.textContent;  // get the text of an element (not 'innerHTML')

        let s0 = this.headerData.find(item => item.key==='phrase');
        let s1 = this.headerData.find(item => item.key==='frequency');
        let s2 = this.headerData.find(item => item.key==='percentage');
        let s3 = this.headerData.find(item => item.key==='total');

        if (header === "Phrase ".toString()) {
            if (!s0.sorted) {
                s0.sorted = true;
                s1.sorted = false;
                s2.sorted = false;
                s3.sorted = false;
            }
            if (s0.ascend) {
                this.tableData = this.tableData.sort(function (a, b) {
                    return a.phrase > b.phrase ? 1: -1;
                });
                s0.ascend = false;
            } else {
                this.tableData = this.tableData.sort(function (b, a) {
                    return a.phrase > b.phrase ? 1: -1;
                });
                s0.ascend = true;
            }
        }
        else if (header === ("Frequency ".toString()) || (header === "Total ".toString())) {
            if (!s1.sorted) {
                s0.sorted = false;
                s1.sorted = true;
                s2.sorted = false;
                s3.sorted = true;
            }
            if (s1.ascend) {
                this.tableData = this.tableData.sort(function (a, b) {
                    return (b.total * 1.0) - (a.total * 1.0);
                });
                s1.ascend = false;
                s3.ascend = false;
            } else {
                this.tableData = this.tableData.sort(function (b, a) {
                    return (b.total * 1.0) - (a.total * 1.0);
                });
                s1.ascend = true;
                s3.ascend = true;
            }
        }
        else if (header === "Percentages ".toString()) {
            if (!s2.sorted) {
                s0.sorted = false;
                s1.sorted = false;
                s2.sorted = true;
                s3.sorted = false;
            }
            if (s2.ascend) {
                this.tableData = this.tableData.sort(function (a, b) {
                    return (b.percent_of_d_speeches * 1.0 + b.percent_of_r_speeches * 1.0)
                        - (a.percent_of_d_speeches * 1.0 + a.percent_of_r_speeches * 1.0);
                });
                s2.ascend = false;
            } else {
                this.tableData = this.tableData.sort(function (b, a) {
                    return (b.percent_of_d_speeches * 1.0 + b.percent_of_r_speeches * 1.0)
                        - (a.percent_of_d_speeches * 1.0 + a.percent_of_r_speeches * 1.0);
                });
                s2.ascend = true;
            }
        }

        this.drawTable()
    }



}
