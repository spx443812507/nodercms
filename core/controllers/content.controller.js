var async = require('async');
var _ = require('lodash');
var siteInfoService = require('../services/site-info.service');
var categoriesService = require('../services/categories.service');
var contentsService = require('../services/contents.service');
var listsService = require('../services/lists.service');

/**
 * 内容
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function (req, res, next) {
  contentsService.one({
    _id: req.query.id
  }, function (err, content) {
    if (err) return res.status(500).end();

    if (!content) return next();

    var categoryPath = _(content.url).split('/').initial().join('/');

    async.auto({
      siteInfo: siteInfoService.get,
      navigation: function (callback) {
        categoriesService.navigation({ }, callback);
      },
      category: function (callback) {
        categoriesService.one({
          path: categoryPath,
          type: 'column'
        }, function (err, category) {
          if (err) return callback(err);
          if (!category) return callback('没有找到 Category');

          callback(null, category);
        });
      },
      localReadingTotal: ['category', function (callback, results) {
        listsService.reading({ _id: results.category._id }, callback);
      }],
      localReadingDay: ['category', function (callback, results) {
        listsService.reading({ _id: results.category._id, sort: '-reading.day' }, callback);
      }],
      localReadingWeek: ['category', function (callback, results) {
        listsService.reading({ _id: results.category._id, sort: '-reading.week' }, callback);
      }],
      localReadingMonth: ['category', function (callback, results) {
        listsService.reading({ _id: results.category._id, sort: '-reading.month' }, callback);
      }]
    }, function (err, results) {
      if (err && !results.category) return next();
      if (err) return res.status(500).end();

      res.status(200).json({
        layout: _.get(results.category, 'views.layout'),
        siteInfo: results.siteInfo,
        navigation: results.navigation,
        category: results.category,
        readingList: {
          total: results.localReadingTotal,
          day: results.localReadingDay,
          week: results.localReadingWeek,
          month: results.localReadingMonth
        },
        title: content.title,
        url: content.url,
        href: content.href,
        user: content.user,
        date: content.date,
        reading: content.reading,
        thumbnail: content.thumbnail,
        media: content.media,
        abstract: content.abstract,
        content: content.content,
        tags: content.tags,
        extensions: content.extensions
      });
    });
  });
};
