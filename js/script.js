
const globalObj = {
    parsedData: null,
    colorScale: null,
    groupedData: null,
    groupedTimeData: null,
    selectedNames: [],  // a list of selected currency names
    selectedTime: [],   // a list of selected time
    line_chart: null,
    grid_brush: null,
    name_select: null,
    tree_map: null,
};

pricesFile = d3.csv('./data/combined_prices.csv');
tradFile = d3.csv('./data/crypto_tradinds.csv');

Promise.all([pricesFile, tradFile]).then( data =>
    {
        //// right split view
        let pricesData = data[0];

        globalObj.parsedData = pricesData.map(d => ({
            name: d.Currency_Name,
            date: d.Date,
            month: d3.timeFormat("%Y/%m")(d3.timeParse("%Y/%m/%d")(d.Date)),
            price: d.Price,
            change: d.Change
        }));

        // group by name
        globalObj.groupedData = d3.group(globalObj.parsedData, d => d.name);
        globalObj.allNames = Array.from(globalObj.groupedData.keys())
        globalObj.selectedNames = globalObj.allNames
        let num = globalObj.allNames.length
        let color50 = []
        for(let i in [...Array(50).keys()]){
            color50.push(d3.interpolateRainbow(i/num))
        }
        globalObj.colorScale = d3.scaleOrdinal()
            .domain(globalObj.allNames)
            .range(color50)
            // .range(d3.schemeCategory10)
        let a_color = globalObj.colorScale('Bitcoin');
        let b_color = globalObj.colorScale('Aave');
        // more color schemes:
        // https://github.com/d3/d3-scale-chromatic

        // group by time
        globalObj.groupedTimeData = d3.group(globalObj.parsedData, d => d.month);
        globalObj.allTime = Array.from(globalObj.groupedTimeData.keys())


        globalObj.grid_brush = new GridBrush();
        globalObj.name_select = new NameSelect();
        globalObj.line_chart = new LineChart();


        //// left split view
        let tradData = data[1];

        globalObj.parsedData = tradData.map(d => ({
            name: d.crypto_name,
            ticker: d.ticker,
            date: d.trade_date,
            month: d3.timeFormat("%Y/%m")(d3.timeParse("%Y/%m/%d")(d.trade_date)),
            volume: d.volume,
            price: d.price_usd,
            cap: d.market_cap,
            cap_change: d.capitalization_change_1_day,
            price_change: d.USD_price_change_1_day,
            platform: d.platform_name,
        }));

        // globalObj.tree_map = new TreeMap();


    });


