//const { svg } = require("d3");

async function make_low_rank_approx (data, selected_pca, freq_sing_val_file) {

  var ret = new Array(selected_pca.length);
  for (let index = 0; index < selected_pca.length; index++) {
    ret[index] = data[selected_pca[index]]
  }
  // ret is matrix with one row for each selected pca, one col for each time point, one row for each obs]

  var time_points;
  var depths;
  var low_rank_approx;

  // get singular value for each col in ret
  const selected_sing_vals = new Array(selected_pca.length);
  var freq_sing_val_file_path = "data/" + freq_sing_val_file;
  await d3.text(freq_sing_val_file_path)
  .then(function (data) {
    return data.split("\n");
  })
  .then(function(data){
    // scale principal components to their singular values:

    // iterate through each selected principal component
    for (let selected_component = 0; selected_component < selected_pca.length; selected_component++){
      // collect all selected singular values in same list index as respective principal component
      selected_sing_vals[selected_component] = data[selected_pca[selected_component]];
      // iterate through all data points in each principal component and multiply each by the proper singular value
      for (let time_point = 0; time_point < ret[selected_component].length; time_point++){
        time_points = time_point + 1;
        for (let depth = 0; depth < ret[selected_component][time_point].length; depth++){
          ret[selected_component][time_point][depth] = parseFloat(ret[selected_component][time_point][depth]) * parseFloat(selected_sing_vals[selected_component]);
          depths = depth + 1;
        }
      }
    }

    if (selected_pca.length > 1){
      // sum principal components if more than one is selected
      // make final output array of correct size filled with zeros
      var low_rank_approx = new Array(1);
      low_rank_approx[0] = new Array(time_points);
      for (time_point = 0; time_point < time_points; time_point++){
        low_rank_approx[0][time_point] = new Array(depths).fill(0);
      }

     // iterate through all data points in each principal component and add to running sum in low_rank_approx
    for (let selected_component = 0; selected_component < selected_pca.length; selected_component++){
      for (let time_point = 0; time_point < ret[selected_component].length; time_point++){
        for (let depth = 0; depth < ret[selected_component][time_point].length; depth++){
          low_rank_approx[0][time_point][depth] = parseFloat(ret[selected_component][time_point][depth]) + parseFloat(low_rank_approx[0][time_point][depth]);
        }
      }
    }
      ret = low_rank_approx;
    }
  })

  return ret;
}

async function filter_by_component (data, selected_pca) {

  var ret = new Array(selected_pca.length);
  for (let index = 0; index < selected_pca.length; index++) {
    ret[index] = data[selected_pca[index]]
  }
  return ret
}

async function plot_heatmap_x_axis(selected_pca, heatmapsvg, xlabel) {
  var components = selected_pca.length;
  if (selected_pca.length == 0){
    components = 1;
  }
  selected_pca.sort()
  const ping_time_array = new Array(144 * components);
  for (let i = 0; i < ping_time_array.length; i++) {
    ping_time_array[i] = i;
  }

  let x = d3.scaleBand()
  .range([0, width])
  .domain(ping_time_array)
  .padding(0.01);

  var xtickValues = x
    .domain()
    .filter(function (d, i) { return !((i) % Math.floor(x.domain().length / 6)); })
    .map(d => parseInt(d));


    xfinaltickValues = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];


    heatmapsvg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickValues(xtickValues).tickFormat(function(d){
      xval_index = xtickValues.indexOf(d);
      return xfinaltickValues[xval_index];
    }));

    var title_string;
    // for (let index = 0; index < components; index++) {
    if (selected_pca.length == 0){
      pc_string = "No Principal Components Selected";
    } else {
      // get list of selected principal components for display (add 1 to deal with zero-indexing)
      var pc_list = new Array(selected_pca.length);
      for (selected_component = 0; selected_component < selected_pca.length; selected_component++){
        pc_list[selected_component] = selected_pca[selected_component] + 1;
      }
      if (xlabel === true) {
        pc_string = "Rank " + parseInt(selected_pca.length) + " approximation of data using principal components: " + pc_list;
        // title_string = "Low Rank Approximation Heatmap Using Selected Principal Components";
      } else {
        pc_string = "Approximation of data using rest principal components";
        // title_string = "Approximation Heatmap Using Unselected Principal Components";
      }
    }

    heatmapsvg.append("text")
    .attr("class", "xlabel")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + 35)
    .text(pc_string);

    heatmapsvg.append("text")      
        .attr("x", 530)
        .attr("y",  355)
        .style("text-anchor", "end")
        .text("Time")
        .attr("font-weight",500)
        .attr("font-size", 14);

    return x;



  }

async function plot_heatmap_y_axis_and_title (heatmapsvg, xlabel, selected_variance) {
  const frequency_depth_array = new Array(frequency.length * depth_levels);
    for (let i = 0; i < frequency_depth_array.length; i++) {
      frequency_depth_array[i] = i;
  }
  const y = d3.scaleBand()
  .range([0, height])
  .domain(frequency_depth_array)
  .padding(0.01);

  var ytickValues = y
  .domain()
  .filter(function (d, i) { return !((i + 1) % Math.floor(y.domain().length / 10)); });

  const depths = [4.971662,   9.943324,  14.914986,  19.886648,  24.85831 ,  29.829972,
    34.801634,  39.773296,  44.744958,  49.71662 ,  54.688282,  59.659945,
    64.631607,  69.603269,  74.574931,  79.546593,  84.518255,  89.489917,
    94.461579,  99.433241, 104.404903, 109.376565, 114.348227, 119.319889,
   124.291551, 129.263213, 134.234875, 139.206537, 144.178199, 149.149861,
   154.121523, 159.093185, 164.064847, 169.03651 , 174.008172, 178.979834,
   183.951496];

  heatmapsvg.append("g")
    .call(d3.axisLeft(y).tickValues(ytickValues).tickFormat(function (d) {
      return depths[d].toFixed(0);
    }));

  heatmapsvg.append("text")
    .attr("class", "ylabel")
    .attr("text-anchor", "start")
    .attr("y", -50)
    .attr("x", -150)
    .attr("dy", ".75em")
    .attr("font-size", 18)
    .attr("transform", "rotate(-90)")
    .text("depth (meters)");
    if (xlabel === true) {
      if (selected_variance == null) {
        title_string = "Low Rank Approximation Using Selected Principal Components (0%)";
      } else{
        title_string = "Low Rank Approximation Using Selected Principal Components (" + (selected_variance*100).toFixed(2) + "%)";
      }
      
    } else {
      if (selected_variance == null) {
        title_string = "Low Rank Approximation Using Unselected Principal Components";
      } else{
        title_string = "Low Rank Approximation Using Unselected Principal Components (" + (100 - selected_variance*100).toFixed(2) + "%)";
      }
      
    }
    //title
    heatmapsvg.append("text")
    .attr("class", "heat_map_title")
    .attr("x", (width / 2))
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")
    .style("font-size", 12)
    .attr("font-weight",600)
    .text(title_string);

  return y;
}



async function plot_column(index_pca , data, col_num, num_pca, heatmapsvg) {
  var components = num_pca;
  const ping_time_array = new Array(144 * components);
  for (let i = 0; i < ping_time_array.length; i++) {
    ping_time_array[i] = i;
  }
  let x = d3.scaleBand()
  .range([0, width])
  .domain(ping_time_array)
  .padding(0.1);

  const frequency_depth_array = new Array(frequency.length * depth_levels);
    for (let i = 0; i < frequency_depth_array.length; i++) {
      frequency_depth_array[i] = i;
  }
  let y = d3.scaleBand()
  .range([0, height])
  .domain(frequency_depth_array)
  .padding(0.01);

  heatmapsvg.selectAll()
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function (d, i) { return x(i + index_pca * ping_time) })
    .attr("y", function (d, i) { return y(col_num) })
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", function (d, i, j) { return myColor(d) })
}






/**
 * Makes a heat map from a file of principal component data of one frequency and an array of selected components
 * @param  {string} dataset The name of the datafile in the data folder
 * @param  {string} freq_sing_val_file The name of the datafile in the data folder holding the frequency's singular value data
 * @param  {array} selected_pca Array that stores selected principal components as they are selected. Begins empty.
 * @param  {svg} heatmapsvg The D3 created SVG (on a div in the html) that will contain the heatmap for this variance chart's frequency
 * @param  {bool} low_rank When true function plots a low rank approximation of the data using selected components. When false plots each principal component selected side by side.
 * @param  {bool} xlabel When true the plot shows the x label, otherwise no labels
 * @return {None}      Does not return anything, just manipulates heatmapsvg passed as parameters
 */
// days 9 - 18
async function heatmap(dataset, freq_sing_val_file, selected_pca, heatmapsvg, low_rank, xlabel, selected_variance) {
  plot_heatmap_x_axis(selected_pca, heatmapsvg, xlabel);
  plot_heatmap_y_axis_and_title(heatmapsvg, xlabel, selected_variance);

  if (selected_pca.length > 0){
  // remove scale bar before adding another one so call in clear all function works
  heatmapsvg.select(".scale_bar").remove();
  var legend = d3.legendColor()
                //.orient("horizontal")
                .ascending(true)
                .shapeWidth(8)
                .cells(7)
                .title("MVBS")
                .titleWidth(30)
                .labelFormat(",")
                .scale(myColor);
                  
  heatmapsvg.append("g")
                  .attr("class", "scale_bar")
                  .attr("transform", "translate(494,100)")
                  .call(legend);
  }

  let dataset_path = "data/" + dataset
  d3.text(dataset_path)
  .then(function (data) {
    return data.split(/[\n,]+/);
  })
  .then(function (data) {
    const three_dim_array = new Array(62);
    for (let i = 0, j = 0; i < data.length; i += p_component_size, j += 1) {
      const chunk = new Array(frequency_depth_size);
      const intermediate = data.slice(i, i + p_component_size);
      for (let k = 0, l = 0; k < intermediate.length; k += ping_time, l += 1) {
        chunk[l] = intermediate.slice(k, k + ping_time);
      }
      three_dim_array[j] = chunk;
    }
    return three_dim_array;
  })
  .then (function (data) {


    if (selected_pca.length > 0){
      if (low_rank == true){
        return make_low_rank_approx(data, selected_pca, freq_sing_val_file);
      } else if (low_rank == false) {
        return filter_by_component (data, selected_pca);
      }
    }
  })
  .then(function (data) {
    var num_pca = selected_pca.length;
    var num_different_heat_plots;
    if (low_rank == true){
      num_different_heat_plots = 1;
    } else if (low_rank == false) {
      num_different_heat_plots = num_pca;
    }

    if (num_pca > 0){
      var num_column = data[0].length;

    for (let i = 0; i< num_different_heat_plots; i++) {
      for (let j = 0; j < num_column; j++) {
        plot_column(i ,data[i][j], j, num_different_heat_plots, heatmapsvg);
      }
    }

  }})

}


async function ds_rpca_plot(dataset, svg_div, xlabel) {
  plot_multi_date_x_axis(svg_div);
  plot_multi_date_y_axis (svg_div);

  var legend = d3.legendColor()
  //.orient("horizontal")
  .ascending(true)
  .shapeWidth(8)
  .cells(5)
  .title("MVBS")
  .titleWidth(30)
  .labelFormat(",")
  .labelOffset(5)
  .scale(myColor_date_plot);
    
  svg_div.append("g")
    .attr("class", "top_scale_bar")
    .attr("transform", "translate(1091,10)")
    .call(legend);

  // put loading label while data are loading
  
  const loading_message = svg_div.append('text')
  .attr('id', 'ds_loading_message')
  .attr('x', 100)
  .attr('y', 80)
  .attr('fill', '#ccc')
  .attr('font-family', 'Helvetica Neue, Arial')
  .attr('font-weight', 500)
  .attr('font-size', 60)
  .text("Loading...");
  

  let dataset_path = "data/" + dataset
  d3.text(dataset_path)
  .then(function (data) {
    return data.split(/[\n,]+/);
  }).
  then(function (data) {
    var matrix = [];
    for (let i = 0, k = -1; i < data.length; i++) {
      if (i % 8928 === 0) {
          k++;
          matrix[k] = [];
      }
      matrix[k].push(data[i]);
  }
    return matrix
  }).then(function(data) {
    svg_div.append("g")
    var ping_time_array = new Array(date_ping_size);
    for (let i = 0; i < ping_time_array.length; i++) {
      ping_time_array[i] = i / 144;
    }
    const frequency_depth_array = new Array(frequency.length * depth_levels);
    for (let i = 0; i < frequency_depth_array.length; i++) {
      frequency_depth_array[i] = i;
  }
    // let length = 1/144 * 62;
    let x = d3.scaleBand()
    // .range([0, width + 600])
    .range([0, width + 600])
    .domain(ping_time_array)
    .padding(0.01);

    let y = d3.scaleBand()
    .range([0, -200 + height])
    .domain(frequency_depth_array)
    // .padding(0.01);

    let min = getMin(data)
    let max = getMax(data)
    for (let i = 0; i <data.length; i++) {
      plot_ds_rpca(data[i],i, svg_div, x, y, min, max);
      }
    //remove loading label from heat plot
    d3.select('#ds_loading_message').remove();
    // remove loading label from variance chart
    //d3.select('#var_loading_message').remove();
  });

}

async function plot_multi_date_x_axis(svg_div) {
  var ping_time_array = new Array(date_ping_size);
  for (let i = 0; i < ping_time_array.length; i++) {
    ping_time_array[i] = i / 144;
  }


    let x = d3.scaleBand()
    .range([0, 600 + width])
    .domain(ping_time_array)
    .padding(0.01);

    var xtickValues = x
    .domain()
    .filter(function (d, i) { return !((i) % Math.floor(x.domain().length / 62)); })
    .map(d => parseInt(d));

    svg_div.append("g")
    .attr("transform", `translate(0, ${-200+height})`)
    .call(d3.axisBottom(x).tickValues(xtickValues));

    svg_div.append("text")
    .attr("class", "xlabel")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 165)
    .text("Day of Observation");

    svg_div.append("text")
    .attr("x", (width / 2 + 250))
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")
    .style("font-size", 15)
    .attr("font-weight",700)
    .text("Full Noise-Reduced Dataset");

}

async function plot_multi_date_y_axis(svg_div) {
  const frequency_depth_array = new Array(frequency.length * depth_levels);
    for (let i = 0; i < frequency_depth_array.length; i++) {
      frequency_depth_array[i] = i;
  }
  const y = d3.scaleBand()
  .range([0, -200 + height])
  .domain(frequency_depth_array)
  .padding(0.01);

  var ytickValues = y
  .domain()
  .filter(function (d, i) { return !((i + 1) % Math.floor(y.domain().length / 10)); });

  const depths = [4.971662,   9.943324,  14.914986,  19.886648,  24.85831 ,  29.829972,
    34.801634,  39.773296,  44.744958,  49.71662 ,  54.688282,  59.659945,
    64.631607,  69.603269,  74.574931,  79.546593,  84.518255,  89.489917,
    94.461579,  99.433241, 104.404903, 109.376565, 114.348227, 119.319889,
   124.291551, 129.263213, 134.234875, 139.206537, 144.178199, 149.149861,
   154.121523, 159.093185, 164.064847, 169.03651 , 174.008172, 178.979834,
   183.951496];

   svg_div.append("g")
    .call(d3.axisLeft(y).tickValues(ytickValues).tickFormat(function (d) {
      return depths[d].toFixed(0);
    }));

  svg_div.append("text")
    .attr("class", "ylabel")
    .attr("text-anchor", "start")
    .attr("y", -50)
    .attr("x", -150)
    .attr("dy", ".75em")
    .attr("font-size", 20)
    .attr("transform", "rotate(-90)")
    .text("depth (meters)");

}

async function plot_ds_rpca(data, row_num, svg_div, x, y, min, max) {
  svg_div.selectAll()
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function (d, i) { return x(i / 144) })
    .attr("y", function (d, i) { return y(row_num) })
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    // .style("fill", function (d, i, j) { return d3.interpolateMagma(Math.max(0, Math.min(1, (d-min) / (max-min)))) })
    .style("fill", function (d, i, j) { return myColor_date_plot(d)})

}

function getMax(a){
  return Math.max(...a.map(e => Array.isArray(e) ? getMax(e) : e));
}

function getMin(a){
  return Math.min(...a.map(e => Array.isArray(e) ? getMin(e) : e));
}