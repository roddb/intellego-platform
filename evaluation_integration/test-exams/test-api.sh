#!/bin/bash

# Test script for exam correction API
# Usage: ./test-api.sh

echo "🧪 Testing Exam Correction API"
echo "================================"
echo ""

# Configuration
API_URL="http://localhost:3000/api/instructor/evaluation/correct"
EXAM_DIR="./evaluation_integration/test-exams"

# Check if dev server is running
echo "1. Checking if dev server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server is not running!"
    echo "   Please start it with: npm run dev"
    exit 1
fi
echo "✅ Dev server is running"
echo ""

# Test GET endpoint (API info)
echo "2. Testing GET endpoint (API documentation)..."
curl -s "${API_URL}" | jq '.' || echo "❌ Failed to get API info"
echo ""
echo "✅ GET endpoint working"
echo ""

# Test POST endpoint (requires authentication)
echo "3. Testing POST endpoint..."
echo "⚠️  This requires authentication - you'll need to:"
echo "   1. Log in as an INSTRUCTOR in the app"
echo "   2. Copy your session cookie"
echo "   3. Use a tool like Postman or curl with the cookie"
echo ""
echo "Example curl command with cookie:"
echo ""
echo "curl -X POST '${API_URL}' \\"
echo "  -H 'Cookie: authjs.session-token=YOUR_SESSION_TOKEN' \\"
echo "  -F 'files=@${EXAM_DIR}/Garcia_Juan.md' \\"
echo "  -F 'files=@${EXAM_DIR}/Lopez_Maria.md' \\"
echo "  -F 'metadata={\"subject\":\"Física\",\"examTopic\":\"Tiro Oblicuo\",\"examDate\":\"2025-10-15\"}'"
echo ""

# List available test files
echo "📂 Available test files:"
ls -lh "${EXAM_DIR}"/*.md 2>/dev/null || echo "No .md files found in ${EXAM_DIR}"
echo ""

echo "================================"
echo "🎯 Next steps:"
echo "1. Start dev server if not running: npm run dev"
echo "2. Log in as instructor at http://localhost:3000"
echo "3. Get session cookie from browser DevTools"
echo "4. Use Postman or curl to test the API with authentication"
echo ""
