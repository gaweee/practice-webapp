var bcrypt = require('bcrypt');
var _ = require('underscore');

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('user', {
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
			set: function(value) {
				var salt = bcrypt.genSaltSync(10);
				var hash = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hash);
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
		instanceMethods: {
			toJSON: function() {
				var values = Object.assign({}, this.get());
			 	return _.omit(values, 'password', 'password_hash', 'salt');
			}
		}
	});
};