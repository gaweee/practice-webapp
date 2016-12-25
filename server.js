var express = require("express");
var app = express();
const PORT = process.env.PORT || 3000;

var todos = [
	{
		id: 1,
		title: 'Meet mom for lunch',
		completed: false
	},
	{
		id: 2,
		title: 'Cook for wife',
		completed: true
	}
];


var middleware = {
	requireAuth: function(req, res, next) {
		console.log('private route hit');
		next();
	},

	logger: function(req, res, next) {
		console.log('Request ' + new Date().toString() + ' ' + req.method + ' '  + req.originalUrl);
		next();
	}
};

app.use(middleware.logger);

app.get('/about', middleware.requireAuth, function(req, res) {
	res.send('About Us!');
});

app.get('/todos', function(req, res) {
	res.json(todos);
});

// Setup Asset Folders
app.use(express.static(__dirname + '/public'));


// Setup Catch-All for 404
app.get('*', function(req, res){
  res.sendStatus(404);
});

app.listen(PORT, function() {
	console.log("Application started");
});