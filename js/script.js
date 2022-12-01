
const globalObj = {
    parsedData: null,
    parsedTransData: null,
    colorScale: null,
    colorScaleFade: null,
    groupedData: null,
    groupedTimeData: null,
    selectedNames: [],  // a list of selected currency names
    selectedTime: [],   // a list of selected time
    line_chart: null,
    grid_brush: null,
    name_select: null,
    treemap: null,
    network: null,
    updateGlobalNameSelection(e) {
        if (e.type !== "end") {  // eliminate the call from grid-brush

            // both name-select and treemap call this
            let et = e.target
            let name = et.getAttribute('id')

            let index = globalObj.selectedNames.indexOf(name);
            if (index !== -1) {  // if found
                globalObj.selectedNames.splice(index, 1);  // delete name
            }
            else {
                if (globalObj.selectedNames.length === this.name_num) {
                    globalObj.selectedNames = []
                }
                globalObj.selectedNames.push(name)
            }
        }

        // console.log(globalObj.selectedNames)

        globalObj.line_chart.update()
        globalObj.name_select.updateCheckboxStatus()
        globalObj.treemap.updateTreeRectStatus()
    }
};

pricesFile = d3.csv('./data/consolidated_coin_data.csv');
transFile = d3.csv('./data/chunk0.csv');
d3.select("#dataset").on("change", changeData)
d3.select("#value").on("change", change_filter)
d3.select("#network_switch").on("change", change_switch)
d3.select("#tip1")
    .style("left", "100px")
    .style("top", "1000px")
d3.select("#menu-forward")
    .on("click", show_second)
d3.select("#menu-back")
    .on("click", show_first)
d3.select("#a1")
    .on("click", show_first)
d3.select("#a2")
    .on("click", show_second)
// d3.select("#network-div")
//     .classed("invisible","true")
function show_first() {
    d3.select("#network-div")
        .classed("invisible", true)
    d3.select(".view1")
        .classed("invisible", false)
    d3.select(".view2")
        .classed("invisible", false)
    d3.select("#a1")
        .classed("active", true)
    d3.select("#a2")
        .classed("active", false)
}
function show_second() {
    d3.select("#network-div")
        .classed("invisible", false)
    d3.select(".view1")
        .classed("invisible", true)
    d3.select(".view2")
        .classed("invisible", true)
    d3.select("#a1")
        .classed("active", false)
    d3.select("#a2")
        .classed("active", true)

}
Promise.all([pricesFile, transFile]).then(data => {
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

    function blendColors(colorA, colorB, amount) {
        const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
        const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
        const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
        const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
        const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }
    let fadeColors = []
    for (let color of d3.schemeCategory10) {
        fadeColors.push(blendColors(color, '#ffffff', 0.5))
    }
    globalObj.colorScaleFade = d3.scaleOrdinal()
        .domain(globalObj.allNames)
        .range(fadeColors)

    // group by time
    globalObj.groupedTimeData = d3.group(globalObj.parsedData, d => d.month);
    globalObj.allTime = Array.from(globalObj.groupedTimeData.keys())

    globalObj.grid_brush = new GridBrush();
    globalObj.line_chart = new LineChart();
    globalObj.treemap = new Treemap();
    globalObj.name_select = new NameSelect();

    globalObj.name_select.updateCheckboxStatus()
    globalObj.treemap.updateTreeRectStatus()

    let transData = data[1];
    let parse = d3.timeParse("%Q");
    let i = 0
    globalObj.parsedTransData = transData.map(d => ({
        // timestamp,input_key,output_key,satoshis
        time: parse(d["timestamp"]),
        source: d["input_key"],
        target: d["output_key"],
        value: d["satoshis"] / 1e8,
        id: ++i
    }));
    globalObj.network = new Network();


})
    .catch(error => console.error(error));
function changeData() {
    //  Load the file indicated by the select menu
    const dataFile = d3.select('#dataset').property('value');

    d3.csv(`data/${dataFile}.csv`)
        .then(dataOutput => {

            let parse = d3.timeParse("%Q");
            const dataResult = dataOutput.map((d) => ({
                time: parse(d["timestamp"]),
                source: d["input_key"],
                target: d["output_key"],
                value: d["satoshis"] / 1e8,
            }));
            globalObj.parsedTransData = dataResult
            globalObj.network.draw(dataResult)
        }).catch(e => {
            console.log(e);
            alert('Error!');
        });
}
show_second()
function change_filter() {
    console.log("calling back")
    let copy = JSON.parse(JSON.stringify(globalObj.parsedTransData))
    globalObj.network.draw(copy)
}
function change_switch() {
    let checked = d3.select("#network_switch").property("checked");
    console.log(checked)
    if (checked) {
        let copy = JSON.parse(JSON.stringify(globalObj.parsedTransData))
        globalObj.network.draw(copy)
    }
    else {
        radial(globalObj.parsedTransData.map(d => d))
    }
}

{
    let story = [
        {
            pid: "#network-div",
            caption: "In May 2010, California student Jeremy Sturdivant, then 19, noticed a bizarre request on a cryptocurrency internet forum: He could receive 10,000 bitcoins, at the time reportedly valued at $41, in exchange for the delivery of two large pizzas to Florida resident Laszlo Hanyecz.",
            left: 500,
            top: 500,
            step: 1,
            direction: "right"
        },
        {
            pid: "#network-div",
            caption: "         Sturdivant filled the order, sending him two large pizzas from Papa John's — atransaction that would become the first physical purchase made with bitcoin in history, marked by the annual Bitcoin Pizza Day on May 22.",
            left: 550,
            top: 500,
            step: 2,
            direction: "right"

        },
        {
            pid: "#network-div",
            caption: "But Sturdivant didn't save the bitcoins for the future; instead, he spent them all on travel. Today, that lowly 10,000 bitcoin haul would be worth a pie-in-the-sky $365 million.",
            left: 600,
            top: 500,
            step: 3,
            direction: "right"
        }
    ]
    let tips = d3.select(story[0].pid)
        .selectAll("div")
        .data(story)
        .enter().insert("div")
        // .join("div")
        .classed("invisible", d => d.step != 1)
        .classed("tooltip2", true)
        .attr("id", d => "tips" + d.step)
        .style("left", d => d.left + "px")
        .style("top", d => d.top + "px")
        .html(d => `
        <div class="popover popover-right">
        <button class="btn btn-primary s-circle"><i class="icon icon-search"></i></button>
            <div class="popover-container">
                <div class="card">
                    <div class="card-header">
                        
                    </div>
                    <div class="card-body">${d.caption}
                    </div>
                    <div class="card-footer" id="footer${d.step}">

                    </div>
                </div>
            </div>
        </div>
    `);
    let _steps = tips.select("div.card-footer")
        .append("ul")
        .classed("step", true)
        .selectAll("li")
        .data(d => story.map(s => d.step))
        .join("li")
    function gen(i) {
        return () => { 
            d3.selectAll(".tooltip2")
                .classed("invisible", true)
            d3.select("#tips" + i)
                .classed("invisible", false)
                // .select("button")
                // .node()
                // .click()
            console.log("callback", i) 
        };
    }
    let step_callbacks = story.map(d => gen(d.step))
    _steps.classed("step-item", true)
        .classed("active", (d, i) => d == i + 1)
        .html((d, i) => `<a href="#${i + 1}" class="tooltip" data-tooltip="Step ${i + 1}" id="_${d}_${i + 1}">Step ${i + 1}</a>`)
    for (let i = 0; i < story.length; i++)
        for (let j = 0; j < story.length; j++) {
            d3.select(`#_${i + 1}_${j + 1}`)
                .on("click", step_callbacks[j])
        }

}
