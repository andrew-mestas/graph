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
var orderBy = [];
var filter = [];
var statisticsBy = []
var op1 = "", op2 = "", op3 = "";

var beginParse = function(file,order,filter,stats){
	orderBy = order;
	filter = filter;
	statisticsBy = stats;
	console.time("d");
	d3.csv(file, parseFile);
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

function(error, rows){
	if(error){
		console.log("There was an error parsing the file: ", error);
	} else {
		dataset = rows;
		console.log("Loaded " + dataset.length + " rows.");
		names = Object.keys(rows[0]);
		console.timeEnd("d");
		console.time("Initial");
		for(var i = 0, len = names.length; i< len; i++){
			parseByName(dataset,names[i]); 
		};
		console.timeEnd("Initial")
		var a = "Done! Rows: " + (dataset.length).toString();
		addElement("span",a,"info");
		console.log("All data parsed!");
		console.log(parsedQSet);
		init();
	}
});

var getGlobalData = function(data,category,subset,metric,group){
	console.time("Parse");

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
	for(var i=0, len = yearlyGroup.length; i< len; i++){
		statistics_by_criteria[i] = {};

		for(var x=0, max = yearlyGroup[i].length; x<max; x++ ){
			try {
			statistics_by_criteria[i][yearlyGroup[i][x][group]].lower += parseFloat(yearlyGroup[i][x].lower);
			} catch(err) {
			statistics_by_criteria[i][yearlyGroup[i][x][group]] = {lower: 0.0, upper: 0.0, mean: 0.0, count: 0};			
			}
			statistics_by_criteria[i][yearlyGroup[i][x][group]].upper += parseFloat(yearlyGroup[i][x].upper);
			statistics_by_criteria[i][yearlyGroup[i][x][group]].mean += parseFloat(yearlyGroup[i][x].mean);
			statistics_by_criteria[i][yearlyGroup[i][x][group]].count += 1;
		};
	};

 console.timeEnd("Parse");
 console.log("Statistics by " + group, parsedQSet[subset]);
 console.log(statistics_by_criteria);
 calculateLineData();
};

var parseByName = function(data, name){
 var location_id_hash_array = {};
 for(var i=0, len = data.length; i < len; i++){
	try {
		location_id_hash_array[data[i][name]].push(data[i]);	
	} catch(err){
		location_id_hash_array[data[i][name]] = [];
	} 
 }
 parsedQSet[name] = location_id_hash_array;
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
 var scaleX = d3.scale.linear().domain([0, Object.keys(statistics_by_criteria).length]).range([gDomain.start,gDomain.end]);
 
 for(var i in keys){
	var low =  (keys[i]).toString() + "-low";
	var mean = (keys[i]).toString() + "-mean";
	var high = (keys[i]).toString() + "-high";
	lineDataF[low] = [];
	lineDataF[mean] = [];
	lineDataF[high] = [];
 }
 // console.log(lineDataF)
 console.time("calculate")
 Object.keys(statistics_by_criteria).forEach(function(key, idx){
	for(var i in statistics_by_criteria[key]){
		var low  = (i).toString() + "-low";
		var mean = (i).toString() + "-mean";
		var high = (i).toString() + "-high";
		lineDataF[low].push({"x": scaleX(idx), "y" : statistics_by_criteria[key][i].lower / statistics_by_criteria[key][i].count });
		lineDataF[mean].push({"x": scaleX(idx), "y" : statistics_by_criteria[key][i].mean / statistics_by_criteria[key][i].count});
		lineDataF[high].push({"x": scaleX(idx), "y" : statistics_by_criteria[key][i].upper / statistics_by_criteria[key][i].count});
	}
 }); 		
 console.timeEnd("calculate")
 gLineData = lineDataF;
 // console.log(lineDataF)
}


var updateGraph = function(){
	// console.log("Initial", initial)
 if(initial){
	// colors = color();
	colors = ["#000000","#0000CD","#008000","#4B0082","#7FFF00","#800000",
			  "#A0522D","#C71585","#D2691E","#DAA520","#FF0000","#FF8C00"];
 }
 // console.log(colors)
 // ["red", 'green', 'blue', 'purple', 'black', 'grey'];
 var idx = 0;
 var count = 0;
 var classCount= 0;
 var data = {};
 console.log("GLINEDATA",gLineData);
 console.time("graphing")
 var names = Object.keys(gLineData);
 d3.selectAll(".tooltips").remove();

   for(var i in gLineData){
	count++;
	  var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.style("background-color","black")
		.style("color", "white")
		.style("font-size","20px")
		.style("font-weight","bold")
    	.attr("class", "tip"+(classCount).toString() + " tooltips")
    	.text(i);
    
		var tips = ".tip"+(classCount).toString();

	if(!initial){
		var className = ".line" + (classCount).toString();
		    svg.selectAll(className).transition()
	  	   .attr("d", lineFn(gLineData[i]))
	  	   .attr("stroke", colors[idx])
       	   .attr("stroke-width", 4)
       	   .attr("stroke-linejoin", "round")
           .attr("class", "line"+(classCount).toString())
           .attr("fill", "none")

        svg.selectAll(className)
           .on("mouseover", function(){return d3.select(d3.select(this).attr("tip")).style("visibility", "visible");})
	  	   .on("mousemove", function(){return d3.select(d3.select(this).attr("tip")).style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
	  	   .on("mouseout", function(){return d3.select(d3.select(this).attr("tip")).style("visibility", "hidden");});

 		if(count % gColorMod == 0){
       		idx++;
   	    } 	
			if(!initial) {
				classCount++;
			}
   		} else {

	 svg.append("path")
	   .transition()
	   .attr("d", lineFn(gLineData[i]))
	   .attr("data", i)
	   .attr("tip",tips)
       .attr("stroke", colors[idx])
       .attr("stroke-width", 4)
  	   .attr("stroke-linejoin", "round")
       .attr("class", "line"+(classCount).toString() + " lines")
       .attr("fill", "none");

       svg.selectAll("path")
       .on("mouseover", function(){return d3.select(d3.select(this).attr("tip")).style("visibility", "visible");})
	   .on("mousemove", function(){return d3.select(d3.select(this).attr("tip")).style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
	   .on("mouseout", function(){return d3.select(d3.select(this).attr("tip")).style("visibility", "hidden");});


       if(count % gColorMod == 0){
       	   idx++;
       } 
		classCount++;
	   }
	}
     console.timeEnd("graphing")

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
	var start = 100000;
// #000066

for(var i =0; i< Object.keys(statistics_by_criteria).length;){
	var color = "#" + (start + i).toString();
	console.log(color)
	if(colors.indexOf(color) <= -1){
		colors.push(color);
		i++;
	};
	}
return colors;	
};


var addElement = function(type,name,id){
	var option = document.createElement(type);
	var text = document.createTextNode(name);
	option.appendChild(text);
	document.getElementById(id).appendChild(option);
};

var extractInfo = function(data){
	console.log("data", data)

}
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


var init = function(){
	initializeDataForGraph();

	document.getElementById("sort").addEventListener("click", function(e){
		e.preventDefault();
		graphing();
	});

	document.getElementById("cbox1").addEventListener("click", function(e){
		graphing();
		// graphing();
	});

	var graphing = function(){
	var checked = $("#cbox1")[0].checked;
	var domain = Object.keys(parsedQSet[op1]).map(function(num){
		if(parseInt(num)!== NaN){
			return parseInt(num);
		}
	});
	var index= document.getElementById("filter2").options.selectedIndex;
	var first = document.getElementById("filter1").options.selectedIndex;
	var selection =document.getElementById("filter1").options[first].innerHTML;
	var cat = '';

	if(index == 1 || index == 2){
		cat = "metric";
	} else if(index == 3 || index == 4){
		cat = "sex";
	} else if(index > 4 && index < 24){
		cat = "age_group"
	}
	
	console.log("PREV", previous)
	if(selection == "year"){
		ticks = Object.keys(parsedQSet.year).length;
		getGlobalData(parsedQSet,cat, op1, op2, op3);
		var upperYear = maxRange();

		if(checked){
		document.getElementsByTagName("svg")[0].remove();
		console.log(yearStart, years)
		setUpGraph(800,500,yearStart,yearStart+years.length,0,upperYear,3);
		initial = true;
		}	
		previous = "year"
	} else if(selection.indexOf("location") >= 0) {
		ticks = Object.keys(parsedQSet.location_id).length;
		getGlobalData(parsedQSet, cat, op1, op2, op3);
		var upperLoc = maxRange();

		if(checked){
		document.getElementsByTagName("svg")[0].remove();
		console.log(countryStart, country)
		setUpGraph(800,500,countryStart,countryStart+country.length,0,upperLoc,3);
		initial = true;
		}
		previous = "locations";
	} else if(selection.indexOf("age_group") >= 0){
		ticks = Object.keys(parsedQSet.age_group).length;
		getGlobalData(parsedQSet, cat, op1, op2, op3);
		var upperAge = maxRange();

		if(checked){
		document.getElementsByTagName("svg")[0].remove();
		console.log(countryStart, country)
		setUpGraph(800,500,agesStart,agesStart+ages.length,0,upperAge,3);
		initial = true;
		}
		previous = "ages"
	}	
	
	updateGraph();
	initial = false;
	$("#cbox1")[0].checked = false;
}
};

var initializeDataForGraph = function(){
	prettyJSON();

	years = Object.keys(parsedQSet.year);
	yearStart = parseInt(years[0]);
	country = Object.keys(parsedQSet.location_id);
	countryStart = parseInt(country[0]);
	ages = Object.keys(parsedQSet.age_group_id);
	agesStart = parseInt(ages[0]);
	previous = "year";

	var upper = d3.max(Object.keys(parsedQSet.upper).map(function(value){return parseFloat(value)}));
	var ticks = Object.keys(parsedQSet.year).length;
	setUpGraph(800,500,yearStart,yearStart+years.length,0,upper,3);

	// Set up options
	Object.keys(parsedQSet.location_name).forEach(function(n){addElement("option",n,"locations")});
	Object.keys(parsedQSet.year).forEach(function(n){addElement("option",n,"years")});
	Object.keys(parsedQSet.age_group).forEach(function(n){addElement("option",n,"ages")});
	Object.keys(parsedQSet.sex).forEach(function(n){addElement("option",n,"sex")});
	Object.keys(parsedQSet.metric).forEach(function(n){addElement("option",n,"metric")});
	orderBy.forEach(function(n){addElement("option",n,"filter1")});
	filter.forEach(function(n){addElement("option",n,"filter2")});
	statisticsBy.forEach(function(n){addElement("option",n,"filter3")});
}

// TESTING 

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


