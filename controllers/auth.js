const User = require('../models/User');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for authorization check
const {
  errorHandler
} = require('../helpers/dbErrorHandler');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.MAIL_KEY);
// using promise
exports.signup = (req, res) => {
  // console.log("req.body", req.body);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        // error: errorHandler(err)
        error: 'Email is taken'
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user
    });
  });
};

// using async/await
// exports.signup = async (req, res) => {
//     try {
//         const user = await new User(req.body);
//         console.log(req.body);

//         await user.save((err, user) => {
//             if (err) {
//                 // return res.status(400).json({ err });
//                 return res.status(400).json({
//                     error: 'Email is taken'
//                 });
//             }
//             res.status(200).json({ user });
//         });
//     } catch (err) {
//         console.error(err.message);
//     }
// };

exports.signin = (req, res) => {
  // find the user based on email
  const {
    email,
    password
  } = req.body;
  User.findOne({
    email
  }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please signup'
      });
    }
    // if user is found make sure the email and password match
    // create authenticate method in user model
    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: 'Email and password dont match'
      });
    }
    // generate a signed token with user id and secret
    const token = jwt.sign({
      _id: user._id
    }, process.env.JWT_SECRET);
    // persist the token as 't' in cookie with expiry date
    res.cookie('t', token, {
      expire: new Date() + 9999
    });
    // return response with user and token to frontend client
    const {
      _id,
      name,
      email,
      role
    } = user;
    return res.json({
      token,
      user: {
        _id,
        email,
        name,
        role
      }
    });
  });
};

exports.signout = (req, res) => {
  res.clearCookie('t');
  res.json({
    message: 'Signout success'
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'auth'
});

exports.isAuth = (req, res, next) => {
  let user = req.profile || req.auth || req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({
      error: 'Access denied'
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: 'Admin resourse! Access denied'
    });
  }
  next();
};

exports.forgotPassword = (req, res) => {
  const {
    email
  } = req.body;
  // const errors = validationResult(req);

  // if (!errors.isEmpty()) {
  //   const firstError = errors.array().map(error => error.msg)[0];
  //   return res.status(422).json({
  //     errors: firstError
  //   });
  // } else {
  User.findOne({
      email
    },
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: 'User with that email does not exist'
        });
      }

      const token = jwt.sign({
          _id: user._id
        },
        process.env.JWT_RESET_PASSWORD, {
          expiresIn: '10m'
        }
      );

      const emailData = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Password Reset link`,
        html: `
                    <h1>Please use the following link to reset your password</h1>
                    <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                    <hr />
                    <p>This email may contain sensetive information</p>
                    <p>${process.env.CLIENT_URL}</p>
                `
      };

      return user.updateOne({
          resetPasswordLink: token
        },
        (err, success) => {
          if (err) {
            console.log('RESET PASSWORD LINK ERROR', err);
            return res.status(400).json({
              error: 'Database connection error on user password forgot request'
            });
          } else {
            sgMail
              .send(emailData)
              .then(sent => {
                // console.log('SIGNUP EMAIL SENT', sent)
                return res.json({
                  message: `Email has been sent to ${email}. Follow the instruction to activate your account`
                });
              })
              .catch(err => {
                // console.log('SIGNUP EMAIL SENT ERROR', err)
                return res.json({
                  message: err.message
                });
              });
          }
        }
      );
    }
  );
  // }
};

exports.resetPassword = (req, res) => {
  const {
    resetPasswordLink,
    newPassword
  } = req.body;

  // const errors = validationResult(req);

  // if (!errors.isEmpty()) {
  //   const firstError = errors.array().map(error => error.msg)[0];
  //   return res.status(422).json({
  //     errors: firstError
  //   });
  // } else {
  if (resetPasswordLink) {
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(400).json({
          error: 'Expired link. Try again'
        });
      }

      User.findOne({
          resetPasswordLink
        },
        (err, user) => {
          if (err || !user) {
            return res.status(400).json({
              error: 'Something went wrong. Try later'
            });
          }

          const updatedFields = {
            password: newPassword,
            resetPasswordLink: ''
          };

          user = _.extend(user, updatedFields);

          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: 'Error resetting user password'
              });
            }
            res.json({
              message: `Great! Now you can login with your new password`
            });
          });
        }
      );
    });
  }
  // }
};