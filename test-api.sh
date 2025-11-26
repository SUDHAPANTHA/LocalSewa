#!/bin/bash

# API Testing Script for Local Sewa App
# Run this to test if backend APIs are working

echo "🧪 Testing Local Sewa Backend APIs..."
echo ""

BASE_URL="http://localhost:5000"

# Test 1: Get all services
echo "1️⃣ Testing GET /services"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/services")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo "✅ Services API working"
    echo "Response preview: $(echo $body | head -c 100)..."
else
    echo "❌ Services API failed with code: $http_code"
    echo "Response: $body"
fi
echo ""

# Test 2: Get Kathmandu areas
echo "2️⃣ Testing GET /areas"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/areas")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    echo "✅ Areas API working"
else
    echo "❌ Areas API failed with code: $http_code"
fi
echo ""

# Test 3: Test chatbot
echo "3️⃣ Testing POST /chatbot"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/chatbot" \
  -H "Content-Type: application/json" \
  -d '{"message":"I need a plumber"}')
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    echo "✅ Chatbot API working"
else
    echo "❌ Chatbot API failed with code: $http_code"
fi
echo ""

# Test 4: Check if MongoDB is connected
echo "4️⃣ Checking MongoDB connection..."
if curl -s "$BASE_URL/services" | grep -q "success"; then
    echo "✅ MongoDB connected"
else
    echo "❌ MongoDB connection issue"
fi
echo ""

echo "🎉 API Testing Complete!"
echo ""
echo "Next steps:"
echo "1. If all tests passed, start frontend: cd project && npm run dev"
echo "2. If tests failed, check backend logs and MongoDB connection"
echo "3. Visit http://localhost:5173 to test the app"
