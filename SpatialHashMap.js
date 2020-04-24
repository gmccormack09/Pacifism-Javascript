function SpatialHashMap(cellSize) {
	this.spatialHash = {};
	this.cellSize = cellSize;
}

SpatialHashMap.prototype = {
	addObj: function(key, obj){
		if(this.spatialHash[key] == undefined) this.spatialHash[key] = [];
		 
		this.spatialHash[key].push(obj);
	},
	add: function(obj){
		var X = Math.round(obj.pos.x / this.cellSize) * this.cellSize;
		var Y = Math.round(obj.pos.y / this.cellSize) * this.cellSize;
		var remainderX = obj.pos.x % this.cellSize;
		var remainderY = obj.pos.y % this.cellSize;
		var checkLeftCell = remainderX<obj.radius;
		var checkRightCell = remainderX>(this.cellSize-obj.radius);
		var checkUpCell = remainderY<obj.radius;
		var checkDownCell = remainderY>(this.cellSize-obj.radius);
		if(checkLeftCell){
			this.addObj((X-this.cellSize) + "," + Y, obj);
		} else if(checkRightCell){
			this.addObj((X+this.cellSize) + "," + Y, obj);
		}
		if(checkUpCell){
			this.addObj(X + "," + (Y-this.cellSize), obj);
			if(checkLeftCell){
				this.addObj((X-this.cellSize) + "," + (Y-this.cellSize), obj);
			} else if(checkRightCell){
				this.addObj((X+this.cellSize) + "," + (Y-this.cellSize), obj);
			}
		} else if(checkDownCell){
			this.addObj(X + "," + (Y+this.cellSize), obj);
			if(checkLeftCell){
				this.addObj((X-this.cellSize) + "," + (Y+this.cellSize), obj);
			} else if(checkRightCell){
				this.addObj((X+this.cellSize) + "," + (Y+this.cellSize), obj);
			}
		}
		this.addObj(X + "," + Y, obj);
	},
	getList: function(obj){
		var X = Math.round(obj.pos.x / this.cellSize) * this.cellSize;
		var Y = Math.round(obj.pos.y / this.cellSize) * this.cellSize;
		var key = X + "," + Y;
		if(this.spatialHash[key] == undefined) this.spatialHash[key] = []
		 
		return this.spatialHash[key];
	}
};
