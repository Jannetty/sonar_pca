/**
 * Makes a variance chart from a file of variance data for principal components of one frequency
 * @param  {string} variance_datafile_name The name of the variance datafile in the data folder
 * @param  {string} dataset The name of the principal component datafile in the data folder
 * @param  {string} freq_sing_val_file The name of the datafile in the data folder holding the frequency's singular value data
 * @param  {array} selected_pca The array that will store selected principal components as they are selected. Begins empty.
 * @param  {svg} varchart The D3 created SVG (on a div in the html) that will contain the variance chart.
 * @param  {svg} heatmapsvg The D3 created SVG (on a div in the html) that will contain the heatmap for this variance chart's frequency
 * @param  {svg} heatmapsvg2 The D3 created SVG (on a div in the html) that will contain the heatmap excluded selected pca low-rank approximation
 * @param  {bool} lowrank Whether the heatmap this chart is tied to represents a low rank approx of data (if True) or multiple principal components side by side (if False)
 * @param  {array} whole_pca The array that will store all pca elements
 * @return {None}      Does not return anything, just manipulates svgs passed as parameters
 */
async function make_variance_chart(variance_datafile_name, dataset, freq_sing_val_file, selected_pca, varchart, heatmapsvg, heatmapsvg2, lowrank, whole_pca){

    // put loading label while data are loading
    /*
      const loading_message = varchart.append('text')
      .attr('id', 'var_loading_message')
      .attr('x', 100)
      .attr('y', 200)
      .attr('fill', '#ccc')
      .attr('font-family', 'Helvetica Neue, Arial')
      .attr('font-weight', 500)
      .attr('font-size', 60)
      .text("Loading...");
      */

      // Y label
      varchart.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "start")
      .attr("y", -50)
      .attr("x", -150)
      .attr("dy", ".75em")
      .attr("font-size", 15)
      .attr("transform", "rotate(-90)")
      .text("% Variance Explained");

      // X label
    varchart.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 40)
        .attr("font-size", 15)
        .text("Component Number");

    // title
    varchart.append("text")
      .attr("x", (width / 2))
      .attr("y", 0 - (margin.top / 2))
      .attr("text-anchor", "middle")
      .style("font-size", 15)
      .attr("font-weight",700)
      .text("% Explained Variance Per Component");

    // Adding the second plot: explained variance
    d3.csv("data/"+ variance_datafile_name)
    .then(function (data) {
      data.forEach(function(d) {
      d.num = parseInt(d.num);
      d.variance = parseFloat(d.variance)});

      // Set x and y axis
      var	var_x = d3.scaleLinear().domain([0, d3.max(data, function(d) { return d.num; })]).range([0, width]);
      var	var_y = d3.scaleLinear().domain([0, d3.max(data, function(d) { return d.variance; })]).range([height, 0]);

      varchart.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(var_x));

      varchart.append("g")
      .call(d3.axisLeft(var_y));

      var total_variance_captured = 0;

     // Add dots
      varchart.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
          .attr("cx", function (d) { return var_x(d.num); } )
          .attr("cy", function (d) { return var_y(d.variance); } )
          .attr("r", 3.5)
          .style("fill", "#69b3a2")
        .on("mouseover", function(d,i) {
                d3.select(this).transition()
               .duration('10')
               .attr("r", 5)
        })
        .on('mouseout', function() {
               d3.select(this).transition()
               .duration('100')
               .attr("r", 3.5)
        })
        .on("click", function(d, i)
        {
          // get component number (stored in 0 indexed matrix so subtract 1)
          component = i.num - 1;


          // get variance
          component_variance = i.variance.toFixed(4);

          // get component data
          //pc_data = get_pc_data(component, 120);
          curr_color = d3.select(this).style("fill");
          if (document.querySelectorAll(".selected").length == 0){
            total_variance_captured = 0
            selected_pca = []
          }
          if (document.querySelectorAll(".selected").length == 62){
            total_variance_captured = 1
            const range = (start, end, length = end - start + 1) =>
            Array.from({ length }, (_, i) => start + i)
            selected_pca = range(0, 61);
          }
          if (curr_color == "rgb(105, 179, 162)"){ // if point is being highlighted
            d3.select(this).style("fill", "rgb(254, 211, 72)");
            d3.select(this).attr("class","selected");
            total_variance_captured = parseFloat(total_variance_captured) + parseFloat(component_variance);
            selected_pca.push(component);
          } else if (curr_color == "rgb(254, 211, 72)"){ // if point is being de-selected
            d3.select(this).style("fill", "rgb(105, 179, 162)");
            d3.select(this).attr("class","");
            total_variance_captured = parseFloat(total_variance_captured) - parseFloat(component_variance);
            var index = selected_pca.indexOf(component);
            selected_pca.splice(index, 1);
          }

          // to make sure -0 never happens
          total_variance_captured = Math.abs(total_variance_captured);

          //clear heatmap
          d3.select(heatmapsvg.node())
            .selectAll("text")
            .remove();
          d3.select(heatmapsvg.node())
            .selectAll("rect")
            .remove();
          d3.select(heatmapsvg2.node())
          .selectAll("text")
          .remove();
          d3.select(heatmapsvg2.node())
            .selectAll("rect")
            .remove();
          // change heatmap
          if (selected_pca.length > 0) {
            rest_pca = whole_pca.filter( function( el ) {
              return selected_pca.indexOf( el ) < 0;
            });
          } else {
            rest_pca = [];
          }


          heatmap(dataset, freq_sing_val_file, selected_pca, heatmapsvg, lowrank, true, total_variance_captured);
          heatmap(dataset, freq_sing_val_file, rest_pca, heatmapsvg2, lowrank, false, total_variance_captured);

          // change variance explained label
          if (total_variance_captured == 0){
            variance_explained_label.text("0%");
          } else {
          variance_explained_label.text((total_variance_captured*100).toFixed(2) + "%");
          }
        })

      // total variance explained label
      const variance_explained_label = varchart.append('text')
        .attr('class', 'year')
        .attr('x', 200)
        .attr('y', 100)
        .attr('fill', '#ccc')
        .attr('font-family', 'Helvetica Neue, Arial')
        .attr('font-weight', 500)
        .attr('font-size', 60)
        .text(total_variance_captured + "%");
        });


}