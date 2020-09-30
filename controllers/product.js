const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const multer = require('multer');
const Product = require('../models/product');
const {
  errorHandler
} = require('../helpers/dbErrorHandler');





let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`)
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    if (ext !== '.jpg' || ext !== '.png') {
      return cb(res.status(400).end('only jpg, png are allowed'), false);
    }
    cb(null, true)
  }
})

let upload = multer({
  storage: storage
}).single("file")


//=================================
//             Product
//=================================

exports.uploadImage = (req, res) => {

  upload(req, res, err => {
    if (err) {
      return res.json({
        success: false,
        err
      })
    }
    return res.json({
      success: true,
      image: res.req.file.path,
      fileName: res.req.file.filename
    })
  })

};


exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate('writer')
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: 'Product not found'
        });
      }
      req.product = product;
      next();
    });
};

exports.create = (req, res) => {
  //save all the data we got from the client into the DB 
  const product = new Product(req.body)

  product.save((err) => {
    if (err) return res.status(400).json({
      success: false,
      err
    })
    return res.status(200).json({
      success: true
    })
  })
};

exports.productPage = (req, res) => {

  let type = req.query.type
  let productIds = req.query.id

  console.log("req.query.id", req.query.id)

  if (type === "array") {
    let ids = req.query.id.split(',');
    productIds = [];
    productIds = ids.map(item => {
      return item
    })
  }

  console.log("productIds", productIds)


  //we need to find the product information that belong to product Id 
  Product.find({
      '_id': {
        $in: productIds
      }
    })
    .populate('writer')
    .exec((err, product) => {
      if (err) return res.status(400).send(err)
      return res.status(200).send(product)
    })
};
exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};


exports.getProducts = (req, res) => {
  let order = req.query.order ? req.query.order : 'asc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  let limit = req.query.limit ? parseInt(req.query.limit) : 5;

  Product.find()
    .select('-photo')
    .populate('category')
    .sort([
      [sortBy, order]
    ])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: 'Products not found'
        });
      }
      res.json(products);
    });
};


exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({

      message: 'Product deleted successfully'
    });
  });
};

exports.update = (req, res) => {
  let product = req.product;
  product = _.extend(product);
  product.save((err) => {
    if (err) return res.status(400).json({
      success: false,
      err
    })
    return res.status(200).json({
      success: true
    })
  })
};

/**
 * sell / arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createdAt&order=desc&limit=4
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : 'desc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  let limit = req.query.limit ? parseInt(req.query.limit) : 10;

  Product.find()
    .select('-photo')
    .populate('category')
    .sort([
      [sortBy, order]
    ])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: 'Products not found'
        });
      }
      res.json(products);
    });
};

exports.listBySell = (req, res) => {
  let order = req.query.order ? req.query.order : 'desc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find()
    .select('-photo')
    .populate('category')
    .sort([
      [sortBy, order]
    ])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: 'Products not found'
        });
      }
      res.json(products);
    });
};


/**
 * it will find the products based on the req product category
 * other products that has the same category, will be returned
 */

exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find({
      _id: {
        $ne: req.product
      },
      category: req.product.category
    })
    .limit(limit)
    .populate('category', '_id name')
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: 'Products not found'
        });
      }
      res.json(products);
    });
};

exports.listCategories = (req, res) => {
  Product.distinct('category', {}, (err, categories) => {
    if (err) {
      return res.status(400).json({
        error: 'Categories not found'
      });
    }
    res.json(categories);
  });
};


exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1]
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  Product.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([
      [sortBy, order]
    ])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found"
        });
      }
      res.json({
        size: data.length,
        data
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set('Content-Type', req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};


exports.listSearch = (req, res) => {
  // create query object to hold search value and category value
  const query = {};
  // assign search value to query.name
  if (req.query.search) {
    query.title = {
      $regex: req.query.search,
      $options: 'i'
    };
    // assigne category value to query.category
    if (req.query.category && req.query.category != 'All') {
      query.category = req.query.category;
    }
    // find the product based on query object with 2 properties
    // search and category
    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(products);
    }).select('-photo');
  }
};

exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map(item => {
    return {
      updateOne: {
        filter: {
          _id: item._id
        },
        update: {
          $inc: {
            quantity: -item.count,
            sold: +item.count
          }
        }
      }
    };
  });

  Product.bulkWrite(bulkOps, {}, (error, products) => {
    if (error) {
      return res.status(400).json({
        error: 'Could not update product'
      });
    }
    next();
  });
};