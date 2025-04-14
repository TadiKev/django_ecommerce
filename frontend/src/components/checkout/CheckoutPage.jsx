import React from 'react'
import OrderSummary from './OrderSummery'
import PaymentSection from './PaymentSection'
import useCartData from '../../hooks/useCartData';

const CheckoutPage = () => {

  const { cartItems, setCartItems, cartTotal, setCartTotal, loading, tax } = useCartData();
  return (
    <div className='container my-3'>
        <div className='row'>
        <OrderSummary cartItems = {cartItems} cartTotal = {cartTotal} tax = {tax} />
        <PaymentSection />
        </div>
         
    </div>
  )
}

export default CheckoutPage
