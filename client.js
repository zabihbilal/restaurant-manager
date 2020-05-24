//The drop-down menu
let select = document.getElementById("restaurant-select");
//Stores the currently selected restaurant index to allow it to be set back when switching restaurants is cancelled by user
let currentSelectIndex = select.selectedIndex
//Stores the current restaurant to easily retrieve data. The assumption is that this object is following the same format as the data included above. If you retrieve the restaurant data from the server and assign it to this variable, the client order form code should work automatically.
let currentRestaurant;
//Stored the order data. Will have a key with each item ID that is in the order, with the associated value being the number of that item in the order.

//Dictionaries to store objects those are being called by the server
let order = {};
let restaurants = {};
//Array to store the name of the restaurants
let restaurantNames = [];

//Called on page load. Initialize the drop-down list, add event handlers, and default to the first restaurant.
function init(){
	//Makes an XML request from the server
	//GET type request to get the data of restautrants from the server
	let req = new XMLHttpRequest();
	req.onreadystatechange = function(){
		//checking if the status and state is ok then store response
		if(this.readyState == 4 && this.status == 200){
			//making the json being returned to an object and saving it in dictis
			restaurantNames = JSON.parse(req.responseText);
		}
	}
	//Get reqyest is made to a server to get the data that was stored earlier
	req.open("GET", '/restaurant',false);
	req.send();
	document.getElementById("restaurant-select").innerHTML = genDropDownList();
	document.getElementById("restaurant-select").onchange = selectRestaurant;
	selectRestaurant();
}

//Generate new HTML for a drop-down list containing all restaurants.
//For A2, you will likely have to make an XMLHttpRequest from here to retrieve the array of restaurant names.
function genDropDownList(){
	let result = '<select name="restaurant-select" id="restaurant-select">';
	restaurantNames.forEach(elem => {
		result += `<option value="${elem}">${elem}</option>`
	});
	result += "</select>";
	return result;
}

//Called when drop-down list item is changed.
//For A2, you will likely have to make an XMLHttpRequest here to retrieve the menu data for the selected restaurant
function selectRestaurant(){
	let result = true;
	
	//If order is not empty, confirm the user wants to switch restaurants.
	if(!isEmpty(order)){
		result = confirm("Are you sure you want to clear your order and switch menus?");
	}
	
	//If switch is confirmed, load the new restaurant data
	if(result){
		//Get the selected index and set the current restaurant
		let selected = select.options[select.selectedIndex].value;
		currentSelectIndex = select.selectedIndex;
		//In A2, current restaurant will be data you received from the server
		
		//Making an XML request for the menu data that is being called by the client
		//on Selecting a restaurant
		let req = new XMLHttpRequest();
		req.onreadystatechange = function(){
			if(this.readyState == 4 && this.status == 200){
				currentRestaurant = JSON.parse(req.responseText);
			}
		}
		req.open("GET", '/data/'+selected,false);
		req.send();
		
		//Update the page contents to contain the new menu
		document.getElementById("left").innerHTML = getCategoryHTML(currentRestaurant);
		document.getElementById("middle").innerHTML = getMenuHTML(currentRestaurant);
		
		//Clear the current oder and update the order summary
		order = {};
		updateOrder();
		
		//Update the restaurant info on the page
		let info = document.getElementById("info");
		info.innerHTML = currentRestaurant.name + "<br>Minimum Order: $" + currentRestaurant.min_order + "<br>Delivery Fee: $" + currentRestaurant.delivery_fee + "<br><br>";
	}else{
		//If they refused the change of restaurant, reset the selected index to what it was before they changed it
		let select = document.getElementById("restaurant-select");
		select.selectedIndex = currentSelectIndex;
	}
}

//Given a restaurant object, produces HTML for the left column
function getCategoryHTML(rest){
	//Storing keys of Objects those are menus
	let menu = rest.menu;
	let result = "<b>Categories<b><br>";
	Object.keys(menu).forEach(key =>{
		result += `<a href="#${key}">${key}</a><br>`;
		console.log(key);
	});
	return result;
}

//Given a restaurant object, produces the menu HTML for the middle column
function getMenuHTML(rest){
	let menu = rest.menu;
	let result = "";
	//For each category in the menu
	Object.keys(menu).forEach(key =>{
		result += `<b>${key}</b><a name="${key}"></a><br>`;
		//For each menu item in the category
		Object.keys(menu[key]).forEach(id => {
			item = menu[key][id];
			result += `${item.name} (\$${item.price}) <img src='add.jpg' style='height:20px;vertical-align:bottom;' onclick='addItem(${id})'/> <br>`;
			result += item.description + "<br><br>";
		});
	});
	return result;
}

//Responsible for adding one of the item with given id to the order and updating the summary
function addItem(id){
	if(order.hasOwnProperty(id)){
		order[id] += 1;
	}else{
		order[id] = 1;
	}
	updateOrder();
}

//Responsible for removing one of the items with given id from the order and updating the summary
function removeItem(id){
	if(order.hasOwnProperty(id)){
		order[id] -= 1;
		if(order[id] <= 0){
			delete order[id];
		}
		updateOrder();
	}
}

//Reproduces new HTML containing the order summary and updates the page
//This is called whenever an item is added/removed in the order
function updateOrder(){
	let result = "";
	let subtotal = 0;
	
	//For each item ID currently in the order
	Object.keys(order).forEach(id =>{
		//Retrieve the item from the menu data using helper function
		//Then update the subtotal and result HTML
		let item = getItemById(id);
		subtotal += (item.price * order[id]);
		result += `${item.name} x ${order[id]} (${(item.price * order[id]).toFixed(2)}) <img src='remove.jpg' style='height:15px;vertical-align:bottom;' onclick='removeItem(${id})'/><br>`;
	});
	
	//Add the summary fields to the result HTML, rounding to two decimal places
	result += `Subtotal: \$${subtotal.toFixed(2)}<br>`;
	result += `Tax: \$${(subtotal*0.1).toFixed(2)}<br>`;
	result += `Delivery Fee: \$${currentRestaurant.delivery_fee.toFixed(2)}<br>`;
	let total = subtotal + (subtotal*0.1) + currentRestaurant.delivery_fee;
	result += `Total: \$${total.toFixed(2)}<br>`;
	
	//Decide whether to show the Submit Order button or the Order X more label
	if(subtotal >= currentRestaurant.min_order){
		result += `<button type="button" id="submit" onclick="submitOrder()">Submit Order</button>`
	}else{
		result += `Add \$${(currentRestaurant.min_order - subtotal).toFixed(2)} more to your order.`;
	}
	document.getElementById("right").innerHTML = result;
}

//Simulated submitting the order
//For A2, you will likely make an XMLHttpRequest here
function submitOrder(){
	//making a POST XML request to store the order data for the stats pg ans summ
	let req = new XMLHttpRequest();
	let postData = {};
	let resName = currentRestaurant.name;
	postData[resName] = order;
	req.open("POST", "/submit", true);
	//Converting Objects to a string to show in simple plain text
	req.send(JSON.stringify(postData));
	alert("Order placed!!!");
	order = {};
	selectRestaurant();
}

//Helper function. Given an ID of an item in the current restaurant's menu, returns that item object if it exists.
function getItemById(id){
	let categories = Object.keys(currentRestaurant.menu);
	for(let i = 0; i < categories.length; i++){
		if(currentRestaurant.menu[categories[i]].hasOwnProperty(id)){
			return currentRestaurant.menu[categories[i]][id];
		}
	}
	return null;
}

//Helper function. Returns true if object is empty, false otherwise.
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}