var express = require('express');
var _ = require('underscore');
var db = require(__dirname + '/database.js');
var middleware = require(__dirname + '/middleware.js');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');


var app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(middleware.logger);
app.use(expressValidator());


app.get('/todos', function(req, res) {
	where = {};

	if (req.query.hasOwnProperty('completed'))
		_.extend(where, { completed: req.sanitizeQuery('completed').toBoolean() });

	if (req.query.hasOwnProperty('title') && req.query.title.trim().length > 0)
		_.extend(where, { title: { $like: '%' + req.query.title.trim().toLowerCase() + '%' }});

	return db.todo.findAll({ where: where }).then(results => {
		return res.json(results);	
	}, error => {
		return res.status(400).json(error);
	});
});


app.get('/todos/:id', middleware.requireId, function(req, res) {
	db.todo
		.findById(req.params.id)
		.then(result => {
			if (result === null) 
				return res.sendStatus(404);

			return res.json(result);
		}, error => {
			return res.status(400).json(error);
		});
});


app.post('/todos', function(req, res) {
	req.sanitizeBody('title').trim();
	req.sanitizeBody('completed').toBoolean(true);
	
	db.todo.create(_.pick(req.body, 'title', 'completed')).then(result => {
		return res.json(result.toJSON());	
	}, error => {
		return res.status(400).json(error);
	});
});


app.delete('/todos/:id', middleware.requireId, function(req, res) {
	db.todo.destroy({ where: {id: req.params.id }}).then(results => {
		return res.sendStatus(results > 0 ? 200 : 404);
	}, error => {
		return res.status(400).json(error);
	});
});


app.put('/todos/:id', middleware.requireId, function(req, res) {
	req.sanitizeBody('title').trim();
	req.sanitizeBody('completed').toBoolean(true);
	
	db.todo.findById(req.params.id).then(
		todo => {
			if (todo === null) 
				return res.sendStatus(404);

			_.extend(todo, _.pick(req.body, 'title', 'completed'));

			todo.save().then(
				result => {
					return res.json(result.toJSON());	
				}, error => {
					return res.status(400).json(error);	
				}
			);
		}
	);
});


app.post('/users', function(req, res) {
	req.sanitizeBody('name').trim();
	req.sanitizeBody('email').trim();
	req.sanitizeBody('email').normalizeEmail({ all_lowercase: true });
	req.sanitizeBody('password').trim();

	db.user.create(_.pick(req.body, 'name', 'email', 'password')).then(
		result => {
			return res.json(result.toJSON());	
		}, 
		error => {
			return res.status(400).json(error);
		}
	);
});


app.get('/users', function(req, res) {
	where = {};

	return db.user.findAll({ where: where }).then(results => {
		return res.json(results);	
	}, error => {
		return res.status(400).json(error);
	});
});

app.post('/users/login', function(req, res) {
	req.checkBody('email', 'Invalid email format').notEmpty().isEmail();
	req.checkBody('password').notEmpty();

	db.user.login(req.body.email, req.body.password).then(
		user => {
			res.header('Auth', user.generateToken('login'));
			return res.sendStatus(200);
		}, 
		error => {
			console.log(error);
			return res.sendStatus(401);
		}
	);
});

app.put('/users', middleware.requireToken, function(req, res) {
	req.sanitizeBody('name').trim();
	req.sanitizeBody('email').trim();
	req.sanitizeBody('email').normalizeEmail({ all_lowercase: true });
	req.sanitizeBody('password').trim();

	var user = req.user;
	_.extend(user, _.pick(req.body, 'name', 'email', 'password'));

	user.save().then(
		result => {
			return res.json(result.toJSON());	
		}, error => {
			return res.status(400).json(error);	
		}
	);
});


app.delete('/users', middleware.requireToken, function(req, res) {
	var user = req.user;
	user.destroy().then(results => {
		return res.sendStatus(200);
	}, error => {
		return res.status(400).json(error);
	});
});

app.get('/populate', function(req, res) {
	db.user.bulkCreate([
		{ name: 'Gary Teo', email: 'gaweee@gmail.com', password: '2353535PHD' },
		{ name: 'Gary Teo', email: 'gary@wits.sg', password: '2353535PHD' },
		{ name: 'Serena Ho', email: 'serenayc@gmail.com', password: 'zomgwftbbq' },
		{ name: 'Bond, Jame', email: 'james@mi6.co.uk', password: 'Password' }
	]);

	db.todo.bulkCreate([
		{ title: "Mop the floor", completed: false },
		{ title: "Wash the dishes", completed: false }, 
		{ title: "Call Mom", completed: false, },
		{ title: "Finish my antibiotics", completed: true, },
		{ title: "Clear 1 hour of lessons", completed: true, },
		{ title: "Complete 1 Mission on MGSV", completed: false, },
		{ title: "Buy Christmas Presents", completed: false, }
	]);

	return res.sendStatus(200);
});



// Setup Asset Folders
app.use(express.static(__dirname + '/public'));

// Setup Catch-All for 404
app.get('*', function(req, res){
	return res.sendStatus(404);
});

db.sequelize.sync({ force: true }).then(function() {
	app.listen(PORT, function() {
		console.log("Application started");
	});	
});