module.exports = function(sequelize, DataTypes) {
	var Todo = sequelize.define('todo', 
		{
			title: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					len: [1, 250]
				}
			},
			completed: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			}
		},
		{
			paranoid: true,
		}
	);

	return Todo;
};