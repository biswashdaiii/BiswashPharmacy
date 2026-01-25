import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'

// Set axios defaults for security (cookies)
axios.defaults.withCredentials = true;

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '$';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://192.168.226.1:5050";
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '');
    const navigate = useNavigate();


    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list')
            if (response.data.success) {
                setProducts(response.data.products)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const addToCart = async (itemId, size) => {
        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { Authorization: `Bearer ${token}` } })
                toast.success("Added to Cart");
                getUserCart(token);
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        } else {
            setCartItems((prev) => {
                const cartData = structuredClone(prev);
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
                return cartData;
            });
            toast.success("Added to Cart (Local)");
        }

    }


    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {

                }
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId, size, quantity) => {
        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { Authorization: `Bearer ${token}` } })
                await getUserCart(token);
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
        } else {
            setCartItems((prev) => {
                const cartData = structuredClone(prev);
                if (!cartData[itemId]) cartData[itemId] = {};
                cartData[itemId][size] = quantity;
                return cartData;
            });
        }
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {

                }
            }
        }
        return totalAmount;
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { Authorization: `Bearer ${token}` } })
            if (response.data.success) {
                setCartItems(response.data.cartData || {})
                console.log("Fetched cartItems from server:", response.data.cartData);
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getProductsData()
    }, [])

    const initiateEsewa = async (items, amount, address) => {
        if (!token) {
            toast.error("Please login to purchase");
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post(backendUrl + '/api/payment/esewa-initiate', {
                items, amount, address
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (response.data.success) {
                const { paymentData } = response.data;
                const form = document.createElement("form");
                form.setAttribute("method", "POST");
                form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");

                for (const key in paymentData) {
                    const hiddenField = document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", paymentData[key]);
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();
                setCartItems({}); // Clear cart on successful initiation (redirecting)
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }

    const buyNow = async (productId, name, price, size, address) => {
        const items = [{ productId, name, price, size, quantity: 1 }];
        await initiateEsewa(items, price, address);
    }

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
        }
        if (token) {
            getUserCart(token)
        }
    }, [token])

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems,
        getCartCount, updateQuantity,
        getCartAmount, navigate, backendUrl,
        setToken, token, buyNow, initiateEsewa
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )

}

export default ShopContextProvider;
