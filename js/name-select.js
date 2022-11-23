
class NameSelect {

    constructor() {
        this.divWidth = 900;
        this.divHeight = 200;

        this.div = d3.select("#name-select")
            .style('width', this.divWidth)
            .style('height', this.divHeight)
            // .style('background-color', 'black')

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

    }

    updateNameSelection(e) {
        let et = e.target
        // console.log(et)
        // console.log(et.checked)

        let name = et.getAttribute('id')
        let rect = globalObj.treemap.cell.select(`#${name}`)
            .attr('aaa', d => (d.selected = !d.selected))
            .style("stroke", d => d.selected? "black": "none")

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
                globalObj.selectedNames = []
            }
            let index = globalObj.selectedNames.indexOf(name);
            if (index === -1) {  // if not found
                globalObj.selectedNames.push(name)
            }
        }
        // console.log(globalObj.selectedNames)
        globalObj.line_chart.updateRange()
    }

    clearNameSelection() {
        // for (let box of this.checkboxes){
        //     box.checked = false;
        // }
        // for (let rect of globalObj.treemap.rectangles){
        //     rect.checked = false
        // }
    }



}