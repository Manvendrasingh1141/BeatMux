export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (res, message, code, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};
