var bcrypt = require('bcrypt');
var _ = require('underscore');

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
				this.setDataValue('password_hash', this.hashPassword(password));
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
					User.findOne({ where: { email: email.toLowerCase() } }).then(
						function(user) {
							if (user !== null && user.password_hash == user.hashPassword(password)) {
								resolve();
							} else {
								reject();
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

			hashPassword: function(password) {
				return bcrypt.hashSync(password, this.salt);
			}
		}
	});

	return User;
};