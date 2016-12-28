var express = require('express');
var _ = require('underscore');
var db =require(__dirname + '/database.js');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');

var app = express();
const PORT = process.env.PORT || 3000;

var middleware = {
	logger: function(req, res, next) {
		console.log('Request ' + new Date().toString() + ' ' + req.method + ' '  + req.originalUrl);
		next();
	}
};

app.use(middleware.logger);
app.use(bodyParser.json());
app.use(expressValidator([]));




app.get('/todos', function(req, res) {
	where = {};

	if (req.query.hasOwnProperty('completed'))
		_.extend(where, { completed: req.sanitizeQuery('completed').toBoolean() });

	if (req.query.hasOwnProperty('title') && req.query.title.trim().length > 0)
		_.extend(where, { title: { $like: '%' + req.query.title.trim().toLowerCase() + '%' }});

	console.log(where);
	return db.todo.findAll({ where: where }).then(todos => {
		return res.json(todos);	
	}, error => {
		res.sendStatus(500).json(error);
	});
});


app.get('/todos/:id', function(req, res) {
	req.sanitizeParams('id').toInt();
	req.checkParams('id', 'Please provide a valid id').isInt();

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			var errors = _.reduce(result.array(), function(message, error) { return message + '<br /><strong>' + error.param.toUpperCase() + '</strong> - ' + error.msg; }, '');
			return res.status(400).send('There have been validation errors: ' + errors);
  		} else {
  			db.todo
				.findById(req.params.id)
				.then(todo => {
					if (todo === null) 
						return res.sendStatus(404);

					return res.json(todo);
				}, error => {
					res.sendStatus(500).json(error);
				});
  		}
  	});
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
			db.todo.create(_.pick(req.body, 'title', 'completed')).then(todo => {
				return res.json(todo.toJSON());	
			}, error => {
				res.sendStatus(500).json(error);
			});
  		}
	});
});


app.delete('/todos/:id', function(req, res) {
	req.sanitizeParams('id').toInt();
	req.checkParams('id', 'Please provide a valid id').isInt();

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			var errors = _.reduce(result.array(), function(message, error) { return message + '<br /><strong>' + error.param.toUpperCase() + '</strong> - ' + error.msg; }, '');
			return res.status(400).send('There have been validation errors: ' + errors);
  		} else {
  			db.todo
			.destroy({ where: {id: req.params.id }})
			.then(rows => {
				res.sendStatus(rows > 0 ? 200 : 404);
			}, error => {
				res.sendStatus(500).json(error);
			});
  		}
  	});
});


app.put('/todos/:id', function(req, res) {
	req.sanitizeParams('id').toInt();
	req.sanitizeBody('title').trim();
	req.sanitizeBody('completed').toBoolean();
	
	req.checkParams('id', 'Please provide a valid id').isInt();
	req.checkBody('title', 'Please provide a title').notEmpty();

	req.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			var errors = _.reduce(result.array(), function(message, error) { return message + '<br /><strong>' + error.param.toUpperCase() + '</strong> - ' + error.msg; }, '');
			return res.status(400).send('There have been validation errors: ' + errors);
  		} else {
  			db.todo
	  			.findById(req.params.id)
	  			.then(todo => {
	  				if (todo === null) 
						return res.sendStatus(404);

					_.extend(todo, _.pick(req.body, 'title', 'completed'));
					todo.save().then(todo => {
						return res.json(todo.toJSON());	
					}, error => {
						res.sendStatus(500).json(error);	
					});
	  			}, error => {
					res.sendStatus(500).json(error);
				});
		}
	});
});



// Setup Asset Folders
app.use(express.static(__dirname + '/public'));

// Setup Catch-All for 404
app.get('*', function(req, res){
	return res.sendStatus(404);
});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log("Application started");
	});	
});