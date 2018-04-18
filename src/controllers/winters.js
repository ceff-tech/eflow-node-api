import {Winter, Gauge} from '../models';
import {
  getGaugeBoxPlotObject,
  ClassBoxPlot,
  nonDimValues,
  gaugeNonDimValues,
} from '../utils/helpers';

module.exports = {
  show(req, res) {
    return Winter.find({gaugeId: req.body.gaugeId})
      .then(allYear => res.status(200).send(allYear))
      .catch(err => res.status(400).send(err));
  },

  async getBoxPlotAttributes(req, res) {
    if (!req.body.metric && Boolean(!req.body.gaugeId || !req.body.classId)) {
      res.status(400).send({message: 'Missing attributes'});
    }
    try {
      //Search based on classId
      if (req.body.classId) {
        let metrics = await Winter.findAll({
          attributes: [req.body.metric],
          where: {
            '$gauge.classId$': req.body.classId,
          },
          include: [
            {
              model: Gauge,
              as: 'gauge',
              attributes: ['id'],
            },
          ],
        });

        if (!req.body.metric.includes('timing')) {
          metrics = await nonDimValues(req, metrics);
        }

        const boxPlotClass = new ClassBoxPlot(
          metrics,
          req.body.metric,
          'Winter'
        ).boxPlotDataGetter;

        return res.status(200).send(boxPlotClass);
      }

      //Search based on gaugeId
      let metric = await Winter.findAll({
        attributes: [req.body.metric],
        where: {
          gaugeId: req.body.gaugeId,
        },
      });

      if (!req.body.metric.includes('timing')) {
        metric = await gaugeNonDimValues(req, metric);
      }

      const boxPlotAttributes = getGaugeBoxPlotObject(
        metric[0][req.body.metric],
        req.body.metric,
        'Winter'
      );

      return res.status(200).send(boxPlotAttributes);
    } catch (e) {
      res.status(400).send(e.toString());
    }
  },
};
