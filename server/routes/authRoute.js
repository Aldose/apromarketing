import express from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import { i18nMiddleware } from '../i18n/index.js';

const router = express.Router();
// router.get('/login', i18nMiddleware, (req,res)=>{
//   res.render('login');
// });
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ email, password: hashedPassword });
//     await user.save();

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
//     res.cookie('token', token, { httpOnly: true });
//     res.status(201).json({ message: 'User created successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ error: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ error: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
//     res.cookie('token', token, { httpOnly: true });
//     res.json({ message: 'Logged in successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/logout', (req, res) => {
//   res.clearCookie('token');
//   res.json({ message: 'Logged out successfully' });
// });

export default router;