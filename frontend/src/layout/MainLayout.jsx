import React from 'react'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { Outlet } from 'react-router-dom'

const MainLayout = ({numCartItems}) => {
  return (
    <>
      <Navbar numCartItems = {numCartItems} />
      <ToastContainer />
      <Outlet />
      <Footer />
    </>
  )
}

export default MainLayout
