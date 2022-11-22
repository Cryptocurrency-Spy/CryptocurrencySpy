

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

        this.name_num = this.allNames.length


        this.colorScale = globalObj.colorScale;


        // checkboxes
        this.labels = this.div.select("#checkbox_group").selectAll('label')
            .data(this.allNames)
            .join('label')
            .on('click', e => this.updateNameSelection(e))

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
        // console.log(et)
        // console.log(et.checked)

        this.updateName(et)
    }

    updateName(et) {
        let name = et.getAttribute('id')

        if (!et.checked) {
            let index = globalObj.selectedNames.indexOf(name);
            if (index !== -1) {  // if found
                globalObj.selectedNames.splice(index, 1);  // delete name
            }
        } else {
            if(globalObj.selectedNames.length===this.name_num){
                this.clearNameSelection()
            }
            let index = globalObj.selectedNames.indexOf(name);
            if (index === -1) {  // if not found
                globalObj.selectedNames.push(name)
            }
        }
        console.log(globalObj.selectedNames)
        globalObj.line_chart.updateRange()
    }

    clearNameSelection() {
        globalObj.selectedNames = []

        for (let box of this.checkboxes){
            box.checked = false;
        }

        for (let rect of globalObj.treemap.rectangles){
            // rect.attr('checked', false)
            rect.checked = false
        }
    }



}