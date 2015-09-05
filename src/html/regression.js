function LineAnimator() {
	
	//****var gridSize = 10;
	var gridSize = 20;
	var halfGridS = Math.round(gridSize/2.0);	
	var coordSys = {'topLeftX'  : gridSize,
					'topLeftY'  : 0,
					'width'     : 500,
					'height'    : 370	};
					//'height'    : 375};
		            
	var xAxisLabel = "Distance";
	var yAxisLabel = "Potatoes";
	
	var ctx;
	var xAxisLen;
	var yAxisHeight;


    this.constructor = function() {
    	ctx         = document.getElementById('canv').getContext("2d");
		xAxisLen    = coordSys.width - halfGridS;
		yAxisHeight = coordSys.height - halfGridS;
    }();
	
    this.setup = function() {

    	// Draw horizontal grid lines:
		for (var x = 0.5; x < coordSys.width; x += gridSize) {
		  ctx.moveTo(x, 0);
		  ctx.lineTo(x, coordSys.height);
		}
		
		// And the vertical lines:
		for (var y = 0.5; y < coordSys.height; y += gridSize) {
		  ctx.moveTo(0, y);
		  ctx.lineTo(coordSys.width, y);
		}
		
		// Stroke the lines:
		ctx.strokeStyle = "#eee";
		ctx.stroke();
		
		// The x-axis:
		ctx.beginPath();
		ctx.strokeStyle = "#000";
		ctx.lineWidth   = 2;

		// Leave 1/2 grid size for arrow head on right:

		ctx.moveTo(gridSize, coordSys.height - halfGridS);
		ctx.lineTo(xAxisLen, yAxisHeight);
		
		// X-axis arrow head:
		ctx.lineTo(xAxisLen - gridSize, yAxisHeight - halfGridS);
		ctx.moveTo(xAxisLen,yAxisHeight);
		ctx.lineTo(xAxisLen - gridSize, coordSys.height);
		
		// The Y-axis:
		ctx.moveTo(gridSize, yAxisHeight);
		ctx.lineTo(gridSize, 0);
		// Y-axis arrow head:
		ctx.lineTo(halfGridS, gridSize);
		ctx.moveTo(gridSize + halfGridS, gridSize);
		ctx.lineTo(gridSize,0);
		
		// Show the axes:
		ctx.stroke();
		
		// X-axis label:
		ctx.font="20px Georgia";
		ctx.fillText(xAxisLabel, 
					 xAxisLen - halfGridS - ctx.measureText(xAxisLabel).width,
					 coordSys.height + Math.round(1.5 * gridSize)
					 );
		
		// Y-axis label:
		ctx.save();
		// Set origin of context to where y-label will start (left of
		// y-axis, below the y-arrow-head):
		ctx.translate(halfGridS + 5, ctx.measureText(yAxisLabel).width + gridSize + halfGridS);
		// Rotate the canvas, because we'll write horizontally:
		ctx.rotate(-90*Math.PI/180);
		// Write at the (new) canvas origin, which is where
		// the y-label will end up:
		ctx.fillText(yAxisLabel,0,0);
		// Rotate and translate the context back to what it was:
		ctx.restore();
		
		// Draw the initial function line as
		//   y = 0.5x + 3
		drawFuncLine(0.5, 3);
		
    }
    
    var drawFuncLine = function(slope, intercept, xMax) {
    	/**
    	 * Given slope and intercept, draw a line from 
    	 * the y-intercept to either the end of the x-axis
    	 * (if xMax is not provided), or to xMax, if it
    	 * is. All units are in terms of the visible grid.
    	 * This method converts to pixel dimension, and 
    	 * accounts for canvas y-dimension growing downward.
    	 */
    
    	if (xMax === undefined) {
    		pixelxMax = xAxisLen;
    	} else {
    		// Add one gridSize, b/c the y-axis is shifted
    		// right by one grid width to make room for the
    		// y-axis label:
    		pixelxMax = gridSize + gridSize * xMax;
    	}
    	var pixelIntercept = yAxisHeight - intercept * gridSize;
    	// Slope multiplied by -1 to account for y-coord
    	// growing down instead of up as y increases:
    	var pixelSlope = - slope;
    	ctx.beginPath();
    	ctx.moveTo(gridSize, pixelIntercept);
    	ctx.lineTo(pixelxMax, pixelSlope * pixelxMax - gridSize + pixelIntercept);
    	
    	ctx.stroke();
    }
    
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
	    //}
	
	    var rotatePtAroundOrigin = function(ptX, ptY, originX, originY, angleRad) {
	    	return {
	    		x: Math.cos(angleRad) * (ptX-originX) - Math.sin(angleRad) * (ptY-originY) + originX,
	    		y: Math.sin(angleRad) * (ptX-originX) + Math.cos(angleRad) * (ptY-originY) + originY
	    	};
	    }
    }
}

lineAnimator = new LineAnimator();
lineAnimator.setup();
/*window.onload = function() {
    document.getElementById('line').addEventListener('mousemove', 
						     lineAnimator.mouseMoveHandler);
}
*/