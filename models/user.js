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
			// unique: true,
			validate: {
				isEmail: true,
				isUnique: function(value, next) {
					var self = this;
                    User.find({where: {email: value}})
                        .then(function (user) {
                            if (user && self.id !== user.id) {
                                return next('Email already in use');
                            }
                            return next();
                        })
                        .catch(function (error) {
                            return next(error);
                        });
				}
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
				var salt = this.get('salt');
				if (_.isNull(salt) || _.isUndefined(salt) || _.isEmpty(salt)) {
					salt = bcrypt.genSaltSync(10);
					this.setDataValue('salt', salt);
				}

				this.setDataValue('password', password);
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
			},

			findByToken: function(token) {
				return new Promise(function(resolve, reject) {
					try {
						var decodedToken = jwt.verify(token, WEBTOKEN);
						var decryptedBytes = cryptojs.AES.decrypt(decodedToken.token, SECRETKEY);
						var data = JSON.parse(decryptedBytes.toString(cryptojs.enc.Utf8));

						if (!_.isNumber(data.id))
							reject('Invalid Id');

						User.findById(data.id).then(
							user => {
								if (user === null)
									reject();

								resolve(user);
							},
							error => {
								reject(error);
							}
						);
					} catch (error) {
						reject(error);
					}
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
				} catch (error) {
					return undefined;
				}
			}
		}
	});

	return User;
};