
$(document).ready(function() {
  	$.getJSON(locus_graph_link, function(data) {
  		var graph = create_cytoscape_vis("cy", layout, graph_style, data);
        $('#go_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['go'] = "node, edge";
            } else {
                graph.filters['go'] = "node, edge[type != 'GO']";
            }
            graph.applyFilters();
        });
        $('#phenotype_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['phenotype'] = "node, edge";
            } else {
                graph.filters['phenotype'] = "node, edge[type != 'PHENOTYPE']";
            }
            graph.applyFilters();
        });
        $('#domain_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['domain'] = "node, edge";
            } else {
                graph.filters['domain'] = "node, edge[type != 'DOMAIN']";
            }
            graph.applyFilters();
        });
        $('#physical_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['physical'] = "node, edge";
            } else {
                graph.filters['physical'] = "node, edge[type != 'PHYSINTERACTION']";
            }
            graph.applyFilters();
        });
        $('#genetic_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['genetic'] = "node, edge";
            } else {
                graph.filters['genetic'] = "node, edge[type != 'GENINTERACTION']";
            }
            graph.applyFilters();
        });
        var top_list = $("#top_interactors");
        for(var i=0; i < data['top_bioconcepts'].length; i++) {
            var bioconcept = data['top_bioconcepts'][i];
            var child = document.createElement('li');
            var link = document.createElement('a');
            link.innerHTML = bioconcept['display_name'];
            link.href = bioconcept['link'];
            var bioconcept_id = bioconcept['id'];
            link.onmouseover = function() {graph.style().selector("node[BIOCONCEPT" + bioconcept_id + "]").css('background-color', 'blue')};
            child.appendChild(link);
            top_list.append(child);
        }
	});

	//Hack because footer overlaps - need to fix this.
    add_footer_space("network");
});

var graph_style = cytoscape.stylesheet()
	.selector('node')
	.css({
		'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 14,
		'text-outline-width': 3,
		'text-outline-color': '#888',
		'text-valign': 'center',
		'color': '#fff',
		'width': 30,
		'height': 30,
		'border-color': '#fff'
	})
	.selector('edge')
	.css({
		'width': 'data(count)',
        'opacity':.6
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
    .selector("edge[type='GO']")
	.css({
		'line-color': "#4daf4a"
	})
    .selector("edge[type='PHENOTYPE']")
	.css({
		'line-color': "#984ea3"
    })
    .selector("edge[type='DOMAIN']")
	.css({
        'line-color': "#377eb8"
    })
    .selector("edge[type='PHYSINTERACTION']")
	.css({
        'line-color': "#ff7f00"
    })
    .selector("edge[type='GENINTERACTION']")
	.css({
        'line-color': "#fb9a99"
    })
    .selector("edge[type='REGULATION']")
	.css({
        'line-color': "#a65628"
    });

var layout = {
	"name": "arbor",
	"liveUpdate": true,
	"ungrabifyWhileSimulating": true,
	"nodeMass":function(data) {
		if(data.sub_type == 'FOCUS') {
			return 10;
		}
		else {
			return 1;
		}
	}
};
