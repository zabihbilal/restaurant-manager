//Importing Modules to be used later
const http = require('http');
const fs = require("fs");
const pug = require("pug");
const renderStatistics = pug.compileFile("./views/pages/stats.pug");
//Dictionaries to store Objects from the JSON files and to Keep track of Stats order
let restaurants = {};
let statistics = {};
//Calling the Directory and storing all the data in restra dictionay
fs.readdir("./restaurants", function(err,data){
	//Array Files in the directory
	console.log(data);
	setTimeout(function(){
		//This loop will go throught all the files in the directr
		//and store all the JSON type files in the restra dictionary
		for (let i=0 ; i<data.length ; i++){
			//JSON files in the directory
			//console.log(data[i]);
			fs.readFile("./restaurants/" + data[i], 'utf8', function(err,data1){
				//If there is an error Client will see an error msg on brow cons
				if(err){
					console.log("Error");
					console.log(err);
				}else{
					//Storing name of those obj files in resName
					let resName = JSON.parse(data1).name;
					restaurants[resName] = JSON.parse(data1);
					statistics[resName] = {resName: resName, popular: "", num_order: 0, avg_total: 0, item_freq: {}};
				}
				//List of all objects(Detail)
				//console.log(restaurants[i]);
				//console.log();			
			});
		}
	}, 1000);
})

//This Function is Getting the ID of the elements by iterating through the categ
//returns the items ids by going through the whole path of rest to menu to cats
function getItemByID(resName, id){
	let restaurant = restaurants[resName];
	let categories = Object.keys(restaurant.menu);
	for(let i = 0; i < categories.length; i++){
		if(restaurant.menu[categories[i]].hasOwnProperty(id)){
			return restaurant.menu[categories[i]][id];
		}
	}
	return null;
}
//This function returns the names of the Objects those are 
//used the most in the dictis for stats
function getMaxID(a){
	return Object.keys(a).filter(x => {
		return a[x] == Math.max.apply(null, 
		Object.values(a));
	 });
}
//Setting time out so the files are all loaded before the server starts and stored in the dicti
setTimeout(function(){
	//Creating a Server
	const server = http.createServer(function (request, response) {
		console.log("URL: " + request.url);
		//All The GET requests that the server will send when it matches the URL
		if(request.method === "GET"){
			//Server will look for these URLS and send back the nessessary info
			if(request.url === "/home.html" || request.url === "/"){	
				fs.readFile("home.html", function(err, data){
				//If there is an error Client will see an error msg on brow cons
					if(err){
						response.statusCode = 500;
						response.end("Error reading file.");
						return;
					}
					//No error success status returned, type of file send set as header
					//This set headr tells the browser what type of file is being passed
					response.statusCode = 200;
					response.setHeader("Content-Type", "text/html");
					response.end(data);
				});
			}else if(request.url === "/orderform.html" || request.url === "/restaurants"){
				fs.readFile("orderform.html", function(err, data){
				//If there is an error Client will see an error msg on brow cons
					if(err){
						response.statusCode = 500;
						response.end("Error reading file.");
						return;
					}
					//No error success status returned, type of file send set as header
					//This set headr tells the browser what type of file is being passed
					response.statusCode = 200;
					response.setHeader("Content-Type", "text/html");
					response.end(data);
				});
			} else if (request.url === "/stats.html") {
				//console.log("TEST")
				let content = renderStatistics({statistics});
				response.statusCode = 200;
				response.setHeader("Content-Type", "text/html");
				response.end(content);
			} else if(request.url === "/client.js"){
				fs.readFile("client.js", function(err, data){
				//If there is an error Client will see an error msg on brow cons
					if(err){
						response.statusCode = 500;
						response.end("Error reading file.");
						return;
					}
					//No error success status returned, type of file send set as header
					//This set headr tells the browser what type of file is being passed
					response.statusCode = 200;
					response.setHeader("Content-Type", "application/javascript");
					response.end(data);
				});
			}else if (request.url === "/restaurant") {
				response.statusCode = 200;
				response.setHeader("Content-Type", "application/json");
				console.log(restaurants);
				response.end(JSON.stringify(Object.keys(restaurants)));
			}else if (request.url.startsWith("/data/")) {
				let resName = request.url.slice(6);
				resName = resName.replace(/%20/g, " ");
				resName = resName.replace(/%27/g, "'");

				response.statusCode = 200;
				response.setHeader("Content-Type", "application/json");
				response.end(JSON.stringify(restaurants[resName]));

			}else if(request.url === "/add.jpg"){
				fs.readFile("./add.jpg", function(err, data){
				//If there is an error Client will see an error msg on brow cons
					if(err){
						response.statusCode = 500;
						response.end("Error reading file.");
						return;
					}
					//No error success status returned, type of file send set as header
					//This set headr tells the browser what type of file is being passed
					response.statusCode = 200;
					response.setHeader("Content-Type", "image/gif");
					response.end(data);
				});
			}else if(request.url === "/remove.jpg"){
				fs.readFile("./remove.jpg", function(err, data){
				//If there is an error Client will see an error msg on brow cons
					if(err){
						response.statusCode = 500;
						response.end("Error reading file.");
						return;
					}
					//No error success status returned, type of file send set as header
					//This set headr tells the browser what type of file is being passed
					response.statusCode = 200;
					response.setHeader("Content-Type", "image/gif");
					response.end(data);
				});
			}
			else{
				response.statusCode = 404;
				response.end("Unknown resource.1");
			}
		}
		//POST request for the server to store the data for status 
		//It will upload all the data as soon as order is placed 
		else if(request.method === "POST"){
			if(request.url === "/submit"){
				let body = '';

			request.on('data', function (data) {
				body += data;
			});
			//Passing in values to the vars to updated the values and pg
			request.on('end', function () {
				let order = JSON.parse(body);
				let resName = Object.keys(order)[0];
				let itemIDs = Object.keys(order[resName]);
				let total = 0;
				//Setting values for the status to view later
				statistics[resName].num_order++;
				for(let i = 0; i < itemIDs.length; i++){
					let itemID = itemIDs[i];

					if(statistics[resName].item_freq[itemID]){
						statistics[resName].item_freq[itemID] += order[resName][itemID];
					}
					else{
						statistics[resName].item_freq[itemID] = order[resName][itemID];
					}

					total += getItemByID(resName, itemID).price;
				}
				total += restaurants[resName].delivery_fee;
				statistics[resName].avg_total += (statistics[resName].avg_total * (statistics[resName].num_order - 1) + total)/statistics[resName].num_order;
				statistics[resName].avg_total = (statistics[resName].avg_total);
				//statistics[resName].avg_total = (statistics[resName].avg_total).toFixed(2);
				statistics[resName].popular = getItemByID(resName, getMaxID(order[resName])).name;

				//console.log(statistics);
			});

			response.statusCode = 200;
			response.setHeader("Content-Type", "application/json");
			response.end();
		}//if error generating error on broser in plain text
			else{
				response.statusCode = 404;
				response.end("Unknown resource.1");
			}
		}
		//if error generating error on broser in plain text
		 else{
			response.statusCode = 404;
			response.end("Unknown resource.2");
		}
	});

	//Server listens on port 3000
	server.listen(3000);
	console.log('Server running at http://127.0.0.1:3000/');
}, 1500);