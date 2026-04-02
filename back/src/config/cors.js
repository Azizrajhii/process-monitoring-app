const LOCAL_ORIGINS = ['http://localhost:5173'];

const splitOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const getAllowedOrigins = () => {
  const fromClientUrl = splitOrigins(process.env.CLIENT_URL);
  const fromClientUrls = splitOrigins(process.env.CLIENT_URLS);
  return Array.from(new Set([...fromClientUrl, ...fromClientUrls, ...LOCAL_ORIGINS]));
};

export const corsOrigin = (origin, callback) => {
  const allowedOrigins = getAllowedOrigins();

  // Requests like curl/postman may have no origin header.
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error('Not allowed by CORS'));
};
