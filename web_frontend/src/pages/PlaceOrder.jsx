import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {

    const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products, initiateEsewa } = useContext(ShopContext);
    const [method, setMethod] = useState('cod');
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: ''
    })

    const nepaliCities = [
        "Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar",
        "Birgunj", "Janakpur", "Ghorahi", "Hetauda", "Dhangadhi",
        "Tulsipur", "Itahari", "Nepalgunj", "Butwal", "Dharan",
        "Kalaiya", "Jitpur Simara", "Mechinagar", "Budhanilkantha", "Gokarneshwor"
    ];

    const onChangeHandler = (event) => {
        const name = event.target.name;
        let value = event.target.value;
        if (name === 'phone') {
            value = value.replace(/\D/g, "").slice(0, 10);
        }
        setFormData(data => ({ ...data, [name]: value }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            if (formData.phone.length !== 10) {
                toast.error("Phone number must be exactly 10 digits.");
                return;
            }

            const nameRegex = /^[a-zA-Z\s]{3,50}$/;
            if (!nameRegex.test(formData.fullName)) {
                toast.error("Name should only contain letters.");
                return;
            }

            let orderItems = []

            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find(product => product._id === items))
                        if (itemInfo) {
                            itemInfo.size = item
                            itemInfo.quantity = cartItems[items][item]
                            orderItems.push(itemInfo)
                        }
                    }
                }
            }

            let orderData = {
                address: formData,
                items: orderItems,
                amount: getCartAmount() + delivery_fee,
            }

            switch (method) {
                // API Calls for COD
                case 'cod':
                    const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { Authorization: `Bearer ${token}` } })
                    if (response.data.success) {
                        setCartItems({})
                        navigate('/orders')
                    } else {
                        toast.error(response.data.message)
                    }
                    break;
                case 'esewa':
                    const totalAmount = getCartAmount() + delivery_fee;
                    // Prepare items for esewa
                    const simplifiedItems = orderItems.map(item => ({
                        productId: item._id,
                        name: item.name,
                        price: item.price,
                        size: item.size,
                        quantity: item.quantity
                    }));
                    await initiateEsewa(simplifiedItems, totalAmount, formData);
                    break;

                default:
                    break;
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>

            {/* Left Side */}
            <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
                <div className='text-xl sm:text-2xl my-3'>
                    <p className=' uppercase'>Delivery Information</p>
                </div>
                <input required onChange={onChangeHandler} name='fullName' value={formData.fullName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Full name' />
                <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Phone number (10 digits)' maxLength={10} />
                <select required onChange={onChangeHandler} name='address' value={formData.address} className='border border-gray-300 rounded py-1.5 px-3.5 w-full bg-white'>
                    <option value="">Select Delivery City</option>
                    {nepaliCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
            </div>

            {/* Right Side */}
            <div className='mt-8'>
                <div className='mt-8 min-w-80'>
                    <CartTotal />
                </div>
                <div className='mt-12'>
                    <div className=' text-2xl mb-3'>
                        <p className=' uppercase'>Payment Method</p>
                    </div>
                    {/* Payment Selection */}
                    <div className='flex gap-3 flex-col lg:flex-row'>

                        <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
                            <p className=' font-medium text-sm text-gray-500 mx-4'>CASH ON DELIVERY</p>
                        </div>
                        <div onClick={() => setMethod('esewa')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'esewa' ? 'bg-green-400' : ''}`}></p>
                            <p className=' font-medium text-sm text-gray-500 mx-4'>ESEWA</p>
                        </div>
                    </div>
                    <div className='w-full text-end mt-8'>
                        <button type='submit' className='bg-black text-white px-16 py-3 text-sm'>PLACE ORDER</button>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default PlaceOrder
