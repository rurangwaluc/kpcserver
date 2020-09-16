const Category = require('../models/category');
const {
  errorHandler
} = require('../helpers/dbErrorHandler');



exports.categoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, category) => {
    if (err || !category) {
      return res.status(400).json({
        error: 'Category does not exist'
      });
    }
    req.category = category;
    next();
  });
};

exports.read = (req, res) => {
  return res.json(req.category);
};

exports.create = (req, res) => {

  const category = new Category(req.body);

  category.save((err, data) => {
    if (err) {
      return res.status(400).json({
        err: errorHandler(err)
      });
    };
    res.json({
      data
    });
  });
};

exports.update = (req, res) => {
  console.log('req.body', req.body);
  console.log('category update param', req.params.categoryId);

  const category = req.category;
  category.name = req.body.name;
  category.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json(data);
  });
};


exports.remove = (req, res) => {
  const category = req.category;
  // Product.find({
  //   category
  // }).exec((err, data) => {
  //   if (data.length >= 1) {
  //     return res.status(400).json({
  //       message: `Sorry. You can't delete ${category.name}. It has ${data.length} associated products.`
  //     });
  //   } else {
  category.remove((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({
      message: 'Category deleted'
    });
    //   });
    // }
  });
};

exports.list = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 10;
  Category.find().limit(limit).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json(data);
  });
};