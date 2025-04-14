import React, { useState } from "react";
import api, { BASE_URL } from "../../api";
import { toast } from "react-toastify";

const CartItem = ({ item, setCartTotal,setCartItems, cartItems, setNumCartItems }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [loading, setLoading] = useState(false);

  const itemID = {item_id:item.id}

  function deleteCartItem() {
    const confirmDelete = window.confirm("Are you sure you want to delete this cart item?");
    
    if (confirmDelete) {
      api.delete("/delete_cartitem/", { data: itemID })
        .then(res => {
          console.log("Cart item deleted:", res.data);
  
      
          setCartItems(prevCartItems => prevCartItems.filter(cartitem => cartitem.id !== item.id));
  
          toast.success("Cart item removed successfully");
  
 
          setNumCartItems(prev => prev - quantity);
          setCartTotal(prev => prev - item.total);
        })
        .catch(err => {
          console.error("Error deleting cart item:", err.message);
          toast.error("Failed to delete cart item");
        });
    }
  }
  

  function updateCartItem() {
    const itemData = { quantity: Number(quantity), item_id: item.id };
    setLoading(true)

    api
      .patch("/update_quantity/", itemData)
      .then((res) => {
        console.log("Updated Cart Item:", res.data);
        setLoading(false)
        toast.success("CartItem updated successfully")

        
        setCartTotal(
          cartItems
            .map((cartItem) =>
              cartItem.id === item.id ? res.data.data : cartItem
            )
            .reduce((acc, curr) => acc + curr.total, 0)
        );

        
        setNumCartItems(
          cartItems
            .map((cartItem) =>
              cartItem.id === item.id ? res.data.data : cartItem
            )
            .reduce((acc, curr) => acc + curr.quantity, 0)
        );
      })
      .catch((err) => {
        console.log("Error updating cart item:", err.message);
        setLoading(false)
      });
  }

  return (
    <div className="col-md-12">
      <div
        className="cart-item d-flex align-items-center mb-3 p-3"
        style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
      >
        <img
          src={`${BASE_URL}${item.product.image}`}
          alt="Product"
          className="img-filed"
          style={{
            width: "80px",
            height: "80px",
            objectFit: "cover",
            borderRadius: "5px",
          }}
        />
        <div className="ms-3 flex-grow-1">
          <h5 className="mb-1">{item.product.name}</h5>
          <p className="mb-0 text-muted">{`$${item.total.toFixed(2)}`}</p>
        </div>
        <div className="d-flex align-items-center">
          <input
            type="number"
            min="1"
            className="form-control ms-3"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={{ width: "70px" }}
          />
          <button
            className="btn-sm ms-2 mx-2"
            onClick={updateCartItem}
            style={{ backgroundColor: "#4b3bcb", color: "white" }}
            disabled = {loading}
          >
            {loading ? "Updating" : "Update"}
          </button>
          <button className="btn btn-danger btn-sm ms-2" onClick={deleteCartItem} >Remove</button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
