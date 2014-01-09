
function draw_venn_diagram(container_name, r, s, x, A, B, C, color1, color2) {
	var zoom = 1;
	if(r > s) {
		zoom = 1.0/r;
	}
	else {
		zoom = 1.0/s;
	}
	
	var stage = new Kinetic.Stage({
		container: container_name,
		draggable: false,
		width:500,
		height:250
	});	
	
	var layer = new Kinetic.Layer();

	if(s > 0) {
        var physical_circle = new Kinetic.Circle({
            x: 100,
            y: 150,
            radius: 100*s*zoom,
            fill: color1,
            opacity: 0.6
        });
        layer.add(physical_circle);

        var physical_label = new Kinetic.Text({
            x: 70,
            y: 125-(100*s*zoom),
            text: 'Physical',
            fontSize: 20,
            fontFamily: 'Calibri',
            fill: 'black'
            });
        layer.add(physical_label);

        var physical_count = new Kinetic.Text({
            x: 100 - 10,
            y: 125-(100*s*zoom) + 35,
            text: B,
            fontSize: 14,
            fontFamily: 'Calibri',
            fill: 'black'
            });
        layer.add(physical_count);
    }

    if(r > 0) {
        var genetic_circle = new Kinetic.Circle({
            x: 100+100*x*zoom,
            y: 150,
            radius: 100*r*zoom,
            fill: color2,
            opacity: 0.6
        });
        layer.add(genetic_circle);

        var genetic_label = new Kinetic.Text({
            x: 70+100*x*zoom,
            y: 125-(100*r*zoom),
            text: 'Genetic',
            fontSize: 20,
            fontFamily: 'Calibri',
            fill: 'black'
            });
        layer.add(genetic_label);

        var genetic_count = new Kinetic.Text({
            x: 100+100*x*zoom - 10,
            y: 125-(100*r*zoom) + 35,
            text: A,
            fontSize: 14,
            fontFamily: 'Calibri',
            fill: 'black'
            });
        layer.add(genetic_count);
    }

    if(r+s > 0) {
    
        var m = (x*x + s*s - r*r)/(2*x);

        if(C > 0) {
            var overlap_count = new Kinetic.Text({
                x: 100+100*m*zoom,
                y: 145,
                text: C,
                fontSize: 14,
                fontFamily: 'Calibri',
                fill: 'black'
                });
            layer.add(overlap_count);
        }
    }
        
    stage.add(layer);
    
	return stage;
}



