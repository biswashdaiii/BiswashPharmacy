import jwt from "jsonwebtoken";

export const authDoctor = async (req, res, next) => {
  try {
    let dToken = req.headers["dtoken"];
    if (!dToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      dToken = req.headers.authorization.split(' ')[1];
    }

    if (!dToken) {
      return res.status(401).json({ success: false, message: "Not authorized, login again" });
    }

    // Use same secret as login
    const secret = process.env.SECRET;

    // Verify and decode token
    const token_decode = jwt.verify(dToken, secret);

    if (!token_decode || !token_decode.id) {
      return res.status(401).json({ success: false, message: "Not authorized, login again" });
    }

    // Attach doctor id to req.body for downstream controllers
    req.userId = token_decode.id;

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: error.message });
  }
};
