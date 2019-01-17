var async = require('async');
var _ = require('lodash');
var siteInfoService = require('../services/site-info.service');
var pagesService = require('../services/pages.service');
var categoriesService = require('../services/categories.service');

/**
 * 单页
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
  // 查询单页
  pagesService.one({
    _id: req.query.id
  }, function(err, page) {
    if (err) return res.status(500).end();

    if (!page) return next();

    // 读取单页所需数据
    async.parallel({
      siteInfo: siteInfoService.get,
      navigation: function(callback) {
        categoriesService.navigation({current: page.path}, callback);
      }
    }, function(err, results) {
      res.status(200).json({
        layout: page.views.layout,
        siteInfo: results.siteInfo,
        navigation: results.navigation,
        category: page,
        content: page.mixed.pageContent,
        media: page.mixed.pageMedia
      });
    });
  });
};
