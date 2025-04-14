import React from "react";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import Spinner from "../ui/Spinner";
import useCartData from "../../hooks/useCartData";

const CartPage = ({ setNumCartItems }) => {

  const { cartItems, setCartItems, cartTotal, setCartTotal, loading, tax } = useCartData();

  if (loading) {
    return <Spinner loading={loading} />;
  }


  if (!cartItems || cartItems.length < 1) {
    return (
      <div className="alert alert-primary my-5" role="alert">
        Your cart is empty. Start shopping now!
      </div>
    );
  }

  return (
    <div className="container my-3 py-3" style={{ height: "80vh", overflow: "scroll" }}>
      <h5 className="mb-4">Shopping Cart</h5>
      <div className="row">
        <div className="col-md-5">
          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              cartItems={cartItems}
              setCartTotal={setCartTotal}
              setNumCartItems={setNumCartItems}
              setCartItems={setCartItems}
            />
          ))}
        </div>
        <div className="col-md-7">
          <CartSummary cartTotal={cartTotal} tax={tax} />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
