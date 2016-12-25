var express = require("express");
var app = express();
const PORT = process.env.PORT || 3000;


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

// Setup Asset Folders
app.use(express.static(__dirname + '/public'));


// Setup Catch-All for 404
app.get('*', function(req, res){
  res.sendStatus(404);
});

app.listen(PORT, function() {
	console.log("Application started");
});