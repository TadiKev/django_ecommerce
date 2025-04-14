import React from 'react';
import styles from './OrderHistoryItem.module.css';
import { BASE_URL } from '../../api';
import { formatDate } from '../../FormatDate';


const OrderHistoryItem = ({item}) => {
  return (
    <div className='card-body'>
      <div className={`order-item mb-3 ${styles.orderItem}`}>
        <div className='row'>
          <div className='col-md-2'>
            <img
              src={`${BASE_URL}${item.product.image}`}
              alt="Product"
              className={`img-fluid ${styles.imgField}`} 
              style={{borderRadius: '5px'}}
            />
          </div>
          <div className='col-md-6'>
            <h6>{item.product.name}</h6>
            <p>{`Order Date:${formatDate(item.order_date)}`}</p>
            <p>{`Order ID: ${item.order_id}`}</p>
          </div>
          <div className='col-md-2 text-center'>
            <h6 className='text-muted'>{`Quantity:${item.quantity}`}</h6>
          </div>
          <div className='col-md-2 text-center'>
            <h6 className='text-muted'>{`$${item.product.price}`}</h6>
          </div>
        </div>
        {/* Repeat for other orders */}
      </div>
    </div>
  );
}

export default OrderHistoryItem;
