var db = require(__dirname + '/database.js');

module.exports = {
	logger: (req, res, next) => {
		console.log('Request ' + new Date().toString() + ' ' + req.method + ' '  + req.originalUrl);
		next();
	},

	requireId: (req, res, next) => {
		var validator = db.Sequelize.Validator;
		if (!validator.isInt('' + req.params.id, { allow_leading_zeroes: true }))
	 		return res.status(400).send('Please provide a valid id');

	 	req.params.id = validator.toInt(req.params.id);
	 	next();
	},

	requireToken: (req, res, next) => {
		var token = req.get('Auth');
		db.user.findByToken(token).then(
			user => {
				req.user = user;
				next();
			}, 
			error => {
				(console.log(error));
				res.sendStatus(401);
			}
		);
	}
};