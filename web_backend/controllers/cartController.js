import userModel from "../models/userModel.js";

// add products to user cart
const addToCart = async (req, res) => {
    try {
        const { itemId, size } = req.body;
        const userId = req.userId;

        console.log("addToCart called for user:", userId);

        if (!userId) {
            return res.json({ success: false, message: "Unauthorized login" });
        }

        const userData = await userModel.findById(userId);

        if (!userData) {
            console.log("User not found in DB for ID:", userId);
            return res.json({ success: false, message: "User not found" });
        }

        let cartData = userData.cartData || {};

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }

        userData.cartData = cartData;
        userData.markModified('cartData');
        await userData.save();

        console.log("Cart saved successfully for user:", userId);
        res.json({ success: true, message: "Added To Cart" });

    } catch (error) {
        console.error("addToCart error:", error);
        res.json({ success: false, message: error.message });
    }
}

// update user cart
const updateCart = async (req, res) => {
    try {
        const { itemId, size, quantity } = req.body;
        const userId = req.userId;

        console.log("updateCart called for user:", userId);

        const userData = await userModel.findById(userId);

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        let cartData = userData.cartData || {};

        if (!cartData[itemId]) {
            cartData[itemId] = {};
        }
        cartData[itemId][size] = quantity;

        userData.cartData = cartData;
        userData.markModified('cartData');
        await userData.save();

        res.json({ success: true, message: "Cart Updated" });

    } catch (error) {
        console.error("updateCart error:", error);
        res.json({ success: false, message: error.message });
    }
}

// get user cart data
const getUserCart = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("getUserCart called for user:", userId);

        if (!userId) {
            return res.json({ success: false, message: "Unauthorized login" });
        }

        const userData = await userModel.findById(userId);

        if (!userData) {
            console.log("User not found for storage in getUserCart:", userId);
            return res.json({ success: false, message: "User not found" });
        }

        const cartData = userData.cartData || {};

        console.log("Returning cart data for user:", userId);
        res.json({ success: true, cartData });

    } catch (error) {
        console.error("getUserCart error:", error);
        res.json({ success: false, message: error.message });
    }
}

export { addToCart, updateCart, getUserCart };
