function LineAnimator() {
	
	//****var gridSize = 10;
	var gridSize = 20;
	var halfGridS = Math.round(gridSize/2.0);
	
	var dragHandlePixWidth  = gridSize;
	var dragHandlePixHeight = gridSize;
	
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
	
	var currPixSlope;
	var currCoordSlope = 0.5;
	var currPixIntercept;
	var currCoordIntercept = 3;
	
	// CUrrent upper left x,y of the
	// handle for dragging line up/down:
	var currPixDragHandleUpLeftX;
	var currPixDragHandleUpLeftY;
	
	// Currently not dragging the intercept handle:
	draggingIntercept = false;
	rotatingLine      = false;
	

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
		drawFuncLine(currCoordSlope, currCoordIntercept);
		drawInterceptHandle(currCoordIntercept);
		
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
    	pixelSlopeIntercept = slopeIntCoord2Pix(slope, intercept)
    	var pixelIntercept = pixelSlopeIntercept.pixelIntercept;
    	var pixelSlope     = pixelSlopeIntercept.pixelSlope;
    	ctx.beginPath();
    	ctx.moveTo(gridSize, pixelIntercept);
    	ctx.lineTo(pixelxMax, pixelSlope * pixelxMax - gridSize + pixelIntercept);
    	
    	ctx.stroke();
    	
    	currPixSlope       = pixelSlope;
    	currCoordSlope     = slope;
    	currPixIntercept   = pixelIntercept;
    	currCoordIntercept = intercept;
    }
    
    var drawInterceptHandle = function(yCoord) {
    	ctx.beginPath();
    	var dragHandleCoords = coord2Pix(0, currCoordIntercept);
    	//ctx.moveTo(dragHandleCoords.pixX, dragHandleCoords.pixY);
    	var pixX = dragHandleCoords.pixX;
    	var pixY = dragHandleCoords.pixY;
    	ctx.fillRect(pixX-halfGridS, pixY-halfGridS,
    				 gridSize, gridSize);
    	currPixDragHandleUpLeftX = pixX-halfGridS;
    	currPixDragHandleUpLeftY = pixY-halfGridS;
    	
    	return {'dragPixHandlePixUpLeftX' : currPixDragHandleUpLeftX,
    			'dragPixHandlePixUpLeftY' : currPixDragHandleUpLeftY}
    }

    var slopeIntCoord2Pix = function(slope, intercept) {
    	/**
    	 * Given a coordinate system slope and intercept,
    	 * return an object with properties pixelSlope
    	 * and pixelIntercept.
    	 */
    	// Slope multiplied by -1 to account for y-coord
    	// growing down instead of up as y increases:
    	return {'pixelSlope' : -slope,
    			'pixelIntercept' : yAxisHeight - intercept * gridSize
    			};
    }

    var coord2Pix = function(x, y) {
    	/**
    	 * Return pixel x and y from coordinate
    	 * x,y in an object. {pixX, pixY}. 
    	 */
    	// Add one grid size on left:
    	return {'pixX' : gridSize + gridSize * x,
    			'pixY' : yAxisHeight - y * gridSize
    	};
    }
    
    var pix2Coord = function(pixX, pixY) {
    	return {'x' : Math.round(pixX / gridSize),
    			'y' : yAxisHeight + Math.round(Math.round(y / gridSize))
    	};
    }
    
    var onDragHandle = function(cursorPixX, cursorPixY) {
    	return (cursorPixX > currPixDragHandleUpLeftX &&
    			cursorPixX < currPixDragHandleUpLeftX + dragHandlePixWidth &&
    			cursorPixY > currPixDragHandleUpLeftY &&
    		    cursorPixY < currPixDragHandleUpLeftY + dragHandlePixHeight
    	);
    }
    
    this.mouseDownHandler = function(evt) {
    	if (onDragHandle(evt.pageX, evt.pageY)) {
    		draggingIntercept = true;
    		rotatingLine      = false;
    	}
    }
    
    this.mouseUpHandler = function(evt) {
    	draggingIntercept = false;
    	rotatingLine      = false;
    }
    
    this.mouseMoveHandler = function(evt) {
		// Ignore mouse motion without button pressed:
		if (evt.buttons == 0) {
		    return;
		}
		
		
		
		var deltaX = evt.pageX - rect.left;
		var deltaY = evt.pageY - rect.bottom;
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