var express = require('express');
var _ = require('underscore');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');

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
app.use(bodyParser.json());
app.use(expressValidator([]));

app.get('/about', middleware.requireAuth, function(req, res) {
	res.send('About Us!');
});

app.get('/todos/:id', function(req, res) {
	if (!_.isFinite(req.params.id))
		throw new Error("Invalid Id");

	var id = parseInt(req.params.id, 10);
	var todo = _.findWhere(todos, { id: id });

	if (typeof todo !== 'undefined')
		return res.json(todo).send();
	
	res.sendStatus(404);
});

app.get('/todos', function(req, res) {
	return res.json(todos).send();
});

app.post('/todos', function(req, res) {
	req.sanitizeBody('title').trim();
	req.sanitizeBody('completed').toBoolean();


	req.checkBody('title', 'Please provide a title').notEmpty();
	var todo = {
		id: _.max(todos, function(item) { return item.id; }).id + 1,
		title: req.body.title,
		completed: req.body.completed
	};

	todos.push(todo);
	return res.json(todo).send();
});

// Setup Asset Folders
app.use(express.static(__dirname + '/public'));

// Setup Catch-All for 404
app.get('*', function(req, res){
	return res.sendStatus(404);
});

app.listen(PORT, function() {
	console.log("Application started");
});
