import 'dotenv/config';

export default {
  expo: {
    name: "YourApp",
    slug: "your-app",
    extra: {
      apiUrl: process.env.API_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
};