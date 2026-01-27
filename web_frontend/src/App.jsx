import React from "react";
import { Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import MyProfile from "./pages/MyProfile";
import ForgotPassword from "./pages/ForgotPassword";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";

import Success from "./components/Success";
import Failure from "./components/Failure";


const App = () => {
  return (
    <div className="mx-4 sm:mx-[10%]">
      <Navbar />
      <SearchBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Payment result routes */}
        <Route path="/payment-success" element={<Success />} />
        <Route path="/payment-failure" element={<Failure />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
