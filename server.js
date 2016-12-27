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
	logger: function(req, res, next) {
		console.log('Request ' + new Date().toString() + ' ' + req.method + ' '  + req.originalUrl);
		next();
	}
};

app.use(middleware.logger);
app.use(bodyParser.json());
app.use(expressValidator([]));

app.get('/todos/:id', function(req, res) {
	if (!_.isFinite(req.params.id))
		throw new Error("Invalid Id");

	var id = parseInt(req.params.id, 10);
	var todo = _.findWhere(todos, { id: id });

	if (typeof todo !== 'undefined') {
		return res.json(todo).send();
	} else {
		res.sendStatus(404);
	}
});

app.delete('/todos/:id', function(req, res) {
	if (!_.isFinite(req.params.id))
		throw new Error("Invalid Id");

	var id = parseInt(req.params.id, 10);
	var todo = _.findWhere(todos, { id: id });

	if (typeof todo !== 'undefined') {
		todos = _.without(todos, todo);
		return res.json(todo).send();
	} else {
		return res.sendStatus(404);
	}
});

app.put('/todos/:id', function(req, res) {
	if (!_.isFinite(req.params.id))
		throw new Error("Invalid Id");

	var id = parseInt(req.params.id, 10);
	var todo = _.findWhere(todos, { id: id });

	if (typeof todo !== 'undefined') {
		req.sanitizeBody('title').trim();
		req.sanitizeBody('completed').toBoolean();

		req.checkBody('title', 'Please provide a title').notEmpty();

		req.getValidationResult().then(function(result) {
    		if (!result.isEmpty()) {
    			var errors = _.reduce(result.array(), function(message, error) { return message + '<br /><strong>' + error.param.toUpperCase() + '</strong> - ' + error.msg; }, '');
				return res.status(400).send('There have been validation errors: ' + errors);
      		} else {
      			var body = _.pick(req.body, 'title', 'completed');
				_.extend(todo, body);
				return res.json(todo).send();
      		}
		});
	} else {
		return res.sendStatus(404);
	}
});

app.get('/todos', function(req, res) {
	return res.json(todos).send();
});

app.post('/todos', function(req, res) {
	req.sanitizeBody('title').trim();
	req.sanitizeBody('completed').toBoolean();

	req.checkBody('title', 'Please provide a title').notEmpty();

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			var errors = _.reduce(result.array(), function(message, error) { return message + '<br /><strong>' + error.param.toUpperCase() + '</strong> - ' + error.msg; }, '');
			return res.status(400).send('There have been validation errors: ' + errors);
  		} else {
  			var body = _.pick(req.body, 'title', 'completed');
			var todo = _.extend({ id: _.max(todos, function(item) { return item.id; }).id + 1 }, body);
			todos.push(todo);

			return res.json(todo).send();
  		}
	});
	
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
