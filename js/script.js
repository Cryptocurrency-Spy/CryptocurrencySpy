
const globalObj = {
    parsedData: null,
    parsedTransData: null,
    colorScale: null,
    groupedData: null,
    groupedTimeData: null,
    selectedNames: [],  // a list of selected currency names
    selectedTime: [],   // a list of selected time
    line_chart: null,
    grid_brush: null,
    name_select: null,
    treemap: null,
    network: null,
};

pricesFile = d3.csv('./data/consolidated_coin_data.csv');
transFile = d3.csv('./data/small_sample.csv');

Promise.all([pricesFile, transFile]).then(data =>
    {
        let pricesData = data[0];

        globalObj.parsedData = pricesData.map(d => ({
            name: d["Currency"],
            date: d3.timeFormat("%Y/%m/%d")(d3.timeParse("%b %d, %Y")(d["Date"])),// %b: abbreviated month name
            month: d3.timeFormat("%Y/%m")(d3.timeParse("%b %d, %Y")(d["Date"])),
            price: d["Close"],
            high: d["High"],
            low: d["Low"],
            vol: d["Volume"],
            cap: d["Market Cap"].replaceAll(',', '')
        }));

        // group by name
        globalObj.groupedData = d3.group(globalObj.parsedData, d => d.name);
        globalObj.allNames = Array.from(globalObj.groupedData.keys())
        globalObj.selectedNames = globalObj.allNames
        let num = globalObj.allNames.length

        globalObj.colorScale = d3.scaleOrdinal()
            .domain(globalObj.allNames)
            .range(d3.schemeCategory10)
        let a_color = globalObj.colorScale('Bitcoin');

        // group by time
        globalObj.groupedTimeData = d3.group(globalObj.parsedData, d => d.month);
        globalObj.allTime = Array.from(globalObj.groupedTimeData.keys())

        globalObj.grid_brush = new GridBrush();
        globalObj.line_chart = new LineChart();
        globalObj.treemap = new Treemap();
        globalObj.name_select = new NameSelect();

        let transData = data[1];
        let parse = d3.timeParse("%Q");
        globalObj.parsedTransData = transData.map(d => ({
            // timestamp,input_key,output_key,satoshis
            time: parse(d["timestamp"]),
            source: d["input_key"],
            target: d["output_key"],
            value: d["satoshis"] / 1e8,
        }));
        globalObj.network = new Network();


    })
    .catch(error => console.error(error));


