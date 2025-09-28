require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');



const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sessions
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// MongoDB connection
// MongoDB connection
const mongoURI = `mongodb+srv://snehazagade2006_db_user:fx6OKC1Dc7cxJOXC@spanishlearningdb.lyiido1.mongodb.net/?retryWrites=true&w=majority&appName=SpanishLearningDB`;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('Error connecting to MongoDB', err));

// User schema
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  username: { type: String, required: true },
  password: { type: String, required: true },
  progress: { type: Object, default: {} },
  loginHistory: [Date],
  scores: {
    match: { type: Number, default: 0 },
    verb: { type: Number, default: 0 },
    Scrambleword: { type: Number, default: 0 },
    guess: { type: Number, default: 0 }
  },
  note: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

// Routes

// Login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration page
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Handle registration
app.post('/register', async (req, res) => {
  const { fullName, email, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.send('<h3>User already exists</h3><a href="register.html">Back to Register</a>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, username, password: hashedPassword });
    await newUser.save();

    res.send('<h3>Registration successful</h3><a href="/">Login Now</a>');
  } catch (err) {
    console.error('Registration error:', err);
    res.send('<h3>Error during registration</h3><a href="register.html">Back to Register</a>');
  }
});

// Handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {

      user.loginHistory.push(new Date());
      await user.save();

      req.session.user = { username };
      console.log('Session at /api/profile:', req.session);
      req.session.progress = user.progress;
      res.redirect('/sneha.html');
    } else {
      res.send('<h3>Invalid credentials</h3><a href="/">Back to Login</a>');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.send('<h3>Something went wrong</h3><a href="/">Back to Login</a>');
  }
});

//leaderboard page
app.post('/api/score/:game', async (req, res) => {
  const { game } = req.params;
  
  // Log the entire request body for debugging
  console.log('Request body:', req.body);
  
  if (!req.body || typeof req.body.score === 'undefined') {
    console.error('Invalid request body:', req.body);
    return res.status(400).json({ error: 'Score is required' });
  }

  const { score } = req.body;

  console.log(`Received score update request: Game=${game}, Score=${score}, User=${req.session.user?.username}`);

  if (!req.session.user) {
    console.log('Unauthorized score update attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['match', 'verb', 'Scrambleword', 'guess'].includes(game)) {
    console.log('Invalid game type:', game);
    return res.status(400).json({ error: 'Invalid game' });
  }

  try {
    const user = await User.findOne({ username: req.session.user.username });
    if (!user) {
      console.log('User not found:', req.session.user.username);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Current scores for ${user.username}:`, user.scores);
    console.log(`Current ${game} score: ${user.scores[game] || 0}, New score: ${score}`);

    // Update score only if it's higher than current score
    if (score > (user.scores[game] || 0)) {
      user.scores[game] = score;
      await user.save();
      console.log(`Updated ${game} score for ${user.username} to ${score}`);
      console.log('Updated user scores:', user.scores);
      res.json({ success: true, message: 'Score updated successfully' });
    } else {
      console.log(`Score not updated - new score (${score}) not higher than current score (${user.scores[game] || 0})`);
      res.json({ success: true, message: 'Score not updated - not higher than current score' });
    }
  } catch (err) {
    console.error('Error updating score:', err);
    res.status(500).json({ error: 'Error updating score', details: err.message });
  }
});
app.get('/api/leaderboard/:game', async (req, res) => {
  const { game } = req.params;
  console.log(`Fetching leaderboard for game: ${game}`);

  if (!['match', 'verb', 'Scrambleword', 'guess'].includes(game)) {
    return res.status(400).send('Invalid game');
  }

  try {
    const leaderboard = await User.find({ [`scores.${game}`]: { $gt: 0 } })
      .sort({ [`scores.${game}`]: -1 })
      .limit(10)
      .select('username scores');

    console.log(`Found ${leaderboard.length} entries for ${game} leaderboard`);
    console.log('Leaderboard data:', leaderboard);

    const formatted = leaderboard.map((user, i) => ({
      rank: i + 1,
      username: user.username,
      score: user.scores[game]
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).send('Error fetching leaderboard');
  }
});


// Save Note
app.post('/api/save-note', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const { content } = req.body;
  try {
    await User.updateOne(
      { username: req.session.user.username },
      { $set: { note: content } }
    );
    res.json({ success: true, message: 'Note saved successfully' });
  } catch (err) {
    console.error('Error saving note:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Load Note
app.get('/api/load-note', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await User.findOne({ username: req.session.user.username });
    res.json({ note: user.note || '' });
  } catch (err) {
    console.error('Error loading note:', err);
    res.status(500).json({ error: 'Failed to load note' });
  }
});


// Protected page
app.get('/sneha.html', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'sneha.html'));
  } else {
    res.redirect('/');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('<h3>Error logging out</h3><a href="/sneha.html">Back</a>');
    }
    res.redirect('/');
  });
});

app.get('/api/profile', async (req, res) => {
  if (!req.session.user || !req.session.user.username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await User.findOne({ username: req.session.user.username }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});
app.get('/profile.html', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
  } else {
    res.redirect('/');
  }
});
app.get('/settings.html', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
  } else {
    res.redirect('/');
  }
});
app.delete('/api/delete-account', async (req, res) => {
  if (!req.session.user) return res.status(401).send('Unauthorized');

  try {
    await User.deleteOne({ username: req.session.user.username });
    req.session.destroy(() => {
      res.status(200).send('Account deleted');
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).send('Error deleting account');
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
