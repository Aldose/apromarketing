import express from 'express';
const router = express.Router();

router.get('/demo', (req, res) => {
  res.render('demo');
});

export default router;
