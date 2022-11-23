
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
            .on('click', e => {
                globalObj.updateGlobalNameSelection(e)
            })

        this.checkboxes = this.labels.append('input')
            .data(this.allNames)
            .attr('type', 'checkbox')
            .attr('class', 'myCheckbox')
            .attr('id', d => d)
            .attr("checked", true)


        this.texts = this.labels.append('text')
            .data(this.allNames)
            .text(d => d)
            .attr('id', d => d)
            .style('color', d => this.colorScale(d))

    }



    updateCheckboxStatus() {
        // this.checkboxes
        //     .attr("checked", false)
        this.checkboxes
            .attr("checked", d => (globalObj.selectedNames.includes(d)))
    }




}