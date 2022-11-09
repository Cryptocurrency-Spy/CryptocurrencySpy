

class NameSelect {

    constructor() {
        this.divWidth = 900;
        this.divHeight = 200;
        this.boxWidth = 80;
        this.boxHeight = 40;
        this.margin = 10;

        this.div = d3.select("#name-select")
            .style('width', this.divWidth)
            .style('height', this.divHeight)
            .style('background-color', 'black')

        this.parsedData = globalObj.parsedData;

        this.allNames = globalObj.allNames

        this.num = this.allNames.length


        this.colorScale = globalObj.colorScale;


        // checkboxes
        this.labels = this.div.select("#checkbox_group").selectAll('label')
            .data(this.allNames)
            .join('label')
            .on('mousedown', e => this.updateNameSelection(e))

        this.checkboxes = this.labels.append('input')
            .data(this.allNames)
            .attr('type', 'checkbox')
            .attr('class', 'myCheckbox')
            .attr('id', d => d)

        this.texts = this.labels.append('text')
            .data(this.allNames)
            .text(d => d)
            .attr('id', d => d)
            .style('color', d => this.colorScale(d))

        // button
        this.clearButton = this.div.select('#clear_names')
            .on('click', e => this.clearNameSelection(e))


    }

    updateNameSelection(e) {
        let et = e.target
        console.log(et)
        // console.log(et.checked)

        let name = et.getAttribute('id')
        if (et.checked) {
            let index = globalObj.selectedNames.indexOf(name);
            if (index !== -1) {  // if found
                globalObj.selectedNames.splice(index, 1);  // delete name
            }
        } else {
            if(globalObj.selectedNames.length===this.num){
                this.clearNameSelection()
            }
            let index = globalObj.selectedNames.indexOf(name);
            if (index === -1) {  // if not found
                globalObj.selectedNames.push(name)
            }
        }

        globalObj.line_chart.updateRange(e)


        // if(d3.select("#myCheckbox").property("checked")){
        //     newData = data.filter(function(d,i){return d % 2 == 0;});
        // } else {
        //     newData = data;
        // }
    }

    clearNameSelection(e) {
        globalObj.selectedNames = []

        for (let box of this.checkboxes){
            box.checked = false;
        }

        globalObj.line_chart.updateRange(e)
    }



}