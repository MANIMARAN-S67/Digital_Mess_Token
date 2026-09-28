export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Unable to process the request',
    code: 'SERVER_ERROR'
  });
};
