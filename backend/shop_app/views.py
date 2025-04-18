from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import CartSerializer
from rest_framework import status
from django.db.models import Sum
from rest_framework.decorators import permission_classes
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
import uuid
from django.conf import settings
import requests
from django.http import JsonResponse
import logging
import paypalrestsdk
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model() 
from django.contrib.auth.hashers import make_password

BASE_URL = settings.REACT_BASE_URL 

paypalrestsdk.configure({
    "mode":settings.PAYPAL_MODE,
    "client_id":settings.PAYPAL_CLIENT_ID,
    "client_secret":settings.PAYPAL_CLIENT_SECRET
})

from .models import Product, Cart, CartItem, Transaction
from .serializers import (
    ProductSerializer,
    DetailedProductSerializer,
    CartItemSerializer,
    SimpleCartSerializer,
    UserSerializer,
)

# View to get all products
@api_view(["GET"])
def products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

# View to get product details by slug
@api_view(["GET"])
def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug)
    serializer = DetailedProductSerializer(product)
    return Response(serializer.data)

# View to add an item to the cart
@api_view(["POST"])
def add_item(request):
    try:
        cart_code = request.data.get("cart_code")
        product_id = request.data.get("product_id")

        # Get or create the cart
        cart, created = Cart.objects.get_or_create(cart_code=cart_code)

        # Retrieve the product
        product = get_object_or_404(Product, id=product_id)

        # Get or create a cart item
        cartitem, created = CartItem.objects.get_or_create(cart=cart, product=product)

        # Increment quantity if already exists
        if not created:
            cartitem.quantity += 1
        else:
            cartitem.quantity = 1
        cartitem.save()

        serializer = CartItemSerializer(cartitem)
        return Response({"data": serializer.data, "message": "Cart item created or updated successfully"}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"message": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# View to check if a product is in the cart
@api_view(['GET'])
def product_in_cart(request):
    cart_code = request.query_params.get("cart_code")
    product_id = request.query_params.get("product_id")

    cart = get_object_or_404(Cart, cart_code=cart_code)
    product = get_object_or_404(Product, id=product_id)

    # Check if product exists in cart
    product_exist_in_cart = CartItem.objects.filter(cart=cart, product=product).exists()

    return Response({'product_in_cart': product_exist_in_cart})

# View to get cart summary
@api_view(['GET'])
def get_cart_stat(request):
    cart_code = request.query_params.get('cart_code')

    if not cart_code:
        return Response({'error': 'cart_code is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cart = Cart.objects.get(cart_code=cart_code)
    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SimpleCartSerializer(cart)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_cart(request):
    cart_code = request.query_params.get('cart_code')

    if not cart_code:
        return Response({"detail": "cart_code parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cart = Cart.objects.get(cart_code=cart_code, paid=False)
    except Cart.DoesNotExist:
        return Response({"detail": "Cart not found or already paid."}, status=status.HTTP_404_NOT_FOUND)

    serializer = CartSerializer(cart)

    return Response(serializer.data)

@api_view(["PATCH"])
def update_quantity(request):
    try:
        cartitem_id = request.data.get("item_id")
        quantity = request.data.get("quantity")

        if cartitem_id is None or quantity is None:
            return Response({"error": "item_id and quantity are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Convert quantity safely
        try:
            quantity = int(quantity)
        except ValueError:
            return Response({"error": "Quantity must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        cartitem = get_object_or_404(CartItem, id=cartitem_id)
        cartitem.quantity = quantity
        cartitem.save()

        serializer = CartItemSerializer(cartitem)
        return Response({"data": serializer.data, "message": "CartItem updated successfully"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_cartitem(request):
    cartitem_id = request.data.get("item_id")
    cartitem = get_object_or_404(CartItem, id=cartitem_id)
    cartitem.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_username(request):
    user = request.user
    return Response({"username": user.username})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)

logger = logging.getLogger(__name__)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated"}, status=401)

    try:
        # Log incoming request
        logger.info(f"Initiating payment for user {request.user} with cart_code {request.data.get('cart_code')}")

        tx_ref = str(uuid.uuid4())
        cart_code = request.data.get("cart_code")
        cart = get_object_or_404(Cart, cart_code=cart_code)

        amount = sum([item.quantity * item.product.price for item in cart.cart_items.all()])
        tax = Decimal("4.00")
        total_amount = amount + tax
        currency = "USD"
        redirect_url = f"{BASE_URL}/payment-status/"

        # Log total amount calculation
        logger.info(f"Total amount for payment: {total_amount}")

        transaction = Transaction.objects.create(
            ref=tx_ref,
            cart=cart,
            amount=total_amount,
            currency=currency,
            user=request.user,  # Corrected this line
            status="pending",
        )

        flutterwave_payload = {
            "tx_ref": tx_ref,
            "amount": str(total_amount),
            "currency": currency,
            "redirect_url": redirect_url,
            "customer": {
                "email": request.user.email,
                "name": request.user.username,
                "phonenumber": request.user.phone,
            },
            "customizations": {
                "title": "Your Store Payment"
            }
        }

        headers = {
            "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
            "Content-Type": "application/json"
        }

        # Log payload before sending request
        logger.info(f"Flutterwave payload: {flutterwave_payload}")

        response = requests.post(
            "https://api.flutterwave.com/v3/payments",
            json=flutterwave_payload,
            headers=headers
        )

        response_data = response.json()

        if response.status_code == 200 and response_data.get("status") == "success":
            logger.info("Payment initiated successfully")
            return JsonResponse({"message": "Payment initiated", "payment_link": response_data["data"]["link"]}, status=200)
        else:
            logger.error(f"Payment initiation failed: {response_data}")
            return JsonResponse({"error": "Payment initiation failed", "details": response_data}, status=400)

    except Exception as e:
        logger.error(f"Exception occurred: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

logger = logging.getLogger(__name__)

@api_view(['POST'])
def payment_callback(request):
    # Log the entire request for debugging
    logger.info(f"Received Payment Callback Request: {request.body.decode('utf-8')}")

    # Extract parameters from the request (GET, POST, or request.data)
    status = request.GET.get('status') or request.POST.get('status') or request.data.get('status')
    tx_ref = request.GET.get('tx_ref') or request.POST.get('tx_ref') or request.data.get('tx_ref')  
    transaction_id = request.GET.get('transaction_id') or request.POST.get('transaction_id') or request.data.get('transaction_id')

    # Log callback params for debugging
    logger.info(f"Callback Params - Status: {status}, Tx-Ref: {tx_ref}, Transaction ID: {transaction_id}")

    # Check if essential parameters are missing
    if not status or not tx_ref or not transaction_id:
        return Response({'message': 'Invalid request', 'subMessage': 'Missing required parameters'}, status=400)

    try:
        # Get the transaction from the database
        transaction = Transaction.objects.get(ref=tx_ref)
    except Transaction.DoesNotExist:
        return Response({'message': 'Transaction not found', 'subMessage': 'Invalid transaction reference'}, status=404)

    user = request.user if request.user.is_authenticated else None

    # If the status is successful, proceed with verification
    if status == 'successful':
        # Verify the transaction using Flutterwave's API
        headers = {
            "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"
        }
        try:
            # Make a request to Flutterwave for transaction verification
            response = requests.get(f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify", headers=headers)
            response_data = response.json()

            # Log the response from Flutterwave for debugging
            logger.info(f"Flutterwave Verification Response: {response.text}")

            # Check if the transaction verification is successful
            if response_data.get('status') != 'success':
                logger.error(f"Error: Flutterwave transaction failed with status: {response_data.get('status')}")
                return Response({'message': 'Payment verification failed', 'subMessage': 'Transaction was not successful.'}, status=400)

            # Check if the amounts and currencies match
            flutterwave_amount = float(response_data['data']['amount'])
            if flutterwave_amount != float(transaction.amount):
                logger.error(f"Error: Amount mismatch (expected: {transaction.amount}, received: {flutterwave_amount})")
                return Response({'message': 'Amount mismatch', 'subMessage': 'Payment amount does not match.'}, status=400)

            # Update the transaction status to 'successful'
            transaction.status = 'successful'
            transaction.save()

            # Mark the cart as paid
            cart = transaction.cart
            cart.paid = True
            cart.save()

            # Success response
            return Response({'message': 'Payment verification successful', 'subMessage': 'Payment was completed successfully.'}, status=200)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error: Failed to verify transaction - {str(e)}")
            return Response({'message': 'Payment verification failed', 'subMessage': 'Failed to verify payment from Flutterwave.'}, status=500)
    else:
        # If the payment was not successful, update the transaction status
        transaction.status = 'failed'
        transaction.save()

        # Failure response
        return Response({'message': 'Payment failed', 'subMessage': 'Transaction was not successful.'}, status=400)
 
@api_view(['POST'])
def initiate_paypal_payment(request):
    if request.method == 'POST' and request.user.is_authenticated:
        # Fetch the cart and calculate total amount
        tx_ref = str(uuid.uuid4())
        user = request.user
        cart_code = request.data.get("cart_code")
        cart = Cart.objects.get(cart_code=cart_code)
        # Using 'cart.cartitems.all()' as used elsewhere in this codebase
        amount = sum(item.product.price * item.quantity for item in cart.cart_items.all())
        tax = Decimal("4.00")
        total_amount = amount + tax

        # Create a PayPal payment object
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": f"{BASE_URL}/payment-status?paymentStatus=success&ref={tx_ref}",
                "cancel_url": f"{BASE_URL}/payment-status?paymentStatus=cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Cart Items",
                        "sku": "cart",
                        "price": str(total_amount),
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(total_amount),
                    "currency": "USD"
                },
                "description": "Payment for cart items."
            }]
        })

        print("pay_id", payment)

        # Create a transaction record in the database
        transaction, created = Transaction.objects.get_or_create(
            ref=tx_ref,
            cart=cart,
            amount=total_amount,
            user=user,
            status='pending'
        )

        if payment.create():
            # Extract PayPal approval URL to redirect the user
            approval_url = None
            for link in payment.links:
                if link.rel == "approval_url":
                    approval_url = str(link.href)
                    break
            if approval_url:
                return Response({"approval_url": approval_url})
            else:
                return Response({"error": "Approval URL not found"}, status=400)
        else:
            return Response({"error": payment.error}, status=400)
    else:
        return Response({"error": "User not authenticated or invalid request method"}, status=401)

@api_view(['POST', 'GET'])
def paypal_payment_callback(request):
    # Retrieve parameters from the query string
    payment_id = request.query_params.get('paymentId')
    payer_id = request.query_params.get('PayerID')
    ref = request.query_params.get('ref')

    if not ref:
        return Response({'error': 'Transaction reference (ref) is missing.'}, status=400)

    try:
        transaction = Transaction.objects.get(ref=ref)
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found.'}, status=404)

    # Log the reference for debugging
    print("refff", ref)

    if payment_id and payer_id:
        try:
            # Fetch the payment object using the PayPal SDK by payment ID
            payment = paypalrestsdk.Payment.find(payment_id)
        except Exception as e:
            return Response({
                'error': 'Error fetching payment information.',
                'details': str(e)
            }, status=500)

        # At this point, you might want to add verification
        # that the payment object reflects a completed payment status.
        # For now, we'll mark the transaction as completed.

        transaction.status = 'completed'
        transaction.save()

        # Mark the associated cart as paid
        cart = transaction.cart
        cart.paid = True
        cart.save()

        return Response({
            'message': 'Payment completed successfully.'
        }, status=200)
    else:
        return Response({
            'error': 'Missing payment_id or payer_id in parameters.'
        }, status=400)

@api_view(['POST'])
def signup(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not all([username, email, password]):
        return Response({'message': 'All fields are required'}, status=400)

    # Use your CUSTOM User model (via get_user_model())
    if User.objects.filter(username=username).exists():
        return Response({'message': 'Username exists'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email exists'}, status=400)

    # Create user with your custom model's manager
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=request.data.get('first_name', ''),  # Optional fields
        last_name=request.data.get('last_name', '')
    )

    return Response({'message': 'User created'}, status=201)
