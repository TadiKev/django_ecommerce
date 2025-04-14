import React, { useEffect, useState } from 'react';
import ProductPagePlaceholder from './ProductPagePlaceholder';
import RelatedProduct from './RelatedProduct';
import { useParams } from 'react-router-dom';
import api, { BASE_URL } from '../../api';
import { toast } from 'react-toastify';

const ProductPage = ({setNumCartItems}) => {
    const { slug } = useParams();
    const [product, setProduct] = useState({});
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inCart, setInCart] = useState(false);
    const cart_code = localStorage.getItem("cart_code");

    useEffect(() => {
      if (product?.id) {  
        api.get(`product_in_cart?cart_code=${cart_code}&product_id=${product.id}`)
          .then(res => {
            console.log(res.data);
            setInCart(res.data.product_in_cart);
          })
          .catch(err => {
            console.log(err.message);
          });
      }
    }, [cart_code, product.id]);
    

    // Ensure the item contains the product id from the state
    const newItem = { cart_code: cart_code, product_id: product.id };

    function add_item() {
        api.post("add_item/", newItem)
            .then(res => {
                console.log(res.data);
                setInCart(true);
                toast.success("Product added to cart")
                setNumCartItems(curr => curr + 1)
            })
            .catch(err => {
                console.log(err.message);
            });
    }

    useEffect(() => {
        setLoading(true);
        api.get(`product_detail/${slug}`)
            .then(res => {
                console.log(res.data);
                setProduct(res.data);
                setSimilarProducts(res.data.similar_products);
                setLoading(false);
            })
            .catch(err => {
                console.log(err.message);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return <ProductPagePlaceholder />;
    }

    return (
        <div>
            <section className='py-3'>
                <div className='container px-4 px-lg-5 my-5'>
                    <div className='row gx-4 gx-lg-5 align-items-center'>
                        <div className='col-md-6'>
                            <img
                                className='card-img-top mb-5 mb-md-0'
                                src={`${BASE_URL}${product.image}`}
                                alt='Product Image'
                            />
                        </div>
                        <div className='col-md-6'>
                            <div className='small mb-1'>BST - BST-498</div>
                            <h1 className='display-5 fw-bolder'>{product.name}</h1>
                            <div className='fs-5 mb-5'>
                                <span>{`${product.price}`}</span>
                            </div>
                            <p className='lead'>
                                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                                Assumenda fugit ipsum in, facere fuga quidem cumque delectus,
                                aspernatur vero libero repellat eveniet unde autem molestiae
                                sint corporis doloribus veniam animi.
                            </p>
                            <div className='d-flex'>
                                <button
                                    className='btn btn-outline-dark flex-shrink-0'
                                    type='button'
                                    onClick={add_item}
                                    disabled={inCart}
                                >
                                    <i className='bi bi-cart-fill me-1'></i>
                                    {inCart ? "Product added to cart" : "Add to cart"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <RelatedProduct products={similarProducts} />
        </div>
    );
};

export default ProductPage;
