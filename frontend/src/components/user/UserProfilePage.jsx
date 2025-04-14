import React, { useEffect, useState } from 'react';
import UserInfo from './UserInfo';
import OrderHistoryItemContainer from './OrderHistoryItemContainer';
import api from '../../api';
import Spinner from '../ui/Spinner';

const UserProfilePage = () => {
  const [userInfo, setUserInfo] = useState({});
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("user_info")
      .then(res => {
        console.log(res.data); 
        setOrderItems(res.data.items); 
        setUserInfo(res.data);
      })
      .catch(err => {
        console.log(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
 
    console.log('Purchased items:', orderItems);
  }, [orderItems]); 

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className='container my-5'>
      {/* Profile header */}
      <UserInfo userInfo={userInfo} loading={loading} />

      {/* Order history */}
      <OrderHistoryItemContainer orderItems={orderItems} />
    </div>
  );
};

export default UserProfilePage;
