from rest_framework import serializers
from .models import Product, Cart, CartItem,Transaction
from django.contrib.auth import get_user_model
from decimal import Decimal

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "slug", "image", "description", "category", "price"]


class DetailedProductSerializer(serializers.ModelSerializer):
    similar_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price", "slug", "image", "description", "similar_products"]

    def get_similar_products(self, product):
        # Limiting the number of similar products returned to optimize performance
        products = Product.objects.filter(category=product.category).exclude(id=product.id)[:5] 
        serializer = ProductSerializer(products, many=True)
        return serializer.data


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "quantity", "product", "total"]
    
    def get_total(self, cartitem):
        # Calculate the total price per cart item
        return cartitem.product.price * cartitem.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True, source='cart_items')  
    sum_total = serializers.SerializerMethodField()
    num_of_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "cart_code", "items", "sum_total", "num_of_items", "created_at", "modified_at"]

    def get_sum_total(self, cart):
        # CORRECTED: Use cart_items instead of cartitems
        cart_items = cart.cart_items.select_related('product')
        return sum(item.product.price * item.quantity for item in cart_items)

    def get_num_of_items(self, cart):
        # CORRECTED: Use cart_items instead of cartitems
        return sum(item.quantity for item in cart.cart_items.all())


class SimpleCartSerializer(serializers.ModelSerializer):
    num_of_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "cart_code", "num_of_items"]

    def get_num_of_items(self, cart):
        # Return the total number of items in the cart
        return sum(item.quantity for item in cart.cartitems.all())


class NewCartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    order_id = serializers.SerializerMethodField()
    order_date = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "order_id", "order_date"]

    def get_order_id(self, cartitem):
        # Get the associated cart's code as the order ID
        return cartitem.cart.cart_code
    
    def get_order_date(self, cartitem):
        # Return the date the cart was modified (representing the order date)
        return cartitem.cart.modified_at


class UserSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            "id", "username", "first_name", "last_name", 
            "email", "city", "state", "address", "phone", "items"
        ]

def get_items(self, user):
    transactions = Transaction.objects.filter(
        user=user,
        status='success' 
    ).prefetch_related('cart__cart_items__product')
    

    cart_items = CartItem.objects.filter(
        cart__in=[t.cart for t in transactions]
    ).order_by('-cart__modified_at')[:10]
    
    return NewCartItemSerializer(cart_items, many=True).data