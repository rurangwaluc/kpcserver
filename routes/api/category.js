const express = require('express');
const router = express.Router();


const {
  userById
} = require('../../controllers/user');
const {
  create,
  categoryById,
  read,
  update,
  remove,
  list
} = require('../../controllers/category');
const {

  requireSignin,
  isAuth,
  isAdmin
} = require('../../controllers/auth');


router.get('/categories', list);
router.get('/:categoryId', read);
router.post('/create/:userId', requireSignin, isAdmin, isAuth, create);
// router.put('/category/:categoryUpdateId/:userId', requireSignin, isAuth, isAdmin, update);
router.put('/:categoryId/:userId', requireSignin, isAdmin, isAuth, update);

router.delete('/:categoryId/:userId', requireSignin, isAdmin, isAuth, remove);

router.param('categoryId', categoryById);
router.param('userId', userById)



module.exports = router;