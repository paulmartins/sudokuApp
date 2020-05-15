import styles1 from './css/footer.css'
import styles2 from './css/grid-input.css'


/* Nav bar (tabs) in input card */
$('#input-type a').on('click', function (e) {
  e.preventDefault()
  $(this).tab('show')
})


function fillTestGrid() {
	var grid_input = [
	5,0,3,0,7,0,8,0,6, 
	0,0,0,0,2,0,0,0,0, 
	8,0,0,5,0,1,0,0,9, 
	0,0,5,0,0,0,7,0,0, 
	2,3,0,0,0,0,0,9,8, 
	0,0,4,0,0,0,3,0,0,
	9,0,0,6,0,3,0,0,4,
	0,0,0,0,4,0,0,0,0,
	4,0,6,0,1,0,5,0,3
	];
	// Fill the input grid
    var $grid_form = $('#submit-grid-form :input');
    $grid_form.each(function(i) {
        if(grid_input[i] != 0){
        	this.value = grid_input[i];
        } 
        else {
        	this.value = null;
        }
    });
}
document.getElementById("btn-test-grid").onclick = fillTestGrid;


function clearInputGrid(){
	document.getElementById("no-solution-msg").style.display = "none";
	document.getElementById("grid-not-detected-msg").style.display = "none";
	// Fill the input grid with empty value
    var $grid_form = $('#submit-grid-form :input');
    $grid_form.each(function(i) {
        this.value = null;
    });
}


function clearInputPicture(){
	document.getElementById("no-solution-msg").style.display = "none";
	document.getElementById("grid-not-detected-msg").style.display = "none";
	document.getElementById("photofile").files = null;
	document.getElementById("photolabel").innerHTML = 'Choose file';
	document.getElementById("photodiv").innerHTML = null;
}


function clearSolutionGrid(){
    var $grid_sol = $('#solution-grid-form :input');
    $grid_sol.each(function(i) {
        this.value = null;
        this.style.color = null;
        if ([3,4,5,12,13,14,21,22,23,27,28,29,33,34,35,36,37,38,42,43,44,45,46,47,51,52,53,57,58,59,66,67,68,75,76,77].includes(i)){
        	this.className = 'form-control bg-white';
            this.style.backgroundColor = 'white';
        }
       	else{
       		this.className = "form-control";
        	this.style.backgroundColor = null;
       	}
    });
}


function clearGrid() {
	clearInputGrid();
	clearInputPicture();
	clearSolutionGrid();
}
document.getElementById("btn-clear-grid").onclick = clearGrid;
document.getElementById("btn-clear-solution").onclick = clearGrid;


/* Generate unique id for grid id */
function uuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}


// Register handler upon submitting the grid form 
$(function onDocReady() {
    $('#submit-grid-form').submit(handleSendGridRequest);
});


function handleSendGridRequest(event) {
	// switch buttons and spinner
	document.getElementById("spinner").style.display = "block";
	document.getElementById("solution-grid").style.display = "none";
	document.getElementById("btn-send-grid").disable = "true";
    var grid_id = uuid();
    // fill the input_grid
    var input_grid = [];
    var $inputs = $('#submit-grid-form :input');
    $inputs.each(function() {
    	if($(this).val() === ''){
    		input_grid.push(parseInt(0));
    	}
    	else{
    		input_grid.push(parseInt($(this).val()));
        }
    });
    input_grid.pop(); // remove the last input_grid (as it's the button input)
    console.log('Sending grid to SQS \n', input_grid);
    event.preventDefault();
    sendGrid(input_grid, grid_id); 
    getSolution(grid_id);
}

// Send the grid to SQS
function sendGrid(input_grid, grid_id) {
    $.ajax({
        method: 'POST',
        url: process.env.api_invokeUrl + '/sendgrid',
        headers: {
            'x-api-key' : process.env.api_key
        },
        data: JSON.stringify({
        	grid_id: grid_id,
            input_matrix: input_grid
        }),
        contentType: 'application/json',
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
            console.error('Error requesting sudoku solution: ', textStatus, ', Details: ', errorThrown);
            console.error('Response: ', jqXHR.responseText);
            alert('An error occured when requesting your sudoku solution:\n' + jqXHR.responseText);
        }
    });
}

// Check if solution has been returned in DynamoDB
function getSolution(grid_id) {
	var solution = [];
	console.log(grid_id);
	$.ajax({
        method: 'GET',
        headers: {
            'x-api-key' : process.env.api_key
        },
        url: process.env.api_invokeUrl + '/getgrid/' + grid_id,
        success: function(data) {
            console.log(data);
            // if not found in DynamoDB, keep polling API every 2.5 sec
            if(data['Count'] <= 0) {
				setTimeout(function(){
            	    getSolution(grid_id);
            	}, 2500);
            }
            else {
            	document.getElementById("spinner").style.display = "none";
            	document.getElementById("btn-send-grid").disable = "false";
            	document.getElementById("solution-grid").style.display = "block";
            	fillSolutionGrid(data);
            }
        }
    });
}

function fillSolutionGrid(data, input_grid) {
	var solution = data['Items'][0]["solution"]["S"];
	var input_grid = JSON.parse(data['Items'][0]["input"]["S"]);
    console.log('Grid read from dynamo DB:', input_grid, solution);
    if(solution === "No solution found"){
    	document.getElementById("no-solution-msg").style.display = "block";
    	clearSolutionGrid();
    }
    else if (solution === 'Grid could not be read'){
    	document.getElementById("grid-not-detected-msg").style.display = "block";
    	clearSolutionGrid();
    }
    else {
    	document.getElementById("no-solution-msg").style.display = "none";
    	document.getElementById("grid-not-detected-msg").style.display = "none";
    	var $grid_result = $('#solution-grid-form :input');
    	$grid_result.each(function(i) {
    	    this.value = JSON.parse(solution)[i];
    	    if(parseInt(input_grid[i]) != 0) {
    	        this.style.color = "white";
    	        this.className = 'form-control bg-black';
    	        this.style.backgroundColor = 'black';
    	    }
    	});
    }
}


var AWS = require("aws-sdk");
AWS.config.region = process.env.cognito_region; 
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.cognito_identityPoolId,
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: process.env.s3_pictureBucketName }
});

// Update file picker with filename selected
$('#photofile').on('change',function(){
	var fieldVal = $(this).val();
	fieldVal = fieldVal.replace("C:\\fakepath\\", "");
	if (fieldVal != undefined || fieldVal != "") {
		$(this).next(".custom-file-label").attr('data-content', fieldVal);
		$(this).next(".custom-file-label").text(fieldVal);
	}
})

function uploadPhoto() {
	var files = document.getElementById("photofile").files;  
	if (!files.length) {
		return alert("Please choose a file to upload first.");
	}
	var grid_id = uuid();
	var photoKey = encodeURIComponent('incoming') + "/" + grid_id + '.png';
	// Use S3 ManagedUpload class as it supports multipart uploads
  	var upload = new AWS.S3.ManagedUpload({
  		params: {
  			Bucket: process.env.s3_pictureBucketName,
  			Key: photoKey,
  			Body: files[0],
  			ACL: "public-read"
  		}
  	});

  	var promise = upload.promise();
  	promise.then(
  		function(data, grid_id) {
  			console.log(data['key'].replace(/incoming\//,"").replace(/\.[^/.]+$/, ""));
  			alert("Successfully uploaded photo.");
  			document.getElementById("photodiv").innerHTML = '<img style="width:256px;height:256px;" src="' + data.Location + '"/>';
  			document.getElementById("spinner").style.display = "block";
			document.getElementById("solution-grid").style.display = "none";
  			getSolution(data['key'].replace(/incoming\//,"").replace(/\.[^/.]+$/, ""));
  		},
  		function(err) {
  			return alert("There was an error uploading your photo: ", err.message);
  		}
  	);
}
document.getElementById("photoupload").onclick = uploadPhoto;




