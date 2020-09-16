const User = require('../models/User');
const {
    Order
} = require('../models/order');
const {
    errorHandler
} = require('../helpers/dbErrorHandler');

exports.userById = (req, res, next, id) => {
    User.findById(id).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        req.profile = user;
        next();
    });
};

exports.read = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

// exports.update = (req, res) => {
//     console.log('user update', req.body);
//     req.body.role = 0; // role will always be 0
//     User.findOneAndUpdate({ _id: req.profile._id }, { $set: req.body }, { new: true }, (err, user) => {
//         if (err) {
//             return res.status(400).json({
//                 error: 'You are not authorized to perform this action'
//             });
//         }
//         user.hashed_password = undefined;
//         user.salt = undefined;
//         res.json(user);
//     });
// };

exports.update = (req, res) => {
    // console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
    const {
        name,
        password
    } = req.body;

    User.findOne({
        _id: req.profile._id
    }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        if (!name) {
            return res.status(400).json({
                error: 'Name is required'
            });
        } else {
            user.name = name;
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    error: 'Password should be min 6 characters long'
                });
            } else {
                user.password = password;
            }
        }

        user.save((err, updatedUser) => {
            if (err) {
                console.log('USER UPDATE ERROR', err);
                return res.status(400).json({
                    error: 'User update failed'
                });
            }
            updatedUser.hashed_password = undefined;
            updatedUser.salt = undefined;
            res.json(updatedUser);
        });
    });
};

exports.addOrderToUserHistory = (req, res, next) => {
    let history = [];

    req.body.order.products.forEach(item => {
        history.push({
            _id: item._id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: item.count,
            transaction_id: req.body.order.transaction_id,
            amount: req.body.order.amount
        });
    });

    User.findOneAndUpdate({
        _id: req.profile._id
    }, {
        $push: {
            history: history
        }
    }, {
        new: true
    }, (error, data) => {
        if (error) {
            return res.status(400).json({
                error: 'Could not update user purchase history'
            });
        }
        next();
    });
};

exports.purchaseHistory = (req, res) => {
    Order.find({
            user: req.profile._id
        })
        .populate('user', '_id name')
        .sort('-created')
        .exec((err, orders) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(orders);
        });
};



exports.addToCart = (req, res) => {

    User.findOne({
        _id: req.user._id
    }, (err, userInfo) => {
        let duplicate = false;

        console.log(userInfo)

        userInfo.cart.forEach((item) => {
            if (item.id == req.query.productId) {
                duplicate = true;
            }
        })


        if (duplicate) {
            User.findOneAndUpdate({
                    _id: req.user._id,
                    "cart.id": req.query.productId
                }, {
                    $inc: {
                        "cart.$.quantity": 1
                    }
                }, {
                    new: true
                },
                (err, userInfo) => {
                    if (err) return res.json({
                        success: false,
                        err
                    });
                    res.status(200).json(userInfo.cart)
                }
            )
        } else {
            User.findOneAndUpdate({
                    _id: req.user._id
                }, {
                    $push: {
                        cart: {
                            id: req.query.productId,
                            quantity: 1,
                            date: Date.now()
                        }
                    }
                }, {
                    new: true
                },
                (err, userInfo) => {
                    if (err) return res.json({
                        success: false,
                        err
                    });
                    res.status(200).json(userInfo.cart)
                }
            )
        }
    })
};


exports.removeFromCart = (req, res) => {

    User.findOneAndUpdate({
            _id: req.user._id
        }, {
            "$pull": {
                "cart": {
                    "id": req.query._id
                }
            }
        }, {
            new: true
        },
        (err, userInfo) => {
            let cart = userInfo.cart;
            let array = cart.map(item => {
                return item.id
            })

            Product.find({
                    '_id': {
                        $in: array
                    }
                })
                .populate('writer')
                .exec((err, cartDetail) => {
                    return res.status(200).json({
                        cartDetail,
                        cart
                    })
                })
        }
    )
}


exports.userCartInfo = (req, res) => {
    User.findOne({
            _id: req.user._id
        },
        (err, userInfo) => {
            let cart = userInfo.cart;
            let array = cart.map(item => {
                return item.id
            })


            Product.find({
                    '_id': {
                        $in: array
                    }
                })
                .populate('writer')
                .exec((err, cartDetail) => {
                    if (err) return res.status(400).send(err);
                    return res.status(200).json({
                        success: true,
                        cartDetail,
                        cart
                    })
                })

        }
    )
}