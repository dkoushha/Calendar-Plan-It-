const express = require('express');
const router = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});
router.get('/indexCalender', (req, res) => {
  res.render('indexCalender')
})

router.post('/events', (req, res) => {
  console.log('ajax', req.body.dataSend);
})
module.exports = router;