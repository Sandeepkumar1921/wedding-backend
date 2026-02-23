const apiResponse = {
  success: (res, data = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data });
  },
  error: (res, message = 'Server Error', statusCode = 500) => {
    return res.status(statusCode).json({ success: false, message });
  },
  created: (res, data = {}, message = 'Created successfully') => {
    return res.status(201).json({ success: true, message, data });
  },
};

module.exports = apiResponse;
