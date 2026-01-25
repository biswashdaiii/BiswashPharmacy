import React from "react";
import { assets } from "../assets/assets"; // Make sure assets.contact is correctly defined

const Contact = () => {
  return (
    <div className="bg-white min-h-screen px-4 py-12 flex flex-col items-center">
      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-wide text-gray-800">
          Contact <span className="font-semibold text-primary">Us</span>
        </h2>
      </div>

      {/* Content Grid */}
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Image */}
        <div>
          <img
            src={assets.contact_image}
            alt="Contact"
            className="rounded-lg shadow-md w-full object-cover max-h-[500px]"
          />
        </div>

        {/* Right: Info */}
        <div className="space-y-10 text-gray-700">
          {/* Office Details */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Our Office</h3>
            <p className="leading-relaxed">
              Biswash Pharmacy Headquarters
              <br />
              Kathmandu Nepal,
              <br />
              Samakhushi, Kathmandu, Nepal
            </p>
            <p className="mt-2">Tel: 980000000</p>
            <p>
              Email:{" "}
              <a
                href=""
                className="text-blue-600 hover:underline"
              >
                BiswashDaikoMail@gmail.com
              </a>
            </p>
          </div>

          {/* Careers */}
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Careers at Biswash Pharmacy
            </h3>
            <p>
              Passionate about transforming healthcare? Join our team and make
              an impact.
            </p>
            <button
              className="mt-4 px-6 py-2 bg-primary text-white font-medium rounded-lg shadow-md 
                   hover:bg-primary-dark hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out"
            >
              Explore Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
