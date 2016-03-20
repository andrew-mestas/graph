var dataset = [];
var parsedQSet = {};	
var gLineData = {};
var yearlyGroup = [];
var statistics_by_criteria = {};
var names = [];
var colors = [];
var gColorMod = 0;
var svg = null;
var lineFn = null;
var initial = true;
var gHeight = 0;
var gWidth = 0;
var gDomain = {};
var gRange = {};
var margin = {};
var reordered = false;
var graphCreated = false;
// ["location_id","location","location_name","year",
// 			 "age_group_id","age_group","age_start","age_end",
// 			 "sex_id","sex","metric","mean","lower","upper"];
var filter = [];
// ["overweight", "obese"];

var op1 = "", op2 = "", op3 = "";

var beginParse = function(file, filter){
	setFilter(filter);
	d3.csv(file, parseFile);
}

var setFilter = function(filter){
	filter = filter;
}

var store = function(val, id){
	switch(id){
		case 1 : op1 = val;
		break;
		case 2: op2 = val;
		break;
		case 3: op3 = val;
	};
}


var parseFile = (

// 	function(d){
// 	return {
// 		location_id: +d.location_id,
// 		location: d.location,
// 		location_name: d.location_name,
// 		year: +d.year,
// 		age_group_id: +d.age_group_id,
// 		age_group: d.age_group,
// 		age_start: +d.age_start,
// 		age_end: +d.age_end,
// 		sex_id: +d.sex_id,
// 		sex: d.sex,
// 		unit: d.unit, 
// 		metric: d.metric,
// 		measure: d.measure,
// 		mean: +d.mean,
// 		lower: +d.lower,
// 		upper: +d.upper
// 	};
// }, 

function(error, rows){
	if(error){
		console.log("There was an error parsing the file: ", error);
	} else {
		dataset = rows;
		console.log("Loaded " + dataset.length + " rows.");
		names = Object.keys(rows[0]);
		names.forEach(function(i){parseByName(dataset,i);});
		var a = "Done! Rows: " + (dataset.length).toString();
		addElement("span",a,"info");
		console.log("All data parsed!");
		console.log(parsedQSet);
		init();

	}
});

var getGlobalData = function(data,category,subset,metric,group){
	yearlyGroup = [];
	statistics_by_criteria = {};
	Object.keys(data[subset]).forEach(function(d){
		var inner = data[subset][d].filter(function(x){
			if(x[category] == metric){
				return x;
			}
		});
		yearlyGroup.push(inner);
	});

	console.log("Grouped By", subset + " filter for "+ metric, yearlyGroup);

	yearlyGroup.forEach(function(countries_by_year, idx){
		statistics_by_criteria[idx] = {};
		countries_by_year.forEach(function(age_group){
			statistics_by_criteria[idx][age_group[group]] = {lower: 0.0, upper: 0.0, mean: 0.0, count: 0, lavg: 0.0, uavg: 0.0, mavg: 0.0};			
		});
	});

	yearlyGroup.forEach(function(countries_by_year, idx){

		countries_by_year.forEach(function(stats){
			statistics_by_criteria[idx][stats[group]].lower += parseFloat(stats.lower);
			statistics_by_criteria[idx][stats[group]].upper += parseFloat(stats.upper);
			statistics_by_criteria[idx][stats[group]].mean += parseFloat(stats.mean);
			statistics_by_criteria[idx][stats[group]].count += 1;
		});
		
		Object.keys(statistics_by_criteria).forEach(function(i){
			Object.keys(statistics_by_criteria[i]).forEach(function(x){
				statistics_by_criteria[i][x].lavg = statistics_by_criteria[i][x].lower / statistics_by_criteria[i][x].count;
				statistics_by_criteria[i][x].uavg = statistics_by_criteria[i][x].upper / statistics_by_criteria[i][x].count;
				statistics_by_criteria[i][x].mavg = statistics_by_criteria[i][x].mean / statistics_by_criteria[i][x].count;
			});
		});
	});
 console.log("Statistics by " + group, parsedQSet[subset]);
 console.log(statistics_by_criteria);
 calculateLineData();
};

var parseByName = function(data, name){
 var location_id_hash_array = {};

 // console.log(name + " Parsing...");
 data.forEach(function(record){
	location_id_hash_array[record[name]] = [];
 });
 data.forEach(function(record){
	location_id_hash_array[record[name]].push(record);
 });
 parsedQSet[name] = location_id_hash_array;

 // console.log(name + " Parsed " + Object.keys(location_id_hash_array).length + " records.");
};

var maxRange = function(){
	var upper = [];
	Object.keys(gLineData).forEach(function(data){
		if(data.indexOf("high") >= 0){
			gLineData[data].forEach(function(value){
				upper.push(value.y);
			});
		}
	});
	upper = d3.max(upper);
	console.log("UPPER",upper)

	return upper;
}

var reorderGraph = function(domain,rStart,rEnd){
	gDomain.array = domain;
	reordered = true;
	var x = d3.scale.linear()
    .domain(domain)
    .range([20, gWidth]);

	var y = d3.scale.linear()
    .domain([rStart, rEnd])
    .range([gHeight, 0]);

	var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-gHeight);

	var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(5)
    .tickSize(-gWidth);

    svg = d3.select(".graph").append("svg")
    .attr("width", gWidth)
    .attr("height", gHeight)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // .call(zoom);


	svg.append("rect")
    .attr("width", gWidth)
    .attr("height", gHeight);

	svg.selectAll("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + gHeight + ")")
    .call(xAxis);

	svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);	
};

var calculateLineData = function(){
 var lineDataF = {};
 var keys = Object.keys(parsedQSet[op3]);
 // if(!reordered){
 var scaleX = d3.scale.linear().domain([0, Object.keys(statistics_by_criteria).length]).range([gDomain.start,gDomain.end]);
 // } else {
 // 	console.log(gDomain)
 // var scaleX = d3.scale.linear().domain([0,Object.keys(statistics_by_criteria).length]).range(gDomain.array);

 //  }

 for(var i in keys){
	var low =  (keys[i]).toString() + "-low";
	var mean = (keys[i]).toString() + "-mean";
	var high = (keys[i]).toString() + "-high";

	lineDataF[low] = [];
	lineDataF[mean] = [];
	lineDataF[high] = [];
 }
 // console.log(lineDataF)
 Object.keys(statistics_by_criteria).forEach(function(key, idx){
	for(var i in statistics_by_criteria[key]){
		var low  = (i).toString() + "-low";
		var mean = (i).toString() + "-mean";
		var high = (i).toString() + "-high";
		// console.log(low, mean, high)
		// console.log(statistics_by_criteria[key][i], statistics_by_criteria, statistics_by_criteria[key], i, key)
		lineDataF[low].push({"x": scaleX(idx), "y" : statistics_by_criteria[key][i].lavg});
		lineDataF[mean].push({"x": scaleX(idx), "y" : statistics_by_criteria[key][i].mavg});
		lineDataF[high].push({"x": scaleX(idx), "y" : statistics_by_criteria[key][i].uavg});

	}
 });

 gLineData = lineDataF;
 console.log(lineDataF)
}


var updateGraph = function(){
	console.log("Initial", initial)
 if(initial){
	colors = color();
 }
 console.log(colors)
 // ["red", 'green', 'blue', 'purple', 'black', 'grey'];
 var idx = 0;
 var count = 0;
 var classCount= 0;
 var data = {};
 console.log("GLINEDATA",gLineData);
 Object.keys(gLineData).forEach(function(key){
	console.log("lineData")
	if(gLineData[key].length > 0){
		data[key] = gLineData[key];
	}
 });
 console.log("FILTERED", data)
	for(var i in data){
	count++;

	if(!initial){
		var className = ".line" + (classCount).toString();
		svg.selectAll(className).transition()
	  	   .attr("d", lineFn(gLineData[i]))
	  	   .attr("stroke", colors[idx])
       	   .attr("stroke-width", 2)
       	   .attr("stroke-linejoin", "round")
           .attr("class", "line"+(classCount).toString())
           // .attr("fill", "none");
 		if(count % gColorMod == 0){
       		idx++;
 			// console.log("here",idx)
   	    } 	
			classCount++;
   		} else {
 console.log("draw Path");
	 svg.append("path")
	   .transition()
	   .attr("d", lineFn(gLineData[i]))
       .attr("stroke", colors[idx])
       .attr("stroke-width", 2)
  	   .attr("stroke-linejoin", "round")
       .attr("class", "line"+(classCount).toString())
       .attr("fill", "none");
       if(count % gColorMod == 0){
       	idx++;
 			// console.log("here",idx)

       } 
		classCount++;
	}
	}
    
};	

var randomcolor = function(){
	var colors = [];
	var R = 0;
	var B = 0;
	var G = 0;

for(var i =0; i< Object.keys(statistics_by_criteria).length;){
	R = Math.floor(Math.random()*222);
	B = Math.floor(Math.random()*222);
	G = Math.floor(Math.random()*222);

	var color = "rgb(" + R + "," + B + "," + G + ")";
	if(colors.indexOf(color) <= -1){
		colors.push(color);
		i++;
	};
}
return colors;	
};


var color = function(){
	var colors = [];
	// var R = 0;
	// var B = 0;
	// var G = 0;
	// var c = [199,115,26];
	var start = 100000;
// #000066

for(var i =0; i< Object.keys(statistics_by_criteria).length;){
	console.log("colors")
	// R = Math.floor(Math.random()*255);
	// B = Math.floor(Math.random()*222);
	// G = Math.floor(Math.random()*222);
	// for(var x=0; x < 3;){
	// G = c[x];
	// console.log("hey")
	// var color = "rgb(" + R + "," + B + "," + G + ")";
	var color = "#" + (start + i).toString();
	console.log(color)
	if(colors.indexOf(color) <= -1){
		colors.push(color);
		i++;
		// x++;
	};
	}
// }
return colors;	
};


var addElement = function(type,name,id){
	var option = document.createElement(type);
	var text = document.createTextNode(name);
	option.appendChild(text);

	document.getElementById(id).appendChild(option);
};

var lineCoordFunction = function(){

	var X = d3.scale.linear().domain([gDomain.start,gDomain.end]).range([20, gWidth]);
	var Y = d3.scale.linear().domain([gRange.start,gRange.end]).range([gHeight, 0]);

 var lineCoords = d3.svg.line()
				.x(function(d){return X(d.x)})
				.y(function(d){return Y(d.y)})
				.interpolate("linear");
 return lineCoords;
};

var setUpGraph = function(width,height,domainStart,domainEnd,rangeStart,rangeEnd,colorMod,ticks){
    margin = {top: 20, right: 20, bottom: 30, left: 40};
 var width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;
    gHeight = height;
    gWidth = width;
    gDomain.start = domainStart;
    gDomain.end = domainEnd;
    gRange.start = rangeStart;
    gRange.end = rangeEnd;
    gColorMod = colorMod;
	lineFn = lineCoordFunction(height,width,margin,domainStart,domainEnd,rangeStart,rangeEnd);
	colorMod = colorMod;
	console.log("SETUP")
 var x = d3.scale.linear()
    .domain([domainStart, domainEnd])
    .range([20, width]);

 var y = d3.scale.linear()
    .domain([rangeStart,rangeEnd])
    .range([height, 0]);

 var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(ticks)
    .tickSize(-height);

 var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(20)
    .tickSize(-width);

 // var zoom = d3.behavior.zoom()
 //     .x(x)
 //     .y(y)
 //     .scaleExtent([1, 32])
 //     .on("zoom", zoomed);

 svg = d3.select(".graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // .call(zoom);

 svg.append("rect")
    .attr("width", width)
    .attr("height", height);

 svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

 svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

 function zoomed() {
  svg.select(".x.axis").call(xAxis);
  svg.select(".y.axis").call(yAxis);
 }
}

var prettyJSON = function(){
	  var el = {
            btnAction: $('#action'),
            btnClear: $('#clear'),
            result: $('#result')
        };
       	var el1 = {
            btnAction: $('#action1'),
            btnClear: $('#clear1'),
            result: $('#result1')
        };
        
        el.btnAction.on('click', function(){
            var json = parsedQSet;
            var data;
            try{ data = json; }
            catch(e){ 
                alert('not valid JSON');
                return;
            }
            var node = new PrettyJSON.view.Node({ 
                el:el.result,
                data: data,
                dateFormat:"DD/MM/YYYY - HH24:MI:SS"
            });
        });
        el.btnClear.on('click', function(){
            el.result.html('');
        });

        el1.btnAction.on('click', function(){
            var json = gLineData;
            var data;
            try{ data = json; }
            catch(e){ 
                alert('not valid JSON');
                return;
            }
            var node = new PrettyJSON.view.Node({ 
                el:el1.result,
                data: data,
                dateFormat:"DD/MM/YYYY - HH24:MI:SS"
            });
        });
        el1.btnClear.on('click', function(){
            el1.result.html('');
        });
}

//TESTING


var lineCoordFunctionD = function(){

	var X = d3.scale.linear().domain(gDomain.array).range([20, gWidth]);
	var Y = d3.scale.linear().domain([gRange.start,gRange.end]).range([gHeight, 0]);
reordered = true;
var lineCoords = d3.svg.line()
				.x(function(d){return X(d.x)})
				.y(function(d){return Y(d.y)})
				.interpolate("linear");
return lineCoords;
};


var setUpGraphD = function(years){
	if(years){
  	  gDomain.array = Object.keys(parsedQSet.year).map(function(i){return parseInt(i)});
  	  gDomain.start =  gDomain.array[0];
  	  gDomain.end = gDomain.array[gDomain.array.length-1];
  	  console.log("YEARS",gDomain)

	} else {
	  gDomain.array =  Object.keys(parsedQSet.location_id).map(function(i){return parseInt(i)});
	  gDomain.start = gDomain.array[0];
	  gDomain.end = gDomain.array[gDomain.array.length-1];
	}
    // gRange.start = rangeStart;
    // gRange.end = rangeEnd;
    // gColorMod = colorMod;
	lineFn = lineCoordFunctionD();
	// colorMod = colorMod;
    margin = {top: 20, right: 20, bottom: 30, left: 40};

	var width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;
var x = d3.scale.linear()
    .domain([gDomain.start, gDomain.end])
    .range([20, gWidth]);

var y = d3.scale.linear()
    .domain([gRange.start,gRange.end])
    .range([gHeight, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-gHeight);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(5)
    .tickSize(-gWidth);

// var zoom = d3.behavior.zoom()
//     .x(x)
//     .y(y)
//     .scaleExtent([1, 32])
//     .on("zoom", zoomed);
if(!graphCreated){
	console.log("heredsfa")
svg = d3.select(".graph").append("svg")
    .attr("width", gWidth + margin.left + margin.right)
    .attr("height", gHeight + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // .call(zoom);
    svg.append("rect")
    .attr("width", gWidth)
    .attr("height", gHeight);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + gHeight + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);
graphCreated = true;
} else {
	svg = d3.select(".graph").select("svg");

 svg.select("rect")
     .select("g")
    .call(xAxis);

svg.select("g")
    .call(yAxis);
}

// function zoomed() {
//   svg.select(".x.axis").call(xAxis);
//   svg.select(".y.axis").call(yAxis);
// }
}


