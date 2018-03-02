import csv from 'csvtojson';
import axios from 'axios';
import {parseString} from 'xml2js';
import request from 'request';

const Fall = require('../models').Fall;
const AllYear = require('../models').AllYear;
const FallWinter = require('../models').FallWinter;
const Spring = require('../models').Spring;
const Summer = require('../models').Summer;
const Winter = require('../models').Winter;
const Year = require('../models').Year;
const AnnualFlow = require('../models').AnnualFlow;
const GeoClass = require('../models').GeoClass;

import geoData from '../static/classification';

import metricReference from '../static/metricReference';

const _getFileKeys = async (url, folder) => {
  const responseXML = await axios.get(url);
  return new Promise(resolve => {
    parseString(responseXML.data, (err, result) => {
      const fileNames = result.ListBucketResult.Contents.map(ele => ele.Key[0]);
      const filtered = fileNames.filter(name => {
        const splitted = name.split('/');
        return Boolean(splitted[0].includes(folder) && splitted[1]);
      });
      resolve(filtered);
    });
  });
};

const _inputFlowToDatabase = (result, file) => {
  Object.keys(result).forEach(key => {
    AnnualFlow.create({
      year: key,
      flowData: result[key],
      gaugeId: Number(file.slice(19, -4)),
    });
  });
};

export const uploadFlowDataToDatabase = async () => {
  console.log('Flow Data updating...'); // eslint-disable-line
  const new_url = process.env.S3_URL;
  try {
    await AnnualFlow.destroy({where: {}});
    const fileNames = await _getFileKeys(new_url, 'annual_flow_matrix');
    fileNames.forEach(file => {
      const csvFilePath = `${new_url}${file}`;
      let firstRow = true;
      const result = {};
      const mapping = {};
      csv({
        noheader: true,
      })
        .fromStream(request.get(csvFilePath))
        .on('csv', csvRow => {
          if (firstRow) {
            csvRow.forEach((ele, index) => {
              result[Number(ele)] = [];
              mapping[index] = Number(ele);
              firstRow = false;
            });
          } else {
            csvRow.forEach((ele, index) => {
              result[mapping[index]].push(ele);
            });
          }
        })
        .on('done', () => _inputFlowToDatabase(result, file));
    });
  } catch (e) {
    throw e;
  }
};

export const uploadResultToDatabase = async () => {
  console.log('Result Data updating...'); // eslint-disable-line
  const new_url = process.env.S3_URL;
  try {
    await Year.destroy({where: {}});
    await AllYear.destroy({where: {}});
    await Fall.destroy({where: {}});
    await Winter.destroy({where: {}});
    await Summer.destroy({where: {}});
    await Spring.destroy({where: {}});
    await FallWinter.destroy({where: {}});
    const fileNames = await _getFileKeys(new_url, 'annual_flow_result');
    fileNames.forEach(file => {
      const csvFilePath = `${new_url}${file}`;
      const current_result = {
        Year: {},
        AllYear: {},
        Spring: {},
        Summer: {},
        Fall: {},
        FallWinter: {},
        Winter: {},
      };
      csv({
        noheader: true,
      })
        .fromStream(request.get(csvFilePath))
        .on('csv', csvRow => {
          if (!metricReference[`${csvRow[0]}`]) {
            return;
          }
          const seasonName = metricReference[`${csvRow[0]}`][0];
          const dataEntryName = metricReference[`${csvRow[0]}`][1];
          current_result[seasonName][dataEntryName] = csvRow.slice(1);
          current_result[seasonName].gaugeId = Number(file.slice(19, -25));
        })
        .on('done', () => {
          Year.create(current_result.Year);
          AllYear.create(current_result.AllYear);
          Spring.create(current_result.Spring);
          Summer.create(current_result.Summer);
          Fall.create(current_result.Fall);
          FallWinter.create(current_result.FallWinter);
          Winter.create(current_result.Winter);
        });
    });
  } catch (e) {
    throw e;
  }
};

export const uploadGeoClassToDatabase = async () => {
  console.log('GeoClass Data updating...'); // eslint-disable-line
  try {
    await GeoClass.destroy({where: {}});

    geoData.features.forEach(data => {
      GeoClass.create({
        geometry: data.geometry,
        classId: data.properties.CLASS,
      });
    });
  } catch (e) {
    throw e;
  }
};