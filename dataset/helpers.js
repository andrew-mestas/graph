var dataset = [];
var parsedQSet = {};	
var yearlyGroup = [];
var statistics_by_criteria = {};
var names = [];
var svg = null;
var lineFn = null;
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

var getGlobalData = function(data,subset,metric,group){
	yearlyGroup = [];
	statistics_by_criteria = {};
	Object.keys(data[subset]).forEach(function(d){
		var inner = data[subset][d].filter(function(x){
			if(x.metric == metric){
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
updateGraph();
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

var updateGraph = function(){
	svg.append("path")
	   .attr("d", lineFn(lineData))
       .attr("stroke", "blue")
       .attr("stroke-width", 2)
       .attr("fill", "none");
};	

var addElement = function(type,name,id){
	var option = document.createElement(type);
	var text = document.createTextNode(name);
	option.appendChild(text);

	document.getElementById(id).appendChild(option);
};

var lineCoordFunction = function(height, width){

var X = d3.scale.linear().range([0, width]);
var Y = d3.scale.linear().range([height, 0]);

var lineCoords = d3.svg.line()
				.x(function(d){return d.x})
				.y(function(d){return d.y})
				.interpolate("linear");
return lineCoords;
};


var setUpGraph = function(width,height,domainStart,domainEnd,rangeStart,rangeEnd){
	lineFn = lineCoordFunction(height, width);
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([domainStart, domainEnd])
    .range([20, width]);

var y = d3.scale.linear()
    .domain([rangeStart,rangeEnd])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(5)
    .tickSize(-width);

var zoom = d3.behavior.zoom()
    .x(x)
    .y(y)
    .scaleExtent([1, 32])
    .on("zoom", zoomed);

svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

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

