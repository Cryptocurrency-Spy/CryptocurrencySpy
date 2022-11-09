/** Class representing the map view. */
class MapVis {
    /**
     * Creates a Map Visuzation
     * @param globalApplicationState The shared global application state (has the data and the line chart instance in it)
     */
    constructor(globalApplicationState) {

        this.globalApplicationState = globalApplicationState;
        let svg = d3.select("#map");

        const projection = d3.geoWinkel3()
            .scale(150)
            .translate([400, 250]);
        let path = d3.geoPath()
            .projection(projection);
        let graticule = d3.geoGraticule();

        // read original data---------------------------------------------------------------------------------------
        let mapData_topo = this.globalApplicationState.mapData;  // json
        let mapData_geo = topojson.feature(mapData_topo, mapData_topo.objects.countries);
        let covidData = this.globalApplicationState.covidData;  // csv

        // find the max cases for each country----------------------------------------------------------------------
        let dataLookup = {};
        let cntNaN = 0;
        covidData.forEach(function (row) {
            let tmp = parseFloat(row.total_cases_per_million);
            if (isNaN(tmp)) {
                cntNaN++;
            } else {
                if (dataLookup[row.iso_code] === undefined) {
                    dataLookup[row.iso_code] = tmp;
                } else if (dataLookup[row.iso_code] < tmp) {
                    dataLookup[row.iso_code] = tmp;  // find the max
                }
            }
        });
        // add max_cases to original data
        mapData_geo.features.forEach(function (d) {
            d.properties.max_cases = dataLookup[d.id];
            d.properties.code = d.id;
        });

        // find the max_case among all countries
        let max_case = d3.max(covidData, d => parseFloat(d.total_cases_per_million));

        // draw tha map--------------------------------------------------------------------------------------------
        let colorScale = d3.scaleSequential(d3.interpolate('#fedbcc', '#dd2a25'))
            .domain([0, max_case])

        svg.select("#outline")
            .append('path')
            .attr('d', path(graticule.outline()))
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .style('opacity', 1.0);

        svg.select("#graticule")
            .append('path')
            .attr('d', path(graticule()))
            .attr('fill', 'none')
            .attr('stroke', '#000000')
            .style('opacity', 0.2);

        let countries = d3.select("#countries")
            .selectAll("path")
            .data(mapData_geo.features)
            .join("path")
            .attr("d", path)
            .attr('class', 'country')
            .attr('stroke', 'lightgrey')
            .attr('stroke-width', 0.8)
            .attr('fill', function (d) {
                return d.properties.max_cases > 0 ? colorScale(d.properties.max_cases) : '#ffffff';
            })
            .attr('opacity', 1.0)
            .attr('country_code', d => d.id)

        // draw the legend----------------------------------------------------------------------------------------
        let legend = d3.select('#legend')
            .append('rect')
            // .attr('x', 0)
            // .attr('y', 0)
            .attr('width', '10%')
            .attr('height', '10%')
            .attr('fill', 'url(#color-gradient)');

        d3.select('#label_1')
            .append('text')
            .attr('class', 'label')
            // .attr('id', 'label_1')
            .attr('x', '-1%')
            .attr('y', '-1%')
            .text("0")
        const f = d3.format(".2s");  // formatting with d3
        d3.select('#label_2')
            .append('text')
            .attr('class', 'label')
            // .attr('id', 'label_2')
            .attr('x', '11%')
            .attr('y', '-1%')
            .text(f(max_case))
        // you cannot add two <text> in the same <g>. i don't know why, but it is true. javascript sucks
    }

    updateSelectedCountries(e) {
        this.globalApplicationState.lineChart.updateFromMap(e)

        let country_code = "";

        // let coordinates = d3.pointer(e);  // this can get the mouse position as well

        let selected_path = d3.select(e.target);

        country_code = selected_path.attr('country_code')

        if (country_code.length !== 0) {
            // select
            if (this.globalApplicationState.selectedLocations.includes(country_code) === false) {
                this.globalApplicationState.selectedLocations.push(country_code);
                selected_path
                    .attr('class', 'country selected')
            }
            // unselect
            else {
                this.globalApplicationState.selectedLocations
                    = this.globalApplicationState.selectedLocations
                    .filter(function (ele) {
                        return ele.toString() !== country_code;
                    })
                selected_path
                    .attr('class', 'country');
            }
            // console.log(this.globalApplicationState.selectedLocations)
        }

    }

    clearCountries(e) {  // you must have the argument 'e' even if you do not need it.
        // or there will be error "reading undefined properties 'selectedLocations'", javascript sucks.

        this.globalApplicationState.lineChart.updateFromMap(e)

        this.globalApplicationState.selectedLocations = [];
        // while(this.globalApplicationState.selectedLocations.length > 0) {  // another way to clear an array
        //     this.globalApplicationState.selectedLocations.pop();  // which may be more reliable
        // }
        let all_path = d3.select("#countries")
            .selectAll("path")
            .attr('class', 'country');
        // console.log(this.globalApplicationState.selectedLocations)
    }
}
