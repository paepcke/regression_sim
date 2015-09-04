function LineAnimator() {

    this.mouseMoveHandler = function(event) {
	// Ignore mouse motion without button pressed:
	if (event.buttons == 0) {
	    return;
	}
	var body = document.getElementById('regressionBody');
	var line = document.getElementById('line');
	var rect = line.getBoundingClientRect();
	
	var deltaX = event.pageX - rect.left;
	var deltaY = event.pageY - rect.bottom;
	// Radians:
	var rad    = Math.atan2(deltaY, deltaX);
	//var degree = rad * (180 / Math.PI);
	newEndPt   = rotatePtAroundOrigin(rect.right, 
					  rect.top,
					  rect.left,
					  rect.bottom,
					  rad);
	

	line.style.transform = 'rotate(' + degree + 'deg)';
        //line.style.transform = 'rotate(' + degree + 'deg) translate(' + rect.left + ',' + rect.bottom + ')';
	//line.style.transform = 'translate(' + rect.left + ',' + rect.bottom + ')';
    }

    var rotatePtAroundOrigin = function(ptX, ptY, originX, originY, angleRad) {
	return {
		x: Math.cos(angleRad) * (ptX-originX) - Math.sin(angleRad) * (ptY-originY) + originX,
		y: Math.sin(angleRad) * (ptX-originX) + Math.cos(angleRad) * (ptY-originY) + originY
	};	
    }
}

lineAnimator = new LineAnimator();
window.onload = function() {
    document.getElementById('line').addEventListener('mousemove', 
						     lineAnimator.mouseMoveHandler);
}
