import cors from 'cors';

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', // Added for Vite dev server
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:8080', // Added for local testing
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'https://gentle-gingersnap-9fde09.netlify.app',
  'https://gentle-gingersnap-9fde09.netlify.app/',
  process.env.FRONTEND_URL,
  null // Allow file:// protocol for local testing
].filter(origin => origin !== undefined);

// Add wildcard for development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('*');
}

const corsOptions = {
  origin: function (origin, callback) {
    console.log('=== CORS DEBUG ===');
    console.log('Request from origin:', origin);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('Allowed origins:', allowedOrigins);
    console.log('================');
    
    // Allow requests with no origin (like mobile apps, Postman, curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      console.log('CORS: Development mode - allowing all origins');
      return callback(null, true);
    }
    
    // Always allow the specific Netlify domain
    if (origin === 'https://gentle-gingersnap-9fde09.netlify.app') {
      console.log('CORS: Netlify domain allowed explicitly');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Origin allowed from list:', origin);
      return callback(null, true);
    }
    
    // Log blocked request but allow it for now (for debugging)
    console.log('CORS: Origin would be blocked:', origin);
    console.log('CORS: But allowing for debugging purposes');
    return callback(null, true);
    
    // Uncomment this line to actually block unauthorized origins
    // callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Cache-Control',
    'X-Keep-Alive',
    'User-Agent'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: 86400 // Cache preflight for 24 hours
};

// Main CORS middleware
const corsMiddleware = cors(corsOptions);

// Additional CORS headers middleware
const additionalCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all responses
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development' || origin === 'https://gentle-gingersnap-9fde09.netlify.app')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://gentle-gingersnap-9fde09.netlify.app');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Keep-Alive, User-Agent');
  res.header('Access-Control-Expose-Headers', 'Authorization');
  
  next();
};

// Preflight handler
const preflightHandler = (req, res) => {
  console.log('=== PREFLIGHT REQUEST ===');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.headers['access-control-request-method']);
  console.log('Headers:', req.headers['access-control-request-headers']);
  console.log('========================');
  
  const origin = req.headers.origin;
  
  // Set CORS headers for preflight
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development' || origin === 'https://gentle-gingersnap-9fde09.netlify.app')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', 'https://gentle-gingersnap-9fde09.netlify.app');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Keep-Alive, User-Agent');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Vary', 'Origin');
  
  res.status(200).end();
};

export {
  corsMiddleware,
  additionalCorsHeaders,
  preflightHandler,
  allowedOrigins
};