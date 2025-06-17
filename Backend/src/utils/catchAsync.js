/**
 * Wrapper function to catch async errors in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;