import React, { useEffect, useContext } from 'react'
import Header from '../components/Header'
import Banner from '../components/Banner'
import { ShopContext } from '../context/ShopContext'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import LatestCollection from '../components/LatestCollection'
import OurPolicy from '../components/OurPolicy'

const Home = () => {
  const { backendUrl, setToken, token } = useContext(ShopContext);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');

    if (success && !token) {
      const fetchProfile = async () => {
        try {
          const res = await axios.get(backendUrl + '/api/user/get-profile');
          if (res.data.success) {
            setToken('true');
            localStorage.setItem('token', 'true');
            localStorage.setItem('user', JSON.stringify(res.data.userData));
            const { setAuthUser, connectSocket } = useAuthStore.getState();
            setAuthUser(res.data.userData);
            connectSocket();
            toast.success('Google Sign-In successful!');
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          toast.error('Authentication error. Please try again.');
        } finally {
          // Clean URL always
          window.history.replaceState({}, document.title, '/');
        }
      };
      fetchProfile();
    } else if (success) {
      // Already has token, just clean URL
      window.history.replaceState({}, document.title, '/');
    }
  }, [backendUrl, setToken, token]);

  return (
    <div className='animate-fadeIn'>
      <Header />
      <LatestCollection />
      <OurPolicy />
      <Banner />
    </div>
  )
}

export default Home
