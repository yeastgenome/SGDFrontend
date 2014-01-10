
function create_cytoscape_vis(div_id, layout, style, data, f) {
	var height = .5*$(window).height();
	var width = $('#' + div_id).width();
	document.getElementById(div_id).style.height = height + 'px';
	$(loadCy = function(){
		options = {
			showOverlay: false,
			layout: layout,
		    minZoom: 0.5,
		    maxZoom: 2,
		    style: style,

		    elements: {
		     	nodes: data['nodes'],
		     	edges: data['edges'],
		    },

		    ready: function(){
		      	cy = this;
		      	cy.zoomingEnabled(false);
		      	if(f != null) {
		      		f();
		      	}
		      	cy.on('tap', 'node', function(evt){
  					var node = evt.cyTarget;
  					window.location.href = node.data().link;
				});
				cy.on('layoutstop', function(evt){
					$('#cy_recenter').removeAttr('disabled');
				});
				cy.on('tap', function (evt) {
					this.zoomingEnabled(true);
				});
				cy.on('mouseout', function(evt) {
					this.zoomingEnabled(false);
				});
		    },
		  };

		$('#' + div_id).cytoscape(options);
	});
	var cytoscape_div = document.getElementById(div_id);
	var recenter_button = document.createElement('a');
	recenter_button.id = "cy_recenter";
	recenter_button.className = "small button secondary";
	recenter_button.innerHTML = "Reset";
	recenter_button.onclick = function() {
		var old_zoom_value = cy.zoomingEnabled();
		cy.zoomingEnabled(true);
		cy.reset();
		cy.layout().run();
		cy.zoomingEnabled(old_zoom_value);
	};
	cytoscape_div.parentNode.insertBefore(recenter_button, cytoscape_div);
	recenter_button.setAttribute('disabled', 'disabled');
	return cy;
}

function setup_slider(div_id, min, max, current, slide_f) {
	if(max==min) {
		var slider = $("#" + div_id).noUiSlider({
			range: [min, min+1]
			,start: current
			,step: 1
			,handles: 1
			,connect: "lower"
			,slide: slide_f
		});
		slider.noUiSlider('disabled', true);
		var spacing =  100;
	    i = min-1
	    var value = i+1;
	    if(value >= 10) {
	    	var left = ((spacing * (i-min+1))-1)
	       	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
	    }
	    else {
	    	var left = ((spacing * (i-min+1))-.5)
			$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
		}
	}
	else {
		var slider = $("#" + div_id).noUiSlider({
			range: [min, max]
			,start: current
			,step: 1
			,handles: 1
			,connect: "lower"
			,slide: slide_f
		});

		var spacing =  100 / (max - min);
	    for (var i = min-1; i < max ; i=i+1) {
	    	var value = i+1;
	    	if(value >= 10) {
	    		var left = ((spacing * (i-min+1))-1)
	        	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
	    	}
	    	else {
	    		var left = ((spacing * (i-min+1))-.5)
				$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
	    	}
		}
	}
}

function create_slider(slider_id, graph) {
    var slider = document.getElementById(slider_id);
    var max_to_slider = {};
    var current_slider = null;
    var update_new_max = function(smax) {
        if(current_slider != null) {
            current_slider.style.display = 'none';
        }
        if(smax in max_to_slider) {
            current_slider = max_to_slider[smax];
        }
        else {
            var new_slider = document.createElement('div');
            new_slider.class = 'noUiSlider';
            new_slider.style.width = '100%';
            new_slider.id = 'slider' + smax;
            slider.appendChild(new_slider);
            max_to_slider[smax] = new_slider;
            current_slider = new_slider;
            setup_slider();
        }
        current_slider.style.display = 'block';
    };

			<div id='all_slider' class='noUiSlider' style="width:100%"></div>
			<div id='targets_slider' class='noUiSlider' style="width:100%"></div>
			<div id='regulators_slider' class='noUiSlider' style="width:100%"></div>

    var li = document.createElement('li');
		li.id = references[i]['id']

		var a = document.createElement('a');
		var linkText = document.createTextNode(reference['display_name']);
		a.appendChild(linkText);
		a.href = reference['link'];
		li.appendChild(a);
}