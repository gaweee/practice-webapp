var bcrypt = require('bcrypt');
var cryptojs = require('crypto-js');
var _ = require('underscore');
var jwt = require('jsonwebtoken');

const SECRETKEY = 'loremipsumdolorsitamet';
const WEBTOKEN = 'zomgwtfbbq';

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('user', {
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1]
			}
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING,
			allowNull: false
		},
		password_hash: {
			type: DataTypes.STRING,
			allowNull: false
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [6,100]
			},
			set: function(password) {
				var salt = bcrypt.genSaltSync(10);

				this.setDataValue('password', password);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', bcrypt.hashSync(password, salt));
			}
		}
	}, {
		paranoid: true,

		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email === 'string')
					user.email = user.email.toLowerCase();
			}
		},

		classMethods: {
			login: function(email, password) {	
				return new Promise(function(resolve, reject) {
					if (!_.isString(email) || !_.isString(password))
						retject('Invalid Credentials');

					User.findOne({ where: { email: email.toLowerCase() } }).then(
						function(user) {
							if (user !== null && bcrypt.compareSync(password, user.password_hash)) {
								resolve(user);
							} else {
								reject("Invalid Password");
							}
						}
					);
				});
			}
		},

		instanceMethods: {
			toJSON: function() {
				var values = Object.assign({}, this.get());
			 	return _.omit(values, 'password', 'password_hash', 'salt');
			},

			generateToken: function(type) {
				if (!_.isString(type))
					return undefined;

				try {
					var encryptedData = cryptojs.AES.encrypt(JSON.stringify({ id: this.get('id'), type: type }), SECRETKEY).toString();
					return jwt.sign({
						token: encryptedData
					}, WEBTOKEN);
				} catch (e) {
					return undefined;
				}
			}
		}
	});

	return User;
};