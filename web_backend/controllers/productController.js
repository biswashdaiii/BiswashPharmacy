import productModel from "../models/productModel.js";
import { logger, logSecurity } from "../config/logger.js";
import fs from 'fs'

// function for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)
        let imageUrls = images.map((item) => `uploads/${item.filename}`)

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imageUrls,
            date: Date.now()
        }

        const product = new productModel(productData);
        await product.save()

        logger.info('PRODUCT_ADDED', {
            name,
            productId: product._id,
            adminId: req.userId || 'system',
            ip: req.ip
        });

        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        logger.error('PRODUCT_ADD_ERROR', { error: error.message, adminId: req.userId, ip: req.ip });
        res.json({ success: false, message: error.message })
    }
}

// function for list product done
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        res.json({ success: true, products })
    } catch (error) {
        logger.error('PRODUCT_LIST_ERROR', { error: error.message });
        res.json({ success: false, message: error.message })
    }
}

// function for removing product done
const removeProduct = async (req, res) => {
    try {
        const { id } = req.body;
        await productModel.findByIdAndDelete(id)

        logger.info('PRODUCT_REMOVED', {
            productId: id,
            adminId: req.userId || 'system',
            ip: req.ip
        });

        res.json({ success: true, message: "Product Removed" })
    } catch (error) {
        logger.error('PRODUCT_REMOVE_ERROR', { error: error.message, adminId: req.userId, ip: req.ip });
        res.json({ success: false, message: error.message })
    }
}

// function for single product info done
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({ success: true, product })
    } catch (error) {
        logger.error('PRODUCT_FETCH_ERROR', { error: error.message, productId: req.body.productId });
        res.json({ success: false, message: error.message })
    }
}

export { listProducts, addProduct, removeProduct, singleProduct }
