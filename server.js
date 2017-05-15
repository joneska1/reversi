var static = require('node-static');
var http = require('http');

var port = process.env.PORT;
var directory = __dirname + '/public';

if(typeof port == 'undefined' || !port){
	directory = './public';
	port = 8080;
}

var file = new static.Server(directory);

var app = http.createServer(
	function(request,response){
		request.addListener('end',
			function(){
				file.serve(request,response);
			}
		).resume();
	}
   ).listen(port);
console.log('The Server is running! Woohoo!');
