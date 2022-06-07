async function get_pc_data(pc, freq){

    var pca_file;
    var pc_data;
    if (freq == 38){
        pca_file = "data/hz38_W_PCA_data.csv";
    } else if (freq == 120){
        pca_file = "data/hz120_W_PCA_data.csv";
    } else if (freq == 200){
        pca_file = "data/hz200_W_PCA_data.csv";
    }

    parsed_data = await access_csv(pca_file);

    pc_data = parsed_data[pc]
    //console.log(pc_data)
    return pc_data;
}

async function access_csv(pca_file){
    var data;
    data = await d3.text(pca_file);
    parsed_data = await d3.csvParseRows(data);
    return parsed_data;
}