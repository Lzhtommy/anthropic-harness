// 所有 Controller 必须用 asyncHandler 包裹（code-standards / verify.sh A2）。
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
