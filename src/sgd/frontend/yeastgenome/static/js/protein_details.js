var phosphodata = null;
var current_residues = "";
var current_strain = "";
var allPtmData = null;

var source_to_color = {
  PANTHER: "#3366cc",
  Pfam: "#dc3912",
  Gene3D: "#ff9900",
  SUPERFAMILY: "#109618",
  TIGRFAM: "#990099",
  PIRSF: "#0099c6",
  SMART: "#dd4477",
  PRINTS: "#66aa00",
  ProDom: "#b82e2e",
  PROSITE: "#316395",
  "-": "#994499",
  SignalP: "#4c33cc",
  HAMAP: "#33cc99"
};

$(document).ready(function () {
  $("#domain_table_analyze").hide();
  $("#alias_table_analyze").hide();
  $("#phosphorylation_table_analyze").hide();
  $("#amino_acid_table_analyze").hide();
  $("#amino_acid_table_download").hide();
  $("#atomic_table_analyze").hide();
  $("#atomic_table_download").hide();

  $.getJSON("/redirect_backend?param=locus/" + locus["id"] + "/sequence_details", function (sequence_data) {
    var protein_data = sequence_data["protein"];
    var alt_strain_protein_data = [];
    var length = 0;
    if (protein_data.length > 0) {
      var strain_selection = $("#strain_selection");
      for (var i = 0; i < protein_data.length; i++) {
        var _strain = protein_data[i]["strain"];
        if (protein_data[i]["strain"]["status"] !== "Other") {
          alt_strain_protein_data.push(protein_data[i]);
          var option = document.createElement("option");
          option.setAttribute(
            "value",
            protein_data[i]["strain"]["format_name"]
          );
          option.innerHTML = protein_data[i]["strain"]["display_name"];
          strain_selection.append(option);
          if (length == 0) {
              length = protein_data[i]["residues"].length - 1;
          }
        }
      }

      function on_change(index) {
        $("#sequence_residues").html(prep_sequence(alt_strain_protein_data[index]["residues"]));
        $("#strain_description").html(alt_strain_protein_data[index]["strain"]["description"]);
        $("#phosphorylation_strain").html(alt_strain_protein_data[index]["strain"]["display_name"]);
        $("#properties_strain").html(alt_strain_protein_data[index]["strain"]["display_name"]);
        $("#no_data_msg").html(alt_strain_protein_data[index]["strain"]["display_name"]);
        set_up_properties(alt_strain_protein_data[index]);
        current_residues = alt_strain_protein_data[index]["residues"];
        current_strain =
          alt_strain_protein_data[index]["strain"]["display_name"];
        draw_phosphodata();
      }

      strain_selection.change(function () {
        on_change(this.selectedIndex);
      });

      $("#sequence_download").click(function f() {
        download_sequence(
          current_residues,
          locus["display_name"],
          current_strain
        );
      });

      on_change(0);
    } else {
      $("#sequence_section").hide();
      $("#sequence_section_message").show();
    }

    //Get domain info
    $.getJSON("/redirect_backend?param=locus/" + locus["id"] + "/protein_domain_details", function (protein_domain_data) {

      var domain_table = create_domain_table(protein_domain_data);

      if (protein_domain_data.length > 0) {
        create_download_button(
          "domain_table_download",
          domain_table,
          locus["display_name"] + "_domains"
        );
      }

      if (protein_domain_data.length > 0) {
        // call react view from external file
        var colorScale = function (sourceName) {
          return source_to_color[sourceName];
        };
      }
      else {
        $("#domain_locations").hide();
      }
      views.protein.render(protein_domain_data, length, colorScale);

      $.getJSON("/redirect_backend?param=locus/" + locus["id"] + "/protein_domain_graph", function (protein_domain_graph_data) {
        if (protein_domain_graph_data["nodes"].length > 1) {
          var graph_style = prep_style();
          var graph = create_cytoscape_vis(
            "cy",
            layout,
            graph_style,
            protein_domain_graph_data,
            null,
            false,
            "protein"
          );
          create_cy_download_button(
            graph,
            "cy_download",
            locus["display_name"] + "_protein_domain_graph"
          );

          var download_headers = ["", "Gene", "Domain"];
          var download_data = [];
          var id_to_name = {};
          for (var i = 0; i < protein_domain_graph_data["nodes"].length; i++) {
            id_to_name[protein_domain_graph_data["nodes"][i]["data"]["id"]] = protein_domain_graph_data["nodes"][i]["data"]["name"];
          }
          for (var i = 0; i < protein_domain_graph_data["edges"].length; i++) {
            download_data.push([
              "",
              id_to_name[protein_domain_graph_data["edges"][i]["data"]["target"]],
              id_to_name[protein_domain_graph_data["edges"][i]["data"]["source"]]
            ]);
          }
          create_download_button_no_table(
            "cy_txt_download",
            download_headers,
            download_data,
            locus["display_name"] + "_domain_network"
          );
        }
        else {
          $("#shared_domains").hide();
        }
      }
      );
    }
    );
  });

  $.getJSON("/redirect_backend?param=locus/" + locus["id"] + "/posttranslational_details", function (data) {
    phosphodata = data;
    allPtmData = data;
    var phospho_table = create_phosphorylation_table(data);                                                                  
    create_download_button("phosphorylation_table_download", phospho_table, locus["display_name"] + "_phosphorylation"); 
    draw_phosphodata();
  });

  $.getJSON("/redirect_backend?param=locus/" + locus["id"] + "/ecnumber_details", function (data) {
    if (data.length > 0) {
      $("#protein_overview").append("<dt>EC Number</dt>");

      var ec_number_html = "";
      for (var i = 0; i < data.length; i++) {
        ec_number_html = ec_number_html + "<a href='" + data[i]["ecnumber"]["link"] + "'>" +
          data[i]["ecnumber"]["display_name"] + "</a>";
        if (i != data.length - 1) {
          ec_number_html = ec_number_html + ", ";
        }
      }
      $("#protein_overview").append("<dd>" + ec_number_html + "</dd>");
    }
  });

  $.getJSON("/redirect_backend?param=locus/" + locus["id"] + "/protein_experiment_details", function (data) {
    if (data.length > 0) {
      var protein_experiment_table = create_protein_experiment_table(data);
      create_download_button(
        "protein_experiment_table_download",
        protein_experiment_table,
        locus["display_name"] + "_experimental_data"
      );
    }
    else {
      $("#protein_experiment_header").remove();
      var $parent = $("#protein_experiment_table").parent();
      $parent.html("No half-life data available for " + locus["display_name"] + ".");
      return "";
    }
  }
  );



  $.getJSON("/redirect_backend?param=locus/" + locus["id"] + "/protein_abundance_details", function (data) {
    if (data.length > 0) {
      var protein_abundance_table = create_protein_abundance_table(data);
      create_download_button(
        "protein_abundance_table_download",
        protein_abundance_table,
        locus["display_name"] + "_abundance_data"
      );
    }
    else {
      $("#protein_abundance_header").remove();
      var $parent = $("#protein_abundance_table").parent();
      $parent.html("No protein abundance data available for " + locus["display_name"] + ".");
      return "";
    }
  }
  );

  var externalIDs = locus["aliases"];

  if (externalIDs.length > 0) {
    var alias_table = create_alias_table(externalIDs);
    create_download_button("alias_table_download", alias_table, locus["display_name"] + "_external_ids");
  }
  else {
    $("#alias_header").remove();
    var $parent = $("#alias_table").parent();
    $parent.html("No external identifier available for " + locus["display_name"] + ".");
    return "";
  }

});

function pad_number(number, num_digits) {
  number = "" + number;
  while (number.length < num_digits) {
    number = " " + number;
  }
  return number;
}

function prep_sequence(residues) {
  var chunks = residues
    .chunk(10)
    .join(" ")
    .chunk(66);
  var num_digits = ("" + residues.length).length;

  var new_sequence = pad_number(1, num_digits) + " " + chunks[0];
  for (var i = 1; i < chunks.length; i++) {
    new_sequence = new_sequence + "<br>" + pad_number(i * 60 + 1, num_digits) + " " + chunks[i];
  }
  return new_sequence;
}

function update_property(prop_id, prop_value) {
  if (prop_value != null && prop_value != "None") {
    $("#" + prop_id).html(prop_value);
  }
  else {
    $("#" + prop_id).html("-");
  }
}

function get_perc(top, bottom) {
  return (100.0 * top / bottom).toFixed(2);
}

function set_up_properties(data) {
  var test = Object.getOwnPropertyNames(data);
  if (Object.getOwnPropertyNames(data).length > 3) {
    var download_headers = [
      "",
      "Gene",
      "Gene Systematic Name",
      "Property",
      "Value"
    ];
    var download_data = [];
    update_property("length", data["residues"].length - 1);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Length",
      data["residues"].length - 1
    ]);
    update_property("molecular_weight", data["molecular_weight"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Molecular Weight (Da)",
      data["molecular_weight"]
    ]);
    update_property("pi", data["pi"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Isoelectric Point (pI)",
      data["pi"]
    ]);
    update_property("aliphatic_index", data["aliphatic_index"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Aliphatic Index",
      data["aliphatic_index"]
    ]);
    update_property("instability_index", data["instability_index"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Instability Index",
      data["instability_index"]
    ]);
    var formula = "-";
    if (data["carbon"] != null) {
      formula =
        "C<sub>" +
        data["carbon"] +
        "</sub>H<sub>" +
        data["hydrogen"] +
        "</sub>N<sub>" +
        data["nitrogen"] +
        "</sub>O<sub>" +
        data["oxygen"] +
        "</sub>S<sub>" +
        data["sulfur"] +
        "</sub>";
    }
    update_property("formula", formula);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Formula",
      formula
    ]);

    update_property("codon_bias", data["codon_bias"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Codon Bias",
      data["codon_bias"]
    ]);
    update_property("cai", data["cai"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Codon Adaptation Index",
      data["cai"]
    ]);
    update_property("fop_score", data["fop_score"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Frequency of Optimal Codons",
      data["fop_score"]
    ]);
    update_property("gravy_score", data["gravy_score"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Hydropathicity of Protein",
      data["gravy_score"]
    ]);
    update_property("aromaticity_score", data["aromaticity_score"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Aromaticity Score",
      data["aromaticity_score"]
    ]);
    update_property("all_cys_ext_coeff", data["all_cys_ext_coeff"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Extinction Coefficients at 280nm ALL Cys residues appear as half cystines",
      data["all_cys_ext_coeff"]
    ]);
    update_property("no_cys_ext_coeff", data["no_cys_ext_coeff"]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Extinction Coefficients at 280nm NO Cys residues appear as half cystines",
      data["no_cys_ext_coeff"]
    ]);

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[0, "asc"]];
    options["bFilter"] = false;
    options["bDestroy"] = true;
    options["sDom"] = "t";
    var total =
      data["ala"] +
      data["arg"] +
      data["asn"] +
      data["asp"] +
      data["cys"] +
      data["gln"] +
      data["glu"] +
      data["gly"] +
      data["his"] +
      data["ile"] +
      data["leu"] +
      data["lys"] +
      data["met"] +
      data["phe"] +
      data["pro"] +
      data["ser"] +
      data["thr"] +
      data["trp"] +
      data["tyr"] +
      data["val"];
    options["aaData"] = [
      ["A", data["ala"], get_perc(data["ala"], total)],
      ["R", data["arg"], get_perc(data["arg"], total)],
      ["N", data["asn"], get_perc(data["asn"], total)],
      ["D", data["asp"], get_perc(data["asp"], total)],
      ["C", data["cys"], get_perc(data["cys"], total)],
      ["Q", data["gln"], get_perc(data["gln"], total)],
      ["E", data["glu"], get_perc(data["glu"], total)],
      ["G", data["gly"], get_perc(data["gly"], total)],
      ["H", data["his"], get_perc(data["his"], total)],
      ["I", data["ile"], get_perc(data["ile"], total)],
      ["L", data["leu"], get_perc(data["leu"], total)],
      ["K", data["lys"], get_perc(data["lys"], total)],
      ["M", data["met"], get_perc(data["met"], total)],
      ["F", data["phe"], get_perc(data["phe"], total)],
      ["P", data["pro"], get_perc(data["pro"], total)],
      ["S", data["ser"], get_perc(data["ser"], total)],
      ["T", data["thr"], get_perc(data["thr"], total)],
      ["W", data["trp"], get_perc(data["trp"], total)],
      ["Y", data["tyr"], get_perc(data["tyr"], total)],
      ["V", data["val"], get_perc(data["val"], total)]
    ];

    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "A",
      data["ala"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "R",
      data["arg"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "N",
      data["asn"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "D",
      data["asp"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "C",
      data["cys"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Q",
      data["gln"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "E",
      data["glu"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "G",
      data["gly"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "H",
      data["his"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "I",
      data["ile"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "L",
      data["leu"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "K",
      data["lys"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "M",
      data["met"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "F",
      data["phe"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "P",
      data["pro"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "S",
      data["ser"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "T",
      data["thr"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "W",
      data["trp"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Y",
      data["tyr"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "V",
      data["val"]
    ]);

    modifyData(options);
    create_table("amino_acid_table", options);


    options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[0, "asc"]];
    options["bFilter"] = false;
    options["bDestroy"] = true;
    options["sDom"] = "t";

    if (data["carbon"] != null) {
      total =
        data["carbon"] +
        data["hydrogen"] +
        data["nitrogen"] +
        data["oxygen"] +
        data["sulfur"];
      options["aaData"] = [
        ["Carbon", data["carbon"], get_perc(data["carbon"], total)],
        ["Hydrogen", data["hydrogen"], get_perc(data["hydrogen"], total)],
        ["Nitrogen", data["nitrogen"], get_perc(data["nitrogen"], total)],
        ["Oxygen", data["oxygen"], get_perc(data["oxygen"], total)],
        ["Sulfur", data["sulfur"], get_perc(data["sulfur"], total)]
      ];
    } else {
      options["aaData"] = [
        ["Carbon", "-", "-"],
        ["Hydrogen", "-", "-"],
        ["Nitrogen", "-", "-"],
        ["Oxygen", "-", "-"],
        ["Sulfur", "-", "-"]
      ];
    }

    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Carbon",
      data["carbon"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Hydrogen",
      data["hydrogen"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Nitrogen",
      data["nitrogen"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Oxygen",
      data["oxygen"]
    ]);
    download_data.push([
      "",
      locus["display_name"],
      locus["format_name"],
      "Sulfur",
      data["sulfur"]
    ]);

    create_table("atomic_table", options);

    create_download_button_no_table(
      "protein_properties_download",
      download_headers,
      download_data,
      locus["display_name"] + "_protein_properties"
    );
    $("#physicochemical_props_panel").show();
    $("#no_data").hide();
  }
  else {
    $("#physicochemical_props_panel").hide();
    $("#no_data").show();
  }
}

function draw_phosphodata() {
  var data = [];
  if (phosphodata != null && phosphodata.length > 0 && current_residues != null) {
    var num_digits = ("" + current_residues.length).length;
    var residues = $("#sequence_residues");
    var old_residues = residues.html();
    var new_residues = "";
    var start = 0;

    var uniq_indexes = {};
    for (var i = 0; i < phosphodata.length; i++) {
      var _index = phosphodata[i].site_index;
      var index = relative_to_html(phosphodata[i]["site_index"] - 1, num_digits);
      if (old_residues.substring(index, index + 1) == phosphodata[i]["site_residue"]) {
        data.push(phosphodata[i]);
      }
      if (uniq_indexes[_index]) continue;
      uniq_indexes[_index] = phosphodata[i];
      if (old_residues.substring(index, index + 1) == phosphodata[i]["site_residue"]) {
        new_residues = new_residues + old_residues.substring(start, index) + "<span style='color:blue;font-weight:bolder'>" + old_residues.substring(index, index + 1) + "</span>";
        start = index + 1;
      }
    }
    new_residues = new_residues + old_residues.substring(start, old_residues.length);
    residues.html(new_residues);
    // var phospho_table = create_phosphorylation_table(data);
    // create_download_button("phosphorylation_table_download", phospho_table, locus["display_name"] + "_phosphorylation");
    $("#phosphorylation_sites_wrapper").show();
  } else {
    $("#phosphorylation_sites_wrapper").hide();
  }
}

function relative_to_html(index, num_digits) {
  var row = Math.floor(1.0 * index / 60);
  var column = index - row * 60;
  return (row * (71 + num_digits) + 1 + num_digits + column + Math.floor(1.0 * column / 10));
}

function create_phosphorylation_table(data) {
  var datatable = [];

  var sites = {};
  for (var i = 0; i < data.length; i++) {
    datatable.push(phosphorylation_data_to_table(data[i]));
    sites[data[i]["site_residue"] + data[i]["site_index"]] = true;
  }
  set_up_header("phosphorylation_table", datatable.length, "entry", "entries", Object.keys(sites).length, "site", "sites");

  set_up_phospho_sort();

  var options = {};
  options["bPaginate"] = true;
  options["aaSorting"] = [[4, "asc"]];
  options["bDestroy"] = true;
  options["aoColumns"] = [
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { sType: "phospho" },
    { bSearchable: false, bVisible: false },
    null,
    null,
    { bSearchable: false, bVisible: false },
    null
  ];
  options["aaData"] = datatable;

  options["oLanguage"] = {
    sEmptyTable: "No post-translational data for this strain."
  };

  return create_table("phosphorylation_table", options);
}

function isDataValid(options) {
  var flag = false;
  if (options.aaData) {
    if (flag == false) {
      items = options.aaData.filter(function (temp_arr) {
        if (temp_arr[1] == undefined || temp_arr[2] == 'NaN') {
          flag = true;
        }
      });
    }
    else {
      return flag;
    }
  }
  return flag;
}
function modifyData(options) {
  if (options.aaData) {
    options.aaData.forEach(function (item) {
      item.forEach(function (itm, index, item) {
        if (item[index] == undefined || item[index] == "NaN") {
          item[index] = "-";
        }
      })

    });
  }
}

function create_protein_experiment_table(data) {
  var datatable = [];
  var experiment_types = {};
  for (var i = 0; i < data.length; i++) {
    datatable.push(protein_experiment_data_to_table(data[i]));
    experiment_types[data[i]["data_type"]] = true;
  }

  set_up_header(
    "protein_experiment_table",
    datatable.length,
    "entry",
    "entries",
    Object.keys(experiment_types).length,
    "experiment",
    "experiments"
  );

  var options = {};
  options["bPaginate"] = false;
  options["aaSorting"] = [[4, "asc"]];
  options["bDestroy"] = true;
  options["aoColumns"] = [
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    null,
    null,
    null
  ];
  options["aaData"] = datatable;
  options["oLanguage"] = {
    sEmptyTable: "No protein experiment data for this protein."
  };

  return create_table("protein_experiment_table", options);
}



function create_protein_abundance_table(data) {

  var datatable = [];
  // var abundanceData = {};
  for (var i = 0; i < data.length; i++) {
    datatable.push(protein_abundance_data_to_table(data[i]));
    // abundanceData[data[i]["annotation_id"]] = true
  }

  // Object.keys(abundanceData).length,

  set_up_header(
    "protein_abundance_table",
    datatable.length,
    "entry",
    "entries",
    "abundance",
    "abundances",
  );

  var options = {};
  options["bPaginate"] = false;
  options["aaSorting"] = [[11, "asc"]];
  // options["bDestroy"] = true;
  options["aoColumns"] = [
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ];
  options["aaData"] = datatable;
  options["bPaginate"] = true;
  options["iDisplayLength"] = 5;
  options["oLanguage"] = {
    sEmptyTable: "No protein abundance data for this protein."
  };

  return create_table("protein_abundance_table", options);
}




function create_alias_table(data) {

  var datatable = [];

  var sources = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i]["protein"]) {
      datatable.push([
        data[i]["id"],
        create_link(data[i]["display_name"], data[i]["link"], true),
        data[i]["source"]["display_name"]
      ]);
      sources[data[i]["source"]["display_name"]] = true;
    }
  }

  set_up_header(
    "alias_table",
    datatable.length,
    "entry",
    "entries",
    Object.keys(sources).length,
    "source",
    "sources"
  );

  var options = {};
  options["aaSorting"] = [[2, "asc"]];
  options["aoColumns"] = [{ bSearchable: false, bVisible: false }, null, null];
  options["aaData"] = datatable;
  options["oLanguage"] = {
    sEmptyTable: "No external identifiers for " + locus["display_name"] + "."
  };

  return create_table("alias_table", options);
}

function create_domain_table(data) {

  if (data.length == 0) {
    $("#domain_header").remove();
    var $parent = $("#domain_table").parent();
    $parent.html("No domain information available for " + locus["display_name"] + ".");
    return "";
  }

  var datatable = [];

  var domains = {};
  for (var i = 0; i < data.length; i++) {
    datatable.push(domain_data_to_table(data[i]));
    domains[data[i]["domain"]["id"]] = true;
  }
  $("#domain_header").html(data.length);

  set_up_header(
    "domain_table",
    datatable.length,
    "entry",
    "entries",
    Object.keys(domains).length,
    "domain",
    "domains"
  );

  set_up_range_sort();

  var options = {};
  options["bPaginate"] = true;
  options["aaSorting"] = [[4, "asc"]];
  options["aoColumns"] = [
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { bSearchable: false, bVisible: false },
    { sType: "range" },
    null,
    null,
    null,
    null
  ];
  options["aaData"] = datatable;
  options["oLanguage"] = {
    sEmptyTable: "No known domains for " + locus["display_name"] + "."
  };

  return create_table("domain_table", options);
}



function prep_style() {
  return cytoscape
    .stylesheet()
    .selector("node")
    .css({
      content: "data(name)",
      "font-family": "helvetica",
      "font-size": 14,
      "text-outline-width": 3,
      "text-outline-color": "#888",
      "text-valign": "center",
      color: "#fff",
      width: 30,
      height: 30,
      "border-color": "#fff"
    })
    .selector("edge")
    .css({
      width: 2
    })
    .selector("node[sub_type='FOCUS']")
    .css({
      "background-color": "#fade71",
      "text-outline-color": "#fff",
      color: "#888"
    })
    .selector("node[type='DOMAIN']")
    .css({
      shape: "rectangle",
      "text-outline-color": "#fff",
      color: "#888"
    })
    .selector("node[type='DOMAIN'][source='PANTHER']")
    .css({
      "background-color": source_to_color["PANTHER"]
    })
    .selector("node[type='DOMAIN'][source='Pfam']")
    .css({
      "background-color": source_to_color["Pfam"]
    })
    .selector("node[type='DOMAIN'][source='Gene3D']")
    .css({
      "background-color": source_to_color["Gene3D"]
    })
    .selector("node[type='DOMAIN'][source='SUPERFAMILY']")
    .css({
      "background-color": source_to_color["SUPERFAMILY"]
    })
    .selector("node[type='DOMAIN'][source='TIGRFAM']")
    .css({
      "background-color": source_to_color["TIGRFAM"]
    })
    .selector("node[type='DOMAIN'][source='PIRSF']")
    .css({
      "background-color": source_to_color["PIRSF"]
    })
    .selector("node[type='DOMAIN'][source='SMART']")
    .css({
      "background-color": source_to_color["SMART"]
    })
    .selector("node[type='DOMAIN'][source='PRINTS']")
    .css({
      "background-color": source_to_color["PRINTS"]
    })
    .selector("node[type='DOMAIN'][source='ProDom']")
    .css({
      "background-color": source_to_color["ProDom"]
    })
    .selector("node[type='DOMAIN'][source='PROSITE']")
    .css({
      "background-color": source_to_color["PROSITE"]
    })
    .selector("node[type='DOMAIN'][source='-']")
    .css({
      "background-color": source_to_color["-"]
    })
    .selector("node[type='DOMAIN'][source='SignalP']")
    .css({
      "background-color": source_to_color["SignalP"]
    })
    .selector("node[type='DOMAIN'][source='HAMAP']")
    .css({
      "background-color": source_to_color["HAMAP"]
    });
}

var layout = {
  name: "arbor",
  liveUpdate: true,
  ungrabifyWhileSimulating: true,
  nodeMass: function (data) {
    if (data.sub_type == "FOCUS") {
      return 10;
    } else {
      return 1;
    }
  }
};
