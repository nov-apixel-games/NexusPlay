import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const nexusAiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  message: { success: false, error: "Límite de solicitudes alcanzado. Por favor, intenta de nuevo más tarde." }
});
