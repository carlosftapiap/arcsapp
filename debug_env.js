require('dotenv').config();
console.log('DIRECT_URL exists:', !!process.env.DIRECT_URL);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('Env keys count:', Object.keys(process.env).length);
