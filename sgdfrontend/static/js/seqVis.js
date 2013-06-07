
function setup_stage(container_name) {
	var stage = new Kinetic.Stage({
		container: container_name,
		draggable: true,
		width:100,
		height:50
	});	
	
	// add cursor styling
	container = $('#' + container_name)
	container.on('mouseover', function() {
		document.body.style.cursor = 'pointer';
	});
	container.on('mouseout', function() {
		document.body.style.cursor = 'default';
	});
	stage.width = stage.getContainer().offsetWidth;

	return stage;
}

function draw_letters(stage) {
	var sequence_div = document.getElementById(stage.seq_name);
	var sequence = stage.sequence;
	var letters_on_screen = sequence.length/stage.zoom;
	var space_per_letter = stage.width/letters_on_screen;
	var begin_index = Math.ceil(-stage.getX()/space_per_letter);
	var offset = stage.getX()+(begin_index*space_per_letter)
	var letter_width = 8;
	if(space_per_letter > letter_width) {
		var letter_spacing = space_per_letter-letter_width;
		if(space_per_letter - 2*offset > letter_width) {
			sequence_div.innerHTML = sequence.slice(begin_index, Math.min(letters_on_screen+begin_index+1, sequence.length));	
		}
		else {
			sequence_div.innerHTML = sequence.slice(begin_index, Math.min(letters_on_screen+begin_index, sequence.length));				
		}
		sequence_div.style.letterSpacing = letter_spacing;
		sequence_div.style.fontFamily = "Courier";
		sequence_div.style.fontSize = 14;
		sequence_div.style.position = 'relative';
		if(sequence[begin_index] == ' ') {
			sequence_div.style.left = offset + space_per_letter;
		}
		else {
			sequence_div.style.left = offset;
		}
		
	}
	else {
		sequence_div.innerHTML = '';
	}
}


function draw_sequence(container_name, seq_name, sequence, background_color) {
	var stage = setup_stage(container_name);
	var container = stage.getContainer();	
	var layer_name = 'layer' + container_name;
	var layer = new Kinetic.Layer({
		id: layer_name
	});
	
	var back_layer = new Kinetic.Layer();

	var background = new Kinetic.Rect({
		x: 0,
		y: stage.getHeight() / 2,
		width: 100,
		height: 20,
        fill: background_color
	});
	
	// add the shape to the layer
	back_layer.add(background);
	
	// add the layer to the stage
	stage.add(back_layer);
	stage.add(layer);
	
	
	var seq_layer_name = 'seq_layer' + container_name;
	var seq_layer = new Kinetic.Layer({
		id:seq_layer_name
	});
	seq_layer.on('mouseover', function() {
		document.body.style.cursor = 'text';
	});
	seq_layer.on('mouseout', function() {
		document.body.style.cursor = 'pointer';
	});
	
	stage.add(seq_layer);
	stage.sequence = sequence;
	stage.seq_name = seq_name
	stage.zoom = 1;
	stage.layer = layer;
	
	zoom_sequence(stage, 1);
	return stage;
}

//http://stackoverflow.com/questions/2854407/javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed
var waitForFinalEvent = (function () {
  var timers = {};
  return function (callback, ms, uniqueId) {
    if (!uniqueId) {
      uniqueId = "Don't call this twice without a uniqueId";
    }
    if (timers[uniqueId]) {
      clearTimeout (timers[uniqueId]);
    }
    timers[uniqueId] = setTimeout(callback, ms);
  };
})();

function zoom_sequence(stage, zoom) {
	var container = stage.getContainer();	
	
	stage.zoom = zoom	
	var max_width = stage.getContainer().offsetWidth;
	var num_letters = stage.sequence.length/zoom;
	var space_per_letter = max_width/num_letters;
	if(space_per_letter > 8) {
		stage.width = num_letters*Math.floor(space_per_letter);
	}
	else {
		stage.width = max_width;
	}
	resize(stage, stage.width, zoom);
	stage.setDragBoundFunc(function(pos) {			
        return {
        	x: Math.min(Math.max(pos.x, (1-zoom)*stage.getWidth()), 0),
            y: this.getAbsolutePosition().y
          }
	});
	
	// deal with window resizing
	window.onresize = function(event) {
		var max_width = stage.getContainer().offsetWidth;
		var num_letters = stage.sequence.length/zoom;
		var space_per_letter = max_width/num_letters;
		if(space_per_letter > 8) {
			stage.width = num_letters*Math.floor(space_per_letter);
		}
		else {
			stage.width = max_width;
		}
		
		waitForFinalEvent(function(){
      		resize(stage, stage.width, zoom);

    		}, 500, "resize" + stage.getContainer().id);	
	};
}

function add_spacer(layer, x_pos, y_pos, width) {
	var tag1 = new Kinetic.Rect({
		x: x_pos,
		y: y_pos,
		width: width,
		height: 20,
        fill: 'white',
        opacity: 1
	});
    layer.add(tag1);
    
    if(x_pos != 0 && x_pos+width != 100) {
    	var dotted_line = new Kinetic.Line({
        points: [x_pos, y_pos+10, x_pos+width, y_pos+10],
        stroke: '#424242',
        strokeWidth: 2,
        lineJoin: 'round',
        /*
         * line segments with a length of 33px
         * with a gap of 10px
         */
        dashArray: [.25, .25]
      	});
		layer.add(dotted_line)
    	
    }
    
    
}


function add_tag(layer, label_text, x_pos, y_pos, width, color, scale_factor) {
	var tag1 = new Kinetic.Rect({
		x: x_pos,
		y: y_pos,
		width: width,
		height: 20,
        fill: color,
        opacity: 0.5
	});
    layer.add(tag1);
    
    var label = new Kinetic.Text({
        x: 0,
        y: y_pos-15,
        text: label_text,
        fontSize: 14,
        fontFamily: 'Calibri',
        fill: '#555',
        name:'tag_label'
        });
    
	label.setX(x_pos + width/2 - label.getWidth()*scale_factor/2);
	layer.add(label);
}

function resize(stage, new_width, zoom) {
	var old_width = stage.getWidth();
	var old_x = stage.getX();
		
	stage.setWidth(new_width);
	stage.setScale(zoom*new_width/100, 1);
	stage.setX(old_x*new_width/old_width);
	
	draw_letters(stage);
	
	var scale_factor = 100/(new_width*zoom);
	
	labels = stage.get('#layer' + stage.getContainer().id)[0].get('.tag_label');
	for(var i = 0; i < labels.length; i++) {
		labels[i].setScale(scale_factor, 1);
	}
	
	//seqs = stage.get('#seq_layer' + stage.getContainer().id)[0].get('.seq');
	//for(var i = 0; i < seqs.length; i++) {
	//	seqs[i].setScale(100/seqs[i].getWidth(), 1);
	//}
	stage.draw();
}

function setup_legend(legend_name) {
	var legend_width = 100;
	
	var stage = new Kinetic.Stage({
		container: legend_name,
		width:legend_width,
		height:20
	});	
	
	var layer_name = 'layer' + legend_name;
	var layer = new Kinetic.Layer({
		id: layer_name
	});	
	
	var sequence = new Kinetic.Rect({
		x: 0,
		y: stage.getHeight() / 2,
		width: legend_width,
		height: 10,
        fill: 'silver'
	});
	
	var selected = new Kinetic.Rect({
		x: 0,
		y: stage.getHeight() / 2,
		width: legend_width,
		height: 10,
        fill: 'gray',
        draggable: true,
        id: 'selected'
     });
     
     // add cursor styling
	selected.on('mouseover', function() {
		document.body.style.cursor = 'pointer';
	});
	selected.on('mouseout', function() {
		document.body.style.cursor = 'default';
	});
	stage.selected = selected;
	layer.add(sequence);
	layer.add(selected);
	stage.add(layer);
	return stage
}

function recalculate_width(stage) {
	var stages = stage.stages;
	var max_width = stages[0].getContainer().offsetWidth;
	var min_width = max_width;
	for(var i = 0; i < stages.length; i++) {
		var num_letters = stages[i].sequence.length/stage.zoom;
		var space_per_letter = max_width/num_letters;
		if(space_per_letter > 8) {
			min_width = Math.min(min_width, num_letters*Math.floor(space_per_letter));
		}
	}	
	
		//set widths across all stages
	for(var i = 0; i < stages.length; i++) {
		var this_stage = stages[i];
		this_stage.zoom = stage.zoom
		this_stage.width = min_width;
		resize(this_stage, this_stage.width, stage.zoom);
		this_stage.setDragBoundFunc(function(pos) {	
			var new_x = Math.min(Math.max(pos.x, (1-stage.zoom)*this_stage.getWidth()), 0);
			move_everything(stages, stage, new_x, container_width, stage.zoom);
	
        return {
        	x: new_x,
            y: this.getAbsolutePosition().y
          }
	});
	}
	
	return min_width;
}

function zoom_legend(stage, zoom, x_pos) {
	var selection_width = 100/zoom;
	var container = stage.getContainer();
	stage.selected.setWidth(selection_width);
	
	var stages = stage.stages;
	stage.zoom = zoom;
	//calculation min width across all stages
	var min_width = recalculate_width(stage);
		
	var legend_selection = stage.selected;
	legend_selection.setDragBoundFunc(function(pos) {
		container_width = recalculate_width(stage);
		legend_selection_x = legend_selection.getX();
		var new_x = -legend_selection_x*container_width*zoom/100;
		move_everything(stages, legend, new_x, container_width, zoom);
		
        return {
            x: Math.min(Math.max(pos.x, 0), stage.getWidth()-legend_selection.getWidth()),
            y: this.getAbsolutePosition().y
          }
      });
      
   	// deal with window resizing
	window.onresize = function(event) {
		var max_width = stages[0].getContainer().offsetWidth;
		var min_width = max_width;
		for(var i = 0; i < stages.length; i++) {
			var num_letters = stages[i].sequence.length/zoom;
			var space_per_letter = max_width/num_letters;
			if(space_per_letter > 8) {
				min_width = Math.min(min_width, num_letters*Math.floor(space_per_letter));
			}
		}		
		
		waitForFinalEvent(function(){
			for(var i = 0; i < stages.length; i++) {
				stages[i].width = min_width;
				resize(stages[i], stages[i].width, zoom);
			}

    		}, 500, "resize");	
	};
      
    move_everything(stages, stage, (-x_pos*zoom + .5)*stages[0].width, stages[0].width, zoom);
	
	
	stage.draw();

}

function move_everything(stages, legend, new_x, container_width, zoom) {
	for(var i = 0; i < stages.length; i++) {
		var stage = stages[i];
        stage.setX(new_x);
        stage.draw();
        draw_letters(stage);
     }
	new_legened_x = -new_x*100/(container_width*zoom);
	legend.selected.setX(new_legened_x);
	legend.draw();
}

function add_legend(legend_name, stages) {
	$('#' + legend_name).empty();

	//Setup legend.
	var legend_stage = setup_legend(legend_name);
	legend_stage.stages = stages;
	for(var i = 0; i < stages.length; i++) {
		stages[i].legend = legend_stage;
	}
	zoom_legend(legend_stage, 1, .5);
	return legend_stage;
}

function zoom_out(legend) {
	legend.zoom = legend.zoom - 1;
	var edge = 1/(2*legend.zoom)
	var center = Math.min(Math.max(edge, (legend.selected.getX() + legend.selected.getWidth()/2)/legend.getWidth()), 1-edge);
	zoom_legend(legend, legend.zoom, center);	
	return legend.zoom;
}
	
function zoom_in(legend) {
	legend.zoom= legend.zoom + 1;
	var center = (legend.selected.getX() + legend.selected.getWidth()/2)/legend.getWidth()
	zoom_legend(legend, legend.zoom, center);	
	return legend.zoom;
}
	
function zoom_full(legend) {
	legend.zoom = 1;
	zoom_legend(legend, legend.zoom, .5);	
	return legend.zoom;
}

function set_seq(stage, sequence) {
	stage.sequence = sequence;
}
function set_tags(stage, tags) {
	var layer = stage.layer;
	layer.removeChildren();
	// add tags to the layer
	var scale_factor = 100/stage.width
	for(var i=0; i < tags.length; i=i+1) {
		if(tags[i][0] == 'spacer') {
			add_spacer(layer, tags[i][1], stage.getHeight()/2, tags[i][2]);
		}
		else {
			add_tag(layer, tags[i][0], tags[i][1], stage.getHeight()/2, tags[i][2], tags[i][3], scale_factor);
		}
	}
	var center = (legend.selected.getX() + legend.selected.getWidth()/2)/legend.getWidth()
	zoom_legend(stage.legend, stage.legend.zoom, center);
}


