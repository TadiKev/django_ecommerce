// HomeCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomeCard.module.css';  
import { BASE_URL } from '../../api';

const HomeCard = ({ product }) => { 
  return (
    <div className={`col-md-3 ${styles.col}`}>
      <Link to={`/products/${product.slug}`} className={styles.links}>
        <div className={styles.card}>
          {/* Image Wrapper */} 
          <div className={styles.cardImgWrapper}>
            <img 
              src={`${BASE_URL}${product.image}`} 
              className={styles.cardImgTop} 
              alt={product.name || "Product"}
            />
          </div>

          {/* Card Content */}
          <div className={styles.cardBody}>
            <h5 className={`${styles.cardTitle} mb-1`}>{product.name}</h5>
            <h6 className={styles.cardText}>{`${product.price}`}</h6>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HomeCard;
