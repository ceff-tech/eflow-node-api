'use strict';

module.exports = (sequelize, DataTypes) => {
  const Gauge = sequelize.define('Gauge', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    stationName: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    geometry: {
      type: DataTypes.JSONB, // eslint-disable-line
      allowNull: true,
    },
    unimpairedStartYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unimpairedEndYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  Gauge.associate = models => {
    Gauge.belongsTo(models.Class, {
      foreignKey: 'classId',
      as: 'classes',
    });
    Gauge.hasMany(models.AllYear, {
      foreignKey: 'gaugeId',
      as: 'allYears',
    });
    Gauge.hasMany(models.Fall, {
      foreignKey: 'gaugeId',
      as: 'falls',
    });
    Gauge.hasMany(models.Spring, {
      foreignKey: 'gaugeId',
      as: 'springs',
    });
    Gauge.hasMany(models.Summer, {
      foreignKey: 'gaugeId',
      as: 'summers',
    });
    Gauge.hasMany(models.Winter, {
      foreignKey: 'gaugeId',
      as: 'winters',
    });
    Gauge.hasMany(models.Year, {
      foreignKey: 'gaugeId',
      as: 'years',
    });
  };
  return Gauge;
};
