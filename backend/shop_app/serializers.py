from rest_framework import serializers
from .models import Product, Cart, CartItem, Transaction
from rest_framework.validators import UniqueValidator

from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

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
        return cartitem.product.price * cartitem.quantity

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True, source='cart_items')
    sum_total = serializers.SerializerMethodField()
    num_of_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "cart_code", "items", "sum_total", "num_of_items", "created_at", "modified_at"]

    def get_sum_total(self, cart):
        cart_items = cart.cart_items.select_related('product')
        return sum(item.product.price * item.quantity for item in cart_items)

    def get_num_of_items(self, cart):
        return sum(item.quantity for item in cart.cart_items.all())

class SimpleCartSerializer(serializers.ModelSerializer):
    num_of_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "cart_code", "num_of_items"]

    def get_num_of_items(self, cart):
        return sum(item.quantity for item in cart.cart_items.all())

class NewCartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    order_id = serializers.SerializerMethodField()
    order_date = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "order_id", "order_date"]

    def get_order_id(self, cartitem):
        return cartitem.cart.cart_code

    def get_order_date(self, cartitem):
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


class SignupSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="Username already exists")]
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="Email already exists")]
    )
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        # Use your custom user model’s manager
        user = User.objects.create_user(
            username=validated_data["username"],
            email=    validated_data["email"],
            password= validated_data["password"]
        )
        # Optional: save first/last name if provided
        user.first_name = validated_data.get("first_name", "")
        user.last_name  = validated_data.get("last_name", "")
        user.save()
        return user

